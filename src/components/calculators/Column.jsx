import React, { useState, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Info, Settings, Calculator, PlusCircle, Trash2, Box, Package, Hammer, AlertCircle, ClipboardCopy, Download, X, Edit2, Copy, ArrowUp, EyeOff, Eye } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import { calculateColumn } from '../../utils/calculations/columnCalculator';

// --- Components ---

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

const TableNumberInput = ({ value, onChange, placeholder, className = "" }) => (
    <MathInput
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full p-1.5 text-center border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-400 outline-none font-medium bg-white text-slate-900 ${className}`}
    />
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

// --- Constants & Defaults ---

// All available commercial SKUs (Diameter x Length) as requested
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

// Filtered list for ties (typically 10mm and 12mm)
const availableTieSKUs = availableRebarSKUs.filter(sku => sku.diameter <= 12);

// Initial Column Template
const getInitialColumn = () => ({
    id: Date.now() + Math.random(),
    quantity: 1,
    length_m: "",      // Empty default
    width_m: "",       // Empty default
    height_m: "",      // Empty default
    main_rebar_cuts: [{ sku: '', length: '', quantity: '' }],
    tie_bar_sku: '',      // Lateral Tie SKU (Diameter_Length)
    tie_spacing_mm: "", // Empty default
    isExcluded: false,
});

export default function Column({ columns: propColumns, setColumns: propSetColumns }) {
    // Use props if provided, otherwise use local state (for backward compatibility if used standalone)
    const [localColumns, setLocalColumns] = useLocalStorage('column_elements', [getInitialColumn()]);
    const columns = propColumns || localColumns;
    const setColumns = propSetColumns || setLocalColumns;
    const [wastePct, setWastePct] = useState(5); // Concrete waste factor (for concrete materials only)

    // Material Prices (PHP) - keyed by diameter for rebar
    const [prices, setPrices] = useLocalStorage('column_prices', {
        cement: 240,       // 40kg bag
        sand: 1200,        // per cu.m
        gravel: 1400,      // per cu.m
        rebar_10: 180,     // per commercial length
        rebar_12: 260,
        rebar_16: 480,
        rebar_20: 750,
        rebar_25: 1150,
        tie_wire: 85,      // per kg
    });

    const [result, setResult] = useLocalStorage('column_result', null);
    const [error, setError] = useState(null);
    const [editingCutsId, setEditingCutsId] = useState(null);
    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Migration logic for old state
    useEffect(() => {
        const needsMigration = columns.some(c => !c.main_rebar_cuts);
        if (needsMigration) {
            setColumns(prev => prev.map(c => {
                if (!c.main_rebar_cuts) {
                    return {
                        ...c,
                        main_rebar_cuts: c.main_bar_sku ? [{ sku: c.main_bar_sku, length: '', quantity: c.main_bar_count }] : [{ sku: '', length: '', quantity: '' }]
                    };
                }
                return c;
            }));
        }
    }, [columns, setColumns]);

    const handleColumnChange = (id, field, value) => {
        setColumns(prev =>
            prev.map(col => {
                if (col.id !== id) return col;
                return { ...col, [field]: value };
            })
        );
        setResult(null);
        setError(null);
    };

    const updateRebarCut = (colId, index, subField, value) => {
        setColumns(prev => prev.map(col => {
            if (col.id === colId) {
                const newCuts = [...(col.main_rebar_cuts || [{ sku: '', length: '', quantity: '' }])];
                newCuts[index] = { ...newCuts[index], [subField]: value };
                return { ...col, main_rebar_cuts: newCuts };
            }
            return col;
        }));
        setResult(null);
    };

    const addRebarCut = (colId) => {
        setColumns(prev => prev.map(col => {
            if (col.id === colId) {
                return { ...col, main_rebar_cuts: [...(col.main_rebar_cuts || []), { sku: '', length: '', quantity: '' }] };
            }
            return col;
        }));
        setResult(null);
    };

    const removeRebarCut = (colId, index) => {
        setColumns(prev => prev.map(col => {
            if (col.id === colId) {
                const cuts = col.main_rebar_cuts || [];
                const newCuts = cuts.filter((_, i) => i !== index);
                return { ...col, main_rebar_cuts: newCuts.length > 0 ? newCuts : [{ sku: '', length: '', quantity: '' }] };
            }
            return col;
        }));
        setResult(null);
    };

    const handleAddRowAbove = (id) => {
        setColumns(prev => {
            const index = prev.findIndex(c => c.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, getInitialColumn());
            return newRows;
        });
        setContextMenu(null);
        setResult(null);
    };

    const handleDuplicateRow = (id) => {
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
        setResult(null);
    };

    const handleToggleExcludeRow = (id) => {
        setColumns(prev => prev.map(c => c.id === id ? { ...c, isExcluded: !c.isExcluded } : c));
        setContextMenu(null);
        setResult(null);
    };

    const handleAddRow = () => {
        setColumns(prev => [...prev, getInitialColumn()]);
        setResult(null);
        setError(null);
    };

    const handleRemoveRow = (id) => {
        if (columns.length > 1) {
            setColumns(prev => prev.filter(col => col.id !== id));
            setResult(null);
            setError(null);
        } else {
            setColumns([getInitialColumn()]);
        }
    };

    // --- Calculation Engine ---
    const calculateMaterials = () => {
        // Validation
        const hasEmptyFields = columns.some(col =>
            col.length_m === "" ||
            col.width_m === "" ||
            col.height_m === "" ||
            (col.main_rebar_cuts || []).some(cut => cut.sku === "" || cut.quantity === "") ||
            col.tie_spacing_mm === "" ||
            col.tie_bar_sku === ""
        );

        if (hasEmptyFields) {
            setError("Please fill in all required fields (Dimensions, Rebar Count, Spacing, and Specs) before calculating.");
            setResult(null);
            return;
        }
        setError(null);

        const calcResult = calculateColumn(columns, prices, wastePct);

        if (calcResult) {
            setResult(calcResult);
        } else {
            setResult(null);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('column_total', result.grandTotal);
        } else {
            setSessionData('column_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    useEffect(() => {
        // Recalculate if prices change and a result is already displayed
        if (result) {
            calculateMaterials();
        }
    }, [prices, wastePct]);


    const activeColForCuts = columns.find(c => c.id === editingCutsId);

    return (
        <div className="space-y-6 relative">
            {/* REBAR MODAL OVERLAY */}
            {editingCutsId && activeColForCuts && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-zinc-200 flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50 rounded-t-xl">
                            <div>
                                <h3 className="font-bold text-lg text-zinc-800">Manage Main Rebar</h3>
                                <p className="text-xs text-zinc-500">Configure different sizes and quantities for this column.</p>
                            </div>
                            <button onClick={() => setEditingCutsId(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                                <X size={20} className="text-zinc-500" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                            {(activeColForCuts.main_rebar_cuts || [{ sku: '', quantity: '' }]).map((cut, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-zinc-400 w-6">{idx + 1}</span>
                                    <div className="flex-[2]">
                                        <SelectInput
                                            value={cut.sku}
                                            onChange={(val) => updateRebarCut(activeColForCuts.id, idx, 'sku', val)}
                                            options={availableRebarSKUs}
                                            placeholder="Select SKU..."
                                            focusColor="indigo"
                                        />
                                    </div>
                                    <div className="w-28 text-center bg-slate-50 border border-slate-200 py-2 rounded text-xs font-medium text-slate-500">
                                        {(parseFloat(activeColForCuts.height_m) + (40 * (parseInt(cut.sku.split('_')[0]) || 12) / 1000) || 0).toFixed(2)} m
                                    </div>
                                    <span className="text-zinc-400 text-xs text-center w-4">×</span>
                                    <div className="w-24">
                                        <MathInput
                                            placeholder="Qty"
                                            value={cut.quantity}
                                            onChange={(val) => updateRebarCut(activeColForCuts.id, idx, 'quantity', val)}
                                            className="w-full"
                                        />
                                    </div>
                                    <span className="text-zinc-400 text-xs text-center w-8">pcs</span>
                                    <button onClick={() => removeRebarCut(activeColForCuts.id, idx)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => addRebarCut(activeColForCuts.id)}
                                className="w-full py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-xs font-bold uppercase hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 mt-2"
                            >
                                <PlusCircle size={14} /> Add Rebar Set
                            </button>
                        </div>
                        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end rounded-b-xl">
                            <button onClick={() => setEditingCutsId(null)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors">
                                Done
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
                        {columns.find(c => c.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in Calculation</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude from Calculation</>
                        }
                    </button>
                </div>
            )}

            {/* INPUT CARD */}
            <Card className="border-t-4 border-t-indigo-600 shadow-md">
                <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <Settings size={18} /> Column Configuration ({columns.length} Total)
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddRow}
                            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 transition-colors active:scale-95 shadow-sm"
                        >
                            <PlusCircle size={14} /> Add Column
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[800px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[30px]" rowSpan="2">#</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]" rowSpan="2">Qty</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-blue-50 text-blue-900" colSpan="3">Dimensions (m)</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-orange-50 text-orange-900 w-[160px]" rowSpan="2">Main Rebar</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-emerald-50 text-emerald-900" colSpan="2">Ties</th>
                                <th className="px-1 py-2 font-bold border border-slate-300 text-center w-[30px]" rowSpan="2"></th>
                            </tr>
                            <tr>
                                {/* Dimensions */}
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[70px] bg-blue-50/50">L</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[70px] bg-blue-50/50">W</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[70px] bg-blue-50/50">H</th>
                                {/* Main Bars */}
                                {/* Ties */}
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[85px] bg-emerald-50/50">Size & Length</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[80px] bg-emerald-50/50">Space (mm)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {columns.map((col, index) => (
                                <tr
                                    key={col.id}
                                    className={`transition-colors ${col.isExcluded ? 'bg-slate-50/50 opacity-60 grayscale-[0.5]' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    <td
                                        className="p-2 border border-slate-300 align-middle text-center text-xs text-slate-400 font-bold cursor-help relative group"
                                        onContextMenu={(e) => {
                                            if (e.ctrlKey) {
                                                e.preventDefault();
                                                setContextMenu({ id: col.id, x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        title="Ctrl + Right Click for options"
                                    >
                                        <div className={`transition-all ${col.isExcluded ? 'text-red-400 line-through' : ''}`}>
                                            {index + 1}
                                        </div>
                                    </td>

                                    {/* Qty */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput
                                            value={col.quantity} onChange={(v) => handleColumnChange(col.id, 'quantity', v)} min="1" step="1" className="font-bold"
                                        />
                                    </td>

                                    {/* Dimensions */}
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={col.length_m} onChange={(v) => handleColumnChange(col.id, 'length_m', v)} placeholder="0.40" /></td>
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={col.width_m} onChange={(v) => handleColumnChange(col.id, 'width_m', v)} placeholder="0.40" /></td>
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={col.height_m} onChange={(v) => handleColumnChange(col.id, 'height_m', v)} placeholder="3.00" /></td>

                                    {/* Main Bars */}
                                    <td className="p-2 border border-slate-300 align-middle bg-orange-50/20 text-center">
                                        <button
                                            onClick={() => setEditingCutsId(col.id)}
                                            className="px-3 py-1.5 bg-white hover:bg-orange-100 text-orange-600 hover:text-orange-700 rounded border border-orange-200 hover:border-orange-300 text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5 w-full min-h-[40px]"
                                        >
                                            <Edit2 size={12} className="opacity-70 flex-shrink-0" />
                                            <span className="truncate">
                                                {(col.main_rebar_cuts || []).filter(c => c.sku && c.quantity).length > 0
                                                    ? (col.main_rebar_cuts || [])
                                                        .filter(c => c.sku && c.quantity)
                                                        .map(c => `${c.quantity}-${c.sku.split('_')[0]}mm`)
                                                        .join(', ')
                                                    : "Sets"
                                                }
                                            </span>
                                        </button>
                                    </td>

                                    {/* Ties */}
                                    <td className="p-2 border border-slate-300 align-middle bg-emerald-50/20">
                                        <SelectInput
                                            value={col.tie_bar_sku}
                                            onChange={(val) => handleColumnChange(col.id, 'tie_bar_sku', val)}
                                            options={availableTieSKUs}
                                            placeholder="Select SKU..."
                                            focusColor="indigo"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-emerald-50/20"><TableNumberInput value={col.tie_spacing_mm} onChange={(v) => handleColumnChange(col.id, 'tie_spacing_mm', v)} placeholder="200" step="10" /></td>

                                    {/* Delete */}
                                    <td className="p-1 border border-slate-300 align-middle text-center">
                                        <button
                                            onClick={() => handleRemoveRow(col.id)}
                                            disabled={columns.length === 1}
                                            className={`p-1.5 rounded-full transition-colors ${columns.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
                                        >
                                            <Trash2 size={14} />
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

                <div className="p-6 bg-slate-50 border-t border-gray-200 flex justify-end">
                    <button onClick={calculateMaterials} className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-all hover:bg-indigo-700 uppercase tracking-wider text-sm flex items-center justify-center gap-2 min-w-[200px]">
                        <Calculator size={18} /> CALCULATE
                    </button>
                </div>
            </Card>

            {/* RESULT CARD */}
            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-emerald-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                    Estimation Result
                                </h3>
                                <div className="flex gap-4 mt-2">
                                    <div className="bg-blue-50 px-3 py-1 rounded text-sm text-blue-700 border border-blue-100">
                                        Total Volume: <strong>{result.volume} cu.m</strong> {/* <-- Changed m³ to cu.m */}
                                    </div>
                                </div>
                            </div>
                            <div className="text-left md:text-right bg-emerald-50 px-5 py-3 rounded-xl border border-emerald-100">
                                <p className="text-xs text-emerald-800 font-bold uppercase tracking-wide mb-1">Estimated Cost</p>
                                <p className="font-bold text-4xl text-emerald-700 tracking-tight">₱{result.grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex justify-end gap-2 mb-4">
                            <button
                                onClick={() => copyToClipboard(result.items)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                                title="Copy table to clipboard"
                            >
                                <ClipboardCopy size={14} /> Copy
                            </button>
                            <button
                                onClick={() => downloadCSV(result.items, 'column_estimation.csv')}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                                title="Download as CSV"
                            >
                                <Download size={14} /> CSV
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200 mb-2">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr><th className="px-4 py-3">Material Item</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[140px]">Unit Price</th>
                                        <th className="px-4 py-3 text-right bg-gray-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">{item.qty.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <TablePriceInput
                                                    value={prices[item.priceKey] !== undefined ? prices[item.priceKey] : item.price.toFixed(2)}
                                                    onChange={(newValue) => setPrices(prev => ({ ...prev, [item.priceKey]: newValue }))}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 bg-gray-50/50">₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                            <p className="text-xs text-gray-400 italic">
                                <Package size={12} className="inline mr-1" />
                                Standard Concrete Class A (1:2:4) • Rebar quantities calculated using direct cutting yield with 40D detailing.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {!result && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-gray-400 bg-slate-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Hammer size={32} className="text-indigo-500" />
                    </div>
                    <p className="font-medium text-center max-w-md">
                        Enter your column dimensions and reinforcement details, then click <span className="font-bold text-indigo-600">'CALCULATE'</span>.
                    </p>
                </div>
            )}
        </div>
    );
}
