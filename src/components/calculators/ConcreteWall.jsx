
import React, { useState, useEffect } from 'react';
import { Settings, Calculator, PlusCircle, Trash2, AlertCircle, ClipboardCopy, Download, Eye, EyeOff, ArrowUp, Copy, Layers } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import { calculateConcreteWall } from '../../utils/calculations/concreteWallCalculator';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';

// --- Components ---

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
            className="w-20 pl-2 pr-2 py-1.5 text-right text-sm border border-gray-300 rounded-r-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-gray-800 font-medium transition-colors border-l-0"
        />
    </div>
);

const rebarDiameters = ["10mm", "12mm", "16mm", "20mm"];
const commonLengths = [6.0, 7.5, 9.0, 10.5, 12.0];
const rebarOptions = rebarDiameters.flatMap(size =>
    commonLengths.map(length => `${size} x ${length.toFixed(1)}m`)
);

const getInitialWall = () => ({
    id: Date.now() + Math.random(),
    length: "",
    height: "",
    thickness: "", // blank
    quantity: "", // blank
    layers: "", // blank
    vertSpacing: "", // blank
    horizSpacing: "", // blank
    vertRebarSpec: "", // blank
    horizRebarSpec: "", // blank
    isExcluded: false,
});

export default function ConcreteWall() {
    const [walls, setWalls] = useLocalStorage('concrete_walls', [getInitialWall()]);
    const [prices, setPrices] = useLocalStorage('concrete_wall_prices', {
        cement: 240,
        sand: 1200,
        gravel: 1400,
        rebar10mmPrice: 185,
        rebar12mmPrice: 265,
        rebar16mmPrice: 470,
        rebar20mmPrice: 750,
        tieWire: 35,
    });

    const [result, setResult] = useLocalStorage('concrete_wall_result', null);
    const [hasEstimated, setHasEstimated] = useLocalStorage('concrete_wall_has_estimated', false);
    const [error, setError] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleWallChange = (id, field, value) => {
        setWalls(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
        setError(null);
    };

    const handleAddWall = () => {
        setWalls(prev => [...prev, getInitialWall()]);
        setHasEstimated(false);
        setResult(null);
    };

    const handleDuplicateRow = (id) => {
        setWalls(prev => {
            const index = prev.findIndex(w => w.id === id);
            const rowToCopy = prev[index];
            const duplicated = { ...JSON.parse(JSON.stringify(rowToCopy)), id: Date.now() + Math.random() };
            const newRows = [...prev];
            newRows.splice(index + 1, 0, duplicated);
            return newRows;
        });
        setResult(null);
    };

    const handleAddRowAbove = (id) => {
        setWalls(prev => {
            const index = prev.findIndex(w => w.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, getInitialWall());
            return newRows;
        });
        setResult(null);
    };

    const handleToggleExcludeRow = (id) => {
        setWalls(prev => prev.map(w => w.id === id ? { ...w, isExcluded: !w.isExcluded } : w));
        setResult(null);
    };

    const handleRemoveWall = (id) => {
        if (walls.length > 1) {
            setWalls(prev => prev.filter(w => w.id !== id));
            setResult(null);
        }
    };

    const handleCalculate = () => {
        const hasEmptyFields = walls.some(w => !w.isExcluded && (!w.length || !w.height || !w.thickness || !w.vertSpacing || !w.horizSpacing));
        if (hasEmptyFields) {
            setError("Please fill in all dimensions and spacing fields.");
            setResult(null);
            return;
        }
        setError(null);
        const res = calculateConcreteWall(walls, prices);
        setResult(res);
        setHasEstimated(true);
    };

    useEffect(() => {
        if (hasEstimated) handleCalculate();
    }, [prices]);

    useEffect(() => {
        setSessionData('concrete_wall_total', result?.total || null);
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    const handlePriceChange = (key, val) => {
        setPrices(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
    };

    return (
        <div className="space-y-6">
            {contextMenu && (
                <div
                    className="fixed z-[100] bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[180px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button onClick={() => handleDuplicateRow(contextMenu.id)} className="w-full flex items-center gap-2 px-4 py-2 text-xs hover:bg-slate-50"><Copy size={14} /> Duplicate Row</button>
                    <button onClick={() => handleAddRowAbove(contextMenu.id)} className="w-full flex items-center gap-2 px-4 py-2 text-xs hover:bg-slate-50"><ArrowUp size={14} /> Add Above</button>
                    <button onClick={() => handleToggleExcludeRow(contextMenu.id)} className="w-full flex items-center gap-2 px-4 py-2 text-xs hover:bg-slate-50">
                        {walls.find(w => w.id === contextMenu.id)?.isExcluded ? <Eye size={14} /> : <EyeOff size={14} />}
                        {walls.find(w => w.id === contextMenu.id)?.isExcluded ? 'Include' : 'Exclude'}
                    </button>
                </div>
            )}

            <Card className="border-t-4 border-t-blue-500 shadow-md">
                <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                    <h2 className="font-bold text-blue-900 flex items-center gap-2"><Layers size={18} /> Retaining / Shear Wall Config</h2>
                    <button onClick={handleAddWall} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 shadow-sm transition-all active:scale-95">
                        <PlusCircle size={14} /> Add Wall
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[1300px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[65px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[85px]">Length (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[85px]">Height (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[115px]">Thick (mm)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Layers</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[170px]">V. Rebar Spec</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[85px]">V. Space (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[170px]">H. Rebar Spec</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[85px]">H. Space (m)</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {walls.map((wall, index) => (
                                <tr key={wall.id} className={`${wall.isExcluded ? 'bg-slate-50/50 opacity-60' : 'bg-white hover:bg-slate-50'}`}>
                                    <td className="p-2 border border-slate-300 text-center text-xs text-gray-400 font-bold"
                                        onContextMenu={(e) => {
                                            if (e.ctrlKey) {
                                                e.preventDefault();
                                                setContextMenu({ id: wall.id, x: e.clientX, y: e.clientY });
                                            }
                                        }}>
                                        {index + 1}
                                    </td>
                                    <td className="p-2 border border-slate-300"><MathInput value={wall.quantity} onChange={(v) => handleWallChange(wall.id, 'quantity', v)} className="w-full p-1.5 text-center border rounded text-sm font-bold" placeholder="Qty" /></td>
                                    <td className="p-2 border border-slate-300"><MathInput value={wall.length} onChange={(v) => handleWallChange(wall.id, 'length', v)} className="w-full p-1.5 text-center border rounded text-sm" placeholder="3.00" /></td>
                                    <td className="p-2 border border-slate-300"><MathInput value={wall.height} onChange={(v) => handleWallChange(wall.id, 'height', v)} className="w-full p-1.5 text-center border rounded text-sm" placeholder="2.70" /></td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput value={wall.thickness} onChange={(v) => handleWallChange(wall.id, 'thickness', v)} options={[{ id: "100", display: "100mm" }, { id: "150", display: "150mm" }, { id: "200", display: "200mm" }, { id: "250", display: "250mm" }, { id: "300", display: "300mm" }]} focusColor="blue" placeholder="Select Thickness..." />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput value={wall.layers} onChange={(v) => handleWallChange(wall.id, 'layers', v)} options={[{ id: "1", display: "Single Mat" }, { id: "2", display: "Double Mat" }]} focusColor="blue" placeholder="Select Layers..." />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput value={wall.vertRebarSpec} onChange={(v) => handleWallChange(wall.id, 'vertRebarSpec', v)} options={rebarOptions} focusColor="blue" placeholder="Select Rig Spec..." />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <div className="relative">
                                            <MathInput value={wall.vertSpacing} onChange={(v) => handleWallChange(wall.id, 'vertSpacing', v)} className="w-full p-1.5 text-center border rounded text-sm font-medium" placeholder="0.20" />
                                            <span className="absolute right-1 top-1.5 text-[10px] text-gray-400">m</span>
                                        </div>
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput value={wall.horizRebarSpec} onChange={(v) => handleWallChange(wall.id, 'horizRebarSpec', v)} options={rebarOptions} focusColor="blue" placeholder="Select Spec..." />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <div className="relative">
                                            <MathInput value={wall.horizSpacing} onChange={(v) => handleWallChange(wall.id, 'horizSpacing', v)} className="w-full p-1.5 text-center border rounded text-sm font-medium" placeholder="0.20" />
                                            <span className="absolute right-1 top-1.5 text-[10px] text-gray-400">m</span>
                                        </div>
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center">
                                        <button onClick={() => handleRemoveWall(wall.id)} disabled={walls.length === 1} className="text-red-400 hover:text-red-600 disabled:text-gray-200"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-700 text-xs text-center border-t border-red-200">{error}</div>}

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button onClick={handleCalculate} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
                        <Calculator size={18} /> CALCULATE
                    </button>
                </div>
            </Card>

            {result && (
                <Card className="shadow-md border-l-4 border-l-blue-500 animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 tracking-tight">Estimation Result</h3>
                                <p className="text-sm text-gray-500 mt-1">Found <strong className="text-gray-700">{result.volume} m³</strong> of concrete across {result.area} m² wall area.</p>
                            </div>
                            <div className="text-left md:text-right bg-blue-50 px-5 py-3 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Estimated Total Cost</p>
                                <p className="font-bold text-4xl text-blue-700 tabular-nums">₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                                <div className="flex gap-2 mt-2 justify-end">
                                    <button onClick={() => downloadCSV(result.items, 'concrete_wall_estimate.csv')} className="text-[10px] font-bold text-blue-400 hover:text-blue-600 flex items-center gap-1 uppercase"><Download size={12} /> CSV</button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3">Material Item</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[140px]">Unit Price</th>
                                        <th className="px-4 py-3 text-right bg-blue-50/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right font-medium">{item.qty}</td>
                                            <td className="px-4 py-3 text-center"><span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-500">{item.unit}</span></td>
                                            <td className="px-4 py-2"><TablePriceInput value={item.price} onChange={(v) => handlePriceChange(item.priceKey, v)} /></td>
                                            <td className="px-4 py-3 text-right font-bold text-blue-900 bg-blue-50/10">₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
