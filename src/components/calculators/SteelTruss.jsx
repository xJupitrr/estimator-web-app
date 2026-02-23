import React, { useState, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Plus, Trash2, Calculator, PlusCircle, AlertCircle, Copy, ArrowUp, Eye, EyeOff, Scissors, X, Box } from 'lucide-react';
import { calculateSteelTruss } from '../../utils/calculations/steelTrussCalculator';

import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import TablePriceInput from '../common/TablePriceInput';
import SelectInput from '../common/SelectInput';
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
    const [unitPrices, setUnitPrices] = useLocalStorage('steel_truss_prices', {});
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
                    <button
                        onClick={() => handleDuplicateRow(contextMenu.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Copy size={14} className="text-slate-400" /> Duplicate Part
                    </button>
                    <button
                        onClick={() => handleAddRowAbove(contextMenu.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                    >
                        <ArrowUp size={14} className="text-slate-400" /> Add Part Above
                    </button>
                    <button
                        onClick={() => handleToggleExcludeRow(contextMenu.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        {trussParts.find(p => p.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include Part</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude Part</>
                        }
                    </button>
                </div>
            )}

            {/* CUTS MODAL */}
            {editingCutsId && activePartForCuts && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-sm border border-zinc-200 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-${THEME}-600`}></div>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50">
                            <div>
                                <h3 className="font-bold text-lg text-zinc-800 uppercase tracking-tight text-left">Cutting Lengths</h3>
                                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-1 text-left">
                                    Part: <span className={`text-${THEME}-600 font-bold`}>{activePartForCuts.name || 'Unnamed'}</span>
                                </p>
                            </div>
                            <button onClick={() => setEditingCutsId(null)} className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors rounded-sm">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                            {activePartForCuts.cuts.map((cut, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="bg-zinc-800 text-white text-[9px] font-mono w-6 h-6 flex items-center justify-center rounded-sm shrink-0">{idx + 1}</div>
                                    <div className="flex-1">
                                        <MathInput placeholder="Length (m)" value={cut.length} onChange={(val) => updateCut(activePartForCuts.id, idx, 'length', val)} className={`${INPUT_UI.TABLE_INPUT} text-center`} />
                                    </div>
                                    <div className="text-zinc-300 font-mono text-[10px] font-bold px-1">×</div>
                                    <div className="w-24">
                                        <MathInput placeholder="Qty" value={cut.quantity} onChange={(val) => updateCut(activePartForCuts.id, idx, 'quantity', val)} className={`${INPUT_UI.TABLE_INPUT} text-center`} />
                                    </div>
                                    <button onClick={() => removeCut(activePartForCuts.id, idx)} className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-sm">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={() => addCut(activePartForCuts.id)} className={`w-full py-3 bg-white border border-dashed border-zinc-200 text-zinc-400 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:border-${THEME}-300 hover:text-${THEME}-500 hover:bg-${THEME}-50/50 transition-all flex items-center justify-center gap-2`}>
                                <Plus size={14} /> Add Cut Pattern
                            </button>
                        </div>
                        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                            <button onClick={() => setEditingCutsId(null)} className={`px-8 py-2 bg-${THEME}-600 text-white rounded-sm font-bold text-[10px] uppercase tracking-widest hover:bg-${THEME}-700 shadow-md`}>Save Pattern</button>
                        </div>
                    </div>
                </div>
            )}

            <Card className={`border-t-4 border-t-${THEME}-500 shadow-md`}>
                <SectionHeader
                    title="Steel Truss Component List"
                    icon={Box}
                    colorTheme={THEME}
                    actions={
                        <ActionButton
                            onClick={addTrussPart}
                            label="Add New Component"
                            icon={PlusCircle}
                            colorTheme={THEME}
                        />
                    }
                />

                <div className="overflow-x-auto p-4">
                    <table className={TABLE_UI.INPUT_TABLE}>
                        <thead className="bg-slate-100">
                            <tr>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[40px]`}>#</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[200px]`}>Component Name</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[160px]`}>Steel Type</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[200px]`}>Size / Specs</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[120px]`}>Thickness</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px] text-center`}>Cuts</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[50px]`}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {trussParts.map((part, index) => (
                                <tr key={part.id} className={`${TABLE_UI.INPUT_ROW} ${part.isExcluded ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                    <td
                                        className={`${TABLE_UI.INPUT_CELL} text-center text-xs text-slate-400 font-bold cursor-help`}
                                        onContextMenu={(e) => {
                                            if (e.ctrlKey) {
                                                e.preventDefault();
                                                setContextMenu({ id: part.id, x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        title="Ctrl + Right Click for options"
                                    >
                                        <span className={part.isExcluded ? 'line-through' : ''}>{index + 1}</span>
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <input type="text" value={part.name} onChange={(e) => updateTrussPart(part.id, 'name', e.target.value)} className={INPUT_UI.TABLE_INPUT} placeholder="e.g. Bottom Chord" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput value={part.type} onChange={(v) => updateTrussPart(part.id, 'type', v)} options={STEEL_TYPES.map(t => ({ id: t.id, display: t.label }))} focusColor={THEME} placeholder="Type" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput value={part.size} onChange={(v) => updateTrussPart(part.id, 'size', v)} options={COMMON_SIZES[part.type] || []} focusColor={THEME} placeholder="Select Size..." disabled={!part.type} />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput value={part.thickness} onChange={(v) => updateTrussPart(part.id, 'thickness', v)} options={COMMON_THICKNESS} focusColor={THEME} placeholder="THK" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <button onClick={() => setEditingCutsId(part.id)} className={`w-full py-1 text-[10px] font-bold border rounded bg-white hover:bg-${THEME}-50 border-${THEME}-200 text-${THEME}-600 uppercase flex items-center justify-center gap-1`}>
                                            <Scissors size={10} /> {part.cuts.reduce((sum, c) => sum + (parseInt(c.quantity) || 0), 0)} Cuts
                                        </button>
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <button onClick={() => removeTrussPart(part.id)} className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors" disabled={trussParts.length === 1}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {
                    error && (
                        <div className="p-4 bg-red-50 border-t border-red-200 text-red-700 text-sm font-medium flex items-center justify-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )
                }

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <ActionButton
                        onClick={handleCalculate}
                        label="RUN OPTIMIZED ESTIMATE"
                        icon={Calculator}
                        colorTheme={THEME}
                        className="w-full sm:w-auto px-10 py-3"
                    />
                </div>
            </Card >

            {!estimationResults && !error && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50 mt-6">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Box size={40} className={`text-${THEME}-400`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 mb-1">Ready to Estimate</h3>
                    <p className="max-w-md mx-auto text-sm">
                        Enter your steel truss components and specifications above, then click <span className={`font-bold text-${THEME}-600`}>'RUN OPTIMIZED ESTIMATE'</span>.
                    </p>
                </div>
            )}

            {estimationResults && (
                <Card className={`animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-${THEME}-500`}>
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                            <div>
                                <h3 className="font-bold text-2xl text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                    Results Summary
                                    <button onClick={() => setViewingPatterns(true)} className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-sm font-mono hover:bg-indigo-700 transition-colors">VIEW CUTTING PATTERNS</button>
                                </h3>
                                <div className="flex flex-wrap gap-4 mt-3">
                                    <p className="text-sm text-slate-500">Total 6m Bars: <strong className="text-slate-900">{estimationResults.totalPieces} pcs</strong></p>
                                    <p className="text-sm text-slate-500">Material Varieties: <strong className="text-slate-900">{estimationResults.items.length}</strong></p>
                                </div>
                            </div>
                            <div className={`text-left md:text-right bg-blue-50 px-8 py-4 rounded-xl border border-blue-100 shadow-sm`}>
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mb-1">Estimated Total Cost</p>
                                <p className={`font-bold text-4xl text-${THEME}-700 tabular-nums`}>₱{estimationResults.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
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
                                                        setUnitPrices(prev => ({ ...prev, [key]: parseFloat(v) || 0 }));
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
