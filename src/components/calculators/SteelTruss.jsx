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
    name: 'Top Chord',
    type: 'angle_bar',
    size: '50mm x 50mm (2" x 2")', // Matches first option of default type
    thickness: '4.0mm',
    cuts: [{ length: '', quantity: '' }]
};

export default function SteelTruss() {
    const [trussParts, setTrussParts] = useLocalStorage('steel_truss_parts', [INITIAL_TRUSS_PART]);
    const [unitPrices, setUnitPrices] = useLocalStorage('steel_truss_prices', {});

    // Results state
    const [estimationResults, setEstimationResults] = useState(null);
    const [hasEstimated, setHasEstimated] = useState(false);
    const [error, setError] = useState(null);

    // Modal States
    const [editingCutsId, setEditingCutsId] = useState(null);
    const [viewingPatterns, setViewingPatterns] = useState(false); // boolean now

    // Calculate whenever inputs change (if already estimated)
    useEffect(() => {
        if (hasEstimated) {
            calculateAll();
        }
    }, [trussParts, unitPrices]);

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

            // Update global state
            setSessionData('steel_truss_total', grandTotal);
            window.dispatchEvent(new CustomEvent('project-total-update'));
        } else {
            setEstimationResults(null);
            setHasEstimated(false);
            setSessionData('steel_truss_total', null);
        }
    };

    const addTrussPart = () => {
        setTrussParts([
            ...trussParts,
            {
                id: `tp_${Date.now()}`,
                name: 'New Part',
                type: 'angle_bar',
                size: '25mm x 25mm (1" x 1")',
                thickness: '1.2mm',
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-zinc-200 flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50 rounded-t-xl">
                            <div>
                                <h3 className="font-bold text-lg text-zinc-800">Manage Cuts</h3>
                                <p className="text-xs text-zinc-500 font-mono">Part: {activePartForCuts.name}</p>
                            </div>
                            <button onClick={() => setEditingCutsId(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                                <X size={20} className="text-zinc-500" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                            {activePartForCuts.cuts.map((cut, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-zinc-400 w-6">{idx + 1}</span>
                                    <div className="flex-1">
                                        <MathInput
                                            placeholder="Length"
                                            value={cut.length}
                                            onChange={(val) => updateCut(activePartForCuts.id, idx, 'length', val)}
                                            className="w-full"
                                        />
                                    </div>
                                    <span className="text-zinc-400 text-xs">m ×</span>
                                    <div className="w-24">
                                        <MathInput
                                            placeholder="Qty"
                                            value={cut.quantity}
                                            onChange={(val) => updateCut(activePartForCuts.id, idx, 'quantity', val)}
                                            className="w-full"
                                        />
                                    </div>
                                    <span className="text-zinc-400 text-xs">pcs</span>
                                    <button onClick={() => removeCut(activePartForCuts.id, idx)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => addCut(activePartForCuts.id)}
                                className="w-full py-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg text-xs font-bold uppercase hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 mt-2"
                            >
                                <Plus size={14} /> Add Cut Length
                            </button>
                        </div>
                        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end rounded-b-xl">
                            <button onClick={() => setEditingCutsId(null)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUTTING PATTERN VISUALIZER MODAL */}
            {viewingPatterns && estimationResults && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-6xl rounded-xl shadow-2xl border border-zinc-200 flex flex-col animate-in zoom-in-95 duration-200 h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50 rounded-t-xl shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-zinc-800 flex items-center gap-2">
                                    <Scissors size={20} className="text-blue-600" /> Cutting List Summary
                                </h3>
                                <p className="text-sm text-zinc-500 font-medium">Optimal Cut Layouts for all materials</p>
                            </div>
                            <button onClick={() => setViewingPatterns(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                                <X size={24} className="text-zinc-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto bg-slate-50 flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 content-start">
                            {estimationResults.items.map((item, index) => (
                                <div key={index} className="space-y-4 bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div>
                                            <h4 className="font-bold text-slate-800">{item.name}</h4>
                                            <p className="text-xs text-slate-500 font-mono">{item.specs}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500 uppercase font-bold">Efficiency</div>
                                            <div className={`font-bold text-lg ${item.optimization.efficiency > 0.9 ? 'text-green-600' : 'text-orange-600'}`}>
                                                {(item.optimization.efficiency * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                        {item.optimization.patterns.map((bin) => (
                                            <div key={bin.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-slate-700 text-xs">Bar #{bin.id}</span>
                                                    <span className="text-[10px] font-mono text-slate-400">Rem: {bin.freeSpace.toFixed(3)}m</span>
                                                </div>

                                                {/* Visual Bar Representation */}
                                                <div className="h-8 w-full bg-white rounded border border-slate-200 relative flex overflow-hidden mb-2 shadow-inner">
                                                    {bin.cuts.map((cut, cIdx) => (
                                                        <div
                                                            key={cIdx}
                                                            style={{ width: `${(cut.length / bin.stockLength) * 100}%` }}
                                                            className="h-full bg-blue-500 border-r border-white/50 first:rounded-l flex items-center justify-center text-white text-[10px] font-bold relative group hover:bg-blue-600 transition-colors"
                                                            title={`${cut.label}: ${cut.length}m`}
                                                        >
                                                            <span className="truncate px-1 drop-shadow-md">{cut.length}m</span>
                                                        </div>
                                                    ))}
                                                    {/* Waste/Free Space */}
                                                    <div className="flex-1 bg-red-50/50 flex items-center justify-center text-red-300 text-[9px] italic">
                                                        {bin.freeSpace > 0.1 && "waste"}
                                                    </div>
                                                </div>

                                                {/* Cut Details List */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {bin.cuts.map((cut, cIdx) => (
                                                        <span key={cIdx} className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] border border-blue-100">
                                                            <span className="font-bold mr-1">{cut.length}m</span>
                                                            <span className="opacity-75 truncate max-w-[80px]">({cut.label})</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                                        Total Bars Required: <strong className="text-slate-700">{item.optimization.barsRequired}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-white border-t border-zinc-100 flex justify-end items-center rounded-b-xl shrink-0">
                            <button onClick={() => setViewingPatterns(false)} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-900 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
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
                                <th className="px-3 py-2 font-bold border border-slate-300 text-left w-[200px]">Part Name</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-left w-[180px]">Type</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-left w-[200px]">Size</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Thickness</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[140px]">Cut List</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {trussParts.map((part, index) => (
                                <tr key={part.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold">
                                        {index + 1}
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <input
                                            type="text"
                                            value={part.name}
                                            onChange={(e) => updateTrussPart(part.id, 'name', e.target.value)}
                                            placeholder="Part Name"
                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none font-medium bg-white text-slate-900"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <SelectInput
                                            value={part.type}
                                            onChange={(val) => updateTrussPart(part.id, 'type', val)}
                                            options={STEEL_TYPES.map(t => ({ id: t.id, display: t.label }))}
                                            placeholder="Select Type..."
                                            focusColor="blue"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <SelectInput
                                            value={part.size}
                                            onChange={(val) => updateTrussPart(part.id, 'size', val)}
                                            options={(COMMON_SIZES[part.type] || []).map(s => ({ id: s, display: s }))}
                                            placeholder="Select Size..."
                                            focusColor="blue"
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

            {/* RESULTS CARD */}
            {estimationResults && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-blue-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                    Estimation Result
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Based on <strong className="text-gray-700">{trussParts.length}</strong> truss parts totaling <strong className="text-gray-700">{estimationResults.totalPieces}</strong> commercial bars.</p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="text-left md:text-right bg-blue-50 px-5 py-3 rounded-xl border border-blue-100">
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                    <p className="font-bold text-4xl text-blue-700 tracking-tight">
                                        {estimationResults.total.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewingPatterns(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors shadow-sm"
                                    >
                                        <Scissors size={14} /> Optimization
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const success = await copyToClipboard(estimationResults.items);
                                            if (success) alert('Table copied to clipboard!');
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                                    >
                                        <ClipboardCopy size={14} /> Copy
                                    </button>
                                    <button
                                        onClick={() => downloadCSV(estimationResults.items, 'steel_truss_estimate.csv')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                                    >
                                        <Download size={14} /> CSV
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200 mb-2">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 w-[35%]">Item Description</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[140px]">Unit Price</th>
                                        <th className="px-4 py-3 text-right bg-gray-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {estimationResults.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                <div>{item.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{item.specs}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">{item.qty}</td>
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
                                                {item.total.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
