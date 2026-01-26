import React, { useState, useEffect } from 'react';
import { Info, Settings, Calculator, PlusCircle, Trash2, Paintbrush, Ruler, PaintBucket, AlertCircle, ClipboardCopy, Download } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';

// --- Components ---

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

// Helper component for generic number inputs
const TableNumberInput = ({ value, onChange, placeholder, min = "0.01", step = "0.01", className = "" }) => (
    <input
        type="number"
        min={min}
        step={step}
        placeholder={placeholder}
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium bg-white text-slate-900 ${className}`}
    />
);

// Helper component for currency inputs
const TablePriceInput = ({ value, onChange, placeholder = "0.00" }) => (
    <div className="flex items-center justify-end relative">
        <span className="absolute left-1 text-gray-400 font-bold text-[10px] pointer-events-none">₱</span>
        <input
            type="number"
            min="0"
            step="0.01"
            placeholder={placeholder}
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-5 pr-2 py-1 text-right text-sm border border-gray-300 rounded bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none text-gray-800 font-medium transition-colors"
        />
    </div>
);


// --- Helper Functions & Data ---

// Initial Wall Configuration Template (Painting)
const getInitialWall = () => ({
    id: crypto.randomUUID(),
    quantity: 1,
    length_m: "", // Wall Length (m)
    height_m: "", // Wall Height (m)
    sides: "1",   // Number of sides to paint (1 or 2)
    area_sqm: "", // Manual Area Input (sqm)
});

import useLocalStorage from '../../hooks/useLocalStorage';

// --- Main Component ---

export default function Painting() {

    // --- State ---
    const [walls, setWalls] = useLocalStorage('painting_rows', [getInitialWall()]);

    // Consumable prices (PHP)
    const [prices, setPrices] = useLocalStorage('painting_prices', {
        primer: 650,    // 4L Gallon Flat Latex / Primer
        skimcoat: 450,  // 20kg Bag Skim Coat
        topcoat: 750,   // 4L Gallon Semi-Gloss/Gloss Latex
    });

    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Handler to update a specific row
    const handleWallChange = (id, field, value) => {
        setWalls(prev =>
            prev.map(wall => {
                if (wall.id !== id) return wall;
                // keep as string to allow flexible typing (e.g. "4.")
                return { ...wall, [field]: value };
            })
        );
        setResult(null); // Reset result on change
        setError(null);
    };

    // Add Row
    const handleAddRow = () => {
        setWalls(prev => [...prev, getInitialWall()]);
        setResult(null);
        setError(null);
    };

    // Remove Row
    const handleRemoveRow = (id) => {
        if (walls.length > 1) {
            setWalls(prev => prev.filter(wall => wall.id !== id));
            setResult(null);
            setError(null);
        } else {
            // If last row removed, reset it
            setWalls([getInitialWall()]);
        }
    };

    // Core Calculation Logic
    const calculateMaterials = () => {

        let totalAreaM2 = 0;

        // Validation Check - Modified to allow EITHER Dimensions OR Manual Area
        const hasValidInput = walls.every(wall => {
            const hasManualArea = wall.area_sqm !== "" && parseFloat(wall.area_sqm) > 0;
            const hasDimensions = wall.length_m !== "" && wall.height_m !== "" && wall.sides !== "";
            return hasManualArea || hasDimensions;
        });

        if (!hasValidInput) {
            setError("Please provide either L x H dimensions or a manual Area (sqm) for all surfaces.");
            setResult(null);
            return;
        }
        setError(null);

        // Aggregate Area
        walls.forEach(wall => {
            const quantity = parseInt(wall.quantity) || 1;
            let rowArea = 0;

            const manualArea = parseFloat(wall.area_sqm);
            if (!isNaN(manualArea) && manualArea > 0) {
                // Priority 1: Manual Area
                rowArea = manualArea;
            } else {
                // Priority 2: Dimensions
                const length = parseFloat(wall.length_m) || 0;
                const height = parseFloat(wall.height_m) || 0;
                const sides = parseFloat(wall.sides) || 1;
                rowArea = length * height * sides;
            }

            totalAreaM2 += rowArea * quantity;
        });

        if (totalAreaM2 <= 0) {
            setResult(null);
            return;
        }

        /* 
         * Coverage Estimations:
         * 1. Primer: ~25-30 sqm per 4L gallon (1 coat)
         * 2. Skim Coat: ~20 sqm per 20kg bag (standard thin application)
         * 3. Topcoat: ~25-30 sqm per 4L gallon (per coat). usually 2 coats required.
         */

        const COVERAGE_PRIMER_GAL = 25;
        const COVERAGE_SKIMCOAT_BAG = 20;
        const COVERAGE_TOPCOAT_GAL = 25;
        const TOPCOAT_COATS = 2; // Standard 2 coats for finish

        // Calculate Quantities
        const primersNeeded = Math.ceil(totalAreaM2 / COVERAGE_PRIMER_GAL);
        const skimcoatsNeeded = Math.ceil(totalAreaM2 / COVERAGE_SKIMCOAT_BAG);

        // Topcoat needs to cover area * number of coats
        const totalTopcoatArea = totalAreaM2 * TOPCOAT_COATS;
        const topcoatsNeeded = Math.ceil(totalTopcoatArea / COVERAGE_TOPCOAT_GAL);


        // Calculate Costs
        const costPrimer = primersNeeded * (parseFloat(prices.primer) || 0);
        const costSkimcoat = skimcoatsNeeded * (parseFloat(prices.skimcoat) || 0);
        const costTopcoat = topcoatsNeeded * (parseFloat(prices.topcoat) || 0);

        const totalCost = costPrimer + costSkimcoat + costTopcoat;

        const items = [
            {
                name: "Concrete Primer (4L Gal)",
                qty: primersNeeded,
                unit: 'gals',
                priceKey: 'primer',
                price: parseFloat(prices.primer) || 0,
                total: costPrimer
            },
            {
                name: "Skim Coat / Putty (20kg Bag)",
                qty: skimcoatsNeeded,
                unit: 'bags',
                priceKey: 'skimcoat',
                price: parseFloat(prices.skimcoat) || 0,
                total: costSkimcoat
            },
            {
                name: `Topcoat Paint (4L Gal) - ${TOPCOAT_COATS} Coats`,
                qty: topcoatsNeeded,
                unit: 'gals',
                priceKey: 'topcoat',
                price: parseFloat(prices.topcoat) || 0,
                total: costTopcoat
            }
        ];

        setResult({
            area: totalAreaM2.toFixed(2),
            items: items,
            total: totalCost
        });
    };

    // Auto-recalculate on price change if result exists
    useEffect(() => {
        if (result) {
            calculateMaterials();
        }
    }, [prices]);


    return (
        <div className="space-y-6">

            {/* INPUT CARD */}
            <Card className="border-t-4 border-t-emerald-800 shadow-md">
                <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-emerald-900 flex items-center gap-2">
                        <Settings size={18} /> Surface Configuration ({walls.length} Total)
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddRow}
                            className="flex items-center gap-1 px-4 py-2 bg-emerald-700 text-white rounded-md text-xs font-bold hover:bg-emerald-800 transition-colors active:scale-95 shadow-sm"
                        >
                            <PlusCircle size={14} /> Add Surface
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[800px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]" rowSpan="2">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[70px]" rowSpan="2">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center bg-emerald-50/50" colSpan="3">Dimensions (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center bg-emerald-100 text-emerald-900 w-[120px]" rowSpan="2">OR Area (sqm)</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]" rowSpan="2"></th>
                            </tr>
                            <tr>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Length</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Height</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">Sides</th>
                            </tr>
                        </thead>
                        <tbody>
                            {walls.map((wall, index) => (
                                <tr key={wall.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold">
                                        {index + 1}
                                    </td>
                                    {/* Qty */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput
                                            value={wall.quantity}
                                            onChange={(value) => handleWallChange(wall.id, 'quantity', value)}
                                            min="1"
                                            step="1"
                                            className="font-bold"
                                        />
                                    </td>
                                    {/* Length (m) */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput
                                            value={wall.length_m}
                                            onChange={(value) => handleWallChange(wall.id, 'length_m', value)}
                                            placeholder="3.00"
                                            disabled={wall.area_sqm !== ""}
                                            className={wall.area_sqm !== "" ? "bg-gray-50 opacity-50" : ""}
                                        />
                                    </td>
                                    {/* Height (m) */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput
                                            value={wall.height_m}
                                            onChange={(value) => handleWallChange(wall.id, 'height_m', value)}
                                            placeholder="2.70"
                                            disabled={wall.area_sqm !== ""}
                                            className={wall.area_sqm !== "" ? "bg-gray-50 opacity-50" : ""}
                                        />
                                    </td>
                                    {/* Sides */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <select
                                            value={wall.sides}
                                            onChange={(e) => handleWallChange(wall.id, 'sides', e.target.value)}
                                            disabled={wall.area_sqm !== ""}
                                            className={`w-full p-1.5 text-center border border-gray-300 rounded bg-white focus:ring-2 focus:ring-emerald-400 outline-none cursor-pointer text-xs font-bold text-slate-800 ${wall.area_sqm !== "" ? "bg-gray-50 opacity-50" : ""}`}
                                        >
                                            <option value="1">1 Side</option>
                                            <option value="2">2 Sides</option>
                                        </select>
                                    </td>
                                    {/* Manual Area */}
                                    <td className="p-2 border border-slate-300 align-middle bg-emerald-50/30">
                                        <TableNumberInput
                                            value={wall.area_sqm}
                                            onChange={(value) => handleWallChange(wall.id, 'area_sqm', value)}
                                            placeholder="Auto"
                                            className="font-bold text-emerald-700 border-emerald-200"
                                        />
                                    </td>
                                    {/* Delete */}
                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <button
                                            onClick={() => handleRemoveRow(wall.id)}
                                            disabled={walls.length === 1}
                                            className={`p-2 rounded-full transition-colors ${walls.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
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
                    <button onClick={calculateMaterials} className="w-full md:w-auto px-8 py-3 bg-emerald-700 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-all hover:bg-emerald-800 uppercase tracking-wider text-sm flex items-center justify-center gap-2 min-w-[200px]">
                        <Calculator size={18} /> Calculate
                    </button>
                </div>
            </Card>

            {/* RESULT CARD */}
            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-emerald-700">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                    Estimation Result
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Total Surface Area: <strong className="text-gray-700">{result.area} m²</strong>
                                </p>
                            </div>
                            <div className="text-left md:text-right bg-emerald-50 px-5 py-3 rounded-xl border border-emerald-100">
                                <p className="text-xs text-emerald-800 font-bold uppercase tracking-wide mb-1">Estimated Material Cost</p>
                                <p className="font-bold text-4xl text-rose-700 tracking-tight">₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                                onClick={() => downloadCSV(result.items, 'painting_estimation.csv')}
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
                                        <th className="px-4 py-3 text-right w-[140px]">Unit Price (Editable)</th>
                                        <th className="px-4 py-3 text-right bg-gray-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors"><td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">
                                                {item.qty.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <TablePriceInput
                                                    value={prices[item.priceKey]}
                                                    onChange={(newValue) => setPrices({ ...prices, [item.priceKey]: newValue })}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 bg-gray-50/50">₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            )}

            {!result && !error && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Paintbrush size={32} className="text-emerald-600" />
                    </div>
                    <p className="font-medium text-center max-w-md">
                        Enter your wall dimensions and number of sides, then click <span className="font-bold text-emerald-700">'Calculate'</span>.
                    </p>
                </div>
            )}
        </div>
    );
}
