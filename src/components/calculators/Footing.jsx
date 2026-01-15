import React, { useState, useEffect } from 'react';
import { Columns, Info, Settings, Calculator, PlusCircle, Trash2, AlertCircle } from 'lucide-react';

// --- Components ---

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

// Helper component for currency inputs (Used in table now)
const TablePriceInput = ({ value, onChange }) => (
    // FIX: Implementing the segmented input group look from the reference image.
    <div className="flex items-center justify-end">

        {/* Peso Sign Segment (Left side - has left rounded corner, no right border) */}
        <div className="bg-gray-100/50 px-2 py-1.5 text-gray-600 text-sm font-bold flex items-center border border-gray-300 rounded-l-lg border-r-0 h-full">
            ₱
        </div>

        {/* Input Field Segment (Right side - has right rounded corner, no left border) */}
        <input
            type="number"
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
            // Adjusted width and classes for the segmented style
            className="w-20 pl-2 pr-2 py-1.5 text-right text-sm border border-gray-300 rounded-r-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-gray-800 font-medium transition-colors border-l-0"
        />
    </div>
);

// --- Helper Functions ---

// Common rebar diameters and lengths for structural work (PH standards)
const rebarDiameters = ["10mm", "12mm", "16mm", "20mm", "25mm"];
const commonLengths = [6.0, 7.5, 9.0, 10.5, 12.0];
const rebarOptions = rebarDiameters.flatMap(size =>
    commonLengths.map(length => `${size} x ${length.toFixed(1)}m`)
);

// Function to extract length (number) from a spec string (e.g., "16mm x 6.0m")
const extractBarLength = (spec) => {
    if (!spec) return 6.0;
    try {
        return parseFloat(spec.split(' x ')[1].replace('m', ''));
    } catch (e) {
        return 6.0;
    }
};

// Function to extract diameter (number in meters) from a spec string (e.g., "16mm x 6.0m")
const extractDiameterMeters = (spec) => {
    if (!spec) return 0.016;
    try {
        // Grabs '16' from '16mm' and divides by 1000 to get meters
        const size = parseFloat(spec.split('mm')[0]) / 1000;
        return size;
    } catch (e) {
        return 0.016;
    }
}

// Initial Footing Configuration Template
const getInitialFooting = () => ({
    id: crypto.randomUUID(),
    quantity: 1,
    x_len: "", // Length (X) in meters
    y_len: "", // Width (Y) in meters
    z_depth: "", // Depth (Z) in meters
    rebarSpec: "16mm x 6.0m", // Default
    // Explicit bar counts are used for calculation
    rebar_x_count: "",
    rebar_y_count: "",
});


/**
 * Processes a single continuous rebar run against the current inventory stock,
 * prioritizing the use of suitable offcuts before purchasing new bars (Rebar Inventory Simulation).
 * This function modifies the rebarStock Map in place.
 * @param {number} requiredLength - The length of the single rebar run.
 * @param {string} spec - The rebar specification (e.g., '16mm x 6.0m').
 * @param {Map<string, {purchased: number, offcuts: number[]}>} rebarStock - The global inventory map.
 */
const processSingleRun = (requiredLength, spec, rebarStock) => {
    // Ensure positive length is required
    if (requiredLength <= 0) return;

    // Initialize stock for this spec if it doesn't exist
    if (!rebarStock.has(spec)) {
        rebarStock.set(spec, { purchased: 0, offcuts: [] });
    }
    const stock = rebarStock.get(spec);

    const barLength = extractBarLength(spec);
    const diameter = extractDiameterMeters(spec);
    // Standard lap/splice length is 40 times the bar diameter (40d)
    const spliceLength = 40 * diameter;

    // Minimum waste considered salvageable (5cm)
    const MIN_SALVAGEABLE_WASTE = 0.05;

    // --- Case 1: Long Run (Requires splicing with commercial bars) ---
    if (requiredLength > barLength) {
        // Effective length added by each additional bar after the first one is placed.
        const effectiveLengthPerAdditionalBar = barLength - spliceLength;
        const remainingLength = requiredLength - barLength;

        let totalPieces = 1; // Start with the first full bar

        if (effectiveLengthPerAdditionalBar > 0) {
            // Calculate how many additional bars are needed to cover the remaining length
            const additionalPieces = Math.ceil(remainingLength / effectiveLengthPerAdditionalBar);
            totalPieces = 1 + additionalPieces;
        } else {
            // Handles cases where splice length is very long (shouldn't happen with 40d)
            totalPieces = Math.ceil(requiredLength / barLength);
        }

        // Total required length including all splices
        const numSplices = totalPieces - 1;
        const totalRequiredEffectiveLength = requiredLength + (numSplices * spliceLength);

        // Total length purchased vs required effective length (waste is the difference)
        const totalPurchasedLength = totalPieces * barLength;
        const wasteLength = totalPurchasedLength - totalRequiredEffectiveLength;

        stock.purchased += totalPieces;
        if (wasteLength > MIN_SALVAGEABLE_WASTE) {
            stock.offcuts.push(wasteLength);
        }
    }
    // --- Case 2: Short Run (Offcut Reuse Heuristic) ---
    else {
        let bestFitIndex = -1;
        let smallestWaste = Infinity;
        // Find the smallest offcut that can fully cover the required length
        stock.offcuts.forEach((offcutLength, index) => {
            if (offcutLength >= requiredLength) {
                const waste = offcutLength - requiredLength;
                if (waste < smallestWaste) {
                    smallestWaste = waste;
                    bestFitIndex = index;
                }
            }
        });

        if (bestFitIndex !== -1) {
            // Found a suitable offcut. USE IT and update remainder.
            const originalOffcutLength = stock.offcuts[bestFitIndex];
            stock.offcuts.splice(bestFitIndex, 1);

            const newRemainder = originalOffcutLength - requiredLength;
            if (newRemainder > MIN_SALVAGEABLE_WASTE) { // If remainder is significant, put it back as a new offcut
                stock.offcuts.push(newRemainder);
            }
        } else {
            // No suitable offcut found. PURCHASE NEW BAR.
            stock.purchased += 1;

            const remainder = barLength - requiredLength;
            if (remainder > MIN_SALVAGEABLE_WASTE) {
                stock.offcuts.push(remainder);
            }
        }
    }
}


// --- Main App ---

export default function Footing() {

    // --- Footing Configurations State (Array of footings) ---
    const [footings, setFootings] = useState([getInitialFooting()]);

    // Default prices for structural materials (in PHP)
    const [footingPrices, setFootingPrices] = useState({
        cement: 240, // Price per bag
        sand: 1200, // Price per cubic meter
        gravel: 1000, // Price per cubic meter
        rebar10mm: 160,
        rebar12mm: 180,
        rebar16mm: 300,
        rebar20mm: 450,
        rebar25mm: 750,
        tieWire: 30, // Price per kg
    });

    const [footingResult, setFootingResult] = useState(null);
    const [error, setError] = useState(null);

    // Handler to update a specific footing in the array
    const handleFootingChange = (id, field, value) => {
        setFootings(prevFootings =>
            prevFootings.map(footing => (
                footing.id === id ? { ...footing, [field]: value } : footing
            ))
        );
        setFootingResult(null); // Clear result on structure change
        setError(null);
    };

    // Handler to add a new footing
    const handleAddFooting = () => {
        setFootings(prevFootings => [...prevFootings, getInitialFooting()]);
        setFootingResult(null);
        setError(null);
    };

    // Handler to remove a footing
    const handleRemoveFooting = (id) => {
        if (footings.length > 1) {
            setFootings(prevFootings => prevFootings.filter(footing => footing.id !== id));
            setFootingResult(null);
            setError(null);
        } else {
            // If last footing is removed, reset to a clean default state
            setFootings([getInitialFooting()]);
        }
    };

    // Core Calculation Logic
    const calculateFootings = () => {

        // --- Aggregated Variables for all footings ---
        let totalVolume = 0;
        let totalTiePoints = 0;

        // Map for Rebar Inventory Simulation: { spec: { purchased: number, offcuts: number[] } }
        const rebarStock = new Map();

        // Validation Check
        const hasEmptyFields = footings.some(footing =>
            footing.x_len === "" ||
            footing.y_len === "" ||
            footing.z_depth === "" ||
            footing.rebar_x_count === "" ||
            footing.rebar_y_count === ""
        );

        if (hasEmptyFields) {
            setError("Please fill in all required fields (Length, Width, Depth, Rebar Counts) before calculating.");
            setFootingResult(null);
            return;
        }
        setError(null);

        // Iterate over all footings to aggregate materials
        footings.forEach(footing => {
            const x_len = parseFloat(footing.x_len) || 0; // Length (X)
            const y_len = parseFloat(footing.y_len) || 0; // Width (Y)
            const z_depth = parseFloat(footing.z_depth) || 0; // Depth (Z)
            const quantity = parseInt(footing.quantity) || 1;

            const singleFootingVolume = x_len * y_len * z_depth;
            const volume = singleFootingVolume * quantity;

            if (volume <= 0 || quantity <= 0) return; // Skip invalid footings

            totalVolume += volume;

            // --- Rebar Inventory Simulation (Bottom Mesh - single layer, two directions) ---

            const rebarSpec = footing.rebarSpec;
            const concreteCover = 0.075; // 75mm standard cover for earth-contact concrete

            // Get diameter and calculate hook length
            const diameter = extractDiameterMeters(rebarSpec);

            // Standard 90-degree hook length is typically 12db
            const hookLength = 12 * diameter;

            // Use explicit bar counts from user input
            const numXBars = parseInt(footing.rebar_x_count) || 0;
            const numYBars = parseInt(footing.rebar_y_count) || 0;

            // A. X-direction bars (Length X runs, number of runs is numYBars)
            // The bars running along the X-length are repeated numYBars times (if placed along Y-direction)
            // Formula: (Dimension - 2*Cover) + (2 * HookLength for both ends)
            const lengthOfXBar = Math.max(0, x_len - (2 * concreteCover)) + (2 * hookLength);

            for (let q = 0; q < quantity; q++) {
                for (let i = 0; i < numYBars; i++) { // Should be Y count because bars span X length
                    processSingleRun(lengthOfXBar, rebarSpec, rebarStock);
                }
            }

            // B. Y-direction bars (Length Y runs, number of runs is numXBars)
            // The bars running along the Y-length are repeated numXBars times (if placed along X-direction)
            // Formula: (Dimension - 2*Cover) + (2 * HookLength for both ends)
            const lengthOfYBar = Math.max(0, y_len - (2 * concreteCover)) + (2 * hookLength);

            for (let q = 0; q < quantity; q++) {
                for (let i = 0; i < numXBars; i++) { // Should be X count because bars span Y length
                    processSingleRun(lengthOfYBar, rebarSpec, rebarStock);
                }
            }

            // --- Tie Wire Tie Points (Calculated based on intersections) ---
            // Total intersections in this footing
            const currentTiePoints = (numXBars * numYBars) * quantity;
            totalTiePoints += currentTiePoints;
        });

        if (totalVolume <= 0) {
            setFootingResult(null);
            return;
        }

        // --- FINAL AGGREGATE CONCRETE CALCULATIONS (Class A: 1:2:4 Mix Factors) ---

        // Standard factors per cubic meter of concrete (V) for 1:2:4 mix (Philippines Class A)
        const cementFactor = 9.0;  // bags/m3
        const sandFactor = 0.5;    // m3/m3
        const gravelFactor = 1.0;  // m3/m3

        const totalCement = totalVolume * cementFactor;
        const totalSand = totalVolume * sandFactor;
        const totalGravel = totalVolume * gravelFactor;

        const finalCement = Math.ceil(totalCement); // Round up to full bags
        const finalSand = totalSand.toFixed(2);
        const finalGravel = totalGravel.toFixed(2);

        const costCement = finalCement * (parseFloat(footingPrices.cement) || 0);
        const costSand = parseFloat(finalSand) * (parseFloat(footingPrices.sand) || 0);
        const costGravel = parseFloat(finalGravel) * (parseFloat(footingPrices.gravel) || 0);
        const totalConcreteCost = costCement + costSand + costGravel;

        // --- Rebar Cost (from final stock purchase count) ---
        let finalRebarItems = [];
        let totalRebarCost = 0;

        rebarStock.forEach((stock, spec) => {
            const size = spec.split('mm')[0];
            const finalQtyPurchase = stock.purchased;

            // Dynamic price selection based on size 
            const priceKey = `rebar${size}mm`;
            const price = parseFloat(footingPrices[priceKey]) || parseFloat(footingPrices.rebar16mm) || 0;

            const total = finalQtyPurchase * price;
            totalRebarCost += total;

            finalRebarItems.push({
                name: `Corrugated Rebar (${spec})`,
                qty: finalQtyPurchase,
                unit: 'pcs',
                priceKey: priceKey, // Key for dynamic pricing
                price: price,
                total: total,
            });
        });

        // --- Tie Wire Calculation ---
        // Assuming 0.4m of tie wire per intersection is needed (typical for 2-wrap stirrup/tie)
        const TIE_WIRE_PER_INTERSECTION = 0.3; // meters/tie point (slightly conservative)
        // Assuming a standard GI wire roll (#16)
        const TIE_WIRE_ROLL_KG = 35;
        const METERS_PER_KG = 53;

        const totalLMTieWire = totalTiePoints * TIE_WIRE_PER_INTERSECTION;
        const totalKGRequired = totalLMTieWire / METERS_PER_KG;

        const finalKGPurchase = Math.ceil(totalKGRequired);
        const costTieWire = finalKGPurchase * (parseFloat(footingPrices.tieWire) || 0);

        const totalOverallCost = totalConcreteCost + totalRebarCost + costTieWire;

        // --- Final Material List and Order ---

        finalRebarItems.sort((a, b) => a.name.localeCompare(b.name));

        const items = [
            { name: 'Portland Cement (40kg)', qty: finalCement, unit: 'bags', priceKey: 'cement', price: parseFloat(footingPrices.cement) || 0, total: costCement },
            { name: 'Wash Sand (S1)', qty: finalSand, unit: 'cu.m', priceKey: 'sand', price: parseFloat(footingPrices.sand) || 0, total: costSand },
            { name: 'Crushed Gravel (3/4)', qty: finalGravel, unit: 'cu.m', priceKey: 'gravel', price: parseFloat(footingPrices.gravel) || 0, total: costGravel },

            ...finalRebarItems.map(item => ({
                name: item.name,
                qty: item.qty,
                unit: item.unit,
                priceKey: item.priceKey,
                price: item.price,
                total: item.total
            })),

            { name: 'G.I. Tie Wire (#16)', qty: finalKGPurchase, unit: 'kg', priceKey: 'tieWire', price: parseFloat(footingPrices.tieWire) || 0, total: costTieWire },
        ];

        setFootingResult({
            volume: totalVolume.toFixed(2),
            quantity: footings.length,
            items,
            total: totalOverallCost
        });
    };

    // Auto-recalculate when prices change IF results are already being shown
    useEffect(() => {
        if (footingResult) {
            calculateFootings();
        }
    }, [footingPrices]);


    return (
        <div className="space-y-6">

            {/* INPUT CARD */}
            <Card className="border-t-4 border-t-green-500 shadow-md">
                <div className="p-4 bg-green-50 border-b border-green-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-green-900 flex items-center gap-2">
                        <Settings size={18} /> Footing Configuration ({footings.length} Total)
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddFooting}
                            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700 transition-colors active:scale-95 shadow-sm"
                            title="Add another footing configuration row"
                        >
                            <PlusCircle size={14} /> Add Row
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[800px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[70px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Length (X)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Width (Y)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Depth (Z)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[180px]">Rebar Spec</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px] bg-green-200 text-green-800">X-Bars (pcs)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px] bg-green-200 text-green-800">Y-Bars (pcs)</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {footings.map((footing, index) => (
                                <tr key={footing.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    {/* Index */}
                                    <td className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold">
                                        {index + 1}
                                    </td>
                                    {/* Quantity */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="1"
                                            value={footing.quantity}
                                            onChange={(e) => handleFootingChange(footing.id, 'quantity', e.target.value)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-400 outline-none font-bold bg-white text-slate-900"
                                        />
                                    </td>
                                    {/* Length (X) */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="1.50"
                                                value={footing.x_len}
                                                onChange={(e) => handleFootingChange(footing.id, 'x_len', e.target.value)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>
                                    {/* Width (Y) */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="1.50"
                                                value={footing.y_len}
                                                onChange={(e) => handleFootingChange(footing.id, 'y_len', e.target.value)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>
                                    {/* Depth (Z) */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="0.30"
                                                value={footing.z_depth}
                                                onChange={(e) => handleFootingChange(footing.id, 'z_depth', e.target.value)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>
                                    {/* Rebar Spec */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <select
                                            value={footing.rebarSpec}
                                            onChange={(e) => handleFootingChange(footing.id, 'rebarSpec', e.target.value)}
                                            className="w-full p-1.5 text-left border border-gray-300 rounded bg-white focus:ring-2 focus:ring-green-400 outline-none cursor-pointer text-xs font-medium"
                                        >
                                            {rebarOptions.map(spec => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                    </td>

                                    {/* Rebar X Count */}
                                    <td className="p-2 border border-slate-300 align-middle bg-green-50">
                                        <input
                                            type="number"
                                            placeholder="5"
                                            value={footing.rebar_x_count}
                                            onChange={(e) => handleFootingChange(footing.id, 'rebar_x_count', e.target.value)}
                                            className="w-full p-1.5 text-center border border-green-300 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none font-bold bg-white text-slate-900"
                                        />
                                    </td>
                                    {/* Rebar Y Count */}
                                    <td className="p-2 border border-slate-300 align-middle bg-green-50">
                                        <input
                                            type="number"
                                            placeholder="5"
                                            value={footing.rebar_y_count}
                                            onChange={(e) => handleFootingChange(footing.id, 'rebar_y_count', e.target.value)}
                                            className="w-full p-1.5 text-center border border-green-300 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none font-bold bg-white text-slate-900"
                                        />
                                    </td>
                                    {/* Delete Button */}
                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <button
                                            onClick={() => handleRemoveFooting(footing.id)}
                                            disabled={footings.length === 1}
                                            className={`p-2 rounded-full transition-colors ${footings.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
                                            title={footings.length === 1 ? 'Minimum one footing is required' : 'Remove Footing'}
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

                {/* Removed the footer input section. Only keeping the button. */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button onClick={calculateFootings} className="w-full md:w-auto px-8 py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-all hover:bg-green-700 uppercase tracking-wider text-sm flex items-center justify-center gap-2 min-w-[200px]">
                        <Calculator size={18} /> Calculate
                    </button>
                </div>
            </Card>

            {/* RESULT CARD */}
            {footingResult && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-green-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                    Estimation Result
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Total Concrete Volume: <strong className="text-gray-700">{footingResult.volume} m³</strong>
                                </p>
                                <p className="text-xs text-gray-400 mt-1 italic">
                                    *Includes 75mm concrete cover and <strong className="text-gray-600">standard 90° bend hooks</strong> at both ends.
                                </p>
                            </div>
                            <div className="text-left md:text-right bg-green-50 px-5 py-3 rounded-xl border border-green-100">
                                <p className="text-xs text-green-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                <p className="font-bold text-4xl text-green-700 tracking-tight">
                                    {footingResult.total.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200 mb-2">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr><th className="px-4 py-3">Material Item</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[140px]">Unit Price (Editable)</th>
                                        <th className="px-4 py-3 text-right bg-gray-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {footingResult.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors"><td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">
                                                {item.unit === 'cu.m' ? item.qty : item.qty.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <TablePriceInput
                                                    value={footingPrices[item.priceKey]}
                                                    onChange={(newValue) => setFootingPrices({ ...footingPrices, [item.priceKey]: newValue })}
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

            {!footingResult && !error && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Calculator size={32} className="text-green-500" />
                    </div>
                    <p className="font-medium text-center max-w-md">
                        Enter your footing dimensions and explicit rebar counts above, then click <span className="font-bold text-green-600">'Calculate'</span> to generate the material list.
                    </p>
                </div>
            )}
        </div>
    );
}
