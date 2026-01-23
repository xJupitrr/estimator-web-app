import React, { useState } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Settings, Calculator, PlusCircle, Trash2, Box, ClipboardCopy, Download, AlertCircle, Tent } from 'lucide-react';
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
        className={`w-full p-1.5 text-center border border-slate-300 rounded text-sm focus:ring-2 focus:ring-rose-500 outline-none font-medium bg-white text-slate-900 ${className}`}
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

const ROOFING_TYPES = [
    { id: 'rib_type', label: 'Rib-Type (Long Span)', eff_width: 1.0, default_price: 480 },
    { id: 'corrugated', label: 'Corrugated (Standard)', eff_width: 0.76, default_price: 380 },
    { id: 'tile_span', label: 'Tile Span (Premium)', eff_width: 1.0, default_price: 550 },
    { id: 'custom', label: 'Custom Spec', eff_width: 0.70, default_price: 400 },
];

const DEFAULT_DEFAULTS = {
    wasteFactor: 5, // percent
};

const DEFAULT_PRICES = {
    tek_screw_pc: 2.50,
};

// Populate default prices for types
ROOFING_TYPES.forEach(t => {
    DEFAULT_PRICES[`roof_${t.id}`] = t.default_price;
});

// Initial Row Template
const getInitialRow = (data = {}) => ({
    id: Date.now() + Math.random(),
    quantity: data.quantity || 1,
    type: 'rib_type',
    length_m: data.length_m || "", // Slope / Long Span Length
    width_m: data.width_m || "", // Width to be covered
    description: data.description || "",
});


export default function Roofing() {
    // --- State ---
    // Persisted States
    const [rows, setRows] = useLocalStorage('roofing_rows', [getInitialRow()]);
    const [prices, setPrices] = useLocalStorage('roofing_prices', DEFAULT_PRICES);
    const [globalSettings, setGlobalSettings] = useLocalStorage('roofing_settings', DEFAULT_DEFAULTS);

    // UI States (Transient)
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleRowChange = (id, field, value) => {
        setRows(prev =>
            prev.map(row => {
                if (row.id !== id) return row;
                return { ...row, [field]: value };
            })
        );
        setResult(null);
        setError(null);
    };

    const handleAddRow = () => {
        setRows(prev => [...prev, getInitialRow()]);
        setResult(null);
        setError(null);
    };

    const handleRemoveRow = (id) => {
        if (rows.length > 1) {
            setRows(prev => prev.filter(row => row.id !== id));
            setResult(null);
            setError(null);
        } else {
            setRows([getInitialRow()]);
        }
    };

    // --- Calculation Engine ---
    const calculateRoofing = () => {
        let totalSheetsCount = 0;
        let totalAreaRaw = 0;

        // Group by type
        const typeGroups = {};

        let isValid = false;

        rows.forEach(row => {
            const Q = parseInt(row.quantity) || 0;
            const L = parseFloat(row.length_m) || 0; // Length (Slope)
            const W = parseFloat(row.width_m) || 0; // Width (Run perlin direction)
            const typeId = row.type;
            const typeSpec = ROOFING_TYPES.find(t => t.id === typeId) || ROOFING_TYPES[0];
            const effWidth = typeSpec.eff_width;

            if (Q > 0 && L > 0 && W > 0) {
                isValid = true;
                const sheetsRequired = Math.ceil(W / effWidth);
                const rowLinearMeters = sheetsRequired * L * Q;

                totalSheetsCount += sheetsRequired * Q;
                totalAreaRaw += (L * W) * Q;

                if (!typeGroups[typeId]) {
                    typeGroups[typeId] = {
                        linearMeters: 0,
                        spec: typeSpec,
                        area: 0
                    };
                }
                typeGroups[typeId].linearMeters += rowLinearMeters;
                typeGroups[typeId].area += (L * W) * Q;
            }
        });

        if (!isValid) {
            setError("Please enter valid dimensions (Qty, Length, Width) for at least one row.");
            setResult(null);
            return;
        }
        setError(null);

        const wasteMultiplier = 1 + (parseFloat(globalSettings.wasteFactor) / 100);

        // Final Items
        const finalItems = [];
        let grandTotal = 0;
        let totalLM_AllTypes = 0;

        // 1. Process Groups
        Object.keys(typeGroups).forEach(typeId => {
            const group = typeGroups[typeId];
            const finalLM = Math.ceil(group.linearMeters * wasteMultiplier);
            const priceKey = `roof_${typeId}`;
            const price = prices[priceKey] || group.spec.default_price;
            const total = finalLM * price;

            grandTotal += total;
            totalLM_AllTypes += finalLM;

            finalItems.push({
                name: `Roof Sheets (${group.spec.label})`,
                qty: finalLM,
                unit: "LM",
                priceKey: priceKey,
                price: price,
                total: total
            });
        });

        // 2. Tek Screws (Based on Total LM of all types)
        // Estimate: 5 pcs per LM
        const fastenersCount = Math.ceil(totalLM_AllTypes * 5);
        const screwPrice = prices.tek_screw_pc || 0;
        const screwTotal = fastenersCount * screwPrice;
        grandTotal += screwTotal;
        finalItems.push({
            name: "Tek Screws (Estimate)",
            qty: fastenersCount,
            unit: "pcs",
            priceKey: "tek_screw_pc",
            price: screwPrice,
            total: screwTotal
        });

        setResult({
            area: totalAreaRaw.toFixed(2),
            items: finalItems,
            grandTotal: grandTotal,
            totalSheets: totalSheetsCount
        });
    };

    return (
        <div className="space-y-6">

            {/* INPUT CARD */}
            <Card className="border-t-4 border-t-rose-600 shadow-md">
                <div className="p-4 bg-rose-50 border-b border-rose-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-rose-900 flex items-center gap-2">
                        <Settings size={18} /> Roofing Configuration
                    </h2>
                    <button
                        onClick={handleAddRow}
                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-md text-xs font-bold hover:bg-rose-700 transition-colors active:scale-95 shadow-sm"
                    >
                        <PlusCircle size={14} /> Add Area
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-1">
                        <Box size={14} className="text-rose-500/50" /> Roof Dimensions
                    </h3>
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[800px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[70px]">Qty</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[180px] bg-rose-50 text-rose-900">Type</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-rose-50 text-rose-900">Length (m)<br /><span className="text-[9px] opacity-70 normal-case">(Slope)</span></th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-rose-50 text-rose-900">Width (m)<br /><span className="text-[9px] opacity-70 normal-case">(Total Cover)</span></th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center">Description</th>
                                <th className="px-1 py-2 font-bold border border-slate-300 text-center w-[40px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors text-xs font-semibold">
                                    <td className="p-2 border border-slate-300 align-middle text-center text-gray-500 font-bold">{index + 1}</td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput value={row.quantity} onChange={(v) => handleRowChange(row.id, 'quantity', v)} min="1" step="1" className="font-bold" />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <select
                                            value={row.type}
                                            onChange={(e) => handleRowChange(row.id, 'type', e.target.value)}
                                            className="w-full p-1.5 text-center border border-slate-300 rounded bg-white outline-none cursor-pointer text-sm font-bold text-slate-700"
                                        >
                                            {ROOFING_TYPES.map(opt => (
                                                <option key={opt.id} value={opt.id}>
                                                    {opt.label} ({opt.eff_width}m)
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={row.length_m} onChange={(v) => handleRowChange(row.id, 'length_m', v)} placeholder="eg. 5.0" /></td>
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={row.width_m} onChange={(v) => handleRowChange(row.id, 'width_m', v)} placeholder="eg. 12.0" /></td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <input type="text" value={row.description} onChange={(e) => handleRowChange(row.id, 'description', e.target.value)} placeholder="e.g. Main Roof" className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-rose-400 outline-none" />
                                    </td>
                                    <td className="p-1 border border-slate-300 align-middle text-center">
                                        <button onClick={() => handleRemoveRow(row.id)} disabled={rows.length === 1} className={`p-1.5 rounded-full transition-colors ${rows.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}><Trash2 size={14} /></button>
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

                <div className="p-6 bg-slate-50 border-t border-gray-200 flex flex-col xl:flex-row justify-between items-center gap-6">
                    <div className="flex flex-wrap items-center gap-6 justify-center w-full xl:w-auto">
                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Waste<br />Factor %</label>
                            <input
                                type="number"
                                value={globalSettings.wasteFactor}
                                onChange={(e) => setGlobalSettings(p => ({ ...p, wasteFactor: e.target.value }))}
                                className="w-12 p-1.5 text-center text-sm font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-rose-400 outline-none"
                            />
                        </div>
                    </div>

                    <button onClick={calculateRoofing} className="w-full xl:w-auto px-8 py-3 bg-rose-600 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-all hover:bg-rose-700 uppercase tracking-wider text-sm flex items-center justify-center gap-2 min-w-[200px]">
                        <Calculator size={18} /> Calculate
                    </button>
                </div>
            </Card>

            {/* RESULTS */}
            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-emerald-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">Estimation Summary</h3>
                                <div className="flex gap-4 mt-2">
                                    <div className="bg-rose-50 px-3 py-1 rounded text-sm text-rose-700 border border-rose-100">
                                        Total Actual Area: <strong>{result.area} sq.m</strong>
                                    </div>
                                    <div className="bg-blue-50 px-3 py-1 rounded text-sm text-blue-700 border border-blue-100">
                                        Total Sheets: <strong>{result.totalSheets} pcs</strong>
                                    </div>
                                </div>
                            </div>
                            <div className="text-left md:text-right bg-emerald-50 px-5 py-3 rounded-xl border border-emerald-100 flex flex-col items-end">
                                <p className="text-xs text-emerald-800 font-bold uppercase tracking-wide mb-1">Total Material Cost</p>
                                <p className="font-bold text-4xl text-emerald-700 tracking-tight">₱{result.grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mb-4">
                            <button onClick={() => copyToClipboard(result.items)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"><ClipboardCopy size={14} /> Copy</button>
                            <button onClick={() => {
                                // Prepare inputs for export
                                const inputsToExport = rows.map(r => ({
                                    Quantity: r.quantity,
                                    Type: ROOFING_TYPES.find(t => t.id === r.type)?.label || r.type,
                                    Length: r.length_m,
                                    Width: r.width_m,
                                    Description: r.description
                                }));
                                downloadCSV(result.items, 'roofing_estimate.csv', inputsToExport);
                            }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"><Download size={14} /> CSV</button>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Material Item</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[140px]">Base Price</th>
                                        <th className="px-4 py-3 text-right bg-gray-100/50">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900">{item.qty.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-slate-500">{item.unit}</span></td>
                                            <td className="px-4 py-1.5"><TablePriceInput value={prices[item.priceKey] || item.price} onChange={(v) => { setPrices(p => ({ ...p, [item.priceKey]: v })); setResult(null); }} /></td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 bg-gray-50/50">₱{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            )}

            {!result && (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                    <div className="bg-white p-5 rounded-2xl shadow-sm mb-5"><Tent size={40} className="text-rose-500" /></div>
                    <p className="font-bold text-lg text-slate-600">Roofing Calculator</p>
                    <p className="max-w-xs text-center text-sm mt-1 leading-relaxed">Enter roof dimensions and select type to calculate <br />Long Span Linear Meters.</p>
                </div>
            )}
        </div>
    );
}
