import React, { useState, useMemo } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Settings, Calculator, Box, AlertCircle, ClipboardCopy, Download, Info, DoorOpen } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';

// --- CONSTANTS ---

const CONCRETE_WASTE_PCT = 5;
const L_ANCHOR_DEV_FACTOR = 40;
const BEARING_LENGTH = 0.20; // 200mm bearing each side (Total 400mm added to opening width)

const DEFAULT_PRICES = {
    cement: 240,
    sand: 1200,
    gravel: 1400,
    rebar_10: 180,
    rebar_12: 260,
    rebar_16: 480,
    tie_wire: 85,
};

const DEFAULT_SPECS = {
    lintelDepth: 0.15, // 150mm standard depth (wall thickness)
    lintelHeight: 0.20, // 200mm standard height
    mainBarSku: '12_6.0',
    mainBarCount: 2,
    tieSku: '10_6.0',
    tieSpacing: 150, // mm
};

const AVAILABLE_REBAR_SKUS = [
    { id: '10_6.0', diameter: 10, length: 6.0, display: '10mm x 6.0m' },
    { id: '12_6.0', diameter: 12, length: 6.0, display: '12mm x 6.0m' },
    { id: '16_6.0', diameter: 16, length: 6.0, display: '16mm x 6.0m' },
    { id: '16_9.0', diameter: 16, length: 9.0, display: '16mm x 9.0m' },
];

const AVAILABLE_TIE_SKUS = [
    { id: '10_6.0', diameter: 10, length: 6.0, display: '10mm x 6.0m' },
    { id: '12_6.0', diameter: 12, length: 6.0, display: '12mm x 6.0m' },
];

// --- HELPER FUNCTIONS ---

const getSkuDetails = (skuId) => {
    if (!skuId) return { diameter: 0, length: 0, priceKey: '' };
    const [diameter, length] = skuId.split('_').map(Number);
    return { diameter, length, priceKey: `rebar_${diameter}` };
};

// --- UI COMPONENTS ---

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {children}
    </div>
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
            className="w-24 pl-2 pr-2 py-1.5 text-right text-sm border border-gray-300 rounded-r-lg bg-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none text-gray-800 font-medium transition-colors border-l-0"
        />
    </div>
);

const NumberInput = ({ value, onChange, placeholder, className = "" }) => (
    <MathInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-400 outline-none font-medium bg-white ${className}`}
    />
);

const SelectInput = ({ value, onChange, options, className = "" }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-400 outline-none font-medium bg-white cursor-pointer ${className}`}
    >
        {options.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.display}</option>
        ))}
    </select>
);

// --- MAIN COMPONENT ---

export default function LintelBeam() {
    const [prices, setPrices] = useLocalStorage('lintel_prices', DEFAULT_PRICES);
    const [specs, setSpecs] = useLocalStorage('lintel_specs', DEFAULT_SPECS);
    const [showResult, setShowResult] = useState(false);

    // Read door/window openings from localStorage
    const doorsWindowsItems = useMemo(() => {
        try {
            const stored = localStorage.getItem('doorswindows_rows');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }, []);

    // Transform to lintel beams
    const lintelBeams = useMemo(() => {
        const depth = parseFloat(specs.lintelDepth) || 0.15;
        return doorsWindowsItems
            .filter(item => item.width_m && item.height_m)
            .map(item => ({
                id: item.id,
                openingType: item.itemType || 'Opening',
                openingWidth: parseFloat(item.width_m) || 0,
                openingHeight: parseFloat(item.height_m) || 0,
                quantity: parseInt(item.quantity) || 1,
                lintelWidth: (parseFloat(item.width_m) || 0) + (2 * BEARING_LENGTH),
                lintelDepth: depth,
                mainBarSku: specs.mainBarSku,
                mainBarCount: parseInt(specs.mainBarCount) || 2,
                tieSku: specs.tieSku,
                tieSpacing: parseInt(specs.tieSpacing) || 150, // mm
            }));
    }, [doorsWindowsItems, specs]);

    const handleCalculate = () => {
        setShowResult(true);
    };

    const handleSpecChange = (field, value) => {
        setSpecs(prev => ({ ...prev, [field]: value }));
        setShowResult(false);
    };

    // --- CALCULATION ENGINE ---
    const result = useMemo(() => {
        if (!showResult) return null;

        let totalVolConcrete = 0;
        let totalCementBags = 0;
        let totalSandCum = 0;
        let totalGravelCum = 0;
        let totalTieWireKg = 0;

        const rebarRequirements = {};
        const concreteCover = 0.025; // 25mm for lintels
        const wireMetersPerKg = 53;

        const depth = parseFloat(specs.lintelDepth) || 0.15;
        const height = parseFloat(specs.lintelHeight) || 0.20;

        const addRebarReq = (skuId, cutLength, count) => {
            if (cutLength <= 0 || count <= 0) return;
            const { length: commercialLength } = getSkuDetails(skuId);
            if (!rebarRequirements[skuId]) rebarRequirements[skuId] = { cuts: [], commercialLength };
            rebarRequirements[skuId].cuts.push({ cutLength, count });
        };

        lintelBeams.forEach(lintel => {
            const qty = lintel.quantity;
            const W = lintel.lintelWidth;
            const D = depth;
            const H = height;
            const L = lintel.openingWidth + (2 * BEARING_LENGTH);

            if (W <= 0 || D <= 0 || L <= 0) return;

            // 1. Concrete
            const vol = W * D * H * qty;
            totalVolConcrete += vol;
            const wasteMult = 1 + (CONCRETE_WASTE_PCT / 100);
            totalCementBags += vol * 9.0 * wasteMult;
            totalSandCum += vol * 0.5 * wasteMult;
            totalGravelCum += vol * 1.0 * wasteMult;

            // 2. Main Rebar
            const mainSkuDetails = getSkuDetails(lintel.mainBarSku);
            const mainDiaM = mainSkuDetails.diameter / 1000;
            const L_dev = L_ANCHOR_DEV_FACTOR * mainDiaM;
            const mainCutLength = L + (2 * L_dev);
            const totalMainBars = lintel.mainBarCount * qty;
            addRebarReq(lintel.mainBarSku, mainCutLength, totalMainBars);

            // 3. Ties/Stirrups
            const tieSkuDetails = getSkuDetails(lintel.tieSku);
            const W_tie = W - (2 * concreteCover);
            const D_tie = D - (2 * concreteCover);
            const hookLength = Math.max(12 * (tieSkuDetails.diameter / 1000), 0.075);
            const tieCutLength = (2 * (W_tie + D_tie)) + (2 * hookLength);

            if (W_tie > 0 && D_tie > 0) {
                const spacingM = lintel.tieSpacing / 1000;
                const tiesPerBeam = Math.ceil(L / spacingM) + 1;
                addRebarReq(lintel.tieSku, tieCutLength, tiesPerBeam * qty);

                // Tie Wire
                const intersections = lintel.mainBarCount * tiesPerBeam * qty;
                totalTieWireKg += (intersections * 0.30) / wireMetersPerKg;
            }
        });

        // --- Finalize Quantities ---
        const items = [];
        let subTotal = 0;

        const addItem = (name, qty, unit, priceKey, priceDefault) => {
            if (qty <= 0) return;
            const finalQty = Number.isInteger(qty) ? qty : Math.ceil(qty * 100) / 100;
            const price = prices[priceKey] !== undefined ? parseFloat(prices[priceKey]) : priceDefault;
            const total = finalQty * price;
            subTotal += total;
            items.push({ name, qty: finalQty, unit, priceKey, price, total });
        };

        // Concrete
        addItem("Portland Cement (40kg)", Math.ceil(totalCementBags), "bags", "cement", 240);
        addItem("Wash Sand (S1)", totalSandCum, "cu.m", "sand", 1200);
        addItem("Crushed Gravel (3/4)", totalGravelCum, "cu.m", "gravel", 1400);

        // Rebar
        Object.keys(rebarRequirements).forEach(skuId => {
            const { cuts, commercialLength } = rebarRequirements[skuId];
            const { diameter, priceKey } = getSkuDetails(skuId);

            let totalBars = 0;
            cuts.forEach(({ cutLength, count }) => {
                const yieldPerBar = Math.floor(commercialLength / cutLength);
                totalBars += yieldPerBar > 0 ? Math.ceil(count / yieldPerBar) : count;
            });

            if (totalBars > 0) addItem(`Corrugated Rebar (${diameter}mm x ${commercialLength}m)`, totalBars, "pcs", priceKey, 200);
        });

        addItem("G.I. Tie Wire (#16)", Math.ceil(totalTieWireKg), "kg", "tie_wire", 85);

        return { volume: totalVolConcrete.toFixed(3), items, grandTotal: subTotal };

    }, [lintelBeams, prices, specs.lintelDepth, specs.lintelHeight, showResult]);

    return (
        <div className="space-y-6">
            <Card className="border-t-4 border-t-purple-600 shadow-md">
                <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <Settings size={18} /> Lintel Beam General Specifications
                    </h2>
                </div>
                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[800px]">
                        <thead className="text-[11px] text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-cyan-50 text-cyan-900" colSpan="2">Dimensions (m)</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-orange-50 text-orange-900" colSpan="2">Main Reinforcement</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-emerald-50 text-emerald-900" colSpan="2">Ties / Stirrups</th>
                            </tr>
                            <tr>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center bg-cyan-50/50">Depth (W)</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center bg-cyan-50/50">Height (H)</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center bg-orange-50/50">Bar Size</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center bg-orange-50/50">Count</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center bg-emerald-50/50">Tie Size</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center bg-emerald-50/50">Spacing (mm)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white">
                                <td className="p-2 border border-slate-200 align-middle">
                                    <NumberInput
                                        value={specs.lintelDepth}
                                        onChange={(v) => handleSpecChange('lintelDepth', v)}
                                        placeholder="0.15"
                                        className="text-center"
                                    />
                                </td>
                                <td className="p-2 border border-slate-200 align-middle">
                                    <NumberInput
                                        value={specs.lintelHeight}
                                        onChange={(v) => handleSpecChange('lintelHeight', v)}
                                        placeholder="0.20"
                                        className="text-center"
                                    />
                                </td>
                                <td className="p-2 border border-slate-200 align-middle bg-orange-50/10">
                                    <SelectInput
                                        value={specs.mainBarSku}
                                        onChange={(v) => handleSpecChange('mainBarSku', v)}
                                        options={AVAILABLE_REBAR_SKUS}
                                        className="text-center"
                                    />
                                </td>
                                <td className="p-2 border border-slate-200 align-middle bg-orange-50/10">
                                    <NumberInput
                                        value={specs.mainBarCount}
                                        onChange={(v) => handleSpecChange('mainBarCount', v)}
                                        placeholder="2"
                                        min="1"
                                        step="1"
                                        className="text-center"
                                    />
                                </td>
                                <td className="p-2 border border-slate-200 align-middle bg-emerald-50/10">
                                    <SelectInput
                                        value={specs.tieSku}
                                        onChange={(v) => handleSpecChange('tieSku', v)}
                                        options={AVAILABLE_TIE_SKUS}
                                        className="text-center"
                                    />
                                </td>
                                <td className="p-2 border border-slate-200 align-middle bg-emerald-50/10">
                                    <NumberInput
                                        value={specs.tieSpacing}
                                        onChange={(v) => handleSpecChange('tieSpacing', v)}
                                        placeholder="150"
                                        min="50"
                                        step="10"
                                        className="text-center"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="mt-2 text-[10px] text-gray-400 italic px-1 flex items-center gap-1">
                        <Info size={10} /> These specifications apply to all lintel beams generated from door and window openings.
                    </div>
                </div>
            </Card>

            <Card className="border-t-4 border-t-purple-600 shadow-md">
                <div className="p-4 bg-purple-50 border-b border-purple-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h2 className="font-bold text-purple-900 flex items-center gap-2">
                            <DoorOpen size={18} /> Opening Detection
                        </h2>
                        <p className="text-xs text-purple-600 mt-1">
                            {lintelBeams.length} opening{lintelBeams.length !== 1 ? 's' : ''} detected from Doors & Windows tab
                        </p>
                    </div>
                </div>

                {lintelBeams.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <DoorOpen size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-medium">No openings found in Doors & Windows tab.</p>
                        <p className="text-xs">Add openings there to see them here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-[11px] text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-center w-[50px]">#</th>
                                    <th className="px-4 py-3 font-semibold">Opening Type</th>
                                    <th className="px-4 py-3 font-semibold text-center">Qty</th>
                                    <th className="px-4 py-3 font-semibold text-center bg-purple-50/30">Opening Width</th>
                                    <th className="px-4 py-3 font-semibold text-center text-purple-700 bg-purple-50/50">Lintel Length</th>
                                    <th className="px-4 py-3 font-semibold text-center">Depth</th>
                                    <th className="px-4 py-3 font-semibold text-center">Height</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {lintelBeams.map((beam, idx) => (
                                    <tr key={beam.id} className="hover:bg-purple-50/20 transition-colors">
                                        <td className="px-4 py-3 text-center text-gray-400 font-medium">{idx + 1}</td>
                                        <td className="px-4 py-3 font-bold text-gray-700">{beam.openingType}</td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-600">{beam.quantity}</td>
                                        <td className="px-4 py-3 text-center bg-purple-50/10 tabular-nums">{beam.openingWidth.toFixed(2)}m</td>
                                        <td className="px-4 py-3 text-center bg-purple-50/30 font-bold text-purple-700 tabular-nums">{beam.lintelWidth.toFixed(2)}m</td>
                                        <td className="px-4 py-3 text-center text-gray-500 text-xs">{specs.mainBarCount} - {getSkuDetails(specs.mainBarSku).diameter}mm</td>
                                        <td className="px-4 py-3 text-center text-gray-500 text-xs">{getSkuDetails(specs.tieSku).diameter}mm @ {specs.tieSpacing}mm</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleCalculate}
                        disabled={lintelBeams.length === 0}
                        className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg font-bold shadow-lg hover:bg-purple-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 uppercase tracking-widest text-xs"
                    >
                        <Calculator size={16} /> Calculate Materials
                    </button>
                </div>
            </Card>

            {showResult && result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-purple-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                    Estimation Result
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Total Lintel concrete volume: <strong className="text-gray-700">{result.volume} m³</strong>
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-3 text-right">
                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mb-1">Total Estimated Cost</p>
                                    <p className="font-bold text-4xl text-purple-700 tabular-nums">₱{result.grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => copyToClipboard(result.items)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                                        <ClipboardCopy size={13} /> Copy Result
                                    </button>
                                    <button onClick={() => downloadCSV(result.items, 'lintel_estimation.csv')} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                                        <Download size={13} /> Export CSV
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[11px] text-gray-400 uppercase bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3">Material Description</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-center w-[80px]">Unit</th>
                                        <th className="px-4 py-3 text-right w-[150px]">Unit Price (Editable)</th>
                                        <th className="px-4 py-3 text-right bg-gray-50/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-700">{item.name}</td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">{item.qty.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 uppercase">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <TablePriceInput
                                                    value={prices[item.priceKey] !== undefined ? prices[item.priceKey] : item.price}
                                                    onChange={(val) => setPrices(prev => ({ ...prev, [item.priceKey]: val }))}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-purple-700 bg-purple-50/10 tabular-nums">₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex items-start gap-2 text-gray-400 px-1">
                            <Info size={14} className="mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] italic leading-relaxed">
                                Lintel length = opening width + 0.40m (200mm bearing each side). Calculations use Concrete Class A (1:2:4) with 5% waste factor.
                                Rebar quantities include 40D anchorage length. Formworks are excluded here as they are handled in the Formworks tab.
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
