import React, { useState, useEffect } from 'react';
import { Settings, Calculator, PlusCircle, Trash2, AlertCircle, ClipboardCopy, Download } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import { calculateSlabOnGrade } from '../../utils/calculations/slabOnGradeCalculator';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';

const getInitialSlab = () => ({
    id: Date.now() + Math.random(),
    quantity: 1,
    length: "",
    width: "",
    thickness: "0.10",
    gravelBeddingThickness: "0.05",
    barSize: "10mm",
    spacing: "0.20",
    description: "",
});

export default function SlabOnGrade() {
    const [slabs, setSlabs] = useLocalStorage('slab_rows', [getInitialSlab()]);
    const [prices, setPrices] = useLocalStorage('slab_prices', {
        cement: 240,
        sand: 1200,
        gravel: 1400,
        rebar: 180,
        tieWire: 110,
    });
    const [result, setResult] = useLocalStorage('slab_result', null);
    const [hasEstimated, setHasEstimated] = useState(false);
    const [error, setError] = useState(null);

    const handleSlabChange = (id, field, value) => {
        setSlabs(prevSlabs =>
            prevSlabs.map(slab => (
                slab.id === id ? { ...slab, [field]: value } : slab
            ))
        );
        setError(null);
    };

    const handleAddSlab = () => {
        setSlabs(prev => [...prev, getInitialSlab()]);
        setHasEstimated(false);
        setResult(null);
    };

    const handleRemoveSlab = (id) => {
        if (slabs.length > 1) {
            setSlabs(prev => prev.filter(slab => slab.id !== id));
            setHasEstimated(false);
            setResult(null);
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
        // Validation Check
        const hasEmptyFields = slabs.some(slab =>
            slab.length === "" || slab.width === "" || slab.thickness === "" || slab.gravelBeddingThickness === "" || slab.barSize === ""
        );

        if (hasEmptyFields) {
            setError("Please fill in all required fields (Dimensions, Bedding, and Bar Size) before calculating.");
            setResult(null);
            setHasEstimated(false);
            return;
        }
        setError(null);

        const calculationResult = calculateSlabOnGrade(slabs, prices);

        if (!calculationResult) {
            setResult(null);
            setHasEstimated(false);
            return;
        }

        setResult(calculationResult);
        setHasEstimated(true);
    };

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('slab_total', result.total);
        } else {
            setSessionData('slab_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    const handlePriceChange = (key, value) => {
        setPrices(prev => ({
            ...prev,
            [key]: parseFloat(value) || 0
        }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden border-t-4 border-t-orange-500">
                <div className="p-4 bg-orange-50 border-b border-orange-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-orange-900 flex items-center gap-2">
                        <Settings size={18} /> Slab Configurations
                    </h2>
                    <button
                        onClick={handleAddSlab}
                        className="flex items-center gap-1 px-4 py-2 bg-orange-600 text-white rounded-md text-xs font-bold hover:bg-orange-700 transition-all active:scale-95 shadow-sm w-full sm:w-auto justify-center"
                    >
                        <PlusCircle size={14} /> Add Slab Row
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[900px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[60px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center">Description</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Length (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Width (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Thkns (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Gravel (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Bar Size</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[100px]">Spacing (m)</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {slabs.map((slab, index) => (
                                <tr key={slab.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 align-middle text-center text-xs text-slate-500 font-bold">{index + 1}</td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            value={slab.quantity}
                                            onChange={(val) => handleSlabChange(slab.id, 'quantity', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none font-bold"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <input
                                            type="text"
                                            value={slab.description}
                                            onChange={(e) => handleSlabChange(slab.id, 'description', e.target.value)}
                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                                            placeholder="e.g., Garage Slab"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            value={slab.length}
                                            onChange={(val) => handleSlabChange(slab.id, 'length', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            value={slab.width}
                                            onChange={(val) => handleSlabChange(slab.id, 'width', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            value={slab.thickness}
                                            onChange={(val) => handleSlabChange(slab.id, 'thickness', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            value={slab.gravelBeddingThickness}
                                            onChange={(val) => handleSlabChange(slab.id, 'gravelBeddingThickness', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none font-medium text-slate-600"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <SelectInput
                                            value={slab.barSize}
                                            onChange={(val) => handleSlabChange(slab.id, 'barSize', val)}
                                            options={["10mm", "12mm", "16mm"]}
                                            focusColor="orange"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            value={slab.spacing}
                                            onChange={(val) => handleSlabChange(slab.id, 'spacing', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <button
                                            onClick={() => handleRemoveSlab(slab.id)}
                                            disabled={slabs.length === 1}
                                            className={`p-2 rounded-full transition-colors ${slabs.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
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
                    <button onClick={calculateSlab} className="w-full sm:w-auto px-8 py-3 bg-orange-600 text-white rounded-lg font-bold shadow-lg hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Calculator size={18} /> Calculate Estimation
                    </button>
                </div>
            </div>

            {result && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border-l-4 border-l-orange-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Estimation Result</h3>
                                <p className="text-sm text-gray-500 mt-1">Total Area: <strong className="text-gray-700">{result.totalArea.toFixed(2)} m²</strong> | Total Volume: <strong className="text-gray-700">{result.totalVolume.toFixed(2)} m³</strong></p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="text-left md:text-right bg-orange-50 px-5 py-3 rounded-xl border border-orange-100">
                                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                    <p className="font-bold text-4xl text-orange-700 tracking-tight">
                                        ₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => copyToClipboard(result.items)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        <ClipboardCopy size={14} /> Copy Table
                                    </button>
                                    <button
                                        onClick={() => downloadCSV(result.items, 'slab_on_grade_estimate.csv')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        <Download size={14} /> Download CSV
                                    </button>
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
                                            <td className="px-4 py-2">
                                                <div className="flex items-center justify-end">
                                                    <span className="text-gray-400 text-xs mr-1">₱</span>
                                                    <input
                                                        type="number"
                                                        value={prices[item.priceKey]}
                                                        onChange={(e) => handlePriceChange(item.priceKey, e.target.value)}
                                                        className="w-20 px-2 py-1 text-right text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-400 outline-none font-medium"
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
