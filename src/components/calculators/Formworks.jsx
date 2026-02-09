import React, { useState, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Info, Settings, Calculator, PlusCircle, Trash2, Box, Package, Hammer, AlertCircle, ClipboardCopy, Download, Copy, CheckSquare } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import { calculateFormworks, DEFAULT_PRICES, PLYWOOD_OPTIONS, LUMBER_OPTIONS } from '../../utils/calculations/formworksCalculator';

const getInitialRow = (data = {}) => ({
    id: Date.now() + Math.random(),
    quantity: data.quantity || 1,
    length_m: data.length_m || "",
    width_m: data.width_m || "",
    height_m: data.height_m || "",
    description: data.description || "",
    plywood_type: data.plywood_type || 'phenolic_1_2',
    lumber_size: data.lumber_size || 'lumber_2x2',
});

export default function Formworks({ columns = [], beams = [] }) {
    const [rows, setRows] = useLocalStorage('formworks_rows', [getInitialRow()]);
    const [prices, setPrices] = useLocalStorage('formworks_prices', DEFAULT_PRICES);
    const [result, setResult] = useLocalStorage('formworks_result', null);
    const [error, setError] = useState(null);
    const [wastePlywood, setWastePlywood] = useLocalStorage('formworks_waste_plywood', 15);
    const [wasteLumber, setWasteLumber] = useLocalStorage('formworks_waste_lumber', 10);
    const [includeColumns, setIncludeColumns] = useLocalStorage('formworks_include_columns', false);
    const [includeBeams, setIncludeBeams] = useLocalStorage('formworks_include_beams', false);
    const [importPlywood, setImportPlywood] = useLocalStorage('formworks_import_plywood', 'phenolic_1_2');
    const [importLumber, setImportLumber] = useLocalStorage('formworks_import_lumber', 'lumber_2x3');

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

    const performCalculation = () => {
        const config = {
            wastePlywood,
            wasteLumber,
            includeColumns,
            includeBeams,
            importPlywood,
            importLumber,
            columns,
            beams
        };
        const calcResult = calculateFormworks(rows, config, prices);

        if (calcResult) {
            setResult(calcResult);
        } else {
            setResult(null);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('formworks_total', result.total);
        } else {
            setSessionData('formworks_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    const updatePrice = (key, value) => {
        setPrices(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden border-t-4 border-t-slate-700">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                        <Hammer size={18} /> Manual Formwork Entry
                    </h2>
                    <button
                        onClick={handleAddRow}
                        className="flex items-center gap-1 px-4 py-2 bg-slate-700 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-sm justify-center"
                    >
                        <PlusCircle size={14} /> Add Manual Row
                    </button>
                </div>

                <div className="p-4 overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[900px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[60px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center">Description</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">L (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">W (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">H (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[180px]">Plywood</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[180px]">Lumber</th>
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
                                        <input type="text" value={row.description} onChange={(e) => handleRowChange(row.id, 'description', e.target.value)} className="w-full p-1.5 border-gray-300 rounded text-sm" placeholder="e.g. Stair Formwork" />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput value={row.length_m} onChange={(val) => handleRowChange(row.id, 'length_m', val)} className="w-full p-1.5 text-center border-gray-300 rounded text-sm" placeholder="0.00" />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput value={row.width_m} onChange={(val) => handleRowChange(row.id, 'width_m', val)} className="w-full p-1.5 text-center border-gray-300 rounded text-sm" placeholder="0.00" />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput value={row.height_m} onChange={(val) => handleRowChange(row.id, 'height_m', val)} className="w-full p-1.5 text-center border-gray-300 rounded text-sm" placeholder="0.00" />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <select value={row.plywood_type} onChange={(e) => handleRowChange(row.id, 'plywood_type', e.target.value)} className="w-full p-1 border-gray-300 rounded text-xs bg-white">
                                            {PLYWOOD_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <select value={row.lumber_size} onChange={(e) => handleRowChange(row.id, 'lumber_size', e.target.value)} className="w-full p-1 border-gray-300 rounded text-xs bg-white">
                                            {LUMBER_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                        </select>
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

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            Plywood Waste %
                            <input type="number" value={wastePlywood} onChange={(e) => setWastePlywood(parseInt(e.target.value) || 0)} className="w-16 p-1 border rounded" />
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            Lumber Waste %
                            <input type="number" value={wasteLumber} onChange={(e) => setWasteLumber(parseInt(e.target.value) || 0)} className="w-16 p-1 border rounded" />
                        </label>
                    </div>
                    <button onClick={performCalculation} className="px-8 py-3 bg-slate-800 text-white rounded-lg font-bold shadow-lg hover:bg-slate-900 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-wide text-xs">
                        <Calculator size={18} /> Calculate Formworks
                    </button>
                </div>
            </div>

            {result && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border-l-4 border-l-slate-700">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Formwork Result</h3>
                                <p className="text-sm text-gray-500 mt-1">Total Contact Area: <strong className="text-gray-700">{result.totalArea.toFixed(2)} m²</strong></p>
                            </div>
                            <div className="text-left md:text-right bg-slate-50 px-5 py-3 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                <p className="font-bold text-4xl text-slate-700 tracking-tight">₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
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
                                        <th className="px-4 py-3 text-right bg-slate-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right">{item.qty}</td>
                                            <td className="px-4 py-3 text-center"><span className="bg-slate-100 px-2 py-1 rounded text-[10px] text-slate-500 uppercase">{item.unit}</span></td>
                                            <td className="px-4 py-2 text-right">
                                                <div className="flex items-center justify-end">
                                                    <span className="text-gray-400 text-[10px] mr-1">₱</span>
                                                    <input type="number" value={prices[item.priceKey] || 0} onChange={(e) => updatePrice(item.priceKey, e.target.value)} className="w-20 px-1 py-0.5 text-right border-slate-200 rounded text-xs" />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-900 font-bold bg-slate-50/50">₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
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
