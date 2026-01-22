import React, { useState, useEffect } from 'react';
import { Layers, Info, Box, LayoutTemplate, Columns, PenTool, Grid3X3, Paintbrush, Cloud, Hammer, SquareStack, Settings, Calculator, PlusCircle, Trash2, AlertCircle, ClipboardCopy, Download, CheckCircle2, XCircle } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';

// --- Components ---
const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

const TableNumberInput = ({ value, onChange, placeholder, min = "0", step = "any", className = "" }) => (
    <input
        type="number"
        min={min}
        step={step}
        placeholder={placeholder}
        value={value === null || value === undefined ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-1.5 text-center border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-400 outline-none font-medium bg-white text-slate-900 ${className}`}
    />
);

const TablePriceInput = ({ value, onChange, placeholder = "0.00" }) => (
    <div className="flex items-center justify-end relative">
        <span className="absolute left-1 text-gray-400 font-bold text-[10px] pointer-events-none">₱</span>
        <input
            type="number"
            min="0"
            step="0.01"
            placeholder={placeholder}
            value={value === null || value === undefined ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-5 pr-2 py-1.5 text-right text-sm border border-slate-300 rounded bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-gray-800 font-medium transition-colors"
        />
    </div>
);

// --- Constants & Defaults ---
const rebarDiameters = ["10mm", "12mm", "16mm", "20mm"];
const commonLengths = [6.0, 7.5, 9.0, 10.5, 12.0];
const rebarOptions = rebarDiameters.flatMap(size =>
    commonLengths.map(length => `${size} x ${length.toFixed(1)}m`)
);

const DECKING_OPTIONS = [
    { id: 'none', label: 'Conventional Formwork' },
    { id: 'deck_08', label: 'Steel Deck 0.80mm', width_eff: 0.9, priceKey: 'deck_08' },
    { id: 'deck_10', label: 'Steel Deck 1.00mm', width_eff: 0.9, priceKey: 'deck_10' },
    { id: 'deck_12', label: 'Steel Deck 1.20mm', width_eff: 0.9, priceKey: 'deck_12' },
];

const FORMWORK_OPTIONS = [
    { id: 'phenolic_1_2', label: '1/2" Phenolic Board', priceKey: 'phenolic_1_2' },
    { id: 'phenolic_3_4', label: '3/4" Phenolic Board', priceKey: 'phenolic_3_4' },
    { id: 'plywood_1_2', label: '1/2" Marine Plywood', priceKey: 'plywood_1_2' },
];

const DEFAULT_PRICES = {
    cement: 245,
    sand: 1300,
    gravel: 1100,
    rebar10mm: 185,
    rebar12mm: 245,
    rebar16mm: 460,
    rebar20mm: 750,
    tieWire: 85,
    phenolic_1_2: 1400,
    phenolic_3_4: 1800,
    plywood_1_2: 950,
    cocoLumber: 45,
    deck_08: 450,
    deck_10: 550,
    deck_12: 650,
};

const extractLength = (spec) => parseFloat(spec.split(' x ')[1].replace('m', ''));
const extractDiameterMeters = (spec) => parseFloat(spec.split('mm')[0]) / 1000;

const getInitialSlab = () => ({
    id: crypto.randomUUID(),
    quantity: 1,
    length: "",
    width: "",
    thickness: "0.125",
    mainBarSpec: "12mm x 9.0m", // For Two-Way or Short Span (One-Way)
    mainSpacing: 0.15,
    tempBarSpec: "10mm x 6.0m", // For Long Span (One-Way Only)
    tempSpacing: 0.20,
    deckingType: 'none', // 'none' = conventional, or ID
    formworkType: 'phenolic_1_2', // Used if deckingType is 'none'
});

// --- Calculation Logic ---

const getSlabType = (L, W) => {
    if (!L || !W || L === 0 || W === 0) return "Unknown";
    const long = Math.max(L, W);
    const short = Math.min(L, W);
    const ratio = long / short;
    return ratio >= 2.0 ? "One-Way" : "Two-Way";
};

const processRebarRun = (requiredLength, spec, qty, rebarStock) => {
    if (requiredLength <= 0 || qty <= 0) return;

    if (!rebarStock.has(spec)) {
        rebarStock.set(spec, { purchased: 0, offcuts: [] });
    }
    const stock = rebarStock.get(spec);
    const barLength = extractLength(spec);
    const diameter = extractDiameterMeters(spec);
    const spliceLength = 40 * diameter;
    const MIN_OFFCUT = 0.1;

    for (let i = 0; i < qty; i++) {
        let currentNeeded = requiredLength + (2 * 12 * diameter); // Hook allowance approx 12db per end if needed, simplifying to 0 for slab straight bars usually, but let's add minimal cover adjustment. Actually standard cuts usually dont have hooks in middle.
        // Actually, just pure length for simplicity as per previous calculators.
        currentNeeded = requiredLength;

        // Optimization: Try offcuts first
        let bestOffcutIdx = -1;
        let minWaste = Infinity;
        stock.offcuts.forEach((off, idx) => {
            if (off >= currentNeeded && (off - currentNeeded) < minWaste) {
                minWaste = off - currentNeeded;
                bestOffcutIdx = idx;
            }
        });

        if (bestOffcutIdx !== -1) {
            const waste = stock.offcuts[bestOffcutIdx] - currentNeeded;
            stock.offcuts.splice(bestOffcutIdx, 1);
            if (waste > MIN_OFFCUT) stock.offcuts.push(waste);
        } else {
            // Need new bars
            if (currentNeeded <= barLength) {
                stock.purchased += 1;
                const waste = barLength - currentNeeded;
                if (waste > MIN_OFFCUT) stock.offcuts.push(waste);
            } else {
                // Long run with splices
                const effectiveLength = barLength - spliceLength;
                const extraPieces = Math.ceil((currentNeeded - barLength) / effectiveLength);
                const totalPieces = 1 + extraPieces;
                stock.purchased += totalPieces;
                const totalReqWithSplices = currentNeeded + (extraPieces * spliceLength);
                const totalSupplied = totalPieces * barLength;
                const waste = totalSupplied - totalReqWithSplices;
                if (waste > MIN_OFFCUT) stock.offcuts.push(waste);
            }
        }
    }
};

export default function SuspendedSlab() {
    const [slabs, setSlabs] = useState([getInitialSlab()]);
    const [prices, setPrices] = useState(DEFAULT_PRICES);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSlabChange = (id, field, value) => {
        setSlabs(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
        setResult(null);
        setError(null);
    };

    const handleAddSlab = () => setSlabs(prev => [...prev, getInitialSlab()]);
    const handleRemoveSlab = (id) => {
        if (slabs.length > 1) setSlabs(prev => prev.filter(s => s.id !== id));
        else setSlabs([getInitialSlab()]);
        setResult(null);
    };

    const calculate = () => {
        let totalConcreteVol = 0;
        let totalTiePoints = 0;
        const rebarStock = new Map();
        const materialCounts = {}; // Generic counter for variable price keys

        const addToMat = (key, qty, unit, name, price) => {
            if (!materialCounts[key]) materialCounts[key] = { qty: 0, unit, name, price, priceKey: key };
            materialCounts[key].qty += qty;
        };

        const invalid = slabs.some(s => !s.length || !s.width || !s.thickness);
        if (invalid) {
            setError("Please fill in Length, Width, and Thickness for all rows.");
            return;
        }

        slabs.forEach(s => {
            const Q = parseFloat(s.quantity) || 0;
            const L = parseFloat(s.length) || 0;
            const W = parseFloat(s.width) || 0;
            const T = parseFloat(s.thickness) || 0;

            const type = getSlabType(L, W);
            const longSpan = Math.max(L, W);
            const shortSpan = Math.min(L, W);

            // 1. Concrete Volume
            const vol = L * W * T * Q;
            totalConcreteVol += vol;

            // 2. Decking / Formwork
            if (s.deckingType !== 'none') {
                const deckOpt = DECKING_OPTIONS.find(d => d.id === s.deckingType);
                if (deckOpt) {
                    const area = L * W * Q;
                    // Usually sold per linear meter, width is fixed (e.g. 0.9m)
                    // Pieces needed across width? No usually calc Length total.
                    // Let's assume covering the Area.
                    const effWidth = deckOpt.width_eff || 0.9;
                    const linearMeters = (area / effWidth);
                    addToMat(deckOpt.priceKey, linearMeters, "ln.m", `Steel Deck (${deckOpt.label})`, prices[deckOpt.priceKey]);
                }
            } else {
                // Conventional
                const formOpt = FORMWORK_OPTIONS.find(f => f.id === s.formworkType) || FORMWORK_OPTIONS[0];
                const areaSoffit = L * W * Q;
                const areaSides = 2 * (L + W) * T * Q; // Perimeter sides
                const totalFormArea = areaSoffit + areaSides;
                const sheetArea = 2.88; // 4x8 ft approx 2.97 sqm, standard 1.22x2.44 = 2.97
                const sheets = totalFormArea / 2.9768;
                addToMat(formOpt.priceKey, sheets, "sheets", formOpt.label, prices[formOpt.priceKey]);

                // Lumber
                const bfPerSqm = 7; // Estimate for scaffolding/bracing
                const totalBF = totalFormArea * bfPerSqm;
                addToMat('cocoLumber', totalBF, "BF", "Coco Lumber (Scaffolding)", prices.cocoLumber);
            }

            // 3. Rebar
            const mainSpacing = parseFloat(s.mainSpacing) || 0.15;
            const tempSpacing = parseFloat(s.tempSpacing) || 0.20;

            if (type === "Two-Way") {
                // Main bars in BOTH directions
                const numBarsShort = Math.ceil(longSpan / mainSpacing) + 1; // Bars running along Short span? No, bars along short span cover the Long distance? 
                // Wait: Bars PARALLEL to Short Span have Length = Short Span. They are distributed along Long Span.
                // Two way: Bars in both directions are structural. usually same spacing or close. We use 'main' for both for simplicity or UI implies it.
                // Let's use Main Spec for both directions as user prompt for Two-Way usually implies uniform grid or major structural. 
                // If they want diff, they can use One-Way logic or we'd need more inputs. For simple estimator:
                // Use Main Spec for Short Span direction (Main Structural) and Long Span direction.

                // Bars running parallel to L (Length = L)
                const numBarsParaL = Math.ceil(W / mainSpacing) + 1;
                processRebarRun(L, s.mainBarSpec, numBarsParaL * Q, rebarStock);

                // Bars running parallel to W (Length = W)
                const numBarsParaW = Math.ceil(L / mainSpacing) + 1;
                processRebarRun(W, s.mainBarSpec, numBarsParaW * Q, rebarStock);

                totalTiePoints += (numBarsParaL * numBarsParaW * Q);

            } else {
                // One-Way
                // Main Reinforcement is parallel to Short Span (Length = Short).
                // Temperature is parallel to Long Span (Length = Long).

                // 1. Main Bars (Length = Short Span)
                // Distributed along Long Span
                const numMain = Math.ceil(longSpan / mainSpacing) + 1;
                processRebarRun(shortSpan, s.mainBarSpec, numMain * Q, rebarStock);

                // 2. Temp Bars (Length = Long Span)
                // Distributed along Short Span
                const numTemp = Math.ceil(shortSpan / tempSpacing) + 1;
                processRebarRun(longSpan, s.tempBarSpec, numTemp * Q, rebarStock);

                totalTiePoints += (numMain * numTemp * Q);
            }
        });

        // Final Totals
        const waste = 1.05;
        const dryVol = totalConcreteVol * 1.54;
        const cementBags = Math.ceil((dryVol * (1 / 7)) / 0.035 * waste);
        const sandCuM = (dryVol * (2 / 7) * waste).toFixed(2);
        const gravelCuM = (dryVol * (4 / 7) * waste).toFixed(2);

        const items = [
            { name: "Portland Cement (40kg)", qty: cementBags, unit: "bags", price: prices.cement, priceKey: "cement" },
            { name: "Wash Sand", qty: sandCuM, unit: "cu.m", price: prices.sand, priceKey: "sand" },
            { name: "Crushed Gravel (3/4)", qty: gravelCuM, unit: "cu.m", price: prices.gravel, priceKey: "gravel" },
        ];

        // Add calculated materials (Deck, Form, Lumber)
        Object.values(materialCounts).forEach(m => {
            items.push({
                name: m.name,
                qty: Math.ceil(m.qty * waste), // Apply waste to all
                unit: m.unit,
                price: m.price,
                priceKey: m.priceKey
            });
        });

        // Add Rebar
        rebarStock.forEach((val, spec) => {
            const size = spec.split('mm')[0];
            const pKey = `rebar${size}mm`;
            items.push({
                name: `Corrugated Rebar (${spec})`,
                qty: val.purchased,
                unit: "pcs",
                price: prices[pKey] || 0,
                priceKey: pKey
            });
        });

        const tieWireKg = Math.ceil((totalTiePoints * 0.3 * (50 / 600)) * waste);
        items.push({ name: "G.I. Tie Wire (#16)", qty: tieWireKg, unit: "kg", price: prices.tieWire, priceKey: "tieWire" });

        const itemsWithTotal = items.map(it => ({ ...it, total: it.qty * it.price }));
        const grandTotal = itemsWithTotal.reduce((acc, it) => acc + it.total, 0);

        setResult({
            volume: totalConcreteVol.toFixed(2),
            items: itemsWithTotal,
            total: grandTotal
        });
    };

    return (
        <div className="space-y-6">
            <Card className="border-t-4 border-t-indigo-600 shadow-md">
                <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-indigo-900 flex items-center gap-2">
                        <SquareStack size={18} /> Suspended Slab Configuration
                    </h2>
                    <button
                        onClick={handleAddSlab}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 transition-colors active:scale-95 shadow-sm"
                    >
                        <PlusCircle size={14} /> Add Slab Row
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[1200px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 font-bold">
                            <tr>
                                <th className="px-2 py-2 border border-slate-300 text-center w-[40px]" rowSpan="2">#</th>
                                <th className="px-2 py-2 border border-slate-300 text-center w-[50px]" rowSpan="2">Qty</th>
                                <th className="px-2 py-2 border border-slate-300 text-center w-[90px]" rowSpan="2">Type</th>
                                <th className="px-2 py-2 border border-slate-300 text-center bg-indigo-50 text-indigo-900" colSpan="3">Dimensions (m)</th>
                                <th className="px-2 py-2 border border-slate-300 text-center bg-blue-50 text-blue-900" colSpan="2">Main Rebar</th>
                                <th className="px-2 py-2 border border-slate-300 text-center bg-sky-50 text-sky-900" colSpan="2">Temp Rebar</th>
                                <th className="px-2 py-2 border border-slate-300 text-center w-[180px]" rowSpan="2">Formwork / Decking</th>
                                <th className="px-2 py-2 border border-slate-300 text-center w-[40px]" rowSpan="2"></th>
                            </tr>
                            <tr>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-indigo-50/50 w-[70px]">L</th>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-indigo-50/50 w-[70px]">W</th>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-indigo-50/50 w-[70px]">Thk</th>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-blue-50/50 w-[110px]">Size</th>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-blue-50/50 w-[60px]">Spc</th>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-sky-50/50 w-[110px]">Size</th>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-sky-50/50 w-[60px]">Spc</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slabs.map((s, idx) => {
                                const type = getSlabType(parseFloat(s.length), parseFloat(s.width));
                                const isTwoWay = type === "Two-Way";
                                return (
                                    <tr key={s.id} className="bg-white hover:bg-slate-50 transition-colors">
                                        <td className="p-2 border border-slate-300 text-center text-[10px] text-gray-400 font-black">{idx + 1}</td>
                                        <td className="p-2 border border-slate-300"><TableNumberInput value={s.quantity} onChange={(v) => handleSlabChange(s.id, 'quantity', v)} /></td>
                                        <td className="p-2 border border-slate-300 align-middle">
                                            <div className={`text-[9px] font-black uppercase text-center px-2 py-1 rounded-full whitespace-nowrap ${isTwoWay ? 'text-purple-700 bg-purple-100 border border-purple-200' : 'text-orange-700 bg-orange-100 border border-orange-200'}`}>
                                                {type}
                                            </div>
                                        </td>
                                        <td className="p-2 border border-slate-300"><TableNumberInput value={s.length} onChange={(v) => handleSlabChange(s.id, 'length', v)} placeholder="L" /></td>
                                        <td className="p-2 border border-slate-300"><TableNumberInput value={s.width} onChange={(v) => handleSlabChange(s.id, 'width', v)} placeholder="W" /></td>
                                        <td className="p-2 border border-slate-300"><TableNumberInput value={s.thickness} onChange={(v) => handleSlabChange(s.id, 'thickness', v)} placeholder="0.12" /></td>

                                        {/* Main Rebar */}
                                        <td className="p-2 border border-slate-300 bg-blue-50/20">
                                            <select value={s.mainBarSpec} onChange={(e) => handleSlabChange(s.id, 'mainBarSpec', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-[10px] font-bold">
                                                {rebarOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2 border border-slate-300 bg-blue-50/20"><TableNumberInput value={s.mainSpacing} onChange={(v) => handleSlabChange(s.id, 'mainSpacing', v)} /></td>

                                        {/* Temp Rebar (Disabled if Two-Way) */}
                                        <td className="p-2 border border-slate-300 bg-sky-50/20">
                                            <select
                                                value={s.tempBarSpec}
                                                onChange={(e) => handleSlabChange(s.id, 'tempBarSpec', e.target.value)}
                                                disabled={isTwoWay}
                                                className={`w-full p-1 border border-slate-300 rounded text-[10px] font-bold ${isTwoWay ? 'opacity-30 cursor-not-allowed bg-slate-100' : ''}`}
                                            >
                                                {rebarOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2 border border-slate-300 bg-sky-50/20">
                                            <TableNumberInput
                                                value={s.tempSpacing}
                                                onChange={(v) => handleSlabChange(s.id, 'tempSpacing', v)}
                                                className={isTwoWay ? 'opacity-30 cursor-not-allowed bg-slate-100' : ''}
                                            // disabled={isTwoWay} // Actually users might want to preserve value, just visual disable
                                            />
                                            {isTwoWay && <div className="text-[9px] text-center text-gray-400 mt-1 leading-none">(N/A for 2-Way)</div>}
                                        </td>

                                        {/* Decking / Formwork */}
                                        <td className="p-2 border border-slate-300">
                                            <div className="flex flex-col gap-2">
                                                <select value={s.deckingType} onChange={(e) => handleSlabChange(s.id, 'deckingType', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-[10px] font-bold text-indigo-800">
                                                    {DECKING_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                                </select>
                                                {s.deckingType === 'none' && (
                                                    <select value={s.formworkType} onChange={(e) => handleSlabChange(s.id, 'formworkType', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-[10px] font-medium text-slate-600">
                                                        {FORMWORK_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                                    </select>
                                                )}
                                            </div>
                                        </td>

                                        <td className="p-2 border border-slate-300 text-center">
                                            <button onClick={() => handleRemoveSlab(s.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold text-center border-t border-red-100 flex items-center justify-center gap-2"><AlertCircle size={14} />{error}</div>}

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button onClick={calculate} className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                        <Calculator size={18} /> Run Calculation
                    </button>
                </div>
            </Card>

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-l-4 border-l-emerald-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-black text-2xl text-slate-800 tracking-tight flex items-center gap-2">Estimation Summary</h3>
                                <div className="flex gap-4 mt-2">
                                    <div className="bg-indigo-50 px-3 py-1 rounded text-xs font-bold text-indigo-700 border border-indigo-100 flex items-center gap-1.5">
                                        <Box size={12} /> Concrete: {result.volume} m³
                                    </div>
                                </div>
                            </div>
                            <div className="text-right bg-emerald-50 px-6 py-4 rounded-2xl border border-emerald-100">
                                <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest mb-1">Total Estimated Cost</p>
                                <p className="font-black text-4xl text-emerald-700 tracking-tighter">₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mb-4">
                            <button onClick={() => copyToClipboard(result.items)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50"><ClipboardCopy size={14} /> Copy</button>
                            <button onClick={() => downloadCSV(result.items, 'suspended_slab.csv')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50"><Download size={14} /> CSV</button>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-black">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Material Item</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[150px]">Unit Price</th>
                                        <th className="px-4 py-3 text-right bg-slate-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-bold text-slate-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right font-black text-slate-900">{item.qty.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black text-slate-500 uppercase">{item.unit}</span></td>
                                            <td className="px-4 py-1.5">
                                                <TablePriceInput
                                                    value={prices[item.priceKey] || item.price}
                                                    onChange={(v) => {
                                                        setPrices(p => ({ ...p, [item.priceKey]: parseFloat(v) || 0 }));
                                                    }}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-slate-900 bg-slate-50/30">₱{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex items-start gap-2 text-[10px] text-slate-400 italic">
                            <Info size={12} className="mt-0.5" />
                            <p>Note: Calculations include a 5% waste factor. One-Way vs Two-Way logic is applied automatically based on dimension ratio (≥2.0 is One-Way). Two-Way slabs use Main Bar spacing in both directions.</p>
                        </div>
                    </div>
                </Card>
            )}

            {!result && (
                <div className="border-2 border-dashed border-indigo-200 rounded-3xl p-20 flex flex-col items-center justify-center text-indigo-300 bg-indigo-50/30">
                    <div className="bg-white p-6 rounded-3xl shadow-md mb-6"><SquareStack size={48} className="text-indigo-500" /></div>
                    <p className="font-black text-xl text-indigo-700 tracking-tight">Suspended Slab Calculator</p>
                    <p className="max-w-xs text-center text-sm font-medium mt-2 leading-relaxed text-indigo-400">
                        Smart calculator with <span className="text-purple-600 font-bold bg-purple-100 px-1 rounded">Two-Way</span> and <span className="text-orange-600 font-bold bg-orange-100 px-1 rounded">One-Way</span> detection. Supports Steel Deck and Phenolic Board configurations.
                    </p>
                </div>
            )}
        </div>
    );
}
