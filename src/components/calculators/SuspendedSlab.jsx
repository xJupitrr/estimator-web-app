import React, { useState, useEffect } from 'react';
import { Layers, Info, Box, LayoutTemplate, Columns, PenTool, Grid3X3, Paintbrush, Cloud, Hammer, SquareStack, Settings, Calculator, PlusCircle, Trash2, AlertCircle, ClipboardCopy, Download, CheckCircle2, XCircle, Eye, EyeOff, ArrowUp, Copy } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import { calculateSuspendedSlab, getSlabType, rebarDiameters, commonLengths, rebarOptions, DECKING_OPTIONS, FORMWORK_OPTIONS, SUPPORT_TYPES, DEFAULT_PRICES } from '../../utils/calculations/suspendedSlabCalculator';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

const TablePriceInput = ({ value, onChange }) => (
    <div className="flex items-center justify-end">
        <div className="bg-gray-100/50 px-2 py-1.5 text-gray-600 text-sm font-bold flex items-center border border-gray-300 rounded-l-lg border-r-0 h-full">
            ₱
        </div>
        <input
            type="number"
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 pl-2 pr-2 py-1.5 text-right text-sm border border-slate-300 rounded-r-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-gray-800 font-medium transition-colors border-l-0"
        />
    </div>
);

const getInitialSlab = () => ({
    id: Date.now() + Math.random(),
    quantity: 1,
    length: "",
    width: "",
    thickness: "0.15", // Standard suspended slab
    rebarSpec: "12mm x 6.0m", // Standard spec
    rebar_x_spacing: "0.20",
    rebar_y_spacing: "0.20",
    decking_type: "b_deck_0_8", // Metal Decking common for suspended
    support_type: "standard_shoring",
    formwork_type: "standard_forms",
    description: "",
    isExcluded: false,
});

export default function SuspendedSlab() {
    const [slabs, setSlabs] = useLocalStorage('suspended_slab_rows', [getInitialSlab()]);
    const [prices, setPrices] = useLocalStorage('suspended_slab_prices', DEFAULT_PRICES);
    const [result, setResult] = useLocalStorage('suspended_slab_result', null);
    const [error, setError] = useState(null);

    const handleSlabChange = (id, field, value) => {
        setSlabs(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
        setResult(null);
        setError(null);
    };

    const handleAddSlab = () => {
        setSlabs(prev => [...prev, getInitialSlab()]);
        setResult(null);
        setError(null);
    };

    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleAddRowAbove = (id) => {
        setSlabs(prev => {
            const index = prev.findIndex(s => s.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, getInitialSlab());
            return newRows;
        });
        setContextMenu(null);
        setResult(null);
    };

    const handleDuplicateRow = (id) => {
        setSlabs(prev => {
            const index = prev.findIndex(s => s.id === id);
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
        setResult(null);
    };

    const handleToggleExcludeRow = (id) => {
        setSlabs(prev => prev.map(s => s.id === id ? { ...s, isExcluded: !s.isExcluded } : s));
        setContextMenu(null);
        setResult(null);
    };

    const performCalculation = () => {
        const invalid = slabs.some(s => !s.length || !s.width || !s.thickness);
        if (invalid) {
            setError("Please fill in all dimensions (Length, Width, Thickness) for all slabs.");
            setResult(null);
            return;
        }
        setError(null);

        const calcResult = calculateSuspendedSlab(slabs, prices);

        if (calcResult) {
            setResult(calcResult);
        } else {
            setResult(null);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('suspended_slab_total', result.total);
        } else {
            setSessionData('suspended_slab_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    const handlePriceChange = (key, value) => {
        setPrices(prev => ({
            ...prev,
            [key]: parseFloat(value) || 0
        }));
    };

    return (
        <div className="space-y-6">
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
                        {slabs.find(s => s.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in Calculation</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude from Calculation</>
                        }
                    </button>
                </div>
            )}

            <Card className="border-t-4 border-t-blue-600 shadow-md">
                <div className="p-4 bg-blue-50 border-b border-blue-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-blue-900 flex items-center gap-2">
                        <Layers size={18} /> Suspended Slab Configuration
                    </h2>
                    <button
                        onClick={handleAddSlab}
                        className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-sm justify-center"
                    >
                        <PlusCircle size={14} /> Add Slab Row
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[1200px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[60px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[200px]">Description</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Length (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Width (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Thkns (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[160px]">Rebar Spec</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">X-Spac</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">Y-Spac</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[140px]">Decking/Forms</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {slabs.map((slab, index) => (
                                <tr
                                    key={slab.id}
                                    className={`transition-colors ${slab.isExcluded ? 'bg-slate-50/50 opacity-60 grayscale-[0.5]' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    <td
                                        className="p-2 border border-slate-300 align-middle text-center text-xs text-slate-500 font-bold cursor-help relative group"
                                        onContextMenu={(e) => {
                                            if (e.ctrlKey) {
                                                e.preventDefault();
                                                setContextMenu({ id: slab.id, x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        title="Ctrl + Right Click for options"
                                    >
                                        <div className={`transition-all ${slab.isExcluded ? 'text-red-400 line-through' : ''}`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={slab.quantity}
                                            onChange={(val) => handleSlabChange(slab.id, 'quantity', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none font-bold"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <input
                                            type="text"
                                            value={slab.description}
                                            onChange={(e) => handleSlabChange(slab.id, 'description', e.target.value)}
                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                            placeholder="e.g., 2F Main Slab"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            value={slab.length}
                                            onChange={(val) => handleSlabChange(slab.id, 'length', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            value={slab.width}
                                            onChange={(val) => handleSlabChange(slab.id, 'width', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            value={slab.thickness}
                                            onChange={(val) => handleSlabChange(slab.id, 'thickness', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput
                                            value={slab.rebarSpec}
                                            onChange={(val) => handleSlabChange(slab.id, 'rebarSpec', val)}
                                            options={rebarOptions}
                                            focusColor="blue"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            value={slab.rebar_x_spacing}
                                            onChange={(val) => handleSlabChange(slab.id, 'rebar_x_spacing', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            value={slab.rebar_y_spacing}
                                            onChange={(val) => handleSlabChange(slab.id, 'rebar_y_spacing', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput
                                            value={slab.decking_type}
                                            onChange={(val) => handleSlabChange(slab.id, 'decking_type', val)}
                                            options={DECKING_OPTIONS}
                                            focusColor="blue"
                                            className="mb-1"
                                        />
                                        <SelectInput
                                            value={slab.formwork_type}
                                            onChange={(val) => handleSlabChange(slab.id, 'formwork_type', val)}
                                            options={FORMWORK_OPTIONS}
                                            focusColor="blue"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center">
                                        <button
                                            onClick={() => handleRemoveSlab(slab.id)}
                                            disabled={slabs.length === 1}
                                            className={`p-2 rounded-full transition-colors ${slabs.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
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
                    <div className="p-4 bg-red-50 border-t border-red-200 text-red-700 text-sm font-medium flex items-center justify-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button onClick={performCalculation} className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Calculator size={18} /> CALCULATE
                    </button>
                </div>
            </Card>

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-blue-600 mt-6">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Estimation Result</h3>
                                <p className="text-sm text-gray-500 mt-1">Total Slab Volume: <strong className="text-gray-700">{result.stats.totalVolume.toFixed(2)} m³</strong></p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="text-left md:text-right bg-blue-50 px-5 py-3 rounded-xl border border-blue-100">
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                    <p className="font-bold text-4xl text-blue-700 tracking-tight">
                                        ₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => copyToClipboard(result.items)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors">
                                        <ClipboardCopy size={14} /> Copy Table
                                    </button>
                                    <button onClick={() => downloadCSV(result.items, 'suspended_slab_estimate.csv')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors">
                                        <Download size={14} /> CSV
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">Material Item</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[160px]">Unit Price</th>
                                        <th className="px-4 py-3 text-right bg-gray-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">{item.qty}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <TablePriceInput
                                                    value={prices[item.priceKey] || 0}
                                                    onChange={(val) => handlePriceChange(item.priceKey, val)}
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
        </div>
    );
}
