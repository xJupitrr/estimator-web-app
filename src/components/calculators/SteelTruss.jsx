import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Calculator, ArrowRight, Info, Construction, Settings, PlusCircle, AlertCircle, ClipboardCopy, Download, X, Edit2, Scissors, Box, ChevronDown, ChevronUp } from 'lucide-react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import InputForm from '../InputForm';
import CostTable from '../CostTable';
import SelectInput from '../common/SelectInput';
import MathInput from '../common/MathInput';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import { optimizeCuts } from '../../utils/optimization/cuttingStock';

// --- Reusable Components (Matching Masonry) ---

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

const TablePriceInput = ({ value, onChange }) => (
    <div className="flex items-center justify-end">
        <div className="bg-gray-100/50 px-2 py-1.5 text-gray-600 text-sm font-bold flex items-center border border-gray-300 rounded-l-lg border-r-0 h-full">₱</div>
        <input
            type="number"
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 pl-2 pr-2 py-1.5 text-right text-sm border border-gray-300 rounded-r-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-gray-800 font-medium transition-colors border-l-0"
        />
    </div>
);

/**
 * Converts a 0-indexed number to an alphabetical sequence like Excel columns.
 * 0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA, 27 -> AB
 */
const getAlphabeticalIndex = (n) => {
    let result = '';
    n = n + 1; // Convert to 1-based for the logic
    while (n > 0) {
        let remainder = (n - 1) % 26;
        result = String.fromCharCode(65 + remainder) + result;
        n = Math.floor((n - 1) / 26);
    }
    return result;
};

// --- Constants ---

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

    // Results state
    const [estimationResults, setEstimationResults] = useLocalStorage('steel_truss_result', null);
    const [hasEstimated, setHasEstimated] = useLocalStorage('steel_truss_has_estimated', false);
    const [error, setError] = useState(null);

    // Modal States
    const [editingCutsId, setEditingCutsId] = useState(null);
    const [viewingPatterns, setViewingPatterns] = useState(false); // boolean now
    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

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
        setEstimationResults(null);
    };

    const handleAddRowAbove = (id) => {
        setTrussParts(prev => {
            const index = prev.findIndex(p => p.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, { ...INITIAL_TRUSS_PART, id: Date.now() + Math.random() });
            return newRows;
        });
        setContextMenu(null);
        setEstimationResults(null);
    };

    const handleToggleExcludeRow = (id) => {
        setTrussParts(prev => prev.map(p => p.id === id ? { ...p, isExcluded: !p.isExcluded } : p));
        setContextMenu(null);
        setEstimationResults(null);
    };

    // Calculate whenever inputs change (if already estimated)
    useEffect(() => {
        if (hasEstimated) {
            calculateAll();
        }
    }, [trussParts, unitPrices]);

    // Global Cost Sync
    useEffect(() => {
        if (estimationResults) {
            setSessionData('steel_truss_total', estimationResults.total);
        } else {
            setSessionData('steel_truss_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [estimationResults]);

    const calculateAll = () => {
        const hasEmptyFields = trussParts.some(p => !p.name || !p.type || !p.size || !p.thickness);
        if (hasEmptyFields) {
            setError("Please fill in all fields before calculating.");
            setEstimationResults(null);
            setHasEstimated(false);
            return;
        }
        setError(null);

        const groupedItems = {}; // Key: specKey, Value: array of cuts
        let grandTotal = 0;
        let totalPieces = 0;

        // 1. Group all cuts by material specification
        trussParts.forEach(part => {
            if (part.isExcluded) return;
            const specKey = `${part.type}_${part.size}_${part.thickness}`;
            if (!groupedItems[specKey]) {
                groupedItems[specKey] = {
                    specKey,
                    type: part.type,
                    size: part.size,
                    thickness: part.thickness,
                    cuts: []
                };
            }

            part.cuts.forEach(cut => {
                const len = parseFloat(cut.length);
                const qty = parseInt(cut.quantity);
                if (len > 0 && qty > 0) {
                    groupedItems[specKey].cuts.push({
                        length: len,
                        quantity: qty,
                        label: part.name
                    });
                }
            });
        });

        const items = [];

        // 2. Optimize each group
        Object.values(groupedItems).forEach(group => {
            if (group.cuts.length === 0) return;

            // Run Optimization
            const optimization = optimizeCuts(group.cuts, 6.0, 0.005); // 6m stock, 5mm kerf

            const piecesRequired = optimization.barsRequired;
            const unitPrice = parseFloat(unitPrices[group.specKey]) || 0;
            const cost = piecesRequired * unitPrice;

            grandTotal += cost;
            totalPieces += piecesRequired;

            items.push({
                name: `${STEEL_TYPES.find(t => t.id === group.type)?.label} - ${group.size}`,
                specs: `${group.thickness} THK`,
                qty: piecesRequired,
                unit: 'pcs (6m)',
                price: unitPrice,
                priceKey: group.specKey,
                total: cost,
                optimization: optimization, // Store full optimization result for modal
                rawGroup: group
            });
        });

        if (items.length > 0) {
            setEstimationResults({
                items: items,
                total: grandTotal,
                totalPieces: totalPieces
            });
            setHasEstimated(true);

        } else {
            setEstimationResults(null);
            setHasEstimated(false);

        }
    };

    const addTrussPart = () => {
        setTrussParts([
            ...trussParts,
            {
                id: `tp_${Date.now()}`,
                name: '',
                type: '',
                size: '',
                thickness: '',
                cuts: [{ length: '', quantity: '' }]
            }
        ]);
        setHasEstimated(false);
    };

    const removeTrussPart = (id) => {
        if (trussParts.length > 1) {
            setTrussParts(trussParts.filter(p => p.id !== id));
            setHasEstimated(false);
        }
    };

    const updateTrussPart = (id, field, value) => {
        setTrussParts(trussParts.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const updateCut = (partId, index, field, value) => {
        setTrussParts(trussParts.map(p => {
            if (p.id === partId) {
                const newCuts = [...p.cuts];
                newCuts[index] = { ...newCuts[index], [field]: value };
                return { ...p, cuts: newCuts };
            }
            return p;
        }));
    };

    const addCut = (partId) => {
        setTrussParts(trussParts.map(p => {
            if (p.id === partId) {
                return { ...p, cuts: [...p.cuts, { length: '', quantity: '' }] };
            }
            return p;
        }));
    };

    const removeCut = (partId, index) => {
        setTrussParts(trussParts.map(p => {
            if (p.id === partId) {
                const newCuts = p.cuts.filter((_, i) => i !== index);
                return { ...p, cuts: newCuts };
            }
            return p;
        }));
    };

    const handlePriceChange = (specKey, newPrice) => {
        setUnitPrices(prev => ({ ...prev, [specKey]: parseFloat(newPrice) || 0 }));
    };

    const activePartForCuts = trussParts.find(p => p.id === editingCutsId);

    return (
        <div className="space-y-6 relative">

            {/* CUTS MODAL OVERLAY */}
            {editingCutsId && activePartForCuts && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-sm border border-zinc-200 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        {/* Decorative Modal Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>

                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50">
                            <div>
                                <h3 className="font-bold text-lg text-zinc-800 uppercase tracking-tight">Part Specifications</h3>
                                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-1">
                                    Configuring: <span className="text-blue-600 font-bold">{activePartForCuts.name}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingCutsId(null)}
                                className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors border border-transparent hover:border-zinc-200 rounded-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 bg-[linear-gradient(rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:15px_15px]">
                            {activePartForCuts.cuts.map((cut, idx) => (
                                <div key={idx} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="bg-zinc-800 text-white text-[9px] font-mono w-6 h-6 flex items-center justify-center rounded-sm shrink-0">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </div>
                                    <div className="flex-1">
                                        <MathInput
                                            placeholder="Length (m)"
                                            value={cut.length}
                                            onChange={(val) => updateCut(activePartForCuts.id, idx, 'length', val)}
                                            className="w-full font-mono font-bold text-zinc-800"
                                        />
                                    </div>
                                    <div className="text-zinc-300 font-mono text-[10px] font-bold px-1">×</div>
                                    <div className="w-24">
                                        <MathInput
                                            placeholder="Qty"
                                            value={cut.quantity}
                                            onChange={(val) => updateCut(activePartForCuts.id, idx, 'quantity', val)}
                                            className="w-full font-mono font-bold text-zinc-800"
                                        />
                                    </div>
                                    <div className="text-[9px] text-zinc-400 font-mono uppercase font-bold w-8 text-center tracking-tighter">Units</div>
                                    <button
                                        onClick={() => removeCut(activePartForCuts.id, idx)}
                                        className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-sm transition-all border border-transparent hover:border-red-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => addCut(activePartForCuts.id)}
                                className="w-full py-3 bg-white border border-dashed border-zinc-200 text-zinc-400 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                <Plus size={14} /> Add Pattern Definition
                            </button>
                        </div>

                        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                            <button
                                onClick={() => setEditingCutsId(null)}
                                className="px-8 py-2 bg-zinc-900 text-white rounded-sm font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-md shadow-zinc-200"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUTTING PATTERN VISUALIZER MODAL */}
            {viewingPatterns && estimationResults && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-6xl h-[90vh] rounded-sm border border-zinc-200 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        {/* Decorative Modal Lines */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 no-print"></div>
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-r border-b border-blue-600 opacity-20 pointer-events-none no-print"></div>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 bg-zinc-50 shrink-0 no-print">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-blue-600 text-white rounded-sm shadow-lg shadow-blue-100">
                                    <Scissors size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-bold text-zinc-900 uppercase tracking-wide">Cutting Stock Analysis</h2>
                                        <span className="text-[10px] font-mono text-white bg-zinc-800 px-2 py-0.5 rounded-sm">OPT-V2</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">Structural Steel Optimization • 6.0m Stock Length</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingPatterns(false)}
                                className="p-2 hover:bg-white text-zinc-400 hover:text-zinc-900 transition-colors border border-transparent hover:border-zinc-200 rounded-sm"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content - Technical Grid */}
                        <div className="flex-1 overflow-y-auto p-8 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px] content-start printable-area">

                            {/* Print-Only Header Support */}
                            <div className="hidden print:block mb-8 border-b-4 border-zinc-900 pb-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h1 className="text-3xl font-black uppercase tracking-tighter">Structural Cutting Schedule</h1>
                                        <p className="text-xs font-mono uppercase text-zinc-500">Structural Steel Optimization • 6.00m Stock Length</p>
                                    </div>
                                    <div className="text-right text-[10px] font-mono uppercase">
                                        <p>Generated: {new Date().toLocaleDateString()}</p>
                                        <p className="font-bold">Ref: SCT-TR-{Date.now().toString().slice(-6)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                                {estimationResults.items.map((item, index) => {
                                    // Group patterns for "Bar-1 (X Pieces)"
                                    const groupedPatternsMap = (item.optimization?.patterns || []).reduce((acc, bin) => {
                                        const key = bin.cuts.map(c => `${c.length.toFixed(3)}|${c.label}`).join('||');
                                        if (!acc[key]) {
                                            acc[key] = { ...bin, count: 1 };
                                        } else {
                                            acc[key].count++;
                                        }
                                        return acc;
                                    }, {});
                                    const groupedPatterns = Object.values(groupedPatternsMap);

                                    // Color Mapping for unique cuts in this item
                                    const uniqueCutsInItem = Array.from(new Set(
                                        (item.optimization?.patterns || []).flatMap(p => p.cuts.map(c => `${c.length.toFixed(3)}|${c.label}`))
                                    ));
                                    const CUT_COLORS = [
                                        'bg-blue-600', 'bg-emerald-600', 'bg-violet-600',
                                        'bg-orange-600', 'bg-rose-600', 'bg-cyan-600',
                                        'bg-amber-600', 'bg-indigo-600', 'bg-teal-600'
                                    ];
                                    const getCutColor = (cut) => {
                                        const key = `${cut.length.toFixed(3)}|${cut.label}`;
                                        const colorIdx = uniqueCutsInItem.indexOf(key);
                                        return CUT_COLORS[colorIdx % CUT_COLORS.length];
                                    };

                                    return (
                                        <div key={index} className="group relative bg-white border border-zinc-200 shadow-sm hover:border-blue-500/30 transition-all duration-300 flex flex-col rounded-sm overflow-hidden print:break-inside-avoid shadow-inner">
                                            {/* Item Header */}
                                            <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                    <div>
                                                        <h3 className="font-bold text-zinc-800 uppercase tracking-wide text-sm">{item.name}</h3>
                                                        <p className="text-[10px] font-mono text-zinc-400 uppercase">{item.specs}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right no-print">
                                                    <div className="text-[9px] text-zinc-400 font-mono uppercase font-bold mb-0.5 tracking-tighter">Utilization</div>
                                                    <div className={`font-mono font-bold text-lg leading-none ${(item.optimization?.efficiency > 0.9) ? 'text-emerald-600' : (item.optimization?.efficiency > 0.8) ? 'text-blue-600' : 'text-amber-600'}`}>
                                                        {((item.optimization?.efficiency || 0) * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Patterns List */}
                                            <div className="p-5 space-y-6 max-h-[500px] overflow-y-auto print:max-h-none print:overflow-visible text-gray-800">
                                                {groupedPatterns.map((bin, gIdx) => (
                                                    <div key={gIdx} className="relative bg-zinc-50/50 p-4 border border-zinc-100 hover:bg-white hover:border-zinc-200 transition-all rounded-sm print:border-zinc-900 print:bg-white">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="bg-zinc-800 text-white text-[9px] font-mono px-2 py-0.5 rounded-sm">
                                                                    {(() => {
                                                                        const type = item.rawGroup?.type === 'angle_bar' ? 'AB' :
                                                                            item.rawGroup?.type === 'c_channel' ? 'CP' :
                                                                                item.rawGroup?.type === 'tubular_square' ? 'SHS' :
                                                                                    item.rawGroup?.type === 'tubular_rect' ? 'RHS' : 'ST';
                                                                        const sizeMatch = (item.rawGroup?.size || "").match(/\d+/);
                                                                        const size = sizeMatch ? sizeMatch[0] : "";
                                                                        const thk = (item.rawGroup?.thickness || "").replace('mm', '');
                                                                        return `${type}${size}.${thk}-${getAlphabeticalIndex(gIdx)}`;
                                                                    })()}
                                                                    <span className="ml-2 text-blue-400 print:text-zinc-500">({bin.count} PIECES)</span>
                                                                </span>
                                                                <span className="text-[10px] text-zinc-400 font-mono italic">STOCK: {bin.stockLength.toFixed(2)}m</span>
                                                            </div>
                                                            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tighter">
                                                                OFFCUT WASTE: <span className={bin.freeSpace > 0.5 ? 'text-red-500 font-black' : 'text-zinc-400 font-bold'}>{bin.freeSpace.toFixed(3)}m</span>
                                                            </span>
                                                        </div>

                                                        {/* Visual Bar - Color Coded */}
                                                        <div className="h-10 w-full bg-zinc-200/50 rounded-sm relative flex overflow-hidden shadow-inner border border-zinc-200/50 mb-3 print:border-zinc-800 print:bg-white">
                                                            {bin.cuts.map((cut, cIdx) => (
                                                                <div
                                                                    key={cIdx}
                                                                    style={{ width: `${(cut.length / bin.stockLength) * 100}%` }}
                                                                    className={`h-full ${getCutColor(cut)} border-r border-white/20 flex items-center justify-center group/cut transition-all hover:brightness-110 active:brightness-90 cursor-default print:border-zinc-800`}
                                                                >
                                                                    <span className="text-white text-[9px] font-bold font-mono px-1 truncate drop-shadow-sm">
                                                                        {cut.length.toFixed(2)}m
                                                                    </span>

                                                                    {/* Hover Tooltip (no-print) */}
                                                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/cut:block z-20 pointer-events-none no-print">
                                                                        <div className="bg-zinc-900 text-white text-[9px] py-1 px-2 rounded-sm font-mono whitespace-nowrap shadow-xl border border-zinc-800">
                                                                            {cut.label} • {cut.length.toFixed(3)}m
                                                                        </div>
                                                                        <div className="w-1.5 h-1.5 bg-zinc-900 rotate-45 -mt-1 mx-auto border-r border-b border-zinc-800"></div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {bin.freeSpace > 0 && (
                                                                <div className="flex-1 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.03)_5px,rgba(0,0,0,0.03)_10px)] flex items-center justify-center print:bg-white">
                                                                    {bin.freeSpace > 0.2 && <span className="text-[8px] text-zinc-300 font-mono uppercase tracking-widest no-print">discard</span>}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Legend */}
                                                        <div className="flex flex-wrap gap-2 text-gray-800">
                                                            {Array.from(new Set(bin.cuts.map(c => `${c.length.toFixed(3)}|${c.label}`))).map((cutKey, lIdx) => {
                                                                const [len, label] = cutKey.split('|');
                                                                const count = bin.cuts.filter(c => `${c.length.toFixed(3)}|${c.label}` === cutKey).length;
                                                                return (
                                                                    <div key={lIdx} className="flex items-center gap-1.5 bg-white border border-zinc-200 px-2 py-0.5 rounded-sm shadow-sm print:border-zinc-400">
                                                                        <div className={`w-2 h-2 rounded-full ${getCutColor({ length: parseFloat(len), label })} print:border print:border-zinc-900`}></div>
                                                                        <span className="text-[9px] font-black text-zinc-800 font-mono">{count}x {parseFloat(len).toFixed(2)}m</span>
                                                                        <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-tighter truncate max-w-[80px]">{label}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Item Footer Info */}
                                            <div className="px-5 py-3 bg-zinc-100/50 border-t border-zinc-100 flex justify-between items-center text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest print:bg-white print:border-zinc-900">
                                                <span>Total requirement</span>
                                                <span className="text-zinc-900 font-black">{item.optimization?.barsRequired || 0} Lengths</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* STRUCTURAL CUTTING SCHEDULE - For Plans/Printing */}
                            <div className="mt-12 pt-8 border-t-2 border-dashed border-zinc-200 print:border-solid print:border-t-4 print:border-zinc-900">
                                <div className="flex items-center justify-between mb-6 no-print">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-1 bg-zinc-900"></div>
                                        <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-tighter flex items-center gap-3">
                                            Structural Cutting Schedule
                                            <span className="text-[10px] font-mono font-normal bg-zinc-100 text-zinc-500 px-2 py-1 rounded-sm border border-zinc-200 uppercase tracking-widest border-l-4 border-l-blue-600">Plan Code: SCT-TR-{Date.now().toString().slice(-6)}</span>
                                        </h2>
                                    </div>
                                    <button
                                        className="sm:flex items-center gap-2 px-4 py-1.5 bg-zinc-900 text-white rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg no-print"
                                        onClick={() => window.print()}
                                    >
                                        <Download size={12} /> Export for Prints
                                    </button>
                                </div>

                                {/* Print Header (Only visible on print) */}
                                <div className="hidden print:block mb-8 border-b-4 border-zinc-900 pb-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900">Structural Cutting Schedule</h1>
                                            <p className="text-xs font-mono uppercase text-zinc-600">Project: structural steel Truss Optimization • Stock: 6.00m</p>
                                        </div>
                                        <div className="text-right text-[10px] font-mono uppercase text-zinc-900">
                                            <p>Generated: {new Date().toLocaleDateString()}</p>
                                            <p className="font-bold">Plan Ref: SCT-TR-{Date.now().toString().slice(-6)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {estimationResults.items.map((item, idx) => (
                                        <div key={idx} className="bg-white border border-zinc-300 rounded-sm overflow-hidden">
                                            <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-300 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 bg-zinc-900 text-white flex items-center justify-center font-mono text-sm">{(idx + 1).toString().padStart(2, '0')}</span>
                                                    <div>
                                                        <h4 className="font-bold text-zinc-900 uppercase text-xs tracking-wide">{item.name}</h4>
                                                        <p className="text-[9px] font-mono text-zinc-500 uppercase">{item.specs} • 6.00m Stock Length</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[8px] font-mono text-zinc-400 block uppercase">Total Quantity</span>
                                                    <span className="text-sm font-bold text-zinc-900 font-mono">{item.qty} PCS</span>
                                                </div>
                                            </div>
                                            <table className="w-full text-[10px] font-mono text-left border-collapse">
                                                <thead className="bg-zinc-100 border-b border-zinc-300">
                                                    <tr>
                                                        <th className="px-6 py-2 border-r border-zinc-200 uppercase tracking-wider font-bold text-zinc-600 w-16 text-center">Mark</th>
                                                        <th className="px-6 py-2 border-r border-zinc-200 uppercase tracking-wider font-bold text-zinc-600 text-center">Cutting Detail (Lengths in Meters)</th>
                                                        <th className="px-6 py-2 border-r border-zinc-200 uppercase tracking-wider font-bold text-zinc-600 w-24 text-center">Stock Count</th>
                                                        <th className="px-6 py-2 border-r border-zinc-200 uppercase tracking-wider font-bold text-zinc-600 w-24 text-center">Waste (m)</th>
                                                        <th className="px-6 py-2 uppercase tracking-wider font-bold text-zinc-600 w-32 text-right">Running Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-200">
                                                    {Object.values((item.optimization?.patterns || []).reduce((acc, bin) => {
                                                        const key = bin.cuts.map(c => `${c.length.toFixed(3)}|${c.label}`).join('||');
                                                        if (!acc[key]) acc[key] = { ...bin, count: 1 };
                                                        else acc[key].count++;
                                                        return acc;
                                                    }, {})).map((group, gIdx) => (
                                                        <tr key={gIdx} className="hover:bg-zinc-50 transition-colors">
                                                            <td className="px-6 py-3 border-r border-zinc-200 text-center font-bold text-zinc-900 whitespace-nowrap">
                                                                {(() => {
                                                                    const type = item.rawGroup?.type === 'angle_bar' ? 'AB' :
                                                                        item.rawGroup?.type === 'c_channel' ? 'CP' :
                                                                            item.rawGroup?.type === 'tubular_square' ? 'SHS' :
                                                                                item.rawGroup?.type === 'tubular_rect' ? 'RHS' : 'ST';
                                                                    const sizeMatch = (item.rawGroup?.size || "").match(/\d+/);
                                                                    const size = sizeMatch ? sizeMatch[0] : "";
                                                                    const thk = (item.rawGroup?.thickness || "").replace('mm', '');
                                                                    return `${type}${size}.${thk}-${getAlphabeticalIndex(gIdx)}`;
                                                                })()}
                                                            </td>
                                                            <td className="px-6 py-3 border-r border-zinc-200">
                                                                <div className="flex flex-wrap gap-2 items-center">
                                                                    {Array.from(new Set(group.cuts.map(c => `${c.length.toFixed(3)}|${c.label}`))).map((cutKey, lIdx) => {
                                                                        const [len, label] = cutKey.split('|');
                                                                        const count = group.cuts.filter(c => `${c.length.toFixed(3)}|${c.label}` === cutKey).length;
                                                                        return (
                                                                            <span key={lIdx} className="bg-zinc-100 px-2 py-0.5 border border-zinc-200 rounded-sm">
                                                                                <span className="font-bold text-blue-600">{count}x</span> {parseFloat(len).toFixed(2)}m <span className="text-[8px] text-zinc-400">[{label}]</span>
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 border-r border-zinc-200 text-center font-bold text-zinc-900">{group.count}</td>
                                                            <td className="px-6 py-3 border-r border-zinc-200 text-center text-zinc-500">{group.freeSpace.toFixed(3)}</td>
                                                            <td className="px-6 py-3 text-right font-bold text-zinc-900">{(group.count * 6.00).toFixed(2)}m</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-zinc-900 text-white font-bold">
                                                    <tr>
                                                        <td colSpan="2" className="px-6 py-2 text-right uppercase tracking-widest text-[9px]">Summary for Item:</td>
                                                        <td className="px-6 py-2 text-center text-sm">{item.qty} PCS</td>
                                                        <td className="px-6 py-2 text-center text-[9px] text-zinc-400">{(item.optimization?.wasteTotal || 0).toFixed(3)}m waste</td>
                                                        <td className="px-6 py-2 text-right text-sm">{(item.qty * 6.00).toFixed(2)}m</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-4 border-t border-zinc-100 bg-white flex justify-between items-center shrink-0 no-print">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono">Total Stock Units</span>
                                    <span className="text-sm font-bold text-zinc-900 font-mono">{estimationResults.totalPieces} Lengths</span>
                                </div>
                                <div className="w-px h-8 bg-zinc-100"></div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono">Kerf / Blade Allowance</span>
                                    <span className="text-sm font-bold text-zinc-900 font-mono">5.00 mm</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingPatterns(false)}
                                className="px-8 py-2.5 bg-zinc-900 text-white rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-200"
                            >
                                Close Analysis
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
                        <Copy size={14} className="text-slate-400" /> Duplicate to Next Row
                    </button>
                    <button
                        onClick={() => handleAddRowAbove(contextMenu.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                    >
                        <ArrowUp size={14} className="text-slate-400" /> Add Row Above
                    </button>
                    <button
                        onClick={() => handleToggleExcludeRow(contextMenu.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        {trussParts.find(p => p.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in Calculation</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude from Calculation</>
                        }
                    </button>
                </div>
            )}

            {/* INPUT CARD */}
            <Card className="border-t-4 border-t-blue-500 shadow-md">
                <div className="p-4 bg-blue-50 border-b border-blue-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-blue-900 flex items-center gap-2">
                        <Settings size={18} /> Truss Configuration ({trussParts.length} Parts)
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={addTrussPart}
                            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 transition-colors active:scale-95 shadow-sm"
                        >
                            <PlusCircle size={14} /> Add Part
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[800px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[200px]">Part Name</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[180px]">Type</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[200px]">Size</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Thickness</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[140px]">Cut List</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {trussParts.map((part, index) => (
                                <tr key={part.id} className={`transition-colors ${part.isExcluded ? 'bg-slate-50/50 opacity-60 grayscale-[0.5]' : 'bg-white hover:bg-slate-50'}`}>
                                    <td
                                        className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold cursor-help relative group"
                                        onContextMenu={(e) => {
                                            if (e.ctrlKey) {
                                                e.preventDefault();
                                                setContextMenu({ id: part.id, x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        title="Ctrl + Right Click for options"
                                    >
                                        <div className={`transition-all ${part.isExcluded ? 'text-red-400 line-through' : ''}`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <input
                                            type="text"
                                            value={part.name}
                                            onChange={(e) => updateTrussPart(part.id, 'name', e.target.value)}
                                            placeholder="Part Name"
                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none font-medium bg-white text-slate-900 text-center placeholder:text-zinc-400 placeholder:font-normal placeholder:italic"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <SelectInput
                                            value={part.type}
                                            onChange={(val) => updateTrussPart(part.id, 'type', val)}
                                            options={STEEL_TYPES.map(t => ({ id: t.id, display: t.label }))}
                                            placeholder="Select Type..."
                                            focusColor="blue"
                                            className="text-center"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <SelectInput
                                            value={part.size}
                                            onChange={(val) => updateTrussPart(part.id, 'size', val)}
                                            options={(COMMON_SIZES[part.type] || []).map(s => ({ id: s, display: s }))}
                                            placeholder="Select Size..."
                                            focusColor="blue"
                                            className="text-center"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <SelectInput
                                            value={part.thickness}
                                            onChange={(val) => updateTrussPart(part.id, 'thickness', val)}
                                            options={COMMON_THICKNESS.map(t => ({ id: t, display: t }))}
                                            placeholder="Thk..."
                                            focusColor="blue"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <button
                                            onClick={() => setEditingCutsId(part.id)}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 rounded border border-slate-200 hover:border-blue-200 text-xs font-bold transition-colors flex items-center justify-center gap-2 w-full"
                                        >
                                            <Edit2 size={12} />
                                            {part.cuts.length} Cuts
                                        </button>
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <button
                                            onClick={() => removeTrussPart(part.id)}
                                            disabled={trussParts.length === 1}
                                            className={`p-2 rounded-full transition-colors ${trussParts.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border-t border-red-200 text-red-700 text-sm font-medium flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button onClick={calculateAll} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-all hover:bg-blue-700 uppercase tracking-wider text-sm flex items-center justify-center gap-2 min-w-[200px]">
                        <Calculator size={18} /> CALCULATE
                    </button>
                </div>
            </Card>

            {/* RESULT CARD (Matching Masonry Style) */}
            {estimationResults && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-blue-600">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                    Estimation Result
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Based on <strong className="text-gray-700">{trussParts.length}</strong> truss part configurations
                                    yielding <strong className="text-gray-700">{estimationResults.totalPieces}</strong> stock lengths (6m).
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="text-left md:text-right bg-blue-50 px-5 py-3 rounded-xl border border-blue-100">
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                    <p className="font-bold text-4xl text-blue-700 tracking-tight">
                                        ₱{estimationResults.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="flex flex-wrap justify-end gap-2">
                                    <button
                                        onClick={() => setViewingPatterns(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                                        title="View detailed cutting stock analysis"
                                    >
                                        <Scissors size={14} /> Cutting Analysis
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const success = await copyToClipboard(estimationResults.items);
                                            if (success) alert('Table copied to clipboard!');
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800 transition-colors shadow-sm"
                                        title="Copy table to clipboard for Excel"
                                    >
                                        <ClipboardCopy size={14} /> Copy CSV
                                    </button>
                                    <button
                                        onClick={() => downloadCSV(estimationResults.items, 'steel_truss_estimate.csv')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800 transition-colors shadow-sm"
                                        title="Download as CSV"
                                    >
                                        <Download size={14} /> Download CSV
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200 mb-2">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">Material Item</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[140px]">Unit Price (Editable)</th>
                                        <th className="px-4 py-3 text-right bg-gray-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {estimationResults.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800">{item.name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono uppercase">{item.specs}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-bold">
                                                {item.qty.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <TablePriceInput
                                                    value={item.price}
                                                    onChange={(newValue) => handlePriceChange(item.priceKey, newValue)}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 bg-gray-50/50">
                                                ₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            )}

            {!estimationResults && !error && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Construction size={32} className="text-blue-500" />
                    </div>
                    <p className="font-medium text-center max-w-md">
                        Configure truss parts above, then click <span className="font-bold text-blue-600">'CALCULATE'</span> to compare results.
                    </p>
                </div>
            )}
        </div>
    );
}
