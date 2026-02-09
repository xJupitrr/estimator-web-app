import React, { useState, useEffect } from 'react';
import { Columns, Info, Settings, Calculator, PlusCircle, Trash2, AlertCircle, ClipboardCopy, Download } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import SelectInput from '../common/SelectInput';
import { calculateFooting, DEFAULT_PRICES } from '../../utils/calculations/footingCalculator';

// Constants for rebar and concrete
const rebarDiameters = ["10mm", "12mm", "16mm", "20mm", "25mm"];
const commonLengths = [6.0, 7.5, 9.0, 10.5, 12.0];
const rebarOptions = rebarDiameters.flatMap(size =>
    commonLengths.map(length => `${size} x ${length.toFixed(1)}m`)
);

const getInitialFooting = () => ({
    id: Date.now() + Math.random(),
    quantity: 1,
    x_len: "", // Length (X) in meters
    y_len: "", // Width (Y) in meters
    z_depth: "", // Depth (Z) in meters
    rebarSpec: "12mm x 6.0m",
    rebar_x_count: "",
    rebar_y_count: "",
    description: "",
});

export default function Footing() {
    const [footings, setFootings] = useLocalStorage('footing_rows', [getInitialFooting()]);
    const [footingPrices, setFootingPrices] = useLocalStorage('footing_prices', DEFAULT_PRICES);
    const [footingResult, setFootingResult] = useLocalStorage('footing_result', null);
    const [error, setError] = useState(null);

    const handleFootingChange = (id, field, value) => {
        setFootings(prevFootings =>
            prevFootings.map(footing => (
                footing.id === id ? { ...footing, [field]: value } : footing
            ))
        );
        setError(null);
    };

    const handleAddFooting = () => {
        setFootings(prev => [...prev, getInitialFooting()]);
        setFootingResult(null);
    };

    const handleRemoveFooting = (id) => {
        if (footings.length > 1) {
            setFootings(prev => prev.filter(footing => footing.id !== id));
            setFootingResult(null);
        } else {
            setFootings([getInitialFooting()]);
        }
    };

    const calculateFootings = () => {
        // Validation Check
        const hasEmptyFields = footings.some(footing =>
            footing.x_len === "" ||
            footing.y_len === "" ||
            footing.z_depth === ""
        );

        if (hasEmptyFields) {
            setError("Please fill in all required dimensions (Length, Width, Depth) before calculating.");
            setFootingResult(null);
            return;
        }
        setError(null);

        const calcResult = calculateFooting(footings, footingPrices);

        if (calcResult) {
            setFootingResult(calcResult);
        } else {
            setFootingResult(null);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (footingResult) {
            setSessionData('footing_total', footingResult.total);
        } else {
            setSessionData('footing_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [footingResult]);

    const handlePriceChange = (key, value) => {
        setFootingPrices(prev => ({
            ...prev,
            [key]: parseFloat(value) || 0
        }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden border-t-4 border-t-emerald-600">
                <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-emerald-900 flex items-center gap-2">
                        <Columns size={18} /> Footing Configuration
                    </h2>
                    <button
                        onClick={handleAddFooting}
                        className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-sm justify-center"
                    >
                        <PlusCircle size={14} /> Add Row
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[1000px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[60px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[200px]">Description</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">X-Len (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Y-Wid (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Z-Dep (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[180px]">Rebar Spec</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">X-Rebars</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">Y-Rebars</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {footings.map((footing, index) => (
                                <tr key={footing.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 text-center text-xs text-slate-500 font-bold">{index + 1}</td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={footing.quantity}
                                            onChange={(val) => handleFootingChange(footing.id, 'quantity', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-bold"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <input
                                            type="text"
                                            value={footing.description}
                                            onChange={(e) => handleFootingChange(footing.id, 'description', e.target.value)}
                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                                            placeholder="e.g., F1 Main Column Footing"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={footing.x_len}
                                            onChange={(val) => handleFootingChange(footing.id, 'x_len', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={footing.y_len}
                                            onChange={(val) => handleFootingChange(footing.id, 'y_len', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={footing.z_depth}
                                            onChange={(val) => handleFootingChange(footing.id, 'z_depth', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-medium text-slate-600"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput
                                            value={footing.rebarSpec}
                                            onChange={(val) => handleFootingChange(footing.id, 'rebarSpec', val)}
                                            options={rebarOptions.map(opt => ({ id: opt, display: opt }))}
                                            focusColor="emerald"
                                            className="text-xs"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={footing.rebar_x_count}
                                            onChange={(val) => handleFootingChange(footing.id, 'rebar_x_count', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput
                                            value={footing.rebar_y_count}
                                            onChange={(val) => handleFootingChange(footing.id, 'rebar_y_count', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center">
                                        <button
                                            onClick={() => handleRemoveFooting(footing.id)}
                                            disabled={footings.length === 1}
                                            className={`p-2 rounded-full transition-colors ${footings.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
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
                    <button onClick={calculateFootings} className="w-full sm:w-auto px-8 py-3 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Calculator size={18} /> Calculate Footing
                    </button>
                </div>
            </div>

            {footingResult && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border-l-4 border-l-emerald-600">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Estimation Result</h3>
                                <p className="text-sm text-gray-500 mt-1">Total Concrete Volume: <strong className="text-gray-700">{footingResult.volume} m³</strong></p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="text-left md:text-right bg-emerald-50 px-5 py-3 rounded-xl border border-emerald-100">
                                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                    <p className="font-bold text-4xl text-emerald-700 tracking-tight">
                                        ₱{footingResult.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                    {footingResult.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">{item.qty}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center justify-end">
                                                    <span className="text-gray-400 text-xs mr-1 font-bold">₱</span>
                                                    <input
                                                        type="number"
                                                        value={footingPrices[item.priceKey] || 0}
                                                        onChange={(e) => handlePriceChange(item.priceKey, e.target.value)}
                                                        className="w-24 px-2 py-1 text-right text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-400 outline-none font-medium"
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
