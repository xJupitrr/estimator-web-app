import React, { useState, useMemo, useCallback } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Info, Settings, PlusCircle, Trash2, Box, Package, Layers, Layout, Scissors, Calculator, ArrowRight, AlertCircle, ClipboardCopy, Download } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';

// --- 1. CONSTANTS & CONFIGURATION ---

const CONCRETE_WASTE_PCT = 5;
const LUMBER_NAIL_WASTE = 1.10; // 10%
const PLYWOOD_WASTE = 1.15;     // 15%
const PLYWOOD_AREA_SQM = 2.9768; // 1.22m x 2.44m
const STUD_SPACING_M = 0.60;
const PROP_SPACING_M = 1.00;
const STANDARD_PROP_LENGTH_M = 3.00;
const L_ANCHOR_DEV_FACTOR = 40;

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

// --- 2. HELPER FUNCTIONS (PURE LOGIC) ---

const getSkuDetails = (skuId) => {
    if (!skuId) return { diameter: 0, length: 0, priceKey: '' };
    const [diameter, length] = skuId.split('_').map(Number);
    return { diameter, length, priceKey: `rebar_${diameter}` };
};

const getInitialElement = () => ({
    id: crypto.randomUUID(),
    quantity: 1,
    length_m: "",      // Width (B)
    width_m: "",       // Depth (H)
    height_m: "",      // Length (L)
    main_bar_sku: '16_9.0',
    main_bar_count: "",
    tie_bar_sku: '10_6.0',
    tie_spacing_mm: "",
    cut_support_sku: '12_6.0',
    cut_support_count: "",
    cut_midspan_sku: '12_6.0',
    cut_midspan_count: "",
});

/**
 * Calculates Lumber (BF) using Direct Counting Method
 */
const calculateLumberVolumeBF = (beams) => {
    let totalLinearMeters_2x3 = 0;

    beams.forEach(col => {
        const qty = parseInt(col.quantity) || 1;
        const D_cross = parseFloat(col.width_m) || 0; // Depth
        const L_elem = parseFloat(col.height_m) || 0; // Length

        if (D_cross <= 0 || L_elem <= 0) return;

        // 1. Vertical Studs (Frame Sides)
        const numStudsPerSide = Math.ceil(L_elem / STUD_SPACING_M) + 1;
        const totalStuds = numStudsPerSide * 2;
        const linearMetersStuds = totalStuds * D_cross;

        // 2. Horizontal Walers (Frame Sides)
        let numWalersPerSide = 2;
        if (D_cross > 0.50 && D_cross <= 1.0) numWalersPerSide = 3;
        else if (D_cross > 1.0) numWalersPerSide = 4;

        const totalWalers = numWalersPerSide * 2;
        const linearMetersWalers = totalWalers * L_elem;

        // 3. Vertical Props (Bottom)
        const numPropsPerBeam = Math.ceil(L_elem / PROP_SPACING_M) + 1;
        const linearMetersProps = numPropsPerBeam * STANDARD_PROP_LENGTH_M;

        totalLinearMeters_2x3 += (linearMetersStuds + linearMetersWalers + linearMetersProps) * qty;
    });

    // 2"x3" => 0.5 BF/ft. 1m = 3.28084ft. Factor = 0.5 * 3.28084 = 1.64042
    const BF_PER_LINEAR_METER = 1.64042;
    return totalLinearMeters_2x3 * BF_PER_LINEAR_METER * LUMBER_NAIL_WASTE;
};

// --- 3. UI COMPONENTS ---

const Card = React.memo(({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
        {children}
    </div>
));

const TableNumberInput = React.memo(({ value, onChange, placeholder, min = "0", step = "any", className = "" }) => (
    <input
        type="number"
        min={min}
        step={step}
        placeholder={placeholder}
        value={value === null || value === undefined ? '' : value}
        onChange={(e) => onChange(e.target.value)}
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
    const [showResult, setShowResult] = useState(false);
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
            beam.tie_spacing_mm === ""
        );

        if (hasEmptyFields) {
            setError("Please fill in all required fields (Width, Depth, Length, Rebar Count, Spacing) before calculating.");
            setShowResult(false);
            return;
        }

        setError(null);
        setShowResult(true);
    };

    // --- CORE ESTIMATION ENGINE (DERIVED STATE) ---
    const result = useMemo(() => {
        if (!showResult) return null;

        let totalVolConcrete = 0;
        let totalAreaFormwork = 0;
        let totalCementBags = 0;
        let totalSandCum = 0;
        let totalGravelCum = 0;
        let totalTieWireKg = 0;

        // Rebar Tracking
        const rebarRequirements = {};
        const concreteCover = 0.04;
        const wireMetersPerKg = 53;

        // Helpers within calculation scope
        const addShortCutReq = (skuId, cutLength, count) => {
            if (cutLength <= 0 || count <= 0) return;
            const { length: commercialLength } = getSkuDetails(skuId);
            if (!rebarRequirements[skuId]) rebarRequirements[skuId] = { shortCuts: [], splicedBarsPieces: 0, commercialLength };
            rebarRequirements[skuId].shortCuts.push({ cutLength, count });
        };

        const addSplicedBarReq = (skuId, totalBars) => {
            if (totalBars <= 0) return;
            const { length: commercialLength } = getSkuDetails(skuId);
            if (!rebarRequirements[skuId]) rebarRequirements[skuId] = { shortCuts: [], splicedBarsPieces: 0, commercialLength };
            rebarRequirements[skuId].splicedBarsPieces += totalBars;
        };

        beams.forEach(col => {
            const qty = parseInt(col.quantity) || 1;
            const W_cross = parseFloat(col.length_m) || 0; // Width
            const D_cross = parseFloat(col.width_m) || 0;  // Depth
            const L_elem = parseFloat(col.height_m) || 0;  // Length

            if (W_cross <= 0 || D_cross <= 0 || L_elem <= 0) return;

            // 1. Concrete
            const vol = W_cross * D_cross * L_elem * qty;
            totalVolConcrete += vol;
            const wasteMult = 1 + (CONCRETE_WASTE_PCT / 100);
            totalCementBags += vol * 9.0 * wasteMult;
            totalSandCum += vol * 0.5 * wasteMult;
            totalGravelCum += vol * 1.0 * wasteMult;

            // 2. Formwork Area (Sides + Bottom)
            totalAreaFormwork += (2 * D_cross * L_elem + W_cross * L_elem) * qty;

            // 3. Rebar - Main
            const mainSkuDetails = getSkuDetails(col.main_bar_sku);
            const mainDiaM = mainSkuDetails.diameter / 1000;
            const L_dev = L_ANCHOR_DEV_FACTOR * mainDiaM;

            const mainCount = parseInt(col.main_bar_count) || 4;
            const totalMainPieces = mainCount * qty;

            if (L_elem > mainSkuDetails.length) {
                // Spliced
                const barsPerRun = Math.ceil(L_elem / mainSkuDetails.length);
                addSplicedBarReq(col.main_bar_sku, barsPerRun * totalMainPieces);
            } else {
                // Not Spliced (Add 2x Development Length)
                addShortCutReq(col.main_bar_sku, L_elem + (2 * L_dev), totalMainPieces);
            }

            // 4. Rebar - Ties
            const tieSkuDetails = getSkuDetails(col.tie_bar_sku);
            const W_tie = W_cross - (2 * concreteCover);
            const D_tie = D_cross - (2 * concreteCover);
            const hookLength = Math.max(12 * (tieSkuDetails.diameter / 1000), 0.075);
            const tieCutLength = (2 * (W_tie + D_tie)) + (2 * hookLength);

            if (W_tie > 0 && D_tie > 0) {
                const spacingM = (parseFloat(col.tie_spacing_mm) || 150) / 1000;
                const tiesPerBeam = Math.ceil(L_elem / spacingM) + 1;
                addShortCutReq(col.tie_bar_sku, tieCutLength, tiesPerBeam * qty);

                // Tie Wire
                const intersections = (mainCount + (parseInt(col.cut_support_count) || 0) * 2 + (parseInt(col.cut_midspan_count) || 0)) * tiesPerBeam * qty;
                totalTieWireKg += (intersections * 0.35) / wireMetersPerKg;
            }

            // 5. Cut Bars - Support
            const cutSupportCount = parseInt(col.cut_support_count) || 0;
            if (cutSupportCount > 0) {
                const supportDetails = getSkuDetails(col.cut_support_sku);
                const L_dev_sup = L_ANCHOR_DEV_FACTOR * (supportDetails.diameter / 1000);
                const reqLen = (0.3 * L_elem) + (2 * L_dev_sup);
                const totalPieces = cutSupportCount * qty * 2; // 2 supports

                if (reqLen > supportDetails.length) {
                    addSplicedBarReq(col.cut_support_sku, Math.ceil(reqLen / supportDetails.length) * totalPieces);
                } else {
                    addShortCutReq(col.cut_support_sku, reqLen, totalPieces);
                }
            }

            // 6. Cut Bars - Midspan
            const cutMidspanCount = parseInt(col.cut_midspan_count) || 0;
            if (cutMidspanCount > 0) {
                const midDetails = getSkuDetails(col.cut_midspan_sku);
                const L_dev_mid = L_ANCHOR_DEV_FACTOR * (midDetails.diameter / 1000);
                const reqLen = (0.4 * L_elem) + (2 * L_dev_mid);
                const totalPieces = cutMidspanCount * qty;

                if (reqLen > midDetails.length) {
                    addSplicedBarReq(col.cut_midspan_sku, Math.ceil(reqLen / midDetails.length) * totalPieces);
                } else {
                    addShortCutReq(col.cut_midspan_sku, reqLen, totalPieces);
                }
            }
        });

        // --- Finalize Quantities ---
        const items = [];
        let subTotal = 0;

        const addItem = (name, qty, unit, priceKey, priceDefault) => {
            if (qty <= 0) return;

            // Apply a soft round for display consistency if it's not an integer
            let finalQty = qty;
            if (!Number.isInteger(qty)) {
                finalQty = Math.ceil(qty * 100) / 100; // Round to 2 decimals
            }

            const price = prices[priceKey] !== undefined ? parseFloat(prices[priceKey]) : priceDefault;
            const total = finalQty * price;
            subTotal += total;
            items.push({ name, qty: finalQty, unit, priceKey, price, total });
        };

        // Concrete
        addItem("Portland Cement (40kg)", Math.ceil(totalCementBags), "bags", "cement", 240);
        addItem("Wash Sand (S1)", totalSandCum, "cu.m", "sand", 1200);
        addItem("Crushed Gravel (3/4)", totalGravelCum, "cu.m", "gravel", 1400);

        // Rebar Yield Processing
        Object.keys(rebarRequirements).forEach(skuId => {
            const { shortCuts, splicedBarsPieces, commercialLength } = rebarRequirements[skuId];
            const { diameter, priceKey } = getSkuDetails(skuId);

            let totalBars = splicedBarsPieces;

            shortCuts.forEach(({ cutLength, count }) => {
                const yieldPerBar = Math.floor(commercialLength / cutLength);
                if (yieldPerBar > 0) totalBars += Math.ceil(count / yieldPerBar);
                else totalBars += count;
            });

            if (totalBars > 0) addItem(`Corrugated Rebar (${diameter}mm x ${commercialLength}m)`, totalBars, "pcs", priceKey, 200);
        });

        addItem("G.I. Tie Wire (#16)", Math.ceil(totalTieWireKg), "kg", "tie_wire", 85);

        // Formwork
        const totalPlywood = (totalAreaFormwork / PLYWOOD_AREA_SQM) * PLYWOOD_WASTE;
        const totalLumber = calculateLumberVolumeBF(beams);
        const totalNails = totalAreaFormwork * 0.15 * LUMBER_NAIL_WASTE;

        addItem("Phenolic Board (1/2\", 4x8 Sheet)", Math.ceil(totalPlywood), "sheets", "phenolic_1_2", 2000);
        addItem("Lumber (2\"x3\" Frame/Props)", Math.ceil(totalLumber), "BF", "lumber_2x3", 45);
        addItem("Common Nails (Assorted)", Math.ceil(totalNails), "kg", "nails_kg", 70);

        return { volume: totalVolConcrete.toFixed(2), areaFormwork: totalAreaFormwork.toFixed(2), items, grandTotal: subTotal };

    }, [beams, prices, showResult]);

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
                                        <select value={col.main_bar_sku} onChange={(e) => handleBeamChange(col.id, 'main_bar_sku', e.target.value)} className="w-full p-1 text-center border border-slate-300 rounded bg-white outline-none cursor-pointer text-xs font-medium h-[34px]">
                                            {AVAILABLE_REBAR_SKUS.map(sku => <option key={sku.id} value={sku.id}>{sku.display}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-orange-50/20"><TableNumberInput value={col.main_bar_count} onChange={(v) => handleBeamChange(col.id, 'main_bar_count', v)} placeholder="4" step="1" /></td>
                                    <td className="p-2 border border-slate-300 align-middle bg-emerald-50/20">
                                        <select value={col.tie_bar_sku} onChange={(e) => handleBeamChange(col.id, 'tie_bar_sku', e.target.value)} className="w-full p-1 text-center border border-slate-300 rounded bg-white outline-none cursor-pointer text-xs font-medium h-[34px]">
                                            {AVAILABLE_TIE_SKUS.map(sku => <option key={sku.id} value={sku.id}>{sku.display}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-emerald-50/20"><TableNumberInput value={col.tie_spacing_mm} onChange={(v) => handleBeamChange(col.id, 'tie_spacing_mm', v)} placeholder="150" step="10" /></td>
                                    <td className="p-2 border border-slate-300 align-middle bg-fuchsia-50/20">
                                        <select value={col.cut_support_sku} onChange={(e) => handleBeamChange(col.id, 'cut_support_sku', e.target.value)} className="w-full p-1 text-center border border-slate-300 rounded bg-white outline-none cursor-pointer text-xs font-medium h-[34px]">
                                            {AVAILABLE_REBAR_SKUS.map(sku => <option key={sku.id} value={sku.id}>{sku.display}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-fuchsia-50/20"><TableNumberInput value={col.cut_support_count} onChange={(v) => handleBeamChange(col.id, 'cut_support_count', v)} placeholder="2" step="1" /></td>
                                    <td className="p-2 border border-slate-300 align-middle bg-fuchsia-50/20">
                                        <select value={col.cut_midspan_sku} onChange={(e) => handleBeamChange(col.id, 'cut_midspan_sku', e.target.value)} className="w-full p-1 text-center border border-slate-300 rounded bg-white outline-none cursor-pointer text-xs font-medium h-[34px]">
                                            {AVAILABLE_REBAR_SKUS.map(sku => <option key={sku.id} value={sku.id}>{sku.display}</option>)}
                                        </select>
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
                                Standard Concrete Class A (1:2:4) • **5% Waste Factor** applied to Cement/Sand/Gravel. Nails use industry area factor + 10% Waste. Phenolic Board uses Area Factor + 15% Waste. **Lumber calculated using Direct Counting Method** (Studs: 0.6m spacing, Props: 1.0m spacing) + **10% Waste Factor**.
                                <br />
                                <Scissors size={12} className="inline mr-1" />
                                **Rebar quantities rounded up to the nearest piece (whole number). Longitudinal and Cut Bars include 2 x 40D anchorage/development length unless splicing is required.**
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
