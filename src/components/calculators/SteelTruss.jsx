import React, { useState, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Plus, Trash2, Calculator, PlusCircle, AlertCircle, Copy, ArrowUp, Eye, EyeOff, Scissors, X, Box, ClipboardCopy, Download } from 'lucide-react';
import { calculateSteelTruss } from '../../utils/calculations/steelTrussCalculator';
import { copyToClipboard, downloadCSV } from '../../utils/export';

import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import TablePriceInput from '../common/TablePriceInput';
import SelectInput from '../common/SelectInput';
import { getDefaultPrices } from '../../constants/materials';
import ExportButtons from '../common/ExportButtons';
import MathInput from '../common/MathInput';
import { THEME_COLORS, TABLE_UI, INPUT_UI } from '../../constants/designSystem';

const THEME = THEME_COLORS.steel_truss;

const STEEL_TYPES = [
    { id: 'angle_bar', label: 'Angle Bar' },
    { id: 'c_channel', label: 'C-Channel' },
    { id: 'tubular_square', label: 'Tubular (Square)' },
    { id: 'tubular_rect', label: 'Tubular (Rectangular)' },
];

const COMMON_SIZES = {
    angle_bar: [
        '25mm x 25mm (1" x 1")',
        '32mm x 32mm (1-1/4" x 1-1/4")',
        '38mm x 38mm (1-1/2" x 1-1/2")',
        '50mm x 50mm (2" x 2")',
        '65mm x 65mm (2-1/2" x 2-1/2")',
        '75mm x 75mm (3" x 3")',
        '100mm x 100mm (4" x 4")'
    ],
    c_channel: [
        '75mm x 50mm (3" x 2")',
        '100mm x 50mm (4" x 2")',
        '125mm x 50mm (5" x 2")',
        '150mm x 50mm (6" x 2")',
        '200mm x 50mm (8" x 2")'
    ],
    tubular_square: [
        '25mm x 25mm (1" x 1")',
        '38mm x 38mm (1-1/2" x 1-1/2")',
        '50mm x 50mm (2" x 2")',
        '75mm x 75mm (3" x 3")',
        '100mm x 100mm (4" x 4")'
    ],
    tubular_rect: [
        '50mm x 25mm (2" x 1")',
        '75mm x 50mm (3" x 2")',
        '100mm x 50mm (4" x 2")',
        '150mm x 50mm (6" x 2")'
    ]
};

const COMMON_THICKNESS = [
    '1.2mm', '1.5mm', '2.0mm', '2.5mm', '3.0mm', '4.0mm', '4.5mm', '5.0mm', '6.0mm'
];

const INITIAL_TRUSS_PART = {
    id: 'tp_1',
    name: '',
    type: '',
    size: '',
    thickness: '',
    cuts: [{ length: '', quantity: '' }],
    isExcluded: false,
};

export default function SteelTruss() {
    const [trussParts, setTrussParts] = useLocalStorage('steel_truss_parts', [INITIAL_TRUSS_PART]);
    const [unitPrices, setUnitPrices] = useLocalStorage('app_material_prices', getDefaultPrices(), { mergeDefaults: true });
    const [estimationResults, setEstimationResults] = useLocalStorage('steel_truss_result', null);
    const [hasEstimated, setHasEstimated] = useLocalStorage('steel_truss_has_estimated', false);
    const [error, setError] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [editingCutsId, setEditingCutsId] = useState(null);
    const [viewingPatterns, setViewingPatterns] = useState(false);

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleCalculate = () => {
        const hasEmptyFields = trussParts.some(p => !p.isExcluded && (!p.name || !p.type || !p.size || !p.thickness));
        if (hasEmptyFields) {
            setError("Please fill in all fields before calculating.");
            setEstimationResults(null);
            setHasEstimated(false);
            return;
        }
        setError(null);

        const res = calculateSteelTruss(trussParts, unitPrices);
        if (res) {
            setEstimationResults(res);
            setHasEstimated(true);
        } else {
            setEstimationResults(null);
            setHasEstimated(false);
        }
    };

    // Auto-recalculate
    useEffect(() => {
        if (hasEstimated) {
            const res = calculateSteelTruss(trussParts, unitPrices);
            setEstimationResults(res);
        }
    }, [trussParts, unitPrices, hasEstimated]);

    // Global Cost Sync
    useEffect(() => {
        if (estimationResults) {
            setSessionData('steel_truss_total', estimationResults.total);
        } else {
            setSessionData('steel_truss_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [estimationResults]);

    const addTrussPart = () => {
        setTrussParts([...trussParts, { ...INITIAL_TRUSS_PART, id: `tp_${Date.now() + Math.random()}` }]);
    };

    const removeTrussPart = (id) => {
        if (trussParts.length > 1) {
            setTrussParts(prev => prev.filter(p => p.id !== id));
        } else {
            setTrussParts([INITIAL_TRUSS_PART]);
        }
    };

    const updateTrussPart = (id, field, value) => {
        setTrussParts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const updateCut = (partId, index, field, value) => {
        setTrussParts(prev => prev.map(p => {
            if (p.id === partId) {
                const newCuts = [...p.cuts];
                newCuts[index] = { ...newCuts[index], [field]: value };
                return { ...p, cuts: newCuts };
            }
            return p;
        }));
    };

    const addCut = (partId) => {
        setTrussParts(prev => prev.map(p => {
            if (p.id === partId) {
                return { ...p, cuts: [...p.cuts, { length: '', quantity: '' }] };
            }
            return p;
        }));
    };

    const removeCut = (partId, index) => {
        setTrussParts(prev => prev.map(p => {
            if (p.id === partId) {
                const newCuts = p.cuts.filter((_, i) => i !== index);
                return { ...p, cuts: newCuts };
            }
            return p;
        }));
    };

    const handleDuplicateRow = (id) => {
        setTrussParts(prev => {
            const index = prev.findIndex(p => p.id === id);
            const rowToCopy = prev[index];
            const duplicated = {
                ...JSON.parse(JSON.stringify(rowToCopy)),
                id: Date.now() + Math.random()
            };
            const newRows = [...prev];
            newRows.splice(index + 1, 0, duplicated);
            return newRows;
        });
        setContextMenu(null);
    };

    const handleAddRowAbove = (id) => {
        setTrussParts(prev => {
            const index = prev.findIndex(p => p.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, { ...INITIAL_TRUSS_PART, id: Date.now() + Math.random() });
            return newRows;
        });
        setContextMenu(null);
    };

    const handleToggleExcludeRow = (id) => {
        setTrussParts(prev => prev.map(p => p.id === id ? { ...p, isExcluded: !p.isExcluded } : p));
        setContextMenu(null);
    };

    const activePartForCuts = trussParts.find(p => p.id === editingCutsId);

    return (
        <div className="space-y-6 relative">
            {/* CONTEXT MENU */}
            {contextMenu && (
                <div
                    className="fixed z-[100] bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <ExportButtons items={estimationResults.items} filename="steel_truss_estimate.csv" />
                                    <button
                                        onClick={() => setViewingPatterns(true)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 bg-${THEME}-600 text-white border border-${THEME}-700 rounded-lg text-sm font-bold hover:bg-${THEME}-700 transition-colors shadow-sm`}
                                        title="View cutting patterns and schedule"
                                    >
                                        <Scissors size={14} /> Cutting Analysis
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={TABLE_UI.CONTAINER}>
                            <table className={TABLE_UI.TABLE}>
                                <thead className={TABLE_UI.HEADER_ROW}>
                                    <tr>
                                        <th className={TABLE_UI.HEADER_CELL_LEFT}>Steel Specification</th>
                                        <th className={TABLE_UI.HEADER_CELL_RIGHT}>Quantity</th>
                                        <th className={TABLE_UI.HEADER_CELL}>Unit</th>
                                        <th className={TABLE_UI.HEADER_CELL_RIGHT}>Unit Price</th>
                                        <th className={`${TABLE_UI.HEADER_CELL_RIGHT} bg-slate-50/50`}>Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {estimationResults.items.map((item, idx) => (
                                        <tr key={idx} className={TABLE_UI.BODY_ROW}>
                                            <td className={`${TABLE_UI.CELL} font-semibold text-slate-800`}>
                                                {item.name}
                                                <div className="text-[9px] text-slate-400 mt-0.5">{item.specs}</div>
                                            </td>
                                            <td className={`${TABLE_UI.CELL_RIGHT} tabular-nums`}>{item.qty}</td>
                                            <td className={TABLE_UI.CELL_CENTER}>
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500`}>{item.unit}</span>
                                            </td>
                                            <td className={`${TABLE_UI.CELL} border-r-0`}>
                                                <TablePriceInput
                                                    value={unitPrices[item.priceKey] || 0}
                                                    onChange={(v) => {
                                                        const key = item.priceKey;
                                                        const newPrices = { ...unitPrices, [key]: parseFloat(v) || 0 };
                                                        setUnitPrices(prev => ({ ...prev, [key]: parseFloat(v) || 0 }));
                                                        // Recalculate immediately with new price
                                                        const freshRes = calculateSteelTruss(trussParts, newPrices);
                                                        if (freshRes) setEstimationResults(freshRes);
                                                    }}
                                                    colorTheme={THEME}
                                                />
                                            </td>
                                            <td className={`${TABLE_UI.CELL_RIGHT} font-bold text-slate-900 bg-slate-50/30 tabular-nums`}>₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            )
            }

            {/* Pattern Visualizer Modal Logic here if needed or keep the original complex one */}
            {
                viewingPatterns && estimationResults && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-6xl h-[90vh] rounded-sm border border-zinc-200 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 relative overflow-hidden text-left">
                            <div className={`absolute top-0 left-0 w-full h-1 bg-${THEME}-600 no-print`}></div>
                            <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 bg-zinc-50 shrink-0 no-print">
                                <div className="flex items-center gap-5">
                                    <div className={`p-3 bg-${THEME}-600 text-white rounded-sm shadow-lg shadow-${THEME}-100`}>
                                        <Scissors size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-zinc-900 uppercase tracking-tight">Cutting Pattern Map</h2>
                                        <p className="text-xs text-zinc-500 font-mono mt-1 uppercase tracking-wider italic">Optimized material utilization plan (6.0m stock base)</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingPatterns(false)} className="p-3 hover:bg-white text-zinc-400 hover:text-zinc-900 transition-colors border border-transparent hover:border-zinc-200 rounded-sm">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto flex-1 bg-[linear-gradient(rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:40px_40px]">
                                <div className="grid grid-cols-1 gap-12">
                                    {estimationResults.items.map((item, idx) => (
                                        <div key={idx} className="space-y-6">
                                            <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-2">
                                                <h4 className="font-bold text-lg text-zinc-900 uppercase flex items-center gap-3">
                                                    <span className={`w-8 h-8 flex items-center justify-center bg-zinc-900 text-white text-sm rounded-sm`}>{idx + 1}</span>
                                                    {item.name} <span className="text-zinc-400 font-mono text-xs">{item.specs}</span>
                                                </h4>
                                                <div className="flex gap-4">
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-zinc-400 font-mono uppercase">Efficiency</div>
                                                        <div className="text-sm font-bold text-emerald-600">{(item.optimization.efficiency * 100).toFixed(1)}%</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-zinc-400 font-mono uppercase">Waste</div>
                                                        <div className="text-sm font-bold text-red-500">{item.optimization.wasteTotal.toFixed(3)}m</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {item.optimization.patterns.map((pattern, pIdx) => (
                                                    <div key={pIdx} className="bg-white border-l-4 border-l-zinc-800 border-t border-b border-r border-zinc-200 p-4 shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase font-mono tracking-widest">Bar #{pattern.id}</span>
                                                            <span className="text-[10px] font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-sm">FREE: {pattern.freeSpace.toFixed(3)}m</span>
                                                        </div>
                                                        <div className="relative h-6 bg-zinc-100 rounded-sm mb-4 flex overflow-hidden border border-zinc-200">
                                                            {pattern.cuts.map((cut, cIdx) => (
                                                                <div key={cIdx} className="h-full border-r border-white/20 flex items-center justify-center relative group" style={{ width: `${(cut.length / pattern.stockLength) * 100}%`, backgroundColor: `hsl(${180 + (cIdx * 40)}, 60%, 45%)` }}>
                                                                    <span className="text-[8px] text-white font-bold tabular-nums">{cut.length.toFixed(2)}</span>
                                                                    <div className="absolute top-full left-0 mt-2 p-2 bg-zinc-900 text-white text-[9px] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl pointer-events-none uppercase tracking-tighter">
                                                                        {cut.label}: {cut.length}m
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="space-y-1">
                                                            {pattern.cuts.map((cut, cIdx) => (
                                                                <div key={cIdx} className="flex justify-between text-[10px] text-zinc-600 font-mono">
                                                                    <span className="truncate pr-2">• {cut.label}</span>
                                                                    <span className="font-bold text-zinc-900">{cut.length.toFixed(3)}m</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}


