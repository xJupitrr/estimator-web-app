import React, { useState, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Settings, Calculator, PlusCircle, Trash2, Box, Info, AlertCircle, ClipboardCopy, Download, Layout } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import { calculateCeiling, DEFAULT_PRICES, CEILING_TYPES } from '../../utils/calculations/ceilingCalculator';

const getInitialRow = () => ({
    id: Date.now() + Math.random(),
    quantity: 1,
    length_m: "",
    width_m: "",
    ceiling_type: "gypsum_board",
    description: "",
});

export default function Ceiling() {
    const [rows, setRows] = useLocalStorage('ceiling_rows', [getInitialRow()]);
    const [prices, setPrices] = useLocalStorage('ceiling_prices', DEFAULT_PRICES);
    const [result, setResult] = useLocalStorage('ceiling_result', null);
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
        const isValid = rows.some(r => r.length_m && r.width_m);
        if (!isValid) {
            setError("Please fill in dimensions for at least one area.");
            setResult(null);
            return;
        }
        setError(null);

        const calcResult = calculateCeiling(rows, prices);
        if (calcResult) {
            setResult(calcResult);
        } else {
            setResult(null);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('ceiling_total', result.total);
        } else {
            setSessionData('ceiling_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    const updatePrice = (key, value) => {
        setPrices(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden border-t-4 border-t-purple-500">
                <div className="p-4 bg-purple-50 border-b border-purple-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-purple-900 flex items-center gap-2">
                        <Layout size={18} /> Ceiling Area Configuration
                    </h2>
                    <button
                        onClick={handleAddRow}
                        className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md text-xs font-bold hover:bg-purple-700 transition-all active:scale-95 shadow-sm justify-center"
                    >
                        <PlusCircle size={14} /> Add Ceiling Area
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[800px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[60px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center">Description</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Length (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Width (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[160px]">Material Type</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 text-center text-xs text-slate-400 font-bold">{index + 1}</td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput value={row.quantity} onChange={(val) => handleRowChange(row.id, 'quantity', val)} className="w-full p-1.5 text-center border-gray-300 rounded text-sm font-bold" />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <input type="text" value={row.description} onChange={(e) => handleRowChange(row.id, 'description', e.target.value)} className="w-full p-1.5 border-gray-300 rounded text-sm" placeholder="e.g. Master Bedroom" />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput value={row.length_m} onChange={(val) => handleRowChange(row.id, 'length_m', val)} className="w-full p-1.5 text-center border-gray-300 rounded text-sm" placeholder="0.00" />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput value={row.width_m} onChange={(val) => handleRowChange(row.id, 'width_m', val)} className="w-full p-1.5 text-center border-gray-300 rounded text-sm" placeholder="0.00" />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput
                                            value={row.ceiling_type}
                                            onChange={(val) => handleRowChange(row.id, 'ceiling_type', val)}
                                            options={CEILING_TYPES.map(t => ({ id: t.id, display: t.label }))}
                                            focusColor="purple"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center">
                                        <button onClick={() => handleRemoveRow(row.id)} disabled={rows.length === 1} className="p-2 text-red-400 hover:text-red-600 disabled:text-gray-200">
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
                    <button onClick={handleCalculate} className="w-full sm:w-auto px-8 py-3 bg-purple-600 text-white rounded-lg font-bold shadow-lg hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Calculator size={18} /> Calculate Ceiling
                    </button>
                </div>
            </div>

            {result && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border-l-4 border-l-purple-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Ceiling Result</h3>
                                <p className="text-sm text-gray-500 mt-1">Total Ceiling Area: <strong className="text-gray-700">{result.totalArea.toFixed(2)} m²</strong></p>
                            </div>
                            <div className="text-left md:text-right bg-purple-50 px-5 py-3 rounded-xl border border-purple-100">
                                <p className="text-xs text-purple-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                <p className="font-bold text-4xl text-purple-700 tracking-tight">₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3">Material Item</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right">Unit Price</th>
                                        <th className="px-4 py-3 text-right bg-purple-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium font-sans">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-purple-50 transition-colors">
                                            <td className="px-4 py-3 text-purple-900">{item.name}</td>
                                            <td className="px-4 py-3 text-right">{item.qty}</td>
                                            <td className="px-4 py-3 text-center"><span className="bg-purple-100 px-2 py-1 rounded text-[10px] text-purple-600 uppercase font-bold">{item.unit}</span></td>
                                            <td className="px-4 py-2 text-right">
                                                <div className="flex items-center justify-end">
                                                    <span className="text-gray-400 text-xs mr-1 font-bold">₱</span>
                                                    <input type="number" value={prices[item.priceKey] || 0} onChange={(e) => updatePrice(item.priceKey, e.target.value)} className="w-20 px-1 py-0.5 text-right border-purple-200 rounded text-xs focus:ring-1 focus:ring-purple-400 outline-none" />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-purple-900 font-extrabold bg-purple-50/30">₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
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
