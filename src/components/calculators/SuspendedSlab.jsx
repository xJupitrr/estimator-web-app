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

const TablePriceInput = ({ value, onChange }) => (
    <div className="flex items-center justify-end">
        <div className="bg-gray-100/50 px-2 py-1.5 text-gray-600 text-sm font-bold flex items-center border border-gray-300 rounded-l-lg border-r-0 h-full">
            ₱
        </div>
        <input
            type="number"
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 pl-2 pr-2 py-1.5 text-right text-sm border border-gray-300 rounded-r-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-gray-800 font-medium transition-colors border-l-0"
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

const SUPPORT_TYPES = [
    { id: 'coco_lumber', label: 'Coco Lumber Frame' },
    { id: 'gi_pipe', label: 'H-Frame Scaffolding' },
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
    h_frame: 1200,
    cross_brace: 450,
    u_head: 350,
    gi_pipe_1_1_2: 850,
    shackle: 65,
};

const extractLength = (spec) => parseFloat(spec.split(' x ')[1].replace('m', ''));
const extractDiameterMeters = (spec) => parseFloat(spec.split('mm')[0]) / 1000;

// NEW: Constants for precise crank calculation
const CONCRETE_COVER = 0.02; // 20mm
const CRANK_FACTOR = 0.42;   // Extra length for 45 deg bend (assuming 2 bends per crank)
const HOOK_MULTIPLIER = 12;  // 12db hook allowance

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
    floorHeight: "3.0",
    supportType: 'coco_lumber',
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

import useLocalStorage from '../../hooks/useLocalStorage';

export default function SuspendedSlab() {
    const [slabs, setSlabs] = useLocalStorage('suspended_slab_rows', [getInitialSlab()]);
    const [prices, setPrices] = useLocalStorage('suspended_slab_prices', DEFAULT_PRICES);
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

            }



            // Lumber & Scaffolding Calculation
            const floorH = parseFloat(s.floorHeight) || 3.0;

            if (s.supportType === 'gi_pipe') {
                // GI Pipe H-Frame Scaffolding (Independent Towers Estimation)
                // Frame Size avg: 1.2m wide x 1.7m high
                // Grid: 1.2m x 1.2m
                const towersX = Math.ceil(L / 1.2);
                const towersY = Math.ceil(W / 1.2);
                const numTowers = towersX * towersY * Q;
                const layers = Math.ceil(floorH / 1.7);

                // Per Tower: 2 Frames, 2 Cross Braces (pairs) -> 4 pcs, 4 U-Heads (Top), 4 Base Jacks (Bottom - Optional/Same Price as U-Head usually)
                // Let's assume standard set: 2 Frames + 2 Braces (pair) per layer
                // U-Heads on top layer only.
                // Joint Pins between layers. (Ignore for now, cheap)

                const totalFrames = numTowers * 2 * layers; // 2 frames per tower per layer
                const totalBraces = numTowers * 4 * layers; // 2 pairs (4 pcs) per tower per layer (conservative)
                const totalUHeads = numTowers * 4; // 4 legs per tower

                // Horizontal Bracing (GI Pipes) - Every 3m height or top/bottom?
                // Let's assume 1 layer of pipe bracing for stability per grid line
                const bracingLen = (towersX * 1.2 * (towersY + 1)) + (towersY * 1.2 * (towersX + 1)); // Grid lines
                const totalPipeBracing = bracingLen * Q;
                const pipes = Math.ceil(totalPipeBracing / 6.0); // 6m pipes
                const clamps = pipes * 2; // Approx 2 clamps per pipe connection

                addToMat('h_frame', totalFrames, "pcs", "H-Frame (1.7m x 1.2m)", prices.h_frame);
                addToMat('cross_brace', totalBraces, "pcs", "Cross Brace", prices.cross_brace);
                addToMat('u_head', totalUHeads, "pcs", "U-Head Jack", prices.u_head);
                addToMat('gi_pipe_1_1_2', pipes, "pcs", "G.I. Pipe 1.5\" x 6m (Horizontal Ties)", prices.gi_pipe_1_1_2);
                addToMat('shackle', clamps, "pcs", "Swivel Clamp / Shackle", prices.shackle);

            } else {
                // Default: Coco Lumber Shoring
                // 1. Vertical Posts (2"x3" used as 2x2 functionally or 2x3 structural)
                // Grid Spacing: 0.60m x 0.60m for safe load bearing of wet concrete
                const postsX = Math.ceil(L / 0.60) + 1;
                const postsY = Math.ceil(W / 0.60) + 1;
                const numPosts = postsX * postsY * Q;
                // Floor Height in feet for BF calc
                const floorH_ft = floorH * 3.28084;
                const totalBF_Posts = numPosts * ((2 * 3 * floorH_ft) / 12);

                // 2. Horizontal Stringers (Primary Supports) - 2"x3"
                // Spacing: Approx 1.2m
                const numStringers = Math.ceil(W / 1.2) + 1;
                const lenStringers_ft = (L * 3.28084);
                const totalBF_Stringers = (numStringers * Q) * ((2 * 3 * lenStringers_ft) / 12);

                // 3. Horizontal Joists (Secondary Supports) - 2"x2"
                // Spacing: 0.40m center-to-center (Typical for Plywood, maybe wider for Deck but safe estimate)
                const numJoists = Math.ceil(L / 0.40) + 1;
                const lenJoists_ft = (W * 3.28084);
                const totalBF_Joists = (numJoists * Q) * ((2 * 2 * lenJoists_ft) / 12);

                // 4. Bracing (Diagonal & Horizontal ties) - 2"x2"
                // Factor: 30% of Vertical Posts volume
                const totalBF_Bracing = totalBF_Posts * 0.30;

                const totalBF = totalBF_Posts + totalBF_Stringers + totalBF_Joists + totalBF_Bracing;

                addToMat('cocoLumber', totalBF, "BF", "Coco Lumber (Posts, Stringers, Joists)", prices.cocoLumber);
            }

            // 3. Rebar
            const mainSpacing = parseFloat(s.mainSpacing) || 0.15;
            const tempSpacing = parseFloat(s.tempSpacing) || 0.20;

            // Prepare Crank Variables
            const mainBarDia = extractDiameterMeters(s.mainBarSpec);
            const tempBarDia = extractDiameterMeters(s.tempBarSpec);
            const effectiveDepth = T - (2 * CONCRETE_COVER);

            // Formula: L + (2 * 0.42 * d) + (2 * 12db Hooks)
            const crankAddOn = effectiveDepth > 0
                ? (2 * CRANK_FACTOR * effectiveDepth) + (2 * HOOK_MULTIPLIER * mainBarDia)
                : 0;

            // Hook Allowances (Ends only)
            const mainHookAllowance = 2 * HOOK_MULTIPLIER * mainBarDia;
            const tempHookAllowance = 2 * HOOK_MULTIPLIER * tempBarDia;

            if (type === "Two-Way") {
                // Two-Way: Main bars in BOTH directions
                // User Requirement: "Main bar... specification of 2 layers... Top rebar crank length... Bottom rebar straight"

                // 1. Direction A (Parallel to Length L, distributed along W)
                const numBarsParaL = Math.ceil(W / mainSpacing) + 1;

                // Bottom Layer (Straight + Hooks): Length = L + Hooks
                processRebarRun(L + mainHookAllowance, s.mainBarSpec, numBarsParaL * Q, rebarStock);

                // Top Layer (Cranked): Length = L + CrankAddOn
                processRebarRun(L + crankAddOn, s.mainBarSpec, numBarsParaL * Q, rebarStock);

                // 2. Direction B (Parallel to Width W, distributed along L)
                const numBarsParaW = Math.ceil(L / mainSpacing) + 1;

                // Bottom Layer (Straight + Hooks): Length = W + Hooks
                processRebarRun(W + mainHookAllowance, s.mainBarSpec, numBarsParaW * Q, rebarStock);

                // Top Layer (Cranked + Hooks): Length = W + CrankAddOn
                processRebarRun(W + crankAddOn, s.mainBarSpec, numBarsParaW * Q, rebarStock);

                // Tie Points: (Bottom Grid) + (Top Grid)
                // Bottom Grid Intersections = numBarsParaL * numBarsParaW
                // Top Grid Intersections = numBarsParaL * numBarsParaW
                totalTiePoints += (2 * numBarsParaL * numBarsParaW * Q);

            } else {
                // One-Way
                // Main Reinforcement is parallel to Short Span
                // Temp Reinforcement is parallel to Long Span

                // 1. Main Bars (Length = Short Span)
                // Distributed along Long Span
                const numMain = Math.ceil(longSpan / mainSpacing) + 1;

                // Bottom Layer (Straight + Hooks): Length = Short Span + Hooks
                processRebarRun(shortSpan + mainHookAllowance, s.mainBarSpec, numMain * Q, rebarStock);

                // Top Layer (Cranked + Hooks): Length = Short Span + CrankAddOn
                processRebarRun(shortSpan + crankAddOn, s.mainBarSpec, numMain * Q, rebarStock);

                // 2. Temp Bars (Length = Long Span)
                // Distributed along Short Span
                const numTemp = Math.ceil(shortSpan / tempSpacing) + 1;
                // Add Hooks to Temp Bars
                processRebarRun(longSpan + tempHookAllowance, s.tempBarSpec, numTemp * Q, rebarStock);

                // Tie Points
                // Bottom Layer Intersections: Bottom Main * Temp
                // Top Layer Intersections: Top Main * Temp (Assuming Temp bars serve both or similar count)
                totalTiePoints += (2 * numMain * numTemp * Q);
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
            <Card className="border-t-4 border-t-blue-500 shadow-md">
                <div className="p-4 bg-blue-50 border-b border-blue-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-blue-900 flex items-center gap-2">
                        <SquareStack size={18} /> Suspended Slab Configuration
                    </h2>
                    <button
                        onClick={handleAddSlab}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 transition-colors active:scale-95 shadow-sm"
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
                                <th className="px-2 py-2 border border-slate-300 text-center bg-blue-50 text-blue-900" colSpan="3">Dimensions (m)</th>
                                <th className="px-2 py-2 border border-slate-300 text-center bg-slate-100 text-slate-700" colSpan="2">Main Rebar</th>
                                <th className="px-2 py-2 border border-slate-300 text-center bg-slate-50 text-slate-600" colSpan="2">Temperature Rebar</th>
                                <th className="px-2 py-2 border border-slate-300 text-center w-[180px]" rowSpan="2">Formwork / Decking</th>
                                <th className="px-2 py-2 border border-slate-300 text-center w-[120px]" rowSpan="2">Scaffolding</th>
                                <th className="px-2 py-2 border border-slate-300 text-center w-[40px]" rowSpan="2"></th>
                            </tr>
                            <tr>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-blue-50/50 w-[70px]">L</th>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-blue-50/50 w-[70px]">W</th>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-blue-50/50 w-[70px]">Thk</th>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-slate-100/50 w-[110px]">Size</th>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-slate-100/50 w-[60px]">Spacing</th>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-slate-50/50 w-[110px]">Size</th>
                                <th className="px-2 py-1 border border-slate-300 text-center bg-slate-50/50 w-[60px]">Spacing</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slabs.map((s, idx) => {
                                const type = getSlabType(parseFloat(s.length), parseFloat(s.width));
                                const isTwoWay = type === "Two-Way";
                                return (
                                    <tr key={s.id} className="bg-white hover:bg-slate-50 transition-colors">
                                        <td className="p-2 border border-slate-300 text-center text-xs text-gray-400 font-black">{idx + 1}</td>
                                        <td className="p-2 border border-slate-300"><TableNumberInput value={s.quantity} onChange={(v) => handleSlabChange(s.id, 'quantity', v)} /></td>
                                        <td className="p-2 border border-slate-300 align-middle">
                                            <div className={`text-[10px] font-black uppercase text-center px-2 py-1 rounded-full whitespace-nowrap ${isTwoWay ? 'text-purple-700 bg-purple-100 border border-purple-200' : 'text-orange-700 bg-orange-100 border border-orange-200'}`}>
                                                {type}
                                            </div>
                                        </td>
                                        <td className="p-2 border border-slate-300"><TableNumberInput value={s.length} onChange={(v) => handleSlabChange(s.id, 'length', v)} placeholder="L" /></td>
                                        <td className="p-2 border border-slate-300"><TableNumberInput value={s.width} onChange={(v) => handleSlabChange(s.id, 'width', v)} placeholder="W" /></td>
                                        <td className="p-2 border border-slate-300"><TableNumberInput value={s.thickness} onChange={(v) => handleSlabChange(s.id, 'thickness', v)} placeholder="0.12" /></td>

                                        {/* Main Rebar */}
                                        <td className="p-2 border border-slate-300 bg-blue-50/20">
                                            <select value={s.mainBarSpec} onChange={(e) => handleSlabChange(s.id, 'mainBarSpec', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-sm font-bold">
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
                                                className={`w-full p-1 border border-slate-300 rounded text-sm font-bold ${isTwoWay ? 'opacity-30 cursor-not-allowed bg-slate-100' : ''}`}
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
                                                <select value={s.deckingType} onChange={(e) => handleSlabChange(s.id, 'deckingType', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-sm font-bold text-blue-800">
                                                    {DECKING_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                                </select>
                                                {s.deckingType === 'none' && (
                                                    <select value={s.formworkType} onChange={(e) => handleSlabChange(s.id, 'formworkType', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-sm font-medium text-slate-600">
                                                        {FORMWORK_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                                    </select>
                                                )}
                                            </div>
                                        </td>

                                        {/* Scaffolding */}
                                        <td className="p-2 border border-slate-300 bg-orange-50/20">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-bold text-slate-400">H:</span>
                                                    <TableNumberInput value={s.floorHeight} onChange={(v) => handleSlabChange(s.id, 'floorHeight', v)} placeholder="3.0" />
                                                </div>
                                                <select value={s.supportType} onChange={(e) => handleSlabChange(s.id, 'supportType', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-sm font-medium text-slate-600">
                                                    {SUPPORT_TYPES.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                                </select>
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
                    <button onClick={calculate} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                        <Calculator size={18} /> Calculate
                    </button>
                </div>
            </Card>

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-blue-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                    Estimation Result
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Total Concrete Volume: <strong className="text-gray-700">{result.volume} m³</strong>
                                </p>
                                <p className="text-xs text-gray-400 mt-1 italic">
                                    Based on <strong className="text-gray-600">{slabs.length}</strong> slab configurations.
                                </p>
                            </div>
                            <div className="text-left md:text-right bg-blue-50 px-5 py-3 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                <p className="font-bold text-4xl text-blue-700 tracking-tight">
                                    ₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mb-4">
                            <button
                                onClick={() => copyToClipboard(result.items)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                                title="Copy table to clipboard"
                            >
                                <ClipboardCopy size={14} /> Copy
                            </button>
                            <button
                                onClick={() => downloadCSV(result.items, 'suspended_slab.csv')}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                                title="Download as CSV"
                            >
                                <Download size={14} /> CSV
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200 border-slate-200">
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
                                            <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">{item.qty.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <TablePriceInput
                                                    value={prices[item.priceKey] || item.price}
                                                    onChange={(v) => {
                                                        setPrices(p => ({ ...p, [item.priceKey]: parseFloat(v) || 0 }));
                                                    }}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 bg-gray-50/50">₱{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex items-start gap-2 text-[10px] text-slate-400 italic">
                            <Info size={12} className="mt-0.5" />
                            <p>Note: Calculations include a 5% waste factor. One-Way vs Two-Way logic is applied automatically (Ratio &ge; 2.0 is One-Way). <strong>All bars (Main Top/Bottom, Temp) include 12db Hook Allowances.</strong></p>
                        </div>
                    </div>
                </Card>
            )}

            {!result && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Calculator size={32} className="text-blue-500" />
                    </div>
                    <p className="font-medium text-center max-w-md">
                        Enter your slab dimensions above, then click <span className="font-bold text-blue-600">'Calculate'</span> to generate the material list.
                    </p>
                </div>
            )}
        </div>
    );
}
