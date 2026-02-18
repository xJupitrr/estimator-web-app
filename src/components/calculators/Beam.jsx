import React, { useState, useMemo, useCallback, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Info, Settings, PlusCircle, Trash2, Box, Package, Layers, Layout, Scissors, Calculator, ArrowRight, AlertCircle, ClipboardCopy, Download, X, Edit2, Copy, ArrowUp, EyeOff, Eye } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';

// --- 1. CONSTANTS & CONFIGURATION ---

// --- 1. CONSTANTS & CONFIGURATION ---
// Calculation constants removed as they are now handled by utility.


const DEFAULT_PRICES = {
    cement: 240,
    sand: 1200,
    gravel: 1400,
    rebar_10: 180,
    rebar_12: 260,
    rebar_16: 480,
    rebar_20: 750,
    rebar_25: 1150,
    tie_wire: 85,
    phenolic_1_2: 2000,
    lumber_2x3: 45,
    nails_kg: 70,
};

const AVAILABLE_REBAR_SKUS = [
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

const AVAILABLE_TIE_SKUS = AVAILABLE_REBAR_SKUS.filter(sku => sku.diameter <= 12);

import { calculateBeam, calculateLumberVolumeBF } from '../../utils/calculations/beamCalculator';

// --- 2. HELPER FUNCTIONS (PURE LOGIC) ---

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

const getInitialElement = () => ({
    id: Date.now() + Math.random(),
    quantity: "",
    length_m: "",      // Width (B)
    width_m: "",       // Depth (H)
    height_m: "",      // Length (L)
    main_rebar_cuts: [{ sku: '', length: '', quantity: '' }],
    tie_bar_sku: '',
    tie_spacing_mm: "",
    cut_support_cuts: [{ sku: '', length: '', quantity: '' }],
    cut_midspan_cuts: [{ sku: '', length: '', quantity: '' }],
    isExcluded: false,
});

// --- 3. UI COMPONENTS ---

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
        className={`w-full p-1.5 text-center border border-slate-300 rounded text-sm focus:ring-2 focus:ring-teal-400 outline-none font-medium bg-white text-slate-900 ${className}`}
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

// --- 4. MAIN COMPONENT ---

export default function Beam({ beams: propBeams, setBeams: propSetBeams }) {
    // Use props if provided, otherwise use local state (for backward compatibility)
    const [localBeams, setLocalBeams] = useLocalStorage('beam_elements', [getInitialElement()]);
    const beams = propBeams || localBeams;
    const setBeams = propSetBeams || setLocalBeams;

    const [prices, setPrices] = useLocalStorage('beam_prices', DEFAULT_PRICES);
    const [showResult, setShowResult] = useLocalStorage('beam_show_result', false);
    const [error, setError] = useState(null);
    const [viewingPatterns, setViewingPatterns] = useState(false);
    const [editingCutsConfig, setEditingCutsConfig] = useState(null); // { id, field, title }
    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Migration logic for old state
    useEffect(() => {
        const needsMigration = beams.some(b => !b.main_rebar_cuts || !b.cut_support_cuts || !b.cut_midspan_cuts);
        if (needsMigration) {
            setBeams(prev => prev.map(b => {
                let updated = { ...b };
                if (!updated.main_rebar_cuts) {
                    updated.main_rebar_cuts = b.main_bar_sku ? [{ sku: b.main_bar_sku, length: '', quantity: b.main_bar_count }] : [{ sku: '', length: '', quantity: '' }];
                }
                if (!updated.cut_support_cuts) {
                    updated.cut_support_cuts = b.cut_support_sku ? [{ sku: b.cut_support_sku, length: '', quantity: b.cut_support_count }] : [{ sku: '', length: '', quantity: '' }];
                }
                if (!updated.cut_midspan_cuts) {
                    updated.cut_midspan_cuts = b.cut_midspan_sku ? [{ sku: b.cut_midspan_sku, length: '', quantity: b.cut_midspan_count }] : [{ sku: '', length: '', quantity: '' }];
                }
                return updated;
            }));
        }
    }, [beams, setBeams]);

    // Handlers wrapped in useCallback for performance
    const handleBeamChange = useCallback((id, field, value) => {
        setBeams(prev => prev.map(col => col.id === id ? { ...col, [field]: value } : col));
        setShowResult(false);
        setError(null);
    }, [setBeams]);

    const handleAddRow = useCallback(() => {
        setBeams(prev => [...prev, getInitialElement()]);
        setShowResult(false);
        setError(null);
    }, [setBeams]);

    const handleRemoveRow = useCallback((id) => {
        setBeams(prev => prev.length > 1 ? prev.filter(col => col.id !== id) : prev);
        setShowResult(false);
        setError(null);
    }, [setBeams]);

    const updateRebarCut = useCallback((beamId, field, index, subField, value) => {
        setBeams(prev => prev.map(beam => {
            if (beam.id === beamId) {
                const newCuts = [...(beam[field] || [{ sku: '', length: '', quantity: '' }])];
                newCuts[index] = { ...newCuts[index], [subField]: value };
                return { ...beam, [field]: newCuts };
            }
            return beam;
        }));
        setShowResult(false);
    }, [setBeams]);

    const addRebarCut = useCallback((beamId, field) => {
        setBeams(prev => prev.map(beam => {
            if (beam.id === beamId) {
                return { ...beam, [field]: [...(beam[field] || []), { sku: '', length: '', quantity: '' }] };
            }
            return beam;
        }));
        setShowResult(false);
    }, [setBeams]);

    const removeRebarCut = useCallback((beamId, field, index) => {
        setBeams(prev => prev.map(beam => {
            if (beam.id === beamId) {
                const cuts = beam[field] || [];
                const newCuts = cuts.filter((_, i) => i !== index);
                return { ...beam, [field]: newCuts.length > 0 ? newCuts : [{ sku: '', length: '', quantity: '' }] };
            }
            return beam;
        }));
        setShowResult(false);
    }, [setBeams]);

    const handleAddRowAbove = (id) => {
        setBeams(prev => {
            const index = prev.findIndex(b => b.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, getInitialElement());
            return newRows;
        });
        setContextMenu(null);
        setShowResult(false);
    };

    const handleDuplicateRow = (id) => {
        setBeams(prev => {
            const index = prev.findIndex(b => b.id === id);
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
        setBeams(prev => prev.map(b => b.id === id ? { ...b, isExcluded: !b.isExcluded } : b));
        setContextMenu(null);
        setShowResult(false);
    };

    const handleCalculate = () => {
        const hasEmptyFields = beams.some(beam =>
            beam.length_m === "" ||
            beam.width_m === "" ||
            beam.height_m === "" ||
            // Main Rebar is REQUIRED - must have at least one valid set
            !(beam.main_rebar_cuts || []).some(cut => cut.sku !== "" && cut.quantity !== "") ||
            // Check for partial entries in main rebar
            (beam.main_rebar_cuts || []).some(cut => (cut.sku !== "" && cut.quantity === "") || (cut.sku === "" && cut.quantity !== "")) ||
            beam.tie_spacing_mm === "" ||
            beam.tie_bar_sku === "" ||
            // Cut Bars are OPTIONAL - only block if PARTIALLY filled
            (beam.cut_support_cuts || []).some(cut => (cut.sku !== "" && cut.quantity === "") || (cut.sku === "" && cut.quantity !== "")) ||
            (beam.cut_midspan_cuts || []).some(cut => (cut.sku !== "" && cut.quantity === "") || (cut.sku === "" && cut.quantity !== ""))
        );

        if (hasEmptyFields) {
            setError("Please fill in all required fields (Dimensions, Rebar Count, Spacing, and Specs) before calculating.");
            setShowResult(false);
            return;
        }

        setError(null);
        setShowResult(true);
    };

    // --- CORE ESTIMATION ENGINE (DERIVED STATE) ---
    const result = useMemo(() => {
        if (!showResult) return null;
        return calculateBeam(beams, prices);
    }, [beams, prices, showResult]);

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('beam_total', result.grandTotal);
        } else {
            setSessionData('beam_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    const activeBeamForCuts = beams.find(b => b.id === (editingCutsConfig?.id));

    return (
        <div className="space-y-6 relative">
            {/* GENERIC REBAR MODAL OVERLAY */}
            {editingCutsConfig && activeBeamForCuts && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-zinc-200 flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50 rounded-t-xl">
                            <div>
                                <h3 className="font-bold text-lg text-zinc-800">{editingCutsConfig.title}</h3>
                                <p className="text-xs text-zinc-500">Configure different sizes and quantities for this configuration.</p>
                            </div>
                            <button onClick={() => setEditingCutsConfig(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                                <X size={20} className="text-zinc-500" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                            {(activeBeamForCuts[editingCutsConfig.field] || [{ sku: '', quantity: '' }]).map((cut, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-zinc-400 w-6">{idx + 1}</span>
                                    <div className="flex-[2]">
                                        <SelectInput
                                            value={cut.sku}
                                            onChange={(val) => updateRebarCut(activeBeamForCuts.id, editingCutsConfig.field, idx, 'sku', val)}
                                            options={AVAILABLE_REBAR_SKUS}
                                            placeholder="Select SKU..."
                                            focusColor="teal"
                                        />
                                    </div>
                                    <div className="w-28 text-center bg-slate-50 border border-slate-200 py-2 rounded text-xs font-medium text-slate-500">
                                        {editingCutsConfig.field === 'main_rebar_cuts'
                                            ? `${activeBeamForCuts.height_m || '0.00'} m`
                                            : editingCutsConfig.field === 'cut_support_cuts'
                                                ? `${(parseFloat(activeBeamForCuts.height_m) * 0.3 || 0).toFixed(2)} m`
                                                : `${(parseFloat(activeBeamForCuts.height_m) * 0.4 || 0).toFixed(2)} m`
                                        }
                                    </div>
                                    <span className="text-zinc-400 text-xs text-center w-4">×</span>
                                    <div className="w-24">
                                        <MathInput
                                            placeholder="Qty"
                                            value={cut.quantity}
                                            onChange={(val) => updateRebarCut(activeBeamForCuts.id, editingCutsConfig.field, idx, 'quantity', val)}
                                            className="w-full"
                                        />
                                    </div>
                                    <span className="text-zinc-400 text-xs">pcs</span>
                                    <button onClick={() => removeRebarCut(activeBeamForCuts.id, editingCutsConfig.field, idx)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => addRebarCut(activeBeamForCuts.id, editingCutsConfig.field)}
                                className="w-full py-2 bg-teal-50 border border-teal-100 text-teal-600 rounded-lg text-xs font-bold uppercase hover:bg-teal-100 transition-colors flex items-center justify-center gap-2 mt-2"
                            >
                                <PlusCircle size={14} /> Add Rebar Set
                            </button>
                        </div>
                        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end rounded-b-xl">
                            <button onClick={() => setEditingCutsConfig(null)} className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold text-sm hover:bg-teal-700 transition-colors">
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
                        {beams.find(b => b.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in Calculation</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude from Calculation</>
                        }
                    </button>
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
                        {beams.find(b => b.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in Calculation</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude from Calculation</>
                        }
                    </button>
                </div>
            )}

            <Card className="border-t-4 border-t-teal-600 shadow-md">
                <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><Settings size={18} /> Beam Configuration ({beams.length} Total)</h2>
                    <button onClick={handleAddRow} className="flex items-center gap-1 px-4 py-2 bg-teal-600 text-white rounded-md text-xs font-bold hover:bg-teal-700 transition-colors active:scale-95 shadow-sm">
                        <PlusCircle size={14} /> Add Element
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[1300px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]" rowSpan="3">#</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[70px]" rowSpan="3">Qty</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-cyan-50 text-cyan-900" colSpan="3">Dimensions (m)</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-orange-50 text-orange-900 w-[160px]" rowSpan="3">Main Rebar</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-emerald-50 text-emerald-900" colSpan="2">Ties/Stirrups</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-fuchsia-50 text-fuchsia-900" colSpan="4">Cut Bars</th>
                                <th className="px-1 py-2 font-bold border border-slate-300 text-center w-[50px]" rowSpan="3"></th>
                            </tr>
                            <tr>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[85px] bg-cyan-50/50" rowSpan="2">Width (B)</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[85px] bg-cyan-50/50" rowSpan="2">Depth (H)</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[85px] bg-cyan-50/50" rowSpan="2">Length (L)</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[140px] bg-emerald-50/50" rowSpan="2">Size & Length</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[90px] bg-emerald-50/50" rowSpan="2">Space (mm)</th>
                                <th className="px-2 py-1 font-bold border border-slate-300 text-center bg-fuchsia-100/50" colSpan="2">At Support (Top)</th>
                                <th className="px-2 py-1 font-bold border border-slate-300 text-center bg-fuchsia-100/50" colSpan="2">At Midspan (Bottom)</th>
                            </tr>
                            <tr>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[130px] bg-fuchsia-50/50">Size</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[60px] bg-fuchsia-50/50">Count</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[130px] bg-fuchsia-50/50">Size</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[60px] bg-fuchsia-50/50">Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {beams.map((col, index) => (
                                <tr
                                    key={col.id}
                                    className={`transition-colors ${col.isExcluded ? 'bg-slate-50/50 opacity-60 grayscale-[0.5]' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    <td
                                        className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold cursor-help relative group"
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
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput value={col.quantity} onChange={(v) => handleBeamChange(col.id, 'quantity', v)} placeholder="Qty" className="font-bold" />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={col.length_m} onChange={(v) => handleBeamChange(col.id, 'length_m', v)} placeholder="0.30" /></td>
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={col.width_m} onChange={(v) => handleBeamChange(col.id, 'width_m', v)} placeholder="0.50" /></td>
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={col.height_m} onChange={(v) => handleBeamChange(col.id, 'height_m', v)} placeholder="6.00" /></td>
                                    <td className="p-2 border border-slate-300 align-middle bg-orange-50/20 text-center">
                                        <button
                                            onClick={() => setEditingCutsConfig({ id: col.id, field: 'main_rebar_cuts', title: 'Manage Main Rebar' })}
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
                                    <td className="p-2 border border-slate-300 align-middle bg-emerald-50/20">
                                        <SelectInput
                                            value={col.tie_bar_sku}
                                            onChange={(val) => handleBeamChange(col.id, 'tie_bar_sku', val)}
                                            options={AVAILABLE_TIE_SKUS}
                                            placeholder="Select SKU..."
                                            focusColor="teal"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-emerald-50/20"><TableNumberInput value={col.tie_spacing_mm} onChange={(v) => handleBeamChange(col.id, 'tie_spacing_mm', v)} placeholder="150" step="10" /></td>
                                    <td className="p-2 border border-slate-300 align-middle bg-fuchsia-100/20 text-center" colSpan="2">
                                        <button
                                            onClick={() => setEditingCutsConfig({ id: col.id, field: 'cut_support_cuts', title: 'Manage Support Rebar (Top)' })}
                                            className="px-3 py-1.5 bg-white hover:bg-fuchsia-100 text-fuchsia-600 hover:text-fuchsia-700 rounded border border-fuchsia-200 hover:border-fuchsia-300 text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5 w-full min-h-[40px]"
                                        >
                                            <Edit2 size={12} className="opacity-70 flex-shrink-0" />
                                            <span className="truncate">
                                                {(col.cut_support_cuts || []).filter(c => c.sku && c.quantity).length > 0
                                                    ? (col.cut_support_cuts || [])
                                                        .filter(c => c.sku && c.quantity)
                                                        .map(c => `${c.quantity}-${c.sku.split('_')[0]}mm`)
                                                        .join(', ')
                                                    : "Setup Support"
                                                }
                                            </span>
                                        </button>
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-fuchsia-100/20 text-center" colSpan="2">
                                        <button
                                            onClick={() => setEditingCutsConfig({ id: col.id, field: 'cut_midspan_cuts', title: 'Manage Midspan Rebar (Bottom)' })}
                                            className="px-3 py-1.5 bg-white hover:bg-fuchsia-100 text-fuchsia-600 hover:text-fuchsia-700 rounded border border-fuchsia-200 hover:border-fuchsia-300 text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5 w-full min-h-[40px]"
                                        >
                                            <Edit2 size={12} className="opacity-70 flex-shrink-0" />
                                            <span className="truncate">
                                                {(col.cut_midspan_cuts || []).filter(c => c.sku && c.quantity).length > 0
                                                    ? (col.cut_midspan_cuts || [])
                                                        .filter(c => c.sku && c.quantity)
                                                        .map(c => `${c.quantity}-${c.sku.split('_')[0]}mm`)
                                                        .join(', ')
                                                    : "Setup Midspan"
                                                }
                                            </span>
                                        </button>
                                    </td>
                                    <td className="p-1 border border-slate-300 align-middle text-center">
                                        <button onClick={() => handleRemoveRow(col.id)} disabled={beams.length === 1} className={`p-1.5 rounded-full transition-colors ${beams.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}>
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

                <div className="flex justify-end p-4 bg-slate-50 border-t border-gray-200">
                    <button
                        onClick={handleCalculate}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
                    >
                        <Calculator size={20} />
                        CALCULATE
                    </button>
                </div>
            </Card>

            {!showResult && !error && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Layout size={40} className="text-teal-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 mb-1">Ready to Estimate</h3>
                    <p className="max-w-md mx-auto text-sm">
                        Enter your beam dimensions, rebar specifications (main, ties, cut bars), and spacing above, then click <span className="font-bold text-teal-600">'CALCULATE'</span>.
                    </p>
                </div>
            )}

            {showResult && result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-emerald-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">Estimation Result</h3>
                                <div className="flex flex-wrap gap-4 mt-2">
                                    <div className="bg-cyan-50 px-3 py-1 rounded text-sm text-cyan-700 border border-cyan-100 flex items-center gap-1">
                                        <Layers size={14} /> Total Volume: <strong>{result.volume} cu.m</strong>
                                    </div>
                                    <div className="bg-yellow-50 px-3 py-1 rounded text-sm text-yellow-700 border border-yellow-100 flex items-center gap-1">
                                        <Layout size={14} /> Formwork Area: <strong>{result.areaFormwork} sq.m</strong>
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
                                onClick={() => downloadCSV(result.items, 'beam_estimation.csv')}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                                title="Download as CSV"
                            >
                                <Download size={14} /> CSV
                            </button>
                            <button
                                onClick={() => setViewingPatterns(true)}
                                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-all shadow-md active:scale-95"
                                title="View cutting patterns and schedule"
                            >
                                <Scissors size={14} /> Cutting Patterns
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
                                            <td className="px-4 py-3 text-right text-gray-800 font-bold">{item.qty.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center text-gray-600"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span></td>
                                            <td className="px-4 py-2">
                                                <TablePriceInput value={prices[item.priceKey] !== undefined ? prices[item.priceKey] : item.price.toFixed(2)} onChange={(newValue) => setPrices(prev => ({ ...prev, [item.priceKey]: newValue }))} />
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
                                Standard Concrete Class A (1:2:4) • **5% Waste Factor** applied to Cement/Sand/Gravel.
                                <br />
                                <Scissors size={12} className="inline mr-1" />
                                **Rebar quantities rounded up to the nearest piece (whole number). Longitudinal and Cut Bars include 2 x 40D anchorage/development length unless splicing is required.**
                                <br />
                                <Info size={12} className="inline mr-1" />
                                **Formwork materials (Plywood, Lumber, Nails) are excluded** - these are calculated separately in the Formworks Tab.
                            </p>
                        </div>
                    </div>
                </Card>
            )}
            {/* CUTTING PATTERN VISUALIZER MODAL */}
            {viewingPatterns && result && (
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
                                        <h2 className="text-2xl font-bold text-zinc-900 uppercase tracking-wide">Beam Rebar Cutting Analysis</h2>
                                        <span className="text-[10px] font-mono text-white bg-zinc-800 px-2 py-0.5 rounded-sm">OPT-V2</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">Optimized Cutting Stock Logic • Rebar Optimization</p>
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
                                        <h1 className="text-3xl font-black uppercase tracking-tighter">Beam Cutting Schedule</h1>
                                        <p className="text-xs font-mono uppercase text-zinc-500">Structural Rebar Optimization • Plan-Ready Details</p>
                                    </div>
                                    <div className="text-right text-[10px] font-mono uppercase">
                                        <p>Generated: {new Date().toLocaleDateString()}</p>
                                        <p className="font-bold">Ref: SCT-BM-{Date.now().toString().slice(-6)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                                {result.items.filter(item => item.optimization).map((item, index) => {
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
                                                        <p className="text-[10px] font-mono text-zinc-400 uppercase">Reinforcement Type: Rebar</p>
                                                    </div>
                                                </div>
                                                <div className="text-right no-print">
                                                    <div className="text-[9px] text-zinc-400 font-mono uppercase font-bold mb-0.5 tracking-tighter">Efficiency</div>
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
                                                                    RB{(item.name.match(/\d+/) || [10])[0]}-{getAlphabeticalIndex(gIdx)}
                                                                    <span className="ml-2 text-blue-400 print:text-zinc-600">({bin.count} PIECES)</span>
                                                                </span>
                                                                <span className="text-[10px] text-zinc-400 font-mono italic">STOCK: {bin.stockLength.toFixed(2)}m</span>
                                                            </div>
                                                            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tighter">
                                                                OFFCUT: <span className={bin.freeSpace > 0.5 ? 'text-red-500 font-black' : 'text-zinc-400 font-bold'}>{bin.freeSpace.toFixed(3)}m</span>
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
                                            Structural Rebar Schedule
                                            <span className="text-[10px] font-mono font-normal bg-zinc-100 text-zinc-500 px-2 py-1 rounded-sm border border-zinc-200 uppercase tracking-widest border-l-4 border-l-blue-600">Plan Code: SCT-BM-{Date.now().toString().slice(-6)}</span>
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
                                            <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900">Structural Rebar Schedule</h1>
                                            <p className="text-xs font-mono uppercase text-zinc-600">Project: Beam Rebar Optimization • Manual Cuts Included</p>
                                        </div>
                                        <div className="text-right text-[10px] font-mono uppercase text-zinc-900">
                                            <p>Generated: {new Date().toLocaleDateString()}</p>
                                            <p className="font-bold">Plan Ref: SCT-BM-{Date.now().toString().slice(-6)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {result.items.filter(item => item.optimization).map((item, idx) => (
                                        <div key={idx} className="bg-white border border-zinc-300 rounded-sm overflow-hidden">
                                            <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-300 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 bg-zinc-900 text-white flex items-center justify-center font-mono text-sm">{(idx + 1).toString().padStart(2, '0')}</span>
                                                    <div>
                                                        <h4 className="font-bold text-zinc-900 uppercase text-xs tracking-wide">{item.name}</h4>
                                                        <p className="text-[9px] font-mono text-zinc-500 uppercase">Structural Reinforcement Details</p>
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
                                                        <th className="px-6 py-2 border-r border-zinc-200 uppercase tracking-wider font-bold text-zinc-600">Cutting Detail (Lengths in Meters)</th>
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
                                                            <td className="px-6 py-3 border-r border-zinc-200 text-center font-bold text-zinc-900">
                                                                RB{(item.name.match(/\d+/) || [10])[0]}-{getAlphabeticalIndex(gIdx)}
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
                                                            <td className="px-6 py-3 text-right font-bold text-zinc-900">{(group.count * (item.optimization?.stockLength || 0)).toFixed(2)}m</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-zinc-900 text-white font-bold">
                                                    <tr>
                                                        <td colSpan="2" className="px-6 py-2 text-right uppercase tracking-widest text-[9px]">Summary:</td>
                                                        <td className="px-6 py-2 text-center text-sm">{item.qty} PCS</td>
                                                        <td className="px-6 py-2 text-center text-[9px] text-zinc-400">{(item.optimization?.wasteTotal || 0).toFixed(3)}m waste</td>
                                                        <td className="px-6 py-2 text-right text-sm">{(item.qty * (item.optimization?.stockLength || 0)).toFixed(2)}m</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-4 border-t border-zinc-100 bg-white flex justify-end items-center shrink-0 no-print">
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
        </div>
    );
}
