import React, { useState, useEffect } from 'react';
import { Columns, Info, Settings, Calculator, PlusCircle, Trash2, AlertCircle, ClipboardCopy, Download, Eye, EyeOff, ArrowUp, Copy, Scissors, ChevronDown, ChevronUp, X } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import SelectInput from '../common/SelectInput';
import { calculateFooting, DEFAULT_PRICES } from '../../utils/calculations/footingCalculator';
import { optimizeCuts } from '../../utils/optimization/cuttingStock';

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
            className="w-20 pl-2 pr-2 py-1.5 text-right text-sm border border-slate-300 rounded-r-lg bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none text-gray-800 font-medium transition-colors border-l-0"
        />
    </div>
);

// Constants for rebar and concrete
const rebarDiameters = ["10mm", "12mm", "16mm", "20mm", "25mm"];
const commonLengths = [6.0, 7.5, 9.0, 10.5, 12.0];
const rebarOptions = rebarDiameters.flatMap(size =>
    commonLengths.map(length => `${size} x ${length.toFixed(1)}m`)
);

const getInitialFooting = () => ({
    id: Date.now() + Math.random(),
    quantity: 1,
    x_len: "", // Length (X) in meters
    y_len: "", // Width (Y) in meters
    z_depth: "", // Depth (Z) in meters
    rebarSpec: "12mm x 6.0m",
    rebar_x_count: "",
    rebar_y_count: "",
    description: "",
    isExcluded: false,
});

export default function Footing() {
    const [footings, setFootings] = useLocalStorage('footing_rows', [getInitialFooting()]);
    const [footingPrices, setFootingPrices] = useLocalStorage('footing_prices', DEFAULT_PRICES);
    const [footingResult, setFootingResult] = useLocalStorage('footing_result', null);
    const [error, setError] = useState(null);
    const [showAnalysis, setShowAnalysis] = useState(false);

    const handleFootingChange = (id, field, value) => {
        setFootings(prevFootings =>
            prevFootings.map(footing => (
                footing.id === id ? { ...footing, [field]: value } : footing
            ))
        );
        setError(null);
    };

    const handleAddFooting = () => {
        setFootings(prev => [...prev, getInitialFooting()]);
        setFootingResult(null);
    };

    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleAddRowAbove = (id) => {
        setFootings(prev => {
            const index = prev.findIndex(f => f.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, getInitialFooting());
            return newRows;
        });
        setContextMenu(null);
        setFootingResult(null);
    };

    const handleDuplicateRow = (id) => {
        setFootings(prev => {
            const index = prev.findIndex(f => f.id === id);
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
        setFootingResult(null);
    };

    const handleToggleExcludeRow = (id) => {
        setFootings(prev => prev.map(f => f.id === id ? { ...f, isExcluded: !f.isExcluded } : f));
        setContextMenu(null);
        setFootingResult(null);
    };

    const calculateFootings = () => {
        // Validation Check
        const hasEmptyFields = footings.some(footing =>
            footing.x_len === "" ||
            footing.y_len === "" ||
            footing.z_depth === ""
        );

        if (hasEmptyFields) {
            setError("Please fill in all required dimensions (Length, Width, Depth) before calculating.");
            setFootingResult(null);
            return;
        }
        setError(null);

        const calcResult = calculateFooting(footings, footingPrices);

        if (calcResult) {
            setFootingResult(calcResult);
        } else {
            setFootingResult(null);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (footingResult) {
            setSessionData('footing_total', footingResult.total);
        } else {
            setSessionData('footing_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [footingResult]);

    const handlePriceChange = (key, value) => {
        setFootingPrices(prev => ({
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
                        {footings.find(f => f.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in Calculation</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude from Calculation</>
                        }
                    </button>
                </div>
            )}

            <Card className="border-t-4 border-t-emerald-600 shadow-md">
                <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-emerald-900 flex items-center gap-2">
                        <Columns size={18} /> Footing Configuration
                    </h2>
                    <button
                        onClick={handleAddFooting}
                        className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-sm justify-center"
                    >
                        <PlusCircle size={14} /> Add Row
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[1000px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[60px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[200px]">Description</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">X-Len (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Y-Wid (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Z-Dep (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[180px]">Rebar Spec</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Rebars along X</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Rebars along Y</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {footings.map((footing, index) => (
                                <tr
                                    key={footing.id}
                                    className={`transition-colors ${footing.isExcluded ? 'bg-slate-50/50 opacity-60 grayscale-[0.5]' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    <td
                                        className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold cursor-help relative group"
                                        onContextMenu={(e) => {
                                            if (e.ctrlKey) {
                                                e.preventDefault();
                                                setContextMenu({ id: footing.id, x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        title="Ctrl + Right Click for options"
                                    >
                                        <div className={`transition-all ${footing.isExcluded ? 'text-red-400 line-through' : ''}`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={footing.quantity}
                                            onChange={(val) => handleFootingChange(footing.id, 'quantity', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-bold"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <input
                                            type="text"
                                            value={footing.description}
                                            onChange={(e) => handleFootingChange(footing.id, 'description', e.target.value)}
                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                                            placeholder="e.g., F1 Main Column Footing"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={footing.x_len}
                                            onChange={(val) => handleFootingChange(footing.id, 'x_len', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={footing.y_len}
                                            onChange={(val) => handleFootingChange(footing.id, 'y_len', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={footing.z_depth}
                                            onChange={(val) => handleFootingChange(footing.id, 'z_depth', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium text-slate-600"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput
                                            value={footing.rebarSpec}
                                            onChange={(val) => handleFootingChange(footing.id, 'rebarSpec', val)}
                                            options={rebarOptions.map(opt => ({ id: opt, display: opt }))}
                                            focusColor="emerald"
                                            className="text-xs"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={footing.rebar_x_count}
                                            onChange={(val) => handleFootingChange(footing.id, 'rebar_x_count', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={footing.rebar_y_count}
                                            onChange={(val) => handleFootingChange(footing.id, 'rebar_y_count', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center">
                                        <button
                                            onClick={() => handleRemoveFooting(footing.id)}
                                            disabled={footings.length === 1}
                                            className={`p-2 rounded-full transition-colors ${footings.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
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
                    <button onClick={calculateFootings} className="w-full sm:w-auto px-8 py-3 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Calculator size={18} /> CALCULATE
                    </button>
                </div>
            </Card>

            {footingResult && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-emerald-600 mt-6">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Estimation Result</h3>
                                <p className="text-sm text-gray-500 mt-1">Total Concrete Volume: <strong className="text-gray-700">{footingResult.volume} m³</strong></p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="text-left md:text-right bg-emerald-50 px-5 py-3 rounded-xl border border-emerald-100">
                                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                    <p className="font-bold text-4xl text-emerald-700 tracking-tight">
                                        ₱{footingResult.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAnalysis(true)}
                                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 hover:bg-emerald-700"
                                >
                                    <Scissors size={14} /> VIEW CUTTING ANALYSIS
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            const success = await copyToClipboard(footingResult.items);
                                            if (success) alert('Table copied to clipboard!');
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                                        title="Copy table to clipboard for Excel"
                                    >
                                        <ClipboardCopy size={14} /> Copy to Clipboard
                                    </button>
                                    <button
                                        onClick={() => downloadCSV(footingResult.items, 'footing_estimate.csv')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                                        title="Download as CSV"
                                    >
                                        <Download size={14} /> Download CSV
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
                                        <th className="px-4 py-3 text-right">Unit Price</th>
                                        <th className="px-4 py-3 text-right bg-gray-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {footingResult.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">{item.qty}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <TablePriceInput
                                                    value={footingPrices[item.priceKey] || 0}
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

                        {/* CUTTING ANALYSIS MODAL */}
                        {showAnalysis && footingResult.rebarGroups && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
                                <div className="bg-white w-full max-w-6xl h-[90vh] rounded-sm border border-zinc-200 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 relative overflow-hidden">
                                    {/* Decorative Modal Line */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600 no-print"></div>

                                    {/* Modal Header */}
                                    <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 bg-zinc-50 shrink-0 no-print">
                                        <div className="flex items-center gap-5">
                                            <div className="p-3 bg-emerald-600 text-white rounded-sm shadow-lg shadow-emerald-100">
                                                <Scissors size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-2xl font-bold text-zinc-900 uppercase tracking-wide">Rebar Cutting Analysis</h2>
                                                    <span className="text-[10px] font-mono text-white bg-zinc-800 px-2 py-0.5 rounded-sm">OPT-REBAR</span>
                                                </div>
                                                <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">Structural Rebar Optimization • Footing Reinforcement</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowAnalysis(false)}
                                            className="p-2 hover:bg-white text-zinc-400 hover:text-zinc-900 transition-colors border border-transparent hover:border-zinc-200 rounded-sm"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>

                                    {/* Modal Content */}
                                    <div className="flex-1 overflow-y-auto p-8 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px] content-start">
                                        {Object.entries(footingResult.rebarGroups).map(([spec, group], index) => {
                                            const diameter = (parseFloat(group.size) || 12) / 1000;
                                            const spliceLen = 40 * diameter; // 40d standard overlap
                                            const optimization = optimizeCuts(group.cuts, group.stockLength, 0.005, spliceLen);

                                            // Group patterns for display
                                            const groupedPatternsMap = (optimization.patterns || []).reduce((acc, bin) => {
                                                const key = bin.cuts.map(c => `${c.length.toFixed(3)}|${c.label}`).join('||');
                                                if (!acc[key]) acc[key] = { ...bin, count: 1 };
                                                else acc[key].count++;
                                                return acc;
                                            }, {});
                                            const groupedPatterns = Object.values(groupedPatternsMap);

                                            // Color Mapping
                                            const uniqueCutsInItem = Array.from(new Set(
                                                (optimization.patterns || []).flatMap(p => p.cuts.map(c => `${c.length.toFixed(3)}|${c.label}`))
                                            ));
                                            const CUT_COLORS = [
                                                'bg-emerald-600', 'bg-blue-600', 'bg-violet-600',
                                                'bg-orange-600', 'bg-rose-600', 'bg-cyan-600',
                                                'bg-amber-600', 'bg-indigo-600', 'bg-teal-600'
                                            ];
                                            const getCutColor = (cut) => {
                                                const key = `${cut.length.toFixed(3)}|${cut.label}`;
                                                const colorIdx = uniqueCutsInItem.indexOf(key);
                                                return CUT_COLORS[colorIdx % CUT_COLORS.length];
                                            };

                                            return (
                                                <div key={index} className="bg-white border border-zinc-200 shadow-sm hover:border-emerald-500/30 transition-all duration-300 flex flex-col rounded-sm overflow-hidden print:break-inside-avoid shadow-inner mb-8">
                                                    <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                            <div>
                                                                <h3 className="font-bold text-zinc-800 uppercase tracking-wide text-sm">REBAR: {group.size}</h3>
                                                                <p className="text-[10px] font-mono text-zinc-400 uppercase">STOCK LENGTH: {group.stockLength.toFixed(2)}m</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right no-print">
                                                            <div className="text-[9px] text-zinc-400 font-mono uppercase font-bold mb-0.5 tracking-tighter">Utilization</div>
                                                            <div className={`font-mono font-bold text-lg leading-none ${optimization.efficiency > 0.9 ? 'text-emerald-600' : 'text-blue-600'}`}>
                                                                {(optimization.efficiency * 100).toFixed(1)}%
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-5 space-y-6 max-h-[500px] overflow-y-auto print:max-h-none print:overflow-visible">
                                                        {groupedPatterns.map((bin, gIdx) => (
                                                            <div key={gIdx} className="bg-zinc-50/50 p-4 border border-zinc-100 rounded-sm print:border-zinc-900">
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="bg-zinc-800 text-white text-[9px] font-mono px-2 py-0.5 rounded-sm">
                                                                            RB{parseInt(group.size)}-{getAlphabeticalIndex(gIdx)}
                                                                            <span className="ml-2 text-emerald-400">({bin.count} PIECES)</span>
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tighter">
                                                                        OFFCUT: <span className={bin.freeSpace > 0.5 ? 'text-red-500' : 'text-zinc-400'}>{bin.freeSpace.toFixed(3)}m</span>
                                                                    </span>
                                                                </div>

                                                                <div className="h-8 w-full bg-zinc-200/50 rounded-sm relative flex overflow-hidden shadow-inner border border-zinc-200/50 mb-3 print:border-zinc-800">
                                                                    {bin.cuts.map((cut, cIdx) => (
                                                                        <div
                                                                            key={cIdx}
                                                                            style={{ width: `${(cut.length / bin.stockLength) * 100}%` }}
                                                                            className={`h-full ${getCutColor(cut)} border-r border-white/20 flex items-center justify-center group transition-all hover:brightness-110`}
                                                                        >
                                                                            <span className="text-white text-[8px] font-bold font-mono px-1 truncate shrink-0">
                                                                                {cut.length.toFixed(2)}m
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                    {bin.freeSpace > 0 && (
                                                                        <div className="flex-1 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.03)_5px,rgba(0,0,0,0.03)_10px)] print:bg-white line-through"></div>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-wrap gap-2">
                                                                    {Array.from(new Set(bin.cuts.map(c => `${c.length.toFixed(3)}|${c.label}`))).map((cutKey, lIdx) => {
                                                                        const [len, label] = cutKey.split('|');
                                                                        const count = bin.cuts.filter(c => `${c.length.toFixed(3)}|${c.label}` === cutKey).length;
                                                                        return (
                                                                            <div key={lIdx} className="flex items-center gap-1 bg-white border border-zinc-200 px-1.5 py-0.5 rounded-sm shadow-xs print:border-zinc-400">
                                                                                <div className={`w-1.5 h-1.5 rounded-full ${getCutColor({ length: parseFloat(len), label })}`}></div>
                                                                                <span className="text-[8px] font-black font-mono">{count}x {parseFloat(len).toFixed(2)}m</span>
                                                                                <span className="text-[8px] text-zinc-500 truncate max-w-[60px]">{label}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="px-5 py-3 bg-zinc-100/50 border-t border-zinc-100 flex justify-between items-center text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest print:bg-white print:border-zinc-900">
                                                        <span>Total Required</span>
                                                        <span className="text-zinc-900 font-black">{optimization.barsRequired} PCS</span>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* FOOTING CUTTING SCHEDULE */}
                                        <div className="mt-16 pt-12 border-t-2 border-dashed border-zinc-200 print:border-solid print:border-t-4 print:border-zinc-900">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-1 bg-emerald-600"></div>
                                                    <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-tighter flex items-center gap-3">
                                                        Rebar Cutting Schedule
                                                        <span className="text-[10px] font-mono font-normal bg-zinc-100 text-zinc-500 px-2 py-1 rounded-sm border border-zinc-200 uppercase tracking-widest border-l-4 border-l-emerald-600">Ref: FT-SCH-{Date.now().toString().slice(-6)}</span>
                                                    </h2>
                                                </div>
                                                <button
                                                    className="px-4 py-2 bg-zinc-900 text-white rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg no-print flex items-center gap-2"
                                                    onClick={() => window.print()}
                                                >
                                                    <Download size={12} /> Print Schedule
                                                </button>
                                            </div>

                                            <div className="space-y-8">
                                                {Object.entries(footingResult.rebarGroups).map(([spec, group], idx) => {
                                                    const diameter = (parseFloat(group.size) || 12) / 1000;
                                                    const spliceLen = 40 * diameter;
                                                    const optimization = optimizeCuts(group.cuts, group.stockLength, 0.005, spliceLen);
                                                    const groupedPatterns = Object.values((optimization.patterns || []).reduce((acc, bin) => {
                                                        const key = bin.cuts.map(c => `${c.length.toFixed(3)}|${c.label}`).join('||');
                                                        if (!acc[key]) acc[key] = { ...bin, count: 1 };
                                                        else acc[key].count++;
                                                        return acc;
                                                    }, {}));

                                                    return (
                                                        <div key={idx} className="bg-white border border-zinc-300 rounded-sm overflow-hidden">
                                                            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-300 flex justify-between items-center">
                                                                <h4 className="font-bold text-zinc-900 uppercase text-xs">SPEC: {group.size} Rebar @ {group.stockLength.toFixed(1)}m</h4>
                                                                <div className="text-right">
                                                                    <span className="text-sm font-bold text-zinc-900 font-mono">{optimization.barsRequired} TOTAL PCS</span>
                                                                </div>
                                                            </div>
                                                            <table className="w-full text-[10px] font-mono text-left border-collapse">
                                                                <thead className="bg-zinc-100 border-b border-zinc-300">
                                                                    <tr>
                                                                        <th className="px-6 py-2 border-r border-zinc-200 uppercase font-bold text-zinc-600 w-16 text-center">Mark</th>
                                                                        <th className="px-6 py-2 border-r border-zinc-200 uppercase font-bold text-zinc-600">Cutting Detail</th>
                                                                        <th className="px-6 py-2 border-r border-zinc-200 uppercase font-bold text-zinc-600 w-24 text-center">Qty</th>
                                                                        <th className="px-6 py-2 border-r border-zinc-200 uppercase font-bold text-zinc-600 w-24 text-center">Waste (m)</th>
                                                                        <th className="px-6 py-2 uppercase font-bold text-zinc-600 w-32 text-right">Running Len</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-zinc-200 text-gray-800">
                                                                    {groupedPatterns.map((p, pIdx) => (
                                                                        <tr key={pIdx}>
                                                                            <td className="px-6 py-3 border-r border-zinc-200 text-center font-bold">RB{parseInt(group.size)}-{getAlphabeticalIndex(pIdx)}</td>
                                                                            <td className="px-6 py-3 border-r border-zinc-200">
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {Array.from(new Set(p.cuts.map(c => `${c.length.toFixed(3)}|${c.label}`))).map((cutKey, lIdx) => {
                                                                                        const [len, label] = cutKey.split('|');
                                                                                        const count = p.cuts.filter(c => `${c.length.toFixed(3)}|${c.label}` === cutKey).length;
                                                                                        return (
                                                                                            <span key={lIdx} className="bg-zinc-100 px-2 py-0.5 border border-zinc-200 rounded-sm">
                                                                                                <span className="font-bold text-emerald-600">{count}x</span> {parseFloat(len).toFixed(2)}m <span className="text-[8px] text-zinc-400">[{label}]</span>
                                                                                            </span>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-3 border-r border-zinc-200 text-center font-bold">{p.count}</td>
                                                                            <td className="px-6 py-3 border-r border-zinc-200 text-center text-zinc-500">{p.freeSpace.toFixed(3)}</td>
                                                                            <td className="px-6 py-3 text-right font-bold">{(p.count * group.stockLength).toFixed(2)}m</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                                <tfoot className="bg-zinc-900 text-white">
                                                                    <tr>
                                                                        <td colSpan="2" className="px-6 py-2 text-right uppercase tracking-widest text-[9px]">Summary:</td>
                                                                        <td className="px-6 py-2 text-center text-sm font-bold">{optimization.barsRequired} PCS</td>
                                                                        <td className="px-6 py-2 text-center text-[9px] text-zinc-400">{optimization.efficiency.toFixed(3)}% Eff.</td>
                                                                        <td className="px-6 py-2 text-right text-sm font-bold">{(optimization.barsRequired * group.stockLength).toFixed(2)}m</td>
                                                                    </tr>
                                                                </tfoot>
                                                            </table>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="px-8 py-4 border-t border-zinc-100 bg-white flex justify-between items-center shrink-0 no-print">
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono">Total Pieces</span>
                                                <span className="text-sm font-bold text-zinc-900 font-mono">
                                                    {Object.values(footingResult.rebarGroups).reduce((acc, g) => {
                                                        const diameter = (parseFloat(g.size) || 12) / 1000;
                                                        const opt = optimizeCuts(g.cuts, g.stockLength, 0.005, 40 * diameter);
                                                        return acc + opt.barsRequired;
                                                    }, 0)} Lengths
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowAnalysis(false)}
                                            className="px-8 py-2 bg-zinc-900 text-white rounded-sm font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-md"
                                        >
                                            Close Analysis
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
