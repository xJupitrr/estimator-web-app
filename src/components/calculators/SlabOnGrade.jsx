import React, { useState, useEffect } from 'react';
import { Settings, Calculator, PlusCircle, Trash2, AlertCircle, ClipboardCopy, Download } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

// Helper component for currency inputs (Used in table now)
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
            className="w-20 pl-2 pr-2 py-1.5 text-right text-sm border border-gray-300 rounded-r-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-gray-800 font-medium transition-colors border-l-0"
        />
    </div>
);

// Format number to Philippine Peso (₱) - Helper for text display
const formatPrice = (value) => {
    return value ? parseFloat(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
};

const rebarDiameters = ["10mm", "12mm", "16mm"];
const commonLengths = [6.0, 7.5, 9.0, 10.5, 12.0];
const rebarOptions = rebarDiameters.flatMap(size =>
    commonLengths.map(length => `${size} x ${length.toFixed(1)}m`)
);

const extractLength = (spec) => parseFloat(spec.split(' x ')[1].replace('m', ''));
const extractDiameterMeters = (spec) => {
    const size = parseFloat(spec.split('mm')[0]) / 1000;
    return size;
}

const getInitialSlab = () => ({
    id: crypto.randomUUID(),
    length: "",
    width: "",
    thickness: "",
    gravelBeddingThickness: "",
    quantity: 1,
    barSize: "10mm x 6.0m", // Default to full spec
    spacing: 0.40,
});

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

import useLocalStorage from '../../hooks/useLocalStorage';

export default function SlabOnGrade() {
    const [slabs, setSlabs] = useLocalStorage('slab_rows', [getInitialSlab()]);
    const [prices, setPrices] = useLocalStorage('slab_prices', {
        cement: 240,
        sand: 1200,
        gravel: 1000,
        gravelBeddingPrice: 800,
        rebar10mmPrice: 180,
        rebar12mmPrice: 240,
        rebar16mmPrice: 450,
        tieWire: 30,
    });
    const [result, setResult] = useState(null);
    const [hasEstimated, setHasEstimated] = useState(false);
    const [error, setError] = useState(null);

    const handleSlabChange = (id, field, value) => {
        setSlabs(prev =>
            prev.map(slab => (
                slab.id === id ? { ...slab, [field]: value } : slab
            ))
        );
        setError(null);
    };

    const handleAddSlab = () => {
        setSlabs(prev => [...prev, getInitialSlab()]);
        setHasEstimated(false);
        setResult(null);
        setError(null);
    };

    const handleRemoveSlab = (id) => {
        if (slabs.length > 1) {
            setSlabs(prev => prev.filter(slab => slab.id !== id));
            setHasEstimated(false);
            setResult(null);
            setError(null);
        } else {
            setSlabs([getInitialSlab()]);
        }
    };

    useEffect(() => {
        if (hasEstimated) {
            calculateSlab();
        }
    }, [prices]);

    const calculateSlab = () => {
        let totalConcreteVolume = 0;
        let totalTiePoints = 0;
        let totalGravelBeddingVolume = 0;
        const rebarStock = new Map();
        let totalArea = 0;

        // Validation Check
        const hasEmptyFields = slabs.some(slab =>
            slab.length === "" || slab.width === "" || slab.thickness === "" || slab.gravelBeddingThickness === ""
        );

        if (hasEmptyFields) {
            setError("Please fill in all required fields (Length, Width, Thickness, Bedding) before calculating.");
            setResult(null);
            setHasEstimated(false);
            return;
        }
        setError(null);

        slabs.forEach(slab => {
            const length = parseFloat(slab.length) || 0;
            const width = parseFloat(slab.width) || 0;
            const thickness = parseFloat(slab.thickness) || 0;
            const beddingThickness = parseFloat(slab.gravelBeddingThickness) || 0;
            const spacing = parseFloat(slab.spacing) || 0.40;
            const quantity = parseInt(slab.quantity) || 1;

            if (length <= 0 || width <= 0 || thickness <= 0) return;

            const singleArea = length * width;
            const singleVol = singleArea * thickness;
            const totalVol = singleVol * quantity;

            totalConcreteVolume += totalVol;
            totalArea += (singleArea * quantity);

            const singleBeddingVol = singleArea * beddingThickness;
            totalGravelBeddingVolume += (singleBeddingVol * quantity);

            const numBarsAlongWidth = Math.ceil(width / spacing) + 1;
            const numBarsAlongLength = Math.ceil(length / spacing) + 1;

            const spec = slab.barSize; // Use the selected full spec string

            for (let q = 0; q < quantity; q++) {
                for (let i = 0; i < numBarsAlongWidth; i++) {
                    processSingleRun(length, spec, rebarStock);
                }
                for (let i = 0; i < numBarsAlongLength; i++) {
                    processSingleRun(width, spec, rebarStock);
                }
            }

            const intersections = numBarsAlongWidth * numBarsAlongLength;
            totalTiePoints += (intersections * quantity);
        });

        if (totalConcreteVolume <= 0) {
            setResult(null);
            setHasEstimated(false);
            return;
        }

        const V_dry_concrete = totalConcreteVolume * 1.5;
        const V_cement = V_dry_concrete * (1 / 7);
        const V_sand = V_dry_concrete * (2 / 7);
        const V_gravel = V_dry_concrete * (4 / 7);

        const CEMENT_BAG_VOLUME = 0.035;

        const finalCement = Math.ceil(V_cement / CEMENT_BAG_VOLUME * 1.05);
        const finalSand = (V_sand * 1.05).toFixed(2);
        const finalGravel = (V_gravel * 1.05).toFixed(2);

        const costCement = finalCement * prices.cement;
        const costSand = parseFloat(finalSand) * prices.sand;
        const costGravel = parseFloat(finalGravel) * prices.gravel;

        const finalGravelBedding = (totalGravelBeddingVolume * 1.05).toFixed(2);
        const costGravelBedding = parseFloat(finalGravelBedding) * prices.gravelBeddingPrice;

        let finalRebarItems = [];
        let totalRebarCost = 0;

        rebarStock.forEach((stock, spec) => {
            const [size, lengthStr] = spec.split(' x ');
            const finalQtyPurchase = stock.purchased;
            const sizeNum = parseFloat(size.replace('mm', ''));

            let price = 0;
            let priceKey = '';
            if (sizeNum === 10) { price = prices.rebar10mmPrice; priceKey = 'rebar10mmPrice'; }
            else if (sizeNum === 12) { price = prices.rebar12mmPrice; priceKey = 'rebar12mmPrice'; }
            else if (sizeNum === 16) { price = prices.rebar16mmPrice; priceKey = 'rebar16mmPrice'; }

            const total = finalQtyPurchase * price;
            totalRebarCost += total;

            finalRebarItems.push({
                name: `Corrugated Rebar (${size} x ${lengthStr})`,
                qty: finalQtyPurchase,
                unit: 'pcs',
                price: price,
                priceKey: priceKey,
                total: total,
            });
        });

        const TIE_WIRE_PER_INTERSECTION = 0.3;
        const TIE_WIRE_ROLL_KG = 50;
        const TIE_WIRE_LM_PER_ROLL = 600;
        const KG_PER_LM = TIE_WIRE_ROLL_KG / TIE_WIRE_LM_PER_ROLL;

        const totalLMTieWire = totalTiePoints * TIE_WIRE_PER_INTERSECTION;
        const totalKGRequired = totalLMTieWire * KG_PER_LM;
        const finalKGPurchase = Math.ceil(totalKGRequired * 1.05);
        const costTieWire = finalKGPurchase * prices.tieWire;

        const totalOverallCost = costCement + costSand + costGravel + costGravelBedding + totalRebarCost + costTieWire;

        const items = [
            { name: 'Portland Cement (40kg)', qty: finalCement, unit: 'bags', price: prices.cement, priceKey: 'cement', total: costCement },
            { name: 'Wash Sand (S1)', qty: finalSand, unit: 'cu.m', price: prices.sand, priceKey: 'sand', total: costSand },
            { name: 'Crushed Gravel (3/4)', qty: finalGravel, unit: 'cu.m', price: prices.gravel, priceKey: 'gravel', total: costGravel },
            { name: 'Gravel Bedding / Sub-base', qty: finalGravelBedding, unit: 'cu.m', price: prices.gravelBeddingPrice, priceKey: 'gravelBeddingPrice', total: costGravelBedding },
            ...finalRebarItems,
            { name: 'G.I. Tie Wire (#16)', qty: finalKGPurchase, unit: 'kg', price: prices.tieWire, priceKey: 'tieWire', total: costTieWire },
        ];

        setResult({
            volume: totalConcreteVolume.toFixed(2),
            quantity: slabs.length,
            items,
            total: totalOverallCost
        });
        setHasEstimated(true);
    };

    const handlePriceChange = (key, newValue) => {
        setPrices(prev => ({
            ...prev,
            [key]: parseFloat(newValue) || 0
        }));
    };

    return (
        <div className="space-y-6">
            <Card className="border-t-4 border-t-blue-500 shadow-md">
                <div className="p-4 bg-blue-50 border-b border-blue-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-blue-900 flex items-center gap-2">
                        <Settings size={18} /> Slab Configuration ({slabs.length} Total)
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddSlab}
                            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 transition-colors active:scale-95 shadow-sm"
                            title="Add another slab row"
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
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Length (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Width (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Thickness (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Bedding (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Bar Size</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Spacing (m)</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {slabs.map((slab, index) => (
                                <tr key={slab.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold">{index + 1}</td>

                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            placeholder="1"
                                            value={slab.quantity}
                                            onChange={(val) => handleSlabChange(slab.id, 'quantity', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none font-bold bg-white text-slate-900"
                                        />
                                    </td>

                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <MathInput
                                                placeholder="4.00"
                                                value={slab.length}
                                                onChange={(val) => handleSlabChange(slab.id, 'length', val)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>

                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <MathInput
                                                placeholder="3.00"
                                                value={slab.width}
                                                onChange={(val) => handleSlabChange(slab.id, 'width', val)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>

                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <MathInput
                                                placeholder="0.10"
                                                value={slab.thickness}
                                                onChange={(val) => handleSlabChange(slab.id, 'thickness', val)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>

                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <MathInput
                                                placeholder="0.10"
                                                value={slab.gravelBeddingThickness}
                                                onChange={(val) => handleSlabChange(slab.id, 'gravelBeddingThickness', val)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>

                                    <td className="p-2 border border-slate-300 align-middle">
                                        <select
                                            value={slab.barSize}
                                            onChange={(e) => handleSlabChange(slab.id, 'barSize', e.target.value)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded bg-white focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer text-sm font-medium"
                                        >
                                            {rebarOptions.map(spec => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <MathInput
                                                placeholder="0.40"
                                                value={slab.spacing}
                                                onChange={(val) => handleSlabChange(slab.id, 'spacing', val)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>

                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <button
                                            onClick={() => handleRemoveSlab(slab.id)}
                                            disabled={slabs.length === 1}
                                            className={`p-2 rounded-full transition-colors ${slabs.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
                                            title={slabs.length === 1 ? 'Minimum one slab is required' : 'Remove Slab'}
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
                    <button onClick={calculateSlab} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-all hover:bg-blue-700 uppercase tracking-wider text-sm flex items-center justify-center gap-2 min-w-[200px]">
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
                                    Based on <strong className="text-gray-600">{result.quantity}</strong> slab configurations.
                                </p>
                            </div>
                            <div className="text-left md:text-right bg-blue-50 px-5 py-3 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                <p className="font-bold text-4xl text-blue-700 tracking-tight">
                                    ₱{formatPrice(result.total)}
                                </p>
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
                                onClick={() => downloadCSV(result.items, 'slab_estimation.csv')}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                                title="Download as CSV"
                            >
                                <Download size={14} /> CSV
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200 mb-2">
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
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">
                                                {item.qty}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <TablePriceInput
                                                    value={item.price}
                                                    onChange={(newValue) => handlePriceChange(item.priceKey, newValue)}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 bg-gray-50/50">₱{formatPrice(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
