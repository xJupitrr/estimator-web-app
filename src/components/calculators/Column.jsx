import React, { useState, useEffect } from 'react';
import { Info, Settings, Calculator, PlusCircle, Trash2, Box, Package, Hammer, AlertCircle, ClipboardCopy, Download } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';

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


// Utility function to get SKU details from its ID string (e.g., '16_9.0')
const getSkuDetails = (skuId) => {
    const [diameter, length] = skuId.split('_').map(Number);
    return {
        diameter,
        length,
        priceKey: `rebar_${diameter}`
    };
};

// Initial Column Template
const getInitialColumn = () => ({
    id: Date.now() + Math.random(),
    quantity: 1,
    length_m: "",      // Empty default
    width_m: "",       // Empty default
    height_m: "",      // Empty default
    main_bar_sku: '16_9.0',     // Main Bar SKU (Diameter_Length)
    main_bar_count: "",   // Empty default
    tie_bar_sku: '10_6.0',      // Lateral Tie SKU (Diameter_Length)
    tie_spacing_mm: "", // Empty default
});

import useLocalStorage from '../../hooks/useLocalStorage';

export default function Column({ columns: propColumns, setColumns: propSetColumns }) {
    // Use props if provided, otherwise use local state (for backward compatibility if used standalone)
    const [localColumns, setLocalColumns] = useLocalStorage('app_columns', [getInitialColumn()]);
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

    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

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

        let totalVolConcrete = 0;

        // Material Accumulators
        let totalCementBags = 0;
        let totalSandCum = 0;
        let totalGravelCum = 0;
        let totalTieWireKg = 0;

        // Rebar Accumulator: stores pieces required per specific cut length, per SKU
        // Key: SKU ID (e.g., '16_9.0')
        // Value: Array of required cuts { cutLength: m, count: pcs }
        const rebarRequirements = {};

        // Standard Concrete Cover for columns (40mm = 0.04m)
        const concreteCover = 0.04;

        // Wire: #16 GI Wire is ~53m per kg
        const wireMetersPerKg = 53;

        // Validation
        const hasEmptyFields = columns.some(col =>
            col.length_m === "" ||
            col.width_m === "" ||
            col.height_m === "" ||
            col.main_bar_count === "" ||
            col.tie_spacing_mm === ""
        );

        if (hasEmptyFields) {
            setError("Please fill in all required fields (Length, Width, Height, Rebar Count, Spacing) before calculating.");
            setResult(null);
            return;
        }
        setError(null);

        columns.forEach(col => {
            const qty = parseInt(col.quantity) || 1;
            const L = parseFloat(col.length_m) || 0;
            const W = parseFloat(col.width_m) || 0;
            const H = parseFloat(col.height_m) || 0;

            const mainSku = col.main_bar_sku;
            const mainCount = parseInt(col.main_bar_count) || 4;

            const tieSku = col.tie_bar_sku;
            const tieSpacing = parseFloat(col.tie_spacing_mm) || 200;

            if (L <= 0 || W <= 0 || H <= 0) return;

            // 1. Concrete Volume (Class A 1:2:4 assumed)
            const volume = L * W * H * qty;
            totalVolConcrete += volume;

            const wasteMult = 1 + (wastePct / 100);

            // Quantities for Class A (1:2:4) per cubic meter
            totalCementBags += volume * 9.0 * wasteMult;
            totalSandCum += volume * 0.5 * wasteMult;
            totalGravelCum += volume * 1.0 * wasteMult;

            // --- Rebar Direct Counting Input ---

            // 2. Main Reinforcement (Length Piece Counting)
            const mainSkuDetails = getSkuDetails(mainSku);
            // Main Bar Diameter in meters
            const mainDiameter_m = mainSkuDetails.diameter / 1000;

            // Starter/Dowel Length (L_dowel): Standard 40 times diameter (40D)
            const L_dowel_splice = 40 * mainDiameter_m;

            // Main Bar Cut Length is initially just the column height (H)
            let mainBarCutLength = H;

            // If the commercial length is NOT long enough for the piece, we must include the required 40D dowel/splice length.
            if (H > mainSkuDetails.length) {
                // If the piece is longer than the commercial bar, the piece must be spliced.
                // In this simple model, we assume H is the piece length, and if it exceeds the commercial length, 
                // we are assuming a splice will be done at the job site.
                // However, based on the prompt's structural intent (starter/dowel), we calculate the required total length:
                mainBarCutLength = H + L_dowel_splice;
            } else {
                // If the piece fits within the commercial length, we only need the H + 40D for the piece connecting to the footing or beam.
                mainBarCutLength = H + L_dowel_splice;
            }

            const totalMainBarPieces = mainCount * qty;

            if (!rebarRequirements[mainSku]) {
                rebarRequirements[mainSku] = [];
            }
            rebarRequirements[mainSku].push({
                cutLength: mainBarCutLength,
                count: totalMainBarPieces
            });

            // 3. Lateral Ties (Stirrups) (Perimeter Piece Counting)
            const tieSkuDetails = getSkuDetails(tieSku);
            // Tie Bar Diameter in meters
            const tieDiameter_m = tieSkuDetails.diameter / 1000;

            // Internal tie dimensions (center-to-center): L_tie and W_tie
            // L_tie = Column L - 2 * Cover
            const L_tie = L - (2 * concreteCover);
            const W_tie = W - (2 * concreteCover);

            // Tie Perimeter (straight section length)
            const tiePerimeter = 2 * (L_tie + W_tie);

            // Hook Length (135 degree hook): Max(12D, 75mm)
            // 0.075m is 75mm
            const hookLength = Math.max(12 * tieDiameter_m, 0.075);

            // Total Cut Length = Perimeter + (2 * Hook Length)
            // Note: Bend allowance subtraction for 90-degree corners is often omitted in simple estimates 
            // as it's small, and the hook length calculation covers the required additional length for bending.
            let tieCutLength = tiePerimeter + (2 * hookLength);

            // Validate tie dimensions (should not be negative or zero)
            if (L_tie <= 0 || W_tie <= 0) {
                console.warn(`Column L=${L}m or W=${W}m is too small for 40mm cover. Tie calculation skipped for this row.`);
                tieCutLength = 0;
            }

            const numTiesPerCol = Math.ceil((H * 1000) / tieSpacing) + 1; // +1 for starter/pad
            const totalTiePieces = numTiesPerCol * qty;

            if (tieCutLength > 0) {
                if (!rebarRequirements[tieSku]) {
                    rebarRequirements[tieSku] = [];
                }
                rebarRequirements[tieSku].push({
                    cutLength: tieCutLength,
                    count: totalTiePieces
                });
            }

            // 4. Tie Wire (#16 GI Wire)
            // Approx 35cm (0.35m) per intersection
            const intersections = mainCount * numTiesPerCol * qty;
            const wireMeters = intersections * 0.35;
            totalTieWireKg += wireMeters / wireMetersPerKg;
        });

        // Final Compilation
        const items = [];
        let subTotal = 0;

        // Helper to add item
        const addItem = (name, qty, unit, priceKey, priceDefault) => {
            if (qty <= 0) return;
            const price = prices[priceKey] !== undefined ? prices[priceKey] : priceDefault;
            const total = qty * price;
            subTotal += total;
            items.push({ name, qty, unit, priceKey, price, total });
        };

        // Concrete Materials
        addItem("Portland Cement (40kg)", Math.ceil(totalCementBags), "bags", "cement", 240);
        addItem("Wash Sand (S1)", Math.ceil(totalSandCum * 10) / 10, "cu.m", "sand", 1200); // <-- Changed m³ to cu.m
        addItem("Crushed Gravel (3/4)", Math.ceil(totalGravelCum * 10) / 10, "cu.m", "gravel", 1400); // <-- Changed m³ to cu.m

        // Steel Materials - Direct Counting Yield Calculation
        Object.keys(rebarRequirements).forEach(skuId => {
            const requirements = rebarRequirements[skuId]; // Array of { cutLength, count }

            // Get details from the SKU ID
            const { diameter, length: commercialLength, priceKey } = getSkuDetails(skuId);

            let totalCommercialBars = 0;

            // Iterate through all required cut lengths for this specific SKU
            requirements.forEach(req => {
                const { cutLength, count } = req;

                if (cutLength <= 0 || count <= 0) return;

                // Calculate how many pieces can be cut from ONE commercial bar (the yield)
                // Use Math.floor() to discard the remaining cut-off waste
                const piecesPerBar = Math.floor(commercialLength / cutLength);

                if (piecesPerBar > 0) {
                    // Total bars needed to satisfy the requirement for this specific cut length
                    const barsNeededForCut = Math.ceil(count / piecesPerBar);
                    totalCommercialBars += barsNeededForCut;
                } else {
                    // If cutLength > commercialLength, we need multiple commercial bars spliced together
                    const spliceLength = 40 * (diameter / 1000); // 40d splice length in meters
                    const effectiveLengthPerAdditionalBar = commercialLength - spliceLength;

                    if (effectiveLengthPerAdditionalBar > 0) {
                        const additionalPiecesNeeded = Math.ceil((cutLength - commercialLength) / effectiveLengthPerAdditionalBar);
                        const piecesPerRun = 1 + additionalPiecesNeeded;
                        totalCommercialBars += (piecesPerRun * count);
                    } else {
                        // Fallback: If splice length >= bar length (extreme case), just use simple division
                        totalCommercialBars += Math.ceil(cutLength / commercialLength) * count;
                    }
                }
            });

            if (totalCommercialBars > 0) {
                addItem(`Corrugated Rebar (${diameter}mm x ${commercialLength}m)`, totalCommercialBars, "pcs", priceKey, 200);
            }
        });

        addItem("G.I. Tie Wire (#16)", Math.ceil(totalTieWireKg), "kg", "tie_wire", 85);

        setResult({
            volume: totalVolConcrete.toFixed(2),
            items: items,
            grandTotal: subTotal
        });
    };

    useEffect(() => {
        // Recalculate if prices change and a result is already displayed
        if (result) {
            calculateMaterials();
        }
    }, [prices, wastePct]);


    return (
        <div className="space-y-6">

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
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-orange-50 text-orange-900" colSpan="2">Main Rebar</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-emerald-50 text-emerald-900" colSpan="2">Ties</th>
                                <th className="px-1 py-2 font-bold border border-slate-300 text-center w-[30px]" rowSpan="2"></th>
                            </tr>
                            <tr>
                                {/* Dimensions */}
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[70px] bg-blue-50/50">L</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[70px] bg-blue-50/50">W</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[70px] bg-blue-50/50">H</th>
                                {/* Main Bars */}
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[85px] bg-orange-50/50">Size & Length</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[70px] bg-orange-50/50">Count</th>
                                {/* Ties */}
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[85px] bg-emerald-50/50">Size & Length</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[80px] bg-emerald-50/50">Space (mm)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {columns.map((col, index) => (
                                <tr key={col.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold">{index + 1}</td>

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
                                    <td className="p-2 border border-slate-300 align-middle bg-orange-50/20">
                                        <select
                                            value={col.main_bar_sku} onChange={(e) => handleColumnChange(col.id, 'main_bar_sku', e.target.value)}
                                            className="w-full p-1 text-center border border-slate-300 rounded bg-white outline-none cursor-pointer text-sm font-medium h-auto py-1.5"
                                        >
                                            {availableRebarSKUs.map(sku => (
                                                <option key={sku.id} value={sku.id}>
                                                    {sku.display}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-orange-50/20"><TableNumberInput value={col.main_bar_count} onChange={(v) => handleColumnChange(col.id, 'main_bar_count', v)} placeholder="4" step="1" /></td>

                                    {/* Ties */}
                                    <td className="p-2 border border-slate-300 align-middle bg-emerald-50/20">
                                        <select
                                            value={col.tie_bar_sku} onChange={(e) => handleColumnChange(col.id, 'tie_bar_sku', e.target.value)}
                                            className="w-full p-1 text-center border border-slate-300 rounded bg-white outline-none cursor-pointer text-sm font-medium h-auto py-1.5"
                                        >
                                            {availableTieSKUs.map(sku => (
                                                <option key={sku.id} value={sku.id}>
                                                    {sku.display}
                                                </option>
                                            ))}
                                        </select>
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
                        <Calculator size={18} /> Calculate
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
                        Enter your column dimensions and reinforcement details, then click <span className="font-bold text-indigo-600">'Calculate'</span>.
                    </p>
                </div>
            )}
        </div>
    );
}
