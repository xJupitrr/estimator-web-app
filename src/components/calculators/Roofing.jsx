import React, { useState, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Settings, Calculator, PlusCircle, Trash2, Box, ClipboardCopy, Download, AlertCircle, Tent } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import { calculateRoofing as calculateRoofingUtil } from '../../utils/calculations/roofingCalculator';

const ROOFING_TYPES = [
    { id: 'rib_type', label: 'Rib-Type (Long Span)', eff_width: 1.0, default_price: 480 },
    { id: 'corrugated', label: 'Corrugated (Standard)', eff_width: 0.75, default_price: 350 },
    { id: 'tile_span', label: 'Tile Span (Red/Green)', eff_width: 1.0, default_price: 550 },
    { id: 'gi_sheet', label: 'G.I. Sheet (Plain)', eff_width: 0.8, default_price: 320 },
];

const DEFAULT_DEFAULTS = {
    wasteFactor: 5, // percent
};

const DEFAULT_PRICES = {
    umbrella_screws: 2.50,
    tekscrews: 1.50,
    sealant: 280,
};
ROOFING_TYPES.forEach(t => {
    DEFAULT_PRICES[`roof_${t.id}`] = t.default_price;
});

const getInitialRow = (data = {}) => ({
    id: Date.now() + Math.random(),
    quantity: data.quantity || 1,
    type: 'rib_type',
    length_m: data.length_m || "",
    width_m: data.width_m || "",
    description: data.description || "",
});

export default function Roofing() {
    const [rows, setRows] = useLocalStorage('roofing_rows', [getInitialRow()]);
    const [prices, setPrices] = useLocalStorage('roofing_prices', DEFAULT_PRICES);
    const [globalSettings, setGlobalSettings] = useLocalStorage('roofing_settings', DEFAULT_DEFAULTS);
    const [result, setResult] = useLocalStorage('roofing_result', null);
    const [error, setError] = useState(null);

    const handleRowChange = (id, field, value) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
        setResult(null);
    };

    const handleAddRow = () => {
        setRows(prev => [...prev, getInitialRow()]);
        setResult(null);
    };

    const handleRemoveRow = (id) => {
        if (rows.length > 1) {
            setRows(prev => prev.filter(r => r.id !== id));
            setResult(null);
        } else {
            setRows([getInitialRow()]);
        }
    };

    const handleCalculate = () => {
        // Validation
        const isValid = rows.some(row => {
            const Q = parseInt(row.quantity) || 0;
            const L = parseFloat(row.length_m) || 0;
            const W = parseFloat(row.width_m) || 0;
            return Q > 0 && L > 0 && W > 0;
        });

        if (!isValid) {
            setError("Please fill in quantity and dimensions for at least one roof area.");
            setResult(null);
            return;
        }
        setError(null);

        const calcResult = calculateRoofingUtil(rows, prices, globalSettings);

        if (calcResult) {
            setResult(calcResult);
        } else {
            setResult(null);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('roofing_total', result.total);
        } else {
            setSessionData('roofing_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    const updatePrice = (key, value) => {
        setPrices(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden border-t-4 border-t-red-500">
                <div className="p-4 bg-red-50 border-b border-red-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-red-900 flex items-center gap-2">
                        <Tent size={18} /> Roofing Configuration
                    </h2>
                    <button
                        onClick={handleAddRow}
                        className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 transition-all active:scale-95 shadow-sm justify-center"
                    >
                        <PlusCircle size={14} /> Add Roof Area
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[800px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[60px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center">Description</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[160px]">Roofing Type</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Length (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Width (m)</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 text-center text-xs text-slate-500 font-bold">{index + 1}</td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={row.quantity}
                                            onChange={(val) => handleRowChange(row.id, 'quantity', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-400 outline-none font-bold"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <input
                                            type="text"
                                            value={row.description}
                                            onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-400 outline-none"
                                            placeholder="e.g., Main Roof"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput
                                            value={row.type}
                                            onChange={(val) => handleRowChange(row.id, 'type', val)}
                                            options={ROOFING_TYPES.map(t => ({ id: t.id, display: t.label }))}
                                            focusColor="red"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={row.length_m}
                                            onChange={(val) => handleRowChange(row.id, 'length_m', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-400 outline-none"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={row.width_m}
                                            onChange={(val) => handleRowChange(row.id, 'width_m', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-400 outline-none"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center">
                                        <button
                                            onClick={() => handleRemoveRow(row.id)}
                                            disabled={rows.length === 1}
                                            className={`p-2 rounded-full transition-colors ${rows.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
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
                    <div className="p-4 bg-red-50 border-t border-red-200 text-red-700 text-sm font-medium flex items-center justify-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button onClick={handleCalculate} className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white rounded-lg font-bold shadow-lg hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Calculator size={18} /> Calculate Roofing
                    </button>
                </div>
            </div>

            {result && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border-l-4 border-l-red-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Estimation Result</h3>
                                <p className="text-sm text-gray-500 mt-1">Total Roof Area: <strong className="text-gray-700">{result.totalArea.toFixed(2)} m²</strong></p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="text-left md:text-right bg-red-50 px-5 py-3 rounded-xl border border-red-100">
                                    <p className="text-xs text-red-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                    <p className="font-bold text-4xl text-red-700 tracking-tight">
                                        ₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">Material Item</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right">Unit Price</th>
                                        <th className="px-4 py-3 text-right bg-gray-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">{item.qty}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <div className="flex items-center justify-end">
                                                    <span className="text-gray-400 text-xs mr-1">₱</span>
                                                    <input
                                                        type="number"
                                                        value={prices[item.priceKey] || 0}
                                                        onChange={(e) => updatePrice(item.priceKey, e.target.value)}
                                                        className="w-24 px-2 py-1 text-right text-sm border border-gray-300 rounded focus:ring-2 focus:ring-red-400 outline-none font-medium"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 bg-gray-50/50">
                                                ₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
