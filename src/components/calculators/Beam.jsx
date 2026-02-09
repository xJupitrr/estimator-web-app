import React, { useState, useMemo, useCallback, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Info, Settings, PlusCircle, Trash2, Box, Package, Layers, Layout, Scissors, Calculator, ArrowRight, AlertCircle, ClipboardCopy, Download } from 'lucide-react';
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
const getInitialElement = () => ({
    id: Date.now() + Math.random(),
    quantity: 1,
    length_m: "",      // Width (B)
    width_m: "",       // Depth (H)
    height_m: "",      // Length (L)
    main_bar_sku: '',
    main_bar_count: "",
    tie_bar_sku: '',
    tie_spacing_mm: "",
    cut_support_sku: '',
    cut_support_count: "",
    cut_midspan_sku: '',
    cut_midspan_count: "",
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
    const [localBeams, setLocalBeams] = useState([getInitialElement()]);
    const beams = propBeams || localBeams;
    const setBeams = propSetBeams || setLocalBeams;

    const [prices, setPrices] = useLocalStorage('beam_prices', DEFAULT_PRICES);
    const [showResult, setShowResult] = useLocalStorage('beam_show_result', false);
    const [error, setError] = useState(null);

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

    const handleCalculate = () => {
        const hasEmptyFields = beams.some(beam =>
            beam.length_m === "" ||
            beam.width_m === "" ||
            beam.height_m === "" ||
            beam.main_bar_count === "" ||
            beam.tie_spacing_mm === "" ||
            beam.main_bar_sku === "" ||
            beam.tie_bar_sku === "" ||
            (beam.cut_support_count !== "" && beam.cut_support_sku === "") ||
            (beam.cut_midspan_count !== "" && beam.cut_midspan_sku === "")
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

    return (
        <div className="space-y-6">
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
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[30px]" rowSpan="3">#</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[60px]" rowSpan="3">Qty</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-cyan-50 text-cyan-900" colSpan="3">Dimensions (m)</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-orange-50 text-orange-900" colSpan="2">Main Rebar</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-emerald-50 text-emerald-900" colSpan="2">Ties/Stirrups</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-fuchsia-50 text-fuchsia-900" colSpan="4">Cut Bars</th>
                                <th className="px-1 py-2 font-bold border border-slate-300 text-center w-[30px]" rowSpan="3"></th>
                            </tr>
                            <tr>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[70px] bg-cyan-50/50" rowSpan="2">Width (B)</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[70px] bg-cyan-50/50" rowSpan="2">Depth (H)</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[70px] bg-cyan-50/50" rowSpan="2">Length (L)</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[120px] bg-orange-50/50" rowSpan="2">Size & Length</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[70px] bg-orange-50/50" rowSpan="2">Count</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[120px] bg-emerald-50/50" rowSpan="2">Size & Length</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[80px] bg-emerald-50/50" rowSpan="2">Space (mm)</th>
                                <th className="px-2 py-1 font-bold border border-slate-300 text-center bg-fuchsia-100/50" colSpan="2">At Support (Top)</th>
                                <th className="px-2 py-1 font-bold border border-slate-300 text-center bg-fuchsia-100/50" colSpan="2">At Midspan (Bottom)</th>
                            </tr>
                            <tr>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[100px] bg-fuchsia-50/50">Size</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[50px] bg-fuchsia-50/50">Count</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[100px] bg-fuchsia-50/50">Size</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[50px] bg-fuchsia-50/50">Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {beams.map((col, index) => (
                                <tr key={col.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold">{index + 1}</td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput value={col.quantity} onChange={(v) => handleBeamChange(col.id, 'quantity', v)} min="1" step="1" className="font-bold" />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={col.length_m} onChange={(v) => handleBeamChange(col.id, 'length_m', v)} placeholder="0.30" /></td>
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={col.width_m} onChange={(v) => handleBeamChange(col.id, 'width_m', v)} placeholder="0.50" /></td>
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={col.height_m} onChange={(v) => handleBeamChange(col.id, 'height_m', v)} placeholder="6.00" /></td>
                                    <td className="p-2 border border-slate-300 align-middle bg-orange-50/20">
                                        <SelectInput
                                            value={col.main_bar_sku}
                                            onChange={(val) => handleBeamChange(col.id, 'main_bar_sku', val)}
                                            options={AVAILABLE_REBAR_SKUS}
                                            placeholder="Select SKU..."
                                            focusColor="teal"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-orange-50/20"><TableNumberInput value={col.main_bar_count} onChange={(v) => handleBeamChange(col.id, 'main_bar_count', v)} placeholder="4" step="1" /></td>
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
                                    <td className="p-2 border border-slate-300 align-middle bg-fuchsia-50/20">
                                        <SelectInput
                                            value={col.cut_support_sku}
                                            onChange={(val) => handleBeamChange(col.id, 'cut_support_sku', val)}
                                            options={AVAILABLE_REBAR_SKUS}
                                            placeholder="Select SKU..."
                                            focusColor="teal"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-fuchsia-50/20"><TableNumberInput value={col.cut_support_count} onChange={(v) => handleBeamChange(col.id, 'cut_support_count', v)} placeholder="2" step="1" /></td>
                                    <td className="p-2 border border-slate-300 align-middle bg-fuchsia-50/20">
                                        <SelectInput
                                            value={col.cut_midspan_sku}
                                            onChange={(val) => handleBeamChange(col.id, 'cut_midspan_sku', val)}
                                            options={AVAILABLE_REBAR_SKUS}
                                            placeholder="Select SKU..."
                                            focusColor="teal"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-fuchsia-50/20"><TableNumberInput value={col.cut_midspan_count} onChange={(v) => handleBeamChange(col.id, 'cut_midspan_count', v)} placeholder="2" step="1" /></td>
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
                        Enter your beam dimensions, rebar specifications (main, ties, cut bars), and spacing above, then click <span className="font-bold text-teal-600">'Calculate'</span>.
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
        </div>
    );
}
