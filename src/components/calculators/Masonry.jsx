import React, { useState, useEffect } from 'react';
import { Settings, Calculator, PlusCircle, Trash2, AlertCircle, ClipboardCopy, Download } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';

// --- Components ---

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

// Helper component for currency inputs (Adapted for Orange Theme)
const TablePriceInput = ({ value, onChange }) => (
    <div className="flex items-center justify-end">
        {/* Peso Sign Segment */}
        <div className="bg-gray-100/50 px-2 py-1.5 text-gray-600 text-sm font-bold flex items-center border border-gray-300 rounded-l-lg border-r-0 h-full">
            ₱
        </div>
        {/* Input Field Segment */}
        <input
            type="number"
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 pl-2 pr-2 py-1.5 text-right text-sm border border-gray-300 rounded-r-lg bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-gray-800 font-medium transition-colors border-l-0"
        />
    </div>
);

// Format number to Philippine Peso (₱)
const formatPrice = (value) => {
    return value ? parseFloat(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
};

// --- Helper Functions ---

const rebarDiameters = ["10mm", "12mm"];
const commonLengths = [6.0, 7.5, 9.0, 10.5, 12.0];
const rebarOptions = rebarDiameters.flatMap(size =>
    commonLengths.map(length => `${size} x ${length.toFixed(1)}m`)
);

// Function to extract length (number) from a spec string (e.g., "10mm x 6.0m")
const extractLength = (spec) => parseFloat(spec.split(' x ')[1].replace('m', ''));
// Function to extract diameter (number in meters) from a spec string (e.g., "10mm x 6.0m")
const extractDiameterMeters = (spec) => {
    const size = parseFloat(spec.split('mm')[0]) / 1000;
    return size;
}

// Initial Wall Configuration Template
const getInitialWall = () => ({
    id: crypto.randomUUID(),
    length: "",
    height: "",
    quantity: 1,
    chbSize: "4",
    plasterSides: "2",
    // Note: Spacing variables reflect the direction *along which* the spacing is measured.
    horizSpacing: "", // Spacing along the length (controls vertical bars)
    vertSpacing: "", // Spacing along the height (controls horizontal bars)
    horizRebarSpec: rebarOptions[0], // 10mm x 6.0m
    vertRebarSpec: rebarOptions[5], // 12mm x 6.0m
});


/**
 * Processes a single continuous rebar run (L or H) against the current inventory stock.
 */
const processSingleRun = (requiredLength, spec, rebarStock) => {
    if (requiredLength <= 0) return;

    if (!rebarStock.has(spec)) {
        rebarStock.set(spec, { purchased: 0, offcuts: [] });
    }
    const stock = rebarStock.get(spec);

    const barLength = extractLength(spec);
    const diameter = extractDiameterMeters(spec);
    const spliceLength = 40 * diameter;
    const MIN_OFFCUT_LENGTH = 0.05;

    // --- Case 1: Long Run (Requires splicing) ---
    if (requiredLength > barLength) {
        const effectiveLengthPerAdditionalBar = barLength - spliceLength;
        const remainingLength = requiredLength - barLength;
        let totalPieces = 1;

        if (effectiveLengthPerAdditionalBar > 0) {
            const additionalPieces = Math.ceil(remainingLength / effectiveLengthPerAdditionalBar);
            totalPieces = 1 + additionalPieces;
        } else {
            totalPieces = Math.ceil(requiredLength / barLength);
        }

        const totalPurchasedLength = totalPieces * barLength;
        const numSplices = totalPieces - 1;
        const totalRequiredEffectiveLength = requiredLength + (numSplices * spliceLength);
        const wasteLength = totalPurchasedLength - totalRequiredEffectiveLength;

        stock.purchased += totalPieces;
        if (wasteLength > MIN_OFFCUT_LENGTH) {
            stock.offcuts.push(wasteLength);
        }
    }
    // --- Case 2: Short Run (Offcut Reuse Heuristic) ---
    else {
        let bestFitIndex = -1;
        let smallestWaste = Infinity;

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
            const originalOffcutLength = stock.offcuts[bestFitIndex];
            stock.offcuts.splice(bestFitIndex, 1);
            const newRemainder = originalOffcutLength - requiredLength;
            if (newRemainder > MIN_OFFCUT_LENGTH) {
                stock.offcuts.push(newRemainder);
            }
        } else {
            stock.purchased += 1;
            const remainder = barLength - requiredLength;
            if (remainder > MIN_OFFCUT_LENGTH) {
                stock.offcuts.push(remainder);
            }
        }
    }
}


// --- Main App ---

import useLocalStorage from '../../hooks/useLocalStorage';

export default function Masonry() { // Renamed to Masonry

    // --- Wall Configurations State (Array of walls) ---
    const [walls, setWalls] = useLocalStorage('masonry_walls', [getInitialWall()]);

    // Material Prices
    const [wallPrices, setWallPrices] = useLocalStorage('masonry_prices', {
        chb: 15,
        cement: 240,
        sand: 1200,
        gravel: 1000,
        rebar10mmPrice: 180,
        rebar12mmPrice: 240,
        tieWire: 30,
    });

    const [wallResult, setWallResult] = useState(null);
    // Track if an estimate has been run at least once to enable auto-recalc
    const [hasEstimated, setHasEstimated] = useState(false);
    const [error, setError] = useState(null);

    // Handler to update a specific wall in the array
    const handleWallChange = (id, field, value) => {
        setWalls(prevWalls =>
            prevWalls.map(wall => (
                wall.id === id ? { ...wall, [field]: value } : wall
            ))
        );
        setError(null);
    };

    // Handler to add a new wall
    const handleAddWall = () => {
        setWalls(prevWalls => [...prevWalls, getInitialWall()]);
        setHasEstimated(false);
        setWallResult(null);
        setError(null);
    };

    // Handler to remove a wall
    const handleRemoveWall = (id) => {
        if (walls.length > 1) {
            setWalls(prevWalls => prevWalls.filter(wall => wall.id !== id));
            setHasEstimated(false);
            setWallResult(null);
            setError(null);
        } else {
            setWalls([getInitialWall()]);
        }
    };

    // Auto-update suggested price for the *first* wall when size changes
    useEffect(() => {
        const firstWallSize = walls[0]?.chbSize;
        if (firstWallSize) {
            setWallPrices(prev => ({
                ...prev,
                chb: firstWallSize === "4" ? 15 : 22
            }));
        }
    }, [walls[0]?.chbSize]); // Only trigger if CHB size changes

    // Re-calculate automatically when prices change IF we already have a result
    useEffect(() => {
        if (hasEstimated) {
            calculateWall();
        }
    }, [wallPrices]);

    const calculateWall = () => {

        let totalArea = 0;
        let totalChbCount = 0;

        // Separating volumes based on material type
        let totalVolumeMortarPlaster = 0; // Uses Cement and Sand only
        let totalVolumeGroutFiller = 0;   // Uses Cement, Sand, and Gravel

        let totalTiePoints = 0;

        const rebarStock = new Map();

        // Validation Check
        const hasEmptyFields = walls.some(wall =>
            wall.length === "" || wall.height === "" || wall.vertSpacing === "" || wall.horizSpacing === ""
        );

        if (hasEmptyFields) {
            setError("Please fill in all required fields (Length, Height, Spacing) before calculating.");
            setWallResult(null);
            setHasEstimated(false);
            return;
        }
        setError(null);

        walls.forEach(wall => {
            const length = parseFloat(wall.length) || 0;
            const height = parseFloat(wall.height) || 0;
            const quantity = parseInt(wall.quantity) || 1;

            const singleWallArea = length * height;
            const area = singleWallArea * quantity;

            if (area <= 0) return;

            totalArea += area;

            // --- 1. CHB Count ---
            const blockLengthTiled = 0.41;
            const blockHeightTiled = 0.21;

            const numBlocksLength = Math.ceil(length / blockLengthTiled);
            const numBlocksHeight = Math.ceil(height / blockHeightTiled);

            const chbCount = (numBlocksLength * numBlocksHeight) * quantity;
            totalChbCount += chbCount;

            // --- 2. Volume Calculation (Wet Volume) ---
            const sides = parseInt(wall.plasterSides);

            // Laying Mortar (Standard factor ~0.015 m³/m²)
            const volumeMortarLaying = area * 0.015;
            // Plaster (Standard 10mm thickness: 0.01 m³/m² per side)
            const volumePlaster = area * sides * 0.01;
            // Accumulate Mortar & Plaster (Cement + Sand only)
            totalVolumeMortarPlaster += volumeMortarLaying + volumePlaster;

            // Grout Filler (for cores) - (4" CHB: ~0.005 m³/m² | 6" CHB: ~0.01 m³/m²)
            const groutFactor = wall.chbSize === "4" ? 0.005 : 0.01;
            const currentGroutVolume = area * groutFactor;
            // Accumulate Grout (Cement + Sand + Gravel)
            totalVolumeGroutFiller += currentGroutVolume;

            // --- 3. Rebar Inventory ---
            const parsedVertSpacing = parseFloat(wall.vertSpacing) || 0.60;
            const parsedHorizSpacing = parseFloat(wall.horizSpacing) || 0.60;

            const numHorizRuns = Math.floor(height / parsedVertSpacing) + 1;
            for (let q = 0; q < quantity; q++) {
                for (let i = 0; i < numHorizRuns; i++) {
                    processSingleRun(length, wall.horizRebarSpec, rebarStock);
                }
            }

            const numVertRuns = Math.floor(length / parsedHorizSpacing) + 1;
            for (let q = 0; q < quantity; q++) {
                for (let i = 0; i < numVertRuns; i++) {
                    processSingleRun(height, wall.vertRebarSpec, rebarStock);
                }
            }

            // --- 4. Tie Wire ---
            const safeVertSpacing = parsedVertSpacing > 0 ? parsedVertSpacing : 0.60;
            const safeHorizSpacing = parsedHorizSpacing > 0 ? parsedHorizSpacing : 0.60;
            const currentTiePoints = area * (1 / (safeVertSpacing * safeHorizSpacing));
            totalTiePoints += currentTiePoints;
        });

        if (totalArea <= 0) {
            setWallResult(null);
            setHasEstimated(false);
            return;
        }

        // --- FINAL AGGREGATE CALCULATIONS (Separated by Mix) ---

        // Constants for volumetric conversion
        const CEMENT_BAG_VOLUME = 0.035; // Volume of 1 bag (40kg) of cement in m³
        const MORTAR_YIELD_FACTOR = 1.25; // Dry volume yield factor for mortar
        const GROUT_YIELD_FACTOR = 1.5;   // Dry volume yield factor for grout

        // 1. Mortar/Plaster Mix (C:S = 1:3) -> Uses Cement and Sand
        const V_dry_mortar = totalVolumeMortarPlaster * MORTAR_YIELD_FACTOR;
        const V_cement_mortar = V_dry_mortar * (1 / 4);
        const V_sand_mortar = V_dry_mortar * (3 / 4);

        // 2. Grout Mix (C:S:G = 1:2:4) -> Uses Cement, Sand, and Gravel
        const V_dry_grout = totalVolumeGroutFiller * GROUT_YIELD_FACTOR;
        const V_cement_grout = V_dry_grout * (1 / 7);
        const V_sand_grout = V_dry_grout * (2 / 7);
        const V_gravel_grout = V_dry_grout * (4 / 7);

        // 3. Totals
        const totalCementVolume = V_cement_mortar + V_cement_grout;
        const totalSandVolume = V_sand_mortar + V_sand_grout;
        const totalGravelVolume = V_gravel_grout; // Only from grout

        // Final Material Quantities (5% allowance added implicitly via Math.ceil/rounding)
        const finalCement = Math.ceil(totalCementVolume / CEMENT_BAG_VOLUME * 1.05); // bags + 5% allowance
        const finalSand = (totalSandVolume * 1.05).toFixed(2); // m³ + 5% allowance
        const finalGravel = (totalGravelVolume * 1.05).toFixed(2); // m³ + 5% allowance

        // --- Cost Calculation ---
        const costCHB = totalChbCount * wallPrices.chb;
        const costCement = finalCement * wallPrices.cement;
        const costSand = parseFloat(finalSand) * wallPrices.sand;
        const costGravel = parseFloat(finalGravel) * wallPrices.gravel;
        const totalCementitiousCost = costCement + costSand + costGravel;

        let finalRebarItems = [];
        let totalRebarCost = 0;

        rebarStock.forEach((stock, spec) => {
            const [size, lengthStr] = spec.split(' x ');
            const finalQtyPurchase = stock.purchased;
            const is10mm = parseFloat(size.replace('mm', '')) === 10;

            const price = is10mm ? wallPrices.rebar10mmPrice : wallPrices.rebar12mmPrice;
            const priceKey = is10mm ? 'rebar10mmPrice' : 'rebar12mmPrice';

            const total = finalQtyPurchase * price;
            totalRebarCost += total;

            finalRebarItems.push({
                name: `Corrugated Rebar (${size} x ${lengthStr})`,
                qty: finalQtyPurchase,
                unit: 'pcs',
                price: price,
                priceKey: priceKey, // Key for editable logic
                total: total,
            });
        });

        const TIE_WIRE_PER_INTERSECTION = 0.4;
        const TIE_WIRE_ROLL_KG = 50;
        const TIE_WIRE_LM_PER_ROLL = 600;
        const KG_PER_LM = TIE_WIRE_ROLL_KG / TIE_WIRE_LM_PER_ROLL;
        const totalLMTieWire = totalTiePoints * TIE_WIRE_PER_INTERSECTION;
        const totalKGRequired = totalLMTieWire * KG_PER_LM;
        const finalKGPurchase = Math.ceil(totalKGRequired * 1.05); // 5% allowance
        const costTieWire = finalKGPurchase * wallPrices.tieWire;

        const totalOverallCost = costCHB + totalCementitiousCost + totalRebarCost + costTieWire;

        const firstWallSize = walls[0]?.chbSize;
        const chbName = firstWallSize === "4" ? 'Concrete Hollow Blocks (4")' : 'Concrete Hollow Blocks (6")';

        finalRebarItems.sort((a, b) => a.name.localeCompare(b.name));

        const items = [
            { name: chbName, qty: totalChbCount, unit: 'pcs', price: wallPrices.chb, priceKey: 'chb', total: costCHB },
            { name: 'Portland Cement (40kg)', qty: finalCement, unit: 'bags', price: wallPrices.cement, priceKey: 'cement', total: costCement },
            { name: 'Wash Sand (S1)', qty: finalSand, unit: 'cu.m', price: wallPrices.sand, priceKey: 'sand', total: costSand },
            { name: 'Crushed Gravel (3/4)', qty: finalGravel, unit: 'cu.m', price: wallPrices.gravel, priceKey: 'gravel', total: costGravel },

            ...finalRebarItems,

            { name: 'G.I. Tie Wire (#16)', qty: finalKGPurchase, unit: 'kg', price: wallPrices.tieWire, priceKey: 'tieWire', total: costTieWire },
        ];

        setWallResult({
            area: totalArea.toFixed(2),
            quantity: walls.length,
            items,
            total: totalOverallCost
        });
        setHasEstimated(true);
    };

    const handlePriceChange = (key, newValue) => {
        setWallPrices(prev => ({
            ...prev,
            [key]: parseFloat(newValue) || 0
        }));
        // Calculate is handled by useEffect
    };


    return (
        <div className="space-y-6">

            {/* INPUT CARD */}
            <Card className="border-t-4 border-t-orange-500 shadow-md">
                <div className="p-4 bg-orange-50 border-b border-orange-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-orange-900 flex items-center gap-2">
                        <Settings size={18} /> Wall Configuration ({walls.length} Total)
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddWall}
                            className="flex items-center gap-1 px-4 py-2 bg-orange-600 text-white rounded-md text-xs font-bold hover:bg-orange-700 transition-colors active:scale-95 shadow-sm"
                            title="Add another wall configuration row"
                        >
                            <PlusCircle size={14} /> Add Row
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[1000px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[60px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">Length (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">Height (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">CMU Size</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">Plaster</th>

                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">V. Rebar Spacing</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Horiz. Rebar Spec</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">H. Rebar Spacing</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Vert. Rebar Spec</th>

                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {walls.map((wall, index) => (
                                <tr key={wall.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    {/* Index */}
                                    <td className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold">
                                        {index + 1}
                                    </td>
                                    {/* Quantity */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            placeholder="1"
                                            value={wall.quantity}
                                            onChange={(val) => handleWallChange(wall.id, 'quantity', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none font-bold bg-white text-slate-900"
                                        />
                                    </td>
                                    {/* Length */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <MathInput
                                                placeholder="3.00"
                                                value={wall.length}
                                                onChange={(val) => handleWallChange(wall.id, 'length', val)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>
                                    {/* Height */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <MathInput
                                                placeholder="2.70"
                                                value={wall.height}
                                                onChange={(val) => handleWallChange(wall.id, 'height', val)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>
                                    {/* CMU Size */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <select
                                            value={wall.chbSize}
                                            onChange={(e) => handleWallChange(wall.id, 'chbSize', e.target.value)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded bg-white focus:ring-2 focus:ring-orange-400 outline-none cursor-pointer text-sm font-medium"
                                        >
                                            <option value="4">4" (10cm)</option>
                                            <option value="6">6" (15cm)</option>
                                        </select>
                                    </td>
                                    {/* Plaster Sides */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <select
                                            value={wall.plasterSides}
                                            onChange={(e) => handleWallChange(wall.id, 'plasterSides', e.target.value)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded bg-white focus:ring-2 focus:ring-orange-400 outline-none cursor-pointer text-sm font-medium"
                                        >
                                            <option value="0">None</option>
                                            <option value="1">1 Side</option>
                                            <option value="2">2 Sides</option>
                                        </select>
                                    </td>

                                    {/* V. Rebar Spacing */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <MathInput
                                                placeholder="0.60"
                                                value={wall.vertSpacing}
                                                onChange={(val) => handleWallChange(wall.id, 'vertSpacing', val)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>

                                    {/* Horizontal Rebar Spec */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <select
                                            value={wall.horizRebarSpec}
                                            onChange={(e) => handleWallChange(wall.id, 'horizRebarSpec', e.target.value)}
                                            className="w-full p-1.5 text-left border border-gray-300 rounded bg-white focus:ring-2 focus:ring-orange-400 outline-none cursor-pointer text-sm font-medium"
                                        >
                                            {rebarOptions.map(spec => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                    </td>

                                    {/* H. Rebar Spacing */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <MathInput
                                                placeholder="0.60"
                                                value={wall.horizSpacing}
                                                onChange={(val) => handleWallChange(wall.id, 'horizSpacing', val)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>

                                    {/* Vertical Rebar Spec */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <select
                                            value={wall.vertRebarSpec}
                                            onChange={(e) => handleWallChange(wall.id, 'vertRebarSpec', e.target.value)}
                                            className="w-full p-1.5 text-left border border-gray-300 rounded bg-white focus:ring-2 focus:ring-orange-400 outline-none cursor-pointer text-sm font-medium"
                                        >
                                            {rebarOptions.map(spec => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                    </td>
                                    {/* Delete Button */}
                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <button
                                            onClick={() => handleRemoveWall(wall.id)}
                                            disabled={walls.length === 1}
                                            className={`p-2 rounded-full transition-colors ${walls.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
                                            title={walls.length === 1 ? 'Minimum one wall is required' : 'Remove Wall'}
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

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button onClick={calculateWall} className="w-full md:w-auto px-8 py-3 bg-orange-600 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-all hover:bg-orange-700 uppercase tracking-wider text-sm flex items-center justify-center gap-2 min-w-[200px]">
                        <Calculator size={18} /> Calculate
                    </button>
                </div>
            </Card>

            {/* RESULT CARD */}
            {wallResult && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-orange-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                    Estimation Result
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Based on <strong className="text-gray-700">{wallResult.quantity}</strong> wall configurations totaling <strong className="text-gray-700">{wallResult.area} m²</strong> area.</p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="text-left md:text-right bg-orange-50 px-5 py-3 rounded-xl border border-orange-100">
                                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                    <p className="font-bold text-4xl text-orange-700 tracking-tight">
                                        {wallResult.total.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            const success = await copyToClipboard(wallResult.items);
                                            if (success) alert('Table copied to clipboard!');
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                                        title="Copy table to clipboard for Excel"
                                    >
                                        <ClipboardCopy size={14} /> Copy to Clipboard
                                    </button>
                                    <button
                                        onClick={() => downloadCSV(wallResult.items, 'masonry_estimate.csv')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                                        title="Download as CSV"
                                    >
                                        <Download size={14} /> Download CSV
                                    </button>
                                </div>
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
                                    {wallResult.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">
                                                {item.qty}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            {/* Editable Price Column using TablePriceInput */}
                                            <td className="px-4 py-2">
                                                <TablePriceInput
                                                    value={item.price}
                                                    onChange={(newValue) => handlePriceChange(item.priceKey, newValue)}
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

            {!wallResult && !error && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Calculator size={32} className="text-orange-500" />
                    </div>
                    <p className="font-medium text-center max-w-md">
                        Enter your wall dimensions above, then click <span className="font-bold text-orange-600">'Calculate'</span> to generate the material list.
                    </p>
                </div>
            )}
        </div>
    );
}
