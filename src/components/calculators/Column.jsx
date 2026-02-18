import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Info, Settings, Calculator, PlusCircle, Trash2, Box, Package, Hammer, AlertCircle, ClipboardCopy, Download, X, Edit2, Copy, ArrowUp, EyeOff, Eye, Layout, Scissors, Columns } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import { calculateColumn } from '../../utils/calculations/columnCalculator';

// --- Components ---

/**
 * Converts a 0-indexed number to an alphabetical sequence like Excel columns.
 */
const getAlphabeticalIndex = (n) => {
    let result = '';
    n = n + 1;
    while (n > 0) {
        let remainder = (n - 1) % 26;
        result = String.fromCharCode(65 + remainder) + result;
        n = Math.floor((n - 1) / 26);
    }
    return result;
};

const Card = React.memo(({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
        {children}
    </div>
));

const TableNumberInput = React.memo(({ value, onChange, placeholder, className = "" }) => (
    <MathInput
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full p-1.5 text-center border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-400 outline-none font-medium bg-white text-slate-900 ${className}`}
    />
));

const TablePriceInput = React.memo(({ value, onChange, placeholder = "0.00" }) => (
    <div className="flex items-center justify-end relative">
        <span className="absolute left-2 text-gray-400 font-bold text-[10px] pointer-events-none">₱</span>
        <input
            type="number"
            min="0"
            step="0.01"
            placeholder={placeholder}
            value={value === null || value === undefined ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-6 pr-2 py-1 text-right text-sm border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none text-gray-800 font-medium transition-colors"
        />
    </div>
));

// --- Constants & Defaults ---

const availableRebarSKUs = [
    { id: '10_6.0', diameter: 10, length: 6.0, display: '10mm x 6.0m' },
    { id: '10_7.5', diameter: 10, length: 7.5, display: '10mm x 7.5m' },
    { id: '10_9.0', diameter: 10, length: 9.0, display: '10mm x 9.0m' },
    { id: '10_12.0', diameter: 10, length: 12.0, display: '10mm x 12.0m' },
    { id: '12_6.0', diameter: 12, length: 6.0, display: '12mm x 6.0m' },
    { id: '12_7.5', diameter: 12, length: 7.5, display: '12mm x 7.5m' },
    { id: '12_9.0', diameter: 12, length: 9.0, display: '12mm x 9.0m' },
    { id: '12_12.0', diameter: 12, length: 12.0, display: '12mm x 12.0m' },
    { id: '16_6.0', diameter: 16, length: 6.0, display: '16mm x 6.0m' },
    { id: '16_7.5', diameter: 16, length: 7.5, display: '16mm x 7.5m' },
    { id: '16_9.0', diameter: 16, length: 9.0, display: '16mm x 9.0m' },
    { id: '16_12.0', diameter: 16, length: 12.0, display: '16mm x 12.0m' },
    { id: '20_6.0', diameter: 20, length: 6.0, display: '20mm x 6.0m' },
    { id: '20_7.5', diameter: 20, length: 7.5, display: '20mm x 7.5m' },
    { id: '20_9.0', diameter: 20, length: 9.0, display: '20mm x 9.0m' },
    { id: '20_12.0', diameter: 20, length: 12.0, display: '20mm x 12.0m' },
    { id: '25_6.0', diameter: 25, length: 6.0, display: '25mm x 6.0m' },
    { id: '25_7.5', diameter: 25, length: 7.5, display: '25mm x 7.5m' },
    { id: '25_9.0', diameter: 25, length: 9.0, display: '25mm x 9.0m' },
    { id: '25_12.0', diameter: 25, length: 12.0, display: '25mm x 12.0m' },
].sort((a, b) => a.diameter - b.diameter || a.length - b.length);

const availableTieSKUs = availableRebarSKUs.filter(sku => sku.diameter <= 12);

const getInitialColumn = () => ({
    id: Date.now() + Math.random(),
    quantity: 1,
    length_m: "",
    width_m: "",
    height_m: "",
    main_rebar_cuts: [{ sku: '', length: '', quantity: '' }],
    tie_bar_sku: '',
    tie_spacing_mm: "",
    isExcluded: false,
});

const Column = React.memo(({ columns: propColumns, setColumns: propSetColumns }) => {
    const [localColumns, setLocalColumns] = useLocalStorage('column_elements', [getInitialColumn()]);

    // Logic to prefer props if provided (from App globally) or local storage
    const columns = propColumns || localColumns;
    const setColumns = propSetColumns || setLocalColumns;
    const [wastePct, setWastePct] = useState(5);

    const [prices, setPrices] = useLocalStorage('column_prices', {
        cement: 240,
        sand: 1200,
        gravel: 1400,
        rebar_10: 180,
        rebar_12: 260,
        rebar_16: 480,
        rebar_20: 750,
        rebar_25: 1150,
        tie_wire: 85,
    });

    const [showResult, setShowResult] = useLocalStorage('column_show_result', false);
    const [error, setError] = useState(null);
    const [viewingPatterns, setViewingPatterns] = useState(false);
    const [editingCutsId, setEditingCutsId] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    useEffect(() => {
        if (!columns || !Array.isArray(columns)) return;
        const needsMigration = columns.some(c => c && !c.main_rebar_cuts);
        if (needsMigration) {
            setColumns(prev => {
                if (!Array.isArray(prev)) return [getInitialColumn()];
                return prev.map(c => {
                    if (c && !c.main_rebar_cuts) {
                        return {
                            ...c,
                            main_rebar_cuts: c.main_bar_sku
                                ? [{ sku: c.main_bar_sku, length: '', quantity: c.main_bar_count || '' }]
                                : [{ sku: '', length: '', quantity: '' }]
                        };
                    }
                    return c;
                });
            });
        }
    }, [columns, setColumns]);

    const handleColumnChange = useCallback((id, field, value) => {
        setColumns(prev => prev.map(col => (col.id === id ? { ...col, [field]: value } : col)));
        setShowResult(false);
        setError(null);
    }, [setColumns]);

    const addColumn = useCallback(() => {
        setColumns(prev => [...prev, getInitialColumn()]);
        setShowResult(false);
        setError(null);
    }, [setColumns]);

    const handleAddRowAbove = (id) => {
        setColumns(prev => {
            const index = prev.findIndex(b => b.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, getInitialColumn());
            return newRows;
        });
        setContextMenu(null);
        setShowResult(false);
    };

    const removeColumn = (id) => {
        setColumns(prev => prev.length > 1 ? prev.filter(col => col.id !== id) : prev);
        setShowResult(false);
        setError(null);
    };

    const duplicateColumn = (id) => {
        setColumns(prev => {
            const index = prev.findIndex(c => c.id === id);
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
        setShowResult(false);
    };

    const handleToggleExcludeRow = (id) => {
        setColumns(prev => prev.map(c => c.id === id ? { ...c, isExcluded: !c.isExcluded } : c));
        setContextMenu(null);
        setShowResult(false);
    };

    const handleCalculate = () => {
        if (!columns || !Array.isArray(columns)) return;
        const hasEmptyFields = columns.some(col => {
            if (col.isExcluded) return false;
            return !col.length_m || !col.width_m || !col.height_m || !col.tie_spacing_mm || !col.tie_bar_sku || (col.main_rebar_cuts || []).some(cut => !cut.sku || !cut.quantity);
        });

        if (hasEmptyFields) {
            setError("Please fill in all required fields (Dimensions, Specs, and Spacing) before calculating.");
            setShowResult(false);
            return;
        }
        setError(null);
        setShowResult(true);
    };

    const result = useMemo(() => {
        if (!showResult) return null;
        try {
            return calculateColumn(columns, prices, wastePct);
        } catch (err) {
            console.error(err);
            setError("Calculation error. Check inputs.");
            return null;
        }
    }, [columns, prices, wastePct, showResult]);

    useEffect(() => {
        if (result) setSessionData('column_total', result.grandTotal);
        else setSessionData('column_total', null);
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    const activeColForCuts = columns.find(c => c.id === editingCutsId);

    const getCutColor = (cut, uniqueCuts) => {
        const COLORS = ['bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-orange-600', 'bg-rose-600', 'bg-cyan-600', 'bg-amber-600', 'bg-indigo-600', 'bg-teal-600'];
        const key = `${(parseFloat(cut?.length) || 0).toFixed(3)}|${cut?.label || ''}`;
        const idx = uniqueCuts.indexOf(key);
        return COLORS[idx % COLORS.length] || 'bg-zinc-600';
    };

    return (
        <div className="space-y-6 relative animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-lg shadow-lg shadow-indigo-100">
                        <Columns className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase" style={{ fontFamily: "'Anton', sans-serif" }}>RC Column</h2>
                        <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">Structural Estimation System STR-COL-03</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end border-r pr-6 border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Concrete Waste</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={wastePct}
                                onChange={(e) => {
                                    setWastePct(parseFloat(e.target.value) || 0);
                                    setShowResult(false);
                                }}
                                className="w-12 text-right font-bold text-indigo-600 bg-transparent outline-none focus:ring-0"
                            />
                            <span className="text-sm font-bold text-slate-400 font-mono">%</span>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Generated</span>
                        <span className="text-xs font-mono font-bold text-slate-900">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <Card className="border-t-4 border-t-indigo-600 shadow-md">
                <div className="px-4 py-3 bg-white border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                        <Settings size={18} className="text-slate-600" /> Column Configuration ({columns.length} Total)
                    </h2>
                    <button onClick={addColumn} className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-md text-[10px] font-bold uppercase hover:bg-indigo-700 transition-all active:scale-95 shadow-sm tracking-wider">
                        <PlusCircle size={14} /> Add Column
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full border-collapse border border-slate-200 rounded-lg min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 uppercase text-[9px] font-bold text-indigo-900">
                                <th className="p-3 text-center border border-slate-200 w-12" rowSpan="2">#</th>
                                <th className="p-3 text-center border border-slate-200 w-20" rowSpan="2">Qty</th>
                                <th className="p-2 text-center border border-slate-200 bg-blue-50/70" colSpan="3">Dimensions (m)</th>
                                <th className="p-2 text-center border border-slate-200 w-[180px] bg-orange-50/70" rowSpan="2">Main Rebar</th>
                                <th className="p-2 text-center border border-slate-200 bg-emerald-50/50" colSpan="2">Ties</th>
                                <th className="p-3 text-center border border-slate-200 w-12" rowSpan="2"></th>
                            </tr>
                            <tr className="bg-slate-50 uppercase text-[8px] font-bold text-slate-500">
                                <th className="p-2 border border-slate-200 text-center w-[80px]">L</th>
                                <th className="p-2 border border-slate-200 text-center w-[80px]">W</th>
                                <th className="p-2 border border-slate-200 text-center w-[80px]">H</th>
                                <th className="p-2 border border-slate-200 text-center w-[160px]">Size & Length</th>
                                <th className="p-2 border border-slate-200 text-center w-[100px]">Space (mm)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {columns.map((col, idx) => (
                                <tr
                                    key={col.id}
                                    className={`group transition-colors ${col.isExcluded ? 'bg-slate-50/50 opacity-60 grayscale-[0.5]' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    <td
                                        className="p-3 border border-slate-200 text-center text-xs text-slate-400 font-bold cursor-help relative group/cell"
                                        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ id: col.id, x: e.clientX, y: e.clientY }); }}
                                        title="Right-click for options"
                                    >
                                        <div className={`transition-all ${col.isExcluded ? 'text-rose-400 line-through' : ''}`}>
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td className="p-3 border border-slate-200">
                                        <TableNumberInput value={col.quantity} onChange={(val) => handleColumnChange(col.id, 'quantity', val)} placeholder="1" className="font-bold" />
                                    </td>
                                    <td className="p-3 border border-slate-200"><TableNumberInput value={col.length_m} onChange={(val) => handleColumnChange(col.id, 'length_m', val)} placeholder="0.40" /></td>
                                    <td className="p-3 border border-slate-200"><TableNumberInput value={col.width_m} onChange={(val) => handleColumnChange(col.id, 'width_m', val)} placeholder="0.40" /></td>
                                    <td className="p-3 border border-slate-200"><TableNumberInput value={col.height_m} onChange={(val) => handleColumnChange(col.id, 'height_m', val)} placeholder="3.00" /></td>
                                    <td className="p-3 border border-slate-200 bg-orange-50/5">
                                        <button
                                            onClick={() => setEditingCutsId(col.id)}
                                            className="w-full h-9 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-orange-200 rounded text-[10px] font-bold text-orange-600 transition-all hover:bg-orange-50 group/btn"
                                        >
                                            <Edit2 size={12} className="text-orange-400" />
                                            <span className="italic">
                                                {(col.main_rebar_cuts || []).filter(c => c.sku && c.quantity).length > 0
                                                    ? `${(col.main_rebar_cuts || []).filter(c => c.sku && c.quantity).length} Sets`
                                                    : 'Sets'
                                                }
                                            </span>
                                        </button>
                                    </td>
                                    <td className="p-3 border border-slate-200">
                                        <SelectInput
                                            value={col.tie_bar_sku}
                                            onChange={(val) => handleColumnChange(col.id, 'tie_bar_sku', val)}
                                            options={availableTieSKUs.map(sku => ({ value: sku.id, label: sku.display }))}
                                            placeholder="Select SKU..."
                                            className="text-[10px] h-9"
                                        />
                                    </td>
                                    <td className="p-3 border border-slate-200">
                                        <TableNumberInput value={col.tie_spacing_mm} onChange={(val) => handleColumnChange(col.id, 'tie_spacing_mm', val)} placeholder="200" className="h-9 font-medium" />
                                    </td>
                                    <td className="p-3 border border-slate-200 text-center">
                                        <button
                                            onClick={() => removeColumn(col.id)}
                                            disabled={columns.length === 1}
                                            className={`p-2 transition-colors ${columns.length > 1 ? 'text-slate-300 hover:text-red-500' : 'text-slate-100 cursor-not-allowed'}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-white border-none flex justify-end">
                    <button
                        onClick={handleCalculate}
                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 transition-all shadow-md active:scale-95 uppercase tracking-wider"
                    >
                        <Calculator size={16} /> CALCULATE
                    </button>
                </div>
            </Card>

            {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="text-rose-500" size={18} />
                    <p className="text-xs text-rose-700 font-bold uppercase tracking-tight">{error}</p>
                </div>
            )}

            {!showResult && !error && (
                <div className="border border-dashed border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center text-center text-slate-400 bg-white shadow-sm mt-6">
                    <div className="bg-indigo-50/50 p-6 rounded-full mb-6">
                        <Hammer size={36} className="text-indigo-600/60" />
                    </div>
                    <p className="max-w-md mx-auto text-sm font-medium text-slate-500 leading-relaxed">
                        Enter your column dimensions and reinforcement details, <br />
                        then click <span className="text-indigo-600 font-bold uppercase">'Calculate'</span>.
                    </p>
                </div>
            )}

            {showResult && result && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                        <div>
                            <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                Estimation Result
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Based on <strong className="text-gray-700">{columns.filter(c => !c.isExcluded).length}</strong> column configurations.</p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <div className="text-left md:text-right bg-emerald-50 px-5 py-3 rounded-xl border border-emerald-100">
                                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                <p className="font-bold text-4xl text-emerald-700 tracking-tight">
                                    {result.grandTotal.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => copyToClipboard(result.items, 'Column Calculation')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                                    title="Copy table to clipboard for Excel"
                                >
                                    <ClipboardCopy size={14} /> Copy to Clipboard
                                </button>
                                <button
                                    onClick={() => downloadCSV(
                                        result.items,
                                        'column_estimate.csv',
                                        columns.filter(c => !c.isExcluded),
                                        ['quantity', 'length_m', 'width_m', 'height_m', 'tie_bar_sku', 'tie_spacing_mm']
                                    )}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                                    title="Download as CSV"
                                >
                                    <Download size={14} /> Download CSV
                                </button>
                                <button
                                    onClick={() => setViewingPatterns(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <Scissors size={14} /> Cutting Analysis
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-5">
                                <Box size={48} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Concrete Vol.</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-slate-900 tracking-tighter italic">{result.volume}</span>
                                <span className="text-xs font-bold text-slate-400 font-mono italic">cu.m</span>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-2 relative overflow-hidden group border-l-4 border-l-emerald-500">
                            <div className="absolute top-0 right-0 p-2 opacity-5 text-emerald-600">
                                <Calculator size={64} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">BoQ Generation Status</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-slate-400 font-mono italic">Verified</span>
                                <span className="text-4xl font-black text-emerald-600 tracking-tighter" style={{ fontFamily: "'Anton', sans-serif" }}>LATEST</span>
                            </div>
                        </div>
                        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex flex-col justify-center items-center shadow-inner group">
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Status</span>
                            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> ESTIMATED
                            </span>
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
                                {result.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800 uppercase tracking-tight">{item.name}</td>
                                        <td className="px-4 py-3 text-right text-gray-800 font-medium">
                                            {item.qty.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-600">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <TablePriceInput
                                                value={prices[item.priceKey] !== undefined ? prices[item.priceKey] : item.price}
                                                onChange={(val) => setPrices(prev => ({ ...prev, [item.priceKey]: parseFloat(val) || 0 }))}
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
                    <div className="flex justify-between items-center p-2 opacity-50">
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest italic flex items-center gap-2">
                            <Info size={12} /> Standard fabrication losses and development lengths applied to rebar schedule.
                        </p>
                    </div>
                </div>
            )}

            {/* Set Config Modal */}
            {editingCutsId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingCutsId(null)}></div>
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-indigo-800 flex items-center gap-2 uppercase tracking-wide text-sm leading-none">
                                    <Edit2 size={16} className="text-indigo-600" /> Longitudinal Steel Spec
                                </h3>
                                <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-widest leading-none">Element ID: C{(columns.findIndex(c => c.id === editingCutsId) + 1)}</p>
                            </div>
                            <button onClick={() => setEditingCutsId(null)} className="p-2 hover:bg-indigo-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <table className="w-full border-collapse border border-slate-100 mb-2">
                                <thead>
                                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left bg-slate-50 border-b border-slate-100">
                                        <th className="p-3">Specification</th>
                                        <th className="p-3 text-center w-24">Length (m)</th>
                                        <th className="p-3 text-center w-20">Count</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(activeColForCuts?.main_rebar_cuts || []).map((cut, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="p-2">
                                                <SelectInput
                                                    value={cut.sku}
                                                    onChange={(val) => {
                                                        const newCuts = [...activeColForCuts.main_rebar_cuts];
                                                        newCuts[idx].sku = val;
                                                        handleColumnChange(editingCutsId, 'main_rebar_cuts', newCuts);
                                                    }}
                                                    options={availableRebarSKUs.map(s => ({ value: s.id, label: s.display }))}
                                                    className="h-8 text-[10px]"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <div className="relative">
                                                    <TableNumberInput
                                                        value={cut.length}
                                                        onChange={(val) => {
                                                            const newCuts = [...activeColForCuts.main_rebar_cuts];
                                                            newCuts[idx].length = val;
                                                            handleColumnChange(editingCutsId, 'main_rebar_cuts', newCuts);
                                                        }}
                                                        placeholder={(parseFloat(activeColForCuts?.height_m) + (40 * (parseInt(cut.sku?.split('_')[0]) || 12) / 1000) || 0).toFixed(2)}
                                                        className="h-8 font-mono"
                                                    />
                                                    <span className="absolute right-1 top-2.5 text-[8px] text-slate-300 font-mono">m</span>
                                                </div>
                                            </td>
                                            <td className="p-2 text-center">
                                                <TableNumberInput
                                                    value={cut.quantity}
                                                    onChange={(val) => {
                                                        const newCuts = [...activeColForCuts.main_rebar_cuts];
                                                        newCuts[idx].quantity = val;
                                                        handleColumnChange(editingCutsId, 'main_rebar_cuts', newCuts);
                                                    }}
                                                    placeholder="4"
                                                    className="h-8 font-bold"
                                                />
                                            </td>
                                            <td className="p-2 text-right">
                                                <button onClick={() => {
                                                    const newCuts = activeColForCuts.main_rebar_cuts.filter((_, i) => i !== idx);
                                                    handleColumnChange(editingCutsId, 'main_rebar_cuts', newCuts.length > 0 ? newCuts : [{ sku: '', length: '', quantity: '' }]);
                                                }} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button onClick={() => {
                                const newCuts = [...(activeColForCuts?.main_rebar_cuts || []), { sku: '', length: '', quantity: '' }];
                                handleColumnChange(editingCutsId, 'main_rebar_cuts', newCuts);
                            }} className="w-full py-2.5 bg-indigo-50 border border-dashed border-indigo-200 rounded text-[9px] font-bold text-indigo-600 hover:bg-indigo-100 uppercase tracking-widest transition-all shadow-sm">+ Add Reinforcement Mark</button>
                        </div>
                        <div className="p-4 bg-indigo-50 border-t border-indigo-100 flex justify-end">
                            <button onClick={() => setEditingCutsId(null)} className="px-10 py-2.5 bg-indigo-600 text-white rounded font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Confirm Reinforcement</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Analysis Modal */}
            {viewingPatterns && result && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in mb-0 no-print">
                    <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm no-print" onClick={() => setViewingPatterns(false)}></div>
                    <div className="relative bg-zinc-50 w-full h-full sm:h-[95vh] sm:w-[95vw] shadow-2xl overflow-hidden flex flex-col border border-zinc-200">
                        <div className="px-8 py-5 bg-white border-b border-zinc-200 flex justify-between items-center shrink-0 no-print">
                            <div className="flex items-center gap-4 text-left">
                                <div className="p-2.5 bg-zinc-900 rounded-sm shadow-xl shadow-zinc-200">
                                    <Hammer className="text-white" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Fabrication Schedule</h2>
                                    <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1 border-l-2 border-indigo-500 pl-2">Structural Rebar Optimized Yield Analysis</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingPatterns(false)} className="p-2 hover:bg-white text-zinc-400 hover:text-zinc-900 transition-colors border border-transparent hover:border-zinc-200 rounded-sm"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px] content-start printable-area">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                                {result.items.filter(item => item.optimization).map((item, index) => {
                                    const groupedPatternsMap = (item?.optimization?.patterns || []).reduce((acc, bin) => {
                                        const key = (bin?.cuts || []).map(c => `${(parseFloat(c?.length) || 0).toFixed(3)}|${c?.label || ''}`).join('||');
                                        if (!acc[key]) acc[key] = { ...bin, count: 1 };
                                        else acc[key].count++;
                                        return acc;
                                    }, {});
                                    const groupedPatterns = Object.values(groupedPatternsMap);
                                    const uniqueCutsInItem = Array.from(new Set((item?.optimization?.patterns || []).flatMap(p => (p?.cuts || []).map(c => `${(parseFloat(c?.length) || 0).toFixed(3)}|${c?.label || ''}`))));

                                    return (
                                        <div key={index} className="group relative bg-white border border-zinc-200 shadow-sm flex flex-col rounded-sm overflow-hidden print:break-inside-avoid">
                                            <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                    <div className="text-left">
                                                        <h3 className="font-bold text-zinc-800 uppercase tracking-wide text-sm">{item.name}</h3>
                                                        <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none">Yield Detail Analysis</p>
                                                    </div>
                                                </div>
                                                <div className="text-right no-print">
                                                    <div className={`font-mono font-bold text-lg leading-none ${(item.optimization?.efficiency > 0.9) ? 'text-emerald-600' : 'text-blue-600'}`}>
                                                        {((item.optimization?.efficiency || 0) * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-5 space-y-6 text-gray-800">
                                                {groupedPatterns.map((bin, gIdx) => (
                                                    <div key={gIdx} className="relative bg-zinc-50/50 p-4 border border-zinc-100 rounded-sm">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="bg-zinc-800 text-white text-[9px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-tighter">
                                                                    MARK {(item?.name?.match(/\d+/) || [10])[0]}-{getAlphabeticalIndex(gIdx)}
                                                                </span>
                                                                <span className="text-[10px] text-zinc-400 font-bold font-mono uppercase">({bin.count} PCS)</span>
                                                                <span className="text-[10px] text-zinc-300 font-mono tracking-tighter uppercase ml-2 text-left">STOCK: {(bin.stockLength || 0).toFixed(2)}m</span>
                                                            </div>
                                                            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tighter">
                                                                SCRAP: <span className={bin.freeSpace > 0.5 ? 'text-rose-500' : 'text-zinc-400'}>{(bin.freeSpace || 0).toFixed(3)}m</span>
                                                            </span>
                                                        </div>

                                                        <div className="h-10 w-full bg-zinc-200/50 rounded-sm relative flex overflow-hidden shadow-inner border border-zinc-200/50 mb-3">
                                                            {(bin?.cuts || []).map((cut, cIdx) => (
                                                                <div key={cIdx} style={{ width: `${((parseFloat(cut?.length) || 0) / (parseFloat(bin?.stockLength) || 6)) * 100}%` }} className={`h-full ${getCutColor(cut, uniqueCutsInItem)} border-r border-white/20 flex items-center justify-center group/cut transition-all relative`}>
                                                                    <span className="text-white text-[9px] font-bold font-mono px-1 truncate drop-shadow-sm">{(parseFloat(cut?.length) || 0).toFixed(2)}m</span>
                                                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/cut:block z-20 pointer-events-none no-print">
                                                                        <div className="bg-zinc-900 text-white text-[9px] py-1 px-2 rounded-sm font-mono whitespace-nowrap shadow-xl border border-zinc-800 uppercase tracking-tighter">{cut.label} • {(parseFloat(cut.length) || 0).toFixed(3)}m</div>
                                                                        <div className="w-1.5 h-1.5 bg-zinc-900 rotate-45 -mt-1 mx-auto border-r border-b border-zinc-800"></div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {bin.freeSpace > 0 && <div className="flex-1 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.03)_5px,rgba(0,0,0,0.03)_10px)] flex items-center justify-center text-[8px] text-zinc-300 font-mono uppercase tracking-widest no-print text-center">loss</div>}
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            {Array.from(new Set((bin?.cuts || []).map(c => `${(parseFloat(c?.length) || 0).toFixed(3)}|${c?.label || ''}`))).map((cutKey, lIdx) => {
                                                                const [lenStr, label] = cutKey.split('|');
                                                                const len = parseFloat(lenStr) || 0;
                                                                const count = (bin?.cuts || []).filter(c => `${(parseFloat(c?.length) || 0).toFixed(3)}|${c?.label || ''}` === cutKey).length;
                                                                return (
                                                                    <div key={lIdx} className="flex items-center gap-1.5 bg-white border border-zinc-200 px-2 py-0.5 rounded-sm shadow-sm ring-1 ring-zinc-50">
                                                                        <div className={`w-2 h-2 rounded-full ${getCutColor({ length: len, label }, uniqueCutsInItem)}`}></div>
                                                                        <span className="text-[9px] font-black text-zinc-800 font-mono">{count}x {len.toFixed(2)}m</span>
                                                                        <span className="text-[8px] text-zinc-500 font-bold font-mono uppercase tracking-tighter truncate max-w-[80px]">{label}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="px-5 py-3 bg-zinc-100/30 border-t border-zinc-100 flex justify-between items-center text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                                                <span>Total required bars</span>
                                                <span className="text-zinc-900 font-black">{item.optimization?.barsRequired || 0} PCS</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-12 pt-8 border-t-2 border-dashed border-zinc-200 print:pt-0 print:mt-0 print:border-none uppercase text-left">
                                <h3 className="text-xl font-bold mb-8 text-slate-800 tracking-tighter" style={{ fontFamily: "'Anton', sans-serif" }}>BOQ Material Breakout</h3>
                                <div className="space-y-8 text-left">
                                    {(result?.items || []).filter(item => item.optimization).map((item, idx) => (
                                        <div key={idx} className="bg-white border border-zinc-300 rounded-sm overflow-hidden text-gray-800 text-left">
                                            <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-300 flex justify-between items-center text-left">
                                                <div className="flex items-center gap-3 text-left">
                                                    <span className="w-8 h-8 bg-zinc-900 text-white flex items-center justify-center font-mono text-sm leading-none">{(idx + 1).toString().padStart(2, '0')}</span>
                                                    <div className="text-left">
                                                        <h4 className="font-bold text-zinc-900 uppercase text-xs tracking-wide">{item.name}</h4>
                                                        <p className="text-[9px] font-mono text-zinc-500 uppercase leading-none italic font-bold">Cutting List Reference</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-bold text-zinc-900 font-mono leading-none underline decoration-orange-400 decoration-2 underline-offset-4">{item.qty} PCS</span>
                                                </div>
                                            </div>
                                            <table className="w-full text-[10px] font-mono text-left border-collapse border-none">
                                                <thead className="bg-zinc-100 border-b border-zinc-300">
                                                    <tr>
                                                        <th className="px-6 py-2 border-r border-zinc-200 uppercase tracking-wider font-bold text-zinc-600 w-16 text-center">Mark</th>
                                                        <th className="px-6 py-2 border-r border-zinc-200 uppercase tracking-wider font-bold text-zinc-600">Cutting Detail (Lengths in Meters)</th>
                                                        <th className="px-6 py-2 border-r border-zinc-200 uppercase tracking-wider font-bold text-zinc-600 w-24 text-center">Batch</th>
                                                        <th className="px-6 py-2 border-r border-zinc-200 uppercase tracking-wider font-bold text-zinc-600 w-24 text-center">Scrap (m)</th>
                                                        <th className="px-6 py-2 uppercase tracking-wider font-bold text-zinc-600 w-32 text-right">Sum (m)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-200">
                                                    {Object.values((item?.optimization?.patterns || []).reduce((acc, bin) => {
                                                        const key = (bin?.cuts || []).map(c => `${(parseFloat(c?.length) || 0).toFixed(3)}|${c?.label || ''}`).join('||');
                                                        if (!acc[key]) acc[key] = { ...bin, count: 1 };
                                                        else acc[key].count++;
                                                        return acc;
                                                    }, {})).map((group, gIdx) => (
                                                        <tr key={gIdx} className="hover:bg-zinc-50 border-none">
                                                            <td className="px-6 py-3 border-r border-zinc-200 text-center font-bold text-zinc-900 text-xs">
                                                                RB{(item?.name?.match(/\d+/) || [10])[0]}-{getAlphabeticalIndex(gIdx)}
                                                            </td>
                                                            <td className="px-6 py-3 border-r border-zinc-200 text-left">
                                                                <div className="flex flex-wrap gap-2 items-center">
                                                                    {Array.from(new Set((group?.cuts || []).map(c => `${(parseFloat(c?.length) || 0).toFixed(3)}|${c?.label || ''}`))).map((cutKey, lIdx) => {
                                                                        const [lenStr, label] = cutKey.split('|');
                                                                        const countResult = (group?.cuts || []).filter(c => `${(parseFloat(c?.length) || 0).toFixed(3)}|${c?.label || ''}` === cutKey).length;
                                                                        return (
                                                                            <span key={lIdx} className="bg-zinc-50 px-2 py-0.5 border border-zinc-100 rounded shadow-sm text-[9px] font-bold">
                                                                                <span className="text-indigo-600 underline decoration-1 underline-offset-2 italic">{countResult}x</span> {(parseFloat(lenStr) || 0).toFixed(2)}m <span className="text-[8px] text-zinc-400 font-normal">[{label}]</span>
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 border-r border-zinc-200 text-center font-bold text-zinc-900">{group.count}</td>
                                                            <td className="px-6 py-3 border-r border-zinc-200 text-center text-rose-500 font-bold italic">{(parseFloat(group.freeSpace) || 0).toFixed(3)}</td>
                                                            <td className="px-6 py-3 text-right font-black text-zinc-900">{(group.count * (item.optimization?.stockLength || 0)).toFixed(2)}m</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-zinc-900 text-white font-bold uppercase tracking-widest text-[9px]">
                                                    <tr className="border-none">
                                                        <td colSpan="2" className="px-6 py-2 text-right">TOTAL MATERIAL:</td>
                                                        <td className="px-6 py-2 text-center text-sm">{item.qty} PCS</td>
                                                        <td className="px-6 py-2 text-center text-zinc-400">{(item.optimization?.wasteTotal || 0).toFixed(3)} m</td>
                                                        <td className="px-6 py-2 text-right text-sm">{(item.qty * (item.optimization?.stockLength || 0)).toFixed(2)}m</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-zinc-100 bg-white flex justify-end items-center shrink-0 no-print">
                            <button onClick={() => setViewingPatterns(false)} className="px-10 py-3 bg-zinc-900 text-white rounded-sm font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-800 transition-all active:scale-95">EXIT SCHEDULE</button>
                        </div>
                    </div>
                </div>
            )}

            {contextMenu && (
                <div
                    className="fixed z-[70] bg-white border border-slate-200 shadow-xl rounded py-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={() => duplicateColumn(contextMenu.id)} className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-slate-700 hover:bg-indigo-50 flex items-center gap-3 uppercase tracking-wider transition-colors">
                        <Copy size={14} className="text-slate-400" /> Duplicate Mark
                    </button>
                    <button onClick={() => handleAddRowAbove(contextMenu.id)} className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-slate-700 hover:bg-indigo-50 flex items-center gap-3 uppercase tracking-wider transition-colors border-b border-slate-50">
                        <ArrowUp size={14} className="text-slate-400" /> Add Mark Above
                    </button>
                    <button onClick={() => handleToggleExcludeRow(contextMenu.id)} className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-slate-700 hover:bg-indigo-50 flex items-center gap-3 uppercase tracking-wider transition-colors mt-1 font-mono">
                        {columns.find(c => c.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in BoQ</>
                            : <><EyeOff size={14} className="text-rose-500" /> Exclude from BoQ</>
                        }
                    </button>
                </div>
            )}
        </div>
    );
});

export default Column;
