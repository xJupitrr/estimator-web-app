import React, { useState, useEffect } from 'react';
import { Info, Settings, Calculator, PlusCircle, Trash2, Grid3X3, Ruler, PoundSterling, AlertCircle } from 'lucide-react';

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
        className={`w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-violet-400 outline-none font-medium bg-white text-slate-900 ${className}`}
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
            className="w-full pl-5 pr-2 py-1 text-right text-sm border border-gray-300 rounded bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none text-gray-800 font-medium transition-colors"
        />
    </div>
);


// --- Helper Functions & Data ---

const tileMaterials = [
    "Ceramic (Glossy)",
    "Ceramic (Matte)",
    "Porcelain (Polished)",
    "Porcelain (Matte)",
    "Homogeneous",
    "Adobe Stone",
    "Natural Stone",
    "Stone Plastic Composite (SPC)",
    "Vinyl Plank",
];

// Initial Area Configuration Template
const getInitialArea = () => ({
    id: crypto.randomUUID(),
    quantity: 1,
    x_len: "", // Room Length (m)
    y_len: "", // Room Width (m)
    tileMaterial: "Ceramic (Glossy)",
    tile_width_cm: "", // Tile Width (cm)
    tile_height_cm: "", // Tile Length/Height (cm)
    tile_price_per_piece: "", // Price per piece (PHP)
});

// --- Main Component ---

export default function Tiles() {

    // --- State ---
    const [areas, setAreas] = useState([getInitialArea()]);

    // Consumable prices (PHP) - Tile prices are now stored per area row
    const [prices, setPrices] = useState({
        adhesive: 280, // 25kg bag
        grout: 65, // per kg
    });

    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Handler to update a specific row
    const handleAreaChange = (id, field, value) => {
        setAreas(prev =>
            prev.map(area => {
                if (area.id !== id) return area;
                // Simply store the value string to allow robust typing (e.g. "4.")
                return { ...area, [field]: value };
            })
        );
        setResult(null); // Reset result on change
        setError(null);
    };

    // Add Row
    const handleAddRow = () => {
        setAreas(prev => [...prev, getInitialArea()]);
        setResult(null);
        setError(null);
    };

    // Remove Row
    const handleRemoveRow = (id) => {
        if (areas.length > 1) {
            setAreas(prev => prev.filter(area => area.id !== id));
            setResult(null);
            setError(null);
        } else {
            // If last row removed, reset it
            setAreas([getInitialArea()]);
        }
    };

    // Core Calculation Logic
    const calculateMaterials = () => {

        let totalAreaM2 = 0;
        let totalAdhesiveBags = 0;
        let totalGroutKg = 0;

        // Key: "Material - WxH (cm)", Value: { qty, price, unit }
        const tileRequirements = new Map();

        // Validation Check
        const hasEmptyFields = areas.some(area =>
            area.x_len === "" ||
            area.y_len === "" ||
            area.tile_width_cm === "" ||
            area.tile_height_cm === "" ||
            area.tile_price_per_piece === ""
        );

        if (hasEmptyFields) {
            setError("Please fill in all required fields (Room Dimensions, Tile Dimensions, Price) before calculating.");
            setResult(null);
            return;
        }
        setError(null);


        areas.forEach(area => {
            const x_len = parseFloat(area.x_len) || 0; // Room Length (m)
            const y_len = parseFloat(area.y_len) || 0; // Room Width (m)
            const quantity = parseInt(area.quantity) || 1;

            const tile_width_cm = parseFloat(area.tile_width_cm) || 0;
            const tile_height_cm = parseFloat(area.tile_height_cm) || 0;
            const tile_price_per_piece = parseFloat(area.tile_price_per_piece) || 0;

            if (x_len <= 0 || y_len <= 0 || tile_width_cm <= 0 || tile_height_cm <= 0) return;

            const singleArea = x_len * y_len;
            const totalRowArea = singleArea * quantity;

            if (totalRowArea <= 0) return;

            totalAreaM2 += totalRowArea;

            // --- Tile Count Calculation ---
            const tile_w_m = tile_width_cm / 100;
            const tile_h_m = tile_height_cm / 100;

            // Orientation 1: Tile W along Room L, Tile H along Room W
            const cols1 = Math.ceil(x_len / tile_w_m);
            const rows1 = Math.ceil(y_len / tile_h_m);
            const total1 = cols1 * rows1;

            // Orientation 2: Tile H along Room L, Tile W along Room W (Rotated 90deg)
            const cols2 = Math.ceil(x_len / tile_h_m);
            const rows2 = Math.ceil(y_len / tile_w_m);
            const total2 = cols2 * rows2;

            // Use the orientation that results in fewer tiles (Efficiency)
            const baseTileCount = Math.min(total1, total2);

            // Add 10% waste factor
            const tilesWithWaste = Math.ceil(baseTileCount * 1.10);

            // Total for this row
            const totalTilesForRow = tilesWithWaste * quantity;

            const uniqueKey = `${area.tileMaterial} - ${tile_width_cm}x${tile_height_cm} cm`;

            // Aggregate requirements
            if (tileRequirements.has(uniqueKey)) {
                // Check if prices are the same (if not, we shouldn't aggregate, but for simplicity we assume same custom size means same price)
                // Since the price is now tied to the row, we should group by size AND price.
                const fullKey = `${uniqueKey} @ ₱${tile_price_per_piece.toFixed(2)}`;
                if (tileRequirements.has(fullKey)) {
                    tileRequirements.set(fullKey, {
                        ...tileRequirements.get(fullKey),
                        qty: tileRequirements.get(fullKey).qty + totalTilesForRow
                    });
                } else {
                    tileRequirements.set(fullKey, {
                        qty: totalTilesForRow,
                        price: tile_price_per_piece,
                        unit: 'pcs',
                        priceKey: 'dynamic' // Placeholder key
                    });
                }
            } else {
                const fullKey = `${uniqueKey} @ ₱${tile_price_per_piece.toFixed(2)}`;
                tileRequirements.set(fullKey, {
                    qty: totalTilesForRow,
                    price: tile_price_per_piece,
                    unit: 'pcs',
                    priceKey: 'dynamic' // Placeholder key
                });
            }


            // --- Consumables ---

            const isFloatingFloor = area.tileMaterial.includes("SPC") || area.tileMaterial.includes("Vinyl");

            if (!isFloatingFloor) {
                // Adhesive: Approx 1 bag (25kg) per 4.0 sqm.
                totalAdhesiveBags += totalRowArea / 4.0;

                // Grout: Rough estimate 0.3kg per sqm for standard joints
                totalGroutKg += totalRowArea * 0.3;
            }
        });

        if (totalAreaM2 <= 0) {
            setResult(null);
            return;
        }

        const finalAdhesive = Math.ceil(totalAdhesiveBags);
        const finalGrout = Math.ceil(totalGroutKg);

        // Calculate Costs
        let totalCost = 0;
        const items = [];

        // Add Tile Items
        tileRequirements.forEach((data, name) => {
            const unitPrice = data.price;
            const lineTotal = data.qty * unitPrice;
            totalCost += lineTotal;
            items.push({
                name: `Tiles: ${name}`,
                qty: data.qty,
                unit: 'pcs',
                priceKey: 'dynamic', // Not editable in the results, as it comes from the input table
                price: unitPrice,
                total: lineTotal
            });
        });

        // Add Adhesive (Only if needed)
        if (finalAdhesive > 0) {
            const adhesiveCost = finalAdhesive * (parseFloat(prices.adhesive) || 0);
            totalCost += adhesiveCost;
            items.push({
                name: "Tile Adhesive (25kg Bag)",
                qty: finalAdhesive,
                unit: 'bags',
                priceKey: 'adhesive',
                price: parseFloat(prices.adhesive) || 0,
                total: adhesiveCost
            });
        }

        // Add Grout (Only if needed)
        if (finalGrout > 0) {
            const groutCost = finalGrout * (parseFloat(prices.grout) || 0);
            totalCost += groutCost;
            items.push({
                name: "Tile Grout (kg)",
                qty: finalGrout,
                unit: 'kg',
                priceKey: 'grout',
                price: parseFloat(prices.grout) || 0,
                total: groutCost
            });
        }

        setResult({
            area: totalAreaM2.toFixed(2),
            items: items,
            total: totalCost
        });
    };

    // Auto-recalculate on price change (for consumables only)
    useEffect(() => {
        if (result) {
            calculateMaterials();
        }
    }, [prices]);


    return (
        <div className="space-y-6">

            {/* INPUT CARD */}
            <Card className="border-t-4 border-t-violet-600 shadow-md">
                <div className="p-4 bg-violet-50 border-b border-violet-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-violet-900 flex items-center gap-2">
                        <Settings size={18} /> Area Configuration ({areas.length} Total)
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddRow}
                            className="flex items-center gap-1 px-4 py-2 bg-violet-600 text-white rounded-md text-xs font-bold hover:bg-violet-700 transition-colors active:scale-95 shadow-sm"
                        >
                            <PlusCircle size={14} /> Add Area
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[1000px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[70px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Room L (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Room W (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[200px] bg-violet-100 text-violet-900">Tile Material</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px] bg-violet-100 text-violet-900">Tile W (cm)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px] bg-violet-100 text-violet-900">Tile L (cm)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px] bg-amber-100 text-amber-900">Price/pc (₱)</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {areas.map((area, index) => (
                                <tr key={area.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold">
                                        {index + 1}
                                    </td>
                                    {/* Qty */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput
                                            value={area.quantity}
                                            onChange={(value) => handleAreaChange(area.id, 'quantity', value)}
                                            min="1"
                                            step="1"
                                            className="font-bold"
                                        />
                                    </td>
                                    {/* Room Length (m) */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput
                                            value={area.x_len}
                                            onChange={(value) => handleAreaChange(area.id, 'x_len', value)}
                                            placeholder="4.00"
                                        />
                                    </td>
                                    {/* Room Width (m) */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput
                                            value={area.y_len}
                                            onChange={(value) => handleAreaChange(area.id, 'y_len', value)}
                                            placeholder="3.50"
                                        />
                                    </td>
                                    {/* Tile Material */}
                                    <td className="p-2 border border-slate-300 align-middle bg-violet-50">
                                        <select
                                            value={area.tileMaterial}
                                            onChange={(e) => handleAreaChange(area.id, 'tileMaterial', e.target.value)}
                                            className="w-full p-1.5 text-left border border-violet-200 rounded bg-white focus:ring-2 focus:ring-violet-400 outline-none cursor-pointer text-xs font-medium text-slate-800"
                                        >
                                            {tileMaterials.map(mat => (
                                                <option key={mat} value={mat}>{mat}</option>
                                            ))}
                                        </select>
                                    </td>
                                    {/* Tile Width (cm) */}
                                    <td className="p-2 border border-slate-300 align-middle bg-violet-50">
                                        <TableNumberInput
                                            value={area.tile_width_cm}
                                            onChange={(value) => handleAreaChange(area.id, 'tile_width_cm', value)}
                                            placeholder="60"
                                            min="1"
                                            step="1"
                                            className="border-violet-200"
                                        />
                                    </td>
                                    {/* Tile Length (cm) */}
                                    <td className="p-2 border border-slate-300 align-middle bg-violet-50">
                                        <TableNumberInput
                                            value={area.tile_height_cm}
                                            onChange={(value) => handleAreaChange(area.id, 'tile_height_cm', value)}
                                            placeholder="60"
                                            min="1"
                                            step="1"
                                            className="border-violet-200"
                                        />
                                    </td>
                                    {/* Price per Piece (₱) */}
                                    <td className="p-2 border border-slate-300 align-middle bg-amber-50">
                                        <TablePriceInput
                                            value={area.tile_price_per_piece}
                                            onChange={(value) => handleAreaChange(area.id, 'tile_price_per_piece', value)}
                                            placeholder="185.00"
                                        />
                                    </td>
                                    {/* Delete */}
                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <button
                                            onClick={() => handleRemoveRow(area.id)}
                                            disabled={areas.length === 1}
                                            className={`p-2 rounded-full transition-colors ${areas.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
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
                    <button onClick={calculateMaterials} className="w-full md:w-auto px-8 py-3 bg-violet-600 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-all hover:bg-violet-700 uppercase tracking-wider text-sm flex items-center justify-center gap-2 min-w-[200px]">
                        <Calculator size={18} /> Calculate
                    </button>
                </div>
            </Card>

            {/* RESULT CARD */}
            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-violet-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                    Estimation Result
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Total Floor Area: <strong className="text-gray-700">{result.area} m²</strong>
                                </p>
                            </div>
                            <div className="text-left md:text-right bg-violet-50 px-5 py-3 rounded-xl border border-violet-100">
                                <p className="text-xs text-violet-800 font-bold uppercase tracking-wide mb-1">Estimated Material Cost</p>
                                <p className="font-bold text-4xl text-violet-700 tracking-tight">₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors"><td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">
                                                {item.qty.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                {/* Only Consumables (Adhesive/Grout) are editable here */}
                                                {item.priceKey !== 'dynamic' ? (
                                                    <TablePriceInput
                                                        value={prices[item.priceKey]}
                                                        onChange={(newValue) => setPrices({ ...prices, [item.priceKey]: newValue })}
                                                    />
                                                ) : (
                                                    <div className="text-right text-sm text-gray-500 font-medium px-2 py-1">
                                                        ₱{item.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                )}
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
                        <Grid3X3 size={32} className="text-violet-500" />
                    </div>
                    <p className="font-medium text-center max-w-md">
                        Enter your room dimensions, tile specifications (width, length, and price per piece), then click <span className="font-bold text-violet-600">'Calculate'</span>.
                    </p>
                </div>
            )}
        </div>
    );
}
