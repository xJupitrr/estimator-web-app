import React, { useState, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Settings, Calculator, PlusCircle, Trash2, Box, Info, AlertCircle, ClipboardCopy, Download, Zap, Eye, EyeOff, ArrowUp, Copy } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import { calculateElectrical, DEFAULT_PRICES } from '../../utils/calculations/electricalCalculator';
import SelectInput from '../common/SelectInput';

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
            className="w-20 pl-2 pr-2 py-1.5 text-right text-sm border border-slate-300 rounded-r-lg bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none text-gray-800 font-medium transition-colors border-l-0"
        />
    </div>
);

const ELECTRICAL_CATEGORIES = [
    { id: 'points', label: 'Electrical Points (Rough-in)' },
    { id: 'protection', label: 'Power Control & Protection' },
    { id: 'devices', label: 'Wiring Devices / Fixtures' },
];

const ELECTRICAL_ITEMS = {
    points: [
        { id: 'lighting', label: 'Lighting Point' },
        { id: 'outlet_conv', label: 'Convenience Outlet Point' },
        { id: 'outlet_ac', label: 'Aircon Outlet Point' },
        { id: 'outlet_range', label: 'Range/Stove Outlet Point' },
    ],
    protection: [
        { id: 'panel_board_4b', label: 'Panel Board (4 Branches)' },
        { id: 'panel_board_6b', label: 'Panel Board (6 Branches)' },
        { id: 'panel_board_8b', label: 'Panel Board (8 Branches)' },
        { id: 'panel_board_10b', label: 'Panel Board (10 Branches)' },
        { id: 'panel_board_12b', label: 'Panel Board (12 Branches)' },
        { id: 'panel_board_16b', label: 'Panel Board (16 Branches)' },
        { id: 'panel_board_20b', label: 'Panel Board (20 Branches)' },
        { id: 'breaker_15a', label: 'Circuit Breaker (15A)' },
        { id: 'breaker_20a', label: 'Circuit Breaker (20A)' },
        { id: 'breaker_30a', label: 'Circuit Breaker (30A)' },
        { id: 'breaker_40a', label: 'Circuit Breaker (40A)' },
        { id: 'breaker_50a', label: 'Circuit Breaker (50A)' },
        { id: 'breaker_60a', label: 'Circuit Breaker (60A)' },
        { id: 'breaker_100a', label: 'Circuit Breaker (100A)' },
    ],
    devices: [
        { id: 'switch_1g', label: '1-Gang Switch' },
        { id: 'switch_2g', label: '2-Gang Switch' },
        { id: 'switch_3g', label: '3-Gang Switch' },
    ],
};

const getInitialRow = () => ({
    id: Date.now() + Math.random(),
    quantity: 1,
    category: 'points',
    type: 'lighting',
    description: '',
    isExcluded: false,
});

export default function Electrical() {
    const [rows, setRows] = useLocalStorage('electrical_rows', [getInitialRow()]);
    const [prices, setPrices] = useLocalStorage('electrical_prices', DEFAULT_PRICES);
    const [result, setResult] = useLocalStorage('electrical_result', null);
    const [error, setError] = useState(null);
    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleRowChange = (id, field, value) => {
        setRows(prev => prev.map(r => {
            if (r.id === id) {
                const updatedRow = { ...r, [field]: value };
                // If category changed, reset type (item) to first available in new category
                if (field === 'category') {
                    updatedRow.type = ELECTRICAL_ITEMS[value][0].id;
                }
                return updatedRow;
            }
            return r;
        }));
        setResult(null);
    };

    const handleAddRowAbove = (id) => {
        setRows(prev => {
            const index = prev.findIndex(r => r.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, getInitialRow());
            return newRows;
        });
        setContextMenu(null);
        setResult(null);
    };

    const handleDuplicateRow = (id) => {
        setRows(prev => {
            const index = prev.findIndex(r => r.id === id);
            const rowToCopy = prev[index];
            const duplicated = {
                ...JSON.parse(JSON.stringify(rowToCopy)),
                id: Date.now() + Math.random()
            };
            const newRows = [...prev];
            newRows.splice(index + 1, 0, duplicated);
            return newRows;
        });
        setContextMenu(null);
        setResult(null);
    };

    const handleToggleExcludeRow = (id) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, isExcluded: !r.isExcluded } : r));
        setContextMenu(null);
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
        const isValid = rows.some(r => r.quantity > 0 && !r.isExcluded);
        if (!isValid) {
            setError("Please add at least one active electrical point.");
            setResult(null);
            return;
        }
        setError(null);

        const calcResult = calculateElectrical(rows, prices);
        if (calcResult) {
            setResult(calcResult);
        } else {
            setResult(null);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('electrical_total', result.total);
        } else {
            setSessionData('electrical_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    const updatePrice = (key, value) => {
        setPrices(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    };

    return (
        <div className="space-y-6">
            {/* CONTEXT MENU */}
            {contextMenu && (
                <div
                    className="fixed z-[100] bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => handleDuplicateRow(contextMenu.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Copy size={14} className="text-slate-400" /> Duplicate to Next Row
                    </button>
                    <button
                        onClick={() => handleAddRowAbove(contextMenu.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                    >
                        <ArrowUp size={14} className="text-slate-400" /> Add Row Above
                    </button>
                    <button
                        onClick={() => handleToggleExcludeRow(contextMenu.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        {rows.find(r => r.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in Calculation</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude from Calculation</>
                        }
                    </button>
                </div>
            )}

            <Card className="border-t-4 border-t-yellow-500 shadow-md">
                <div className="p-4 bg-yellow-50 border-b border-yellow-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-yellow-900 flex items-center gap-2">
                        <Zap size={18} /> Electrical Works Configuration
                    </h2>
                    <button
                        onClick={handleAddRow}
                        className="flex items-center gap-1 px-4 py-2 bg-yellow-600 text-white rounded-md text-xs font-bold hover:bg-yellow-700 transition-all active:scale-95 shadow-sm justify-center"
                    >
                        <PlusCircle size={14} /> Add Row
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[750px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-3 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-3 font-bold border border-slate-300 text-center w-[90px]">Qty</th>
                                <th className="px-3 py-3 font-bold border border-slate-300 text-center">Category</th>
                                <th className="px-3 py-3 font-bold border border-slate-300 text-center">Equipment / Device Type</th>
                                <th className="px-3 py-3 font-bold border border-slate-300 text-center">Description (Location/Notes)</th>
                                <th className="px-2 py-3 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr
                                    key={row.id}
                                    className={`transition-colors ${row.isExcluded ? 'bg-slate-50/50 opacity-60 grayscale-[0.5]' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    <td
                                        className="p-2 border border-slate-300 align-middle text-center text-xs text-slate-400 font-bold cursor-help relative group"
                                        onContextMenu={(e) => {
                                            if (e.ctrlKey) {
                                                e.preventDefault();
                                                setContextMenu({ id: row.id, x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        title="Ctrl + Right Click for options"
                                    >
                                        <div className={`transition-all ${row.isExcluded ? 'text-red-400 line-through' : ''}`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <MathInput value={row.quantity} onChange={(val) => handleRowChange(row.id, 'quantity', val)} className="w-full p-2 text-center border-gray-300 rounded text-sm font-bold" />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput
                                            value={row.category}
                                            onChange={(val) => handleRowChange(row.id, 'category', val)}
                                            options={ELECTRICAL_CATEGORIES.map(c => ({ id: c.id, display: c.label }))}
                                            focusColor="yellow"
                                            className="text-xs"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput
                                            value={row.type}
                                            onChange={(val) => handleRowChange(row.id, 'type', val)}
                                            options={ELECTRICAL_ITEMS[row.category].map(t => ({ id: t.id, display: t.label }))}
                                            focusColor="yellow"
                                            className="text-xs"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <input
                                            type="text"
                                            value={row.description}
                                            onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                            placeholder="e.g. Master's Bedroom"
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

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button onClick={handleCalculate} className="w-full sm:w-auto px-8 py-3 bg-yellow-600 text-white rounded-lg font-bold shadow-lg hover:bg-yellow-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Calculator size={18} /> CALCULATE
                    </button>
                </div>
            </Card>

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-yellow-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Electrical Result</h3>
                                <p className="text-sm text-gray-500 mt-1 italic flex items-center gap-1">
                                    <Info size={14} /> Rough-in estimates included (conduits & wires)
                                </p>
                            </div>
                            <div className="text-left md:text-right bg-yellow-50 px-5 py-3 rounded-xl border border-yellow-100">
                                <p className="text-xs text-yellow-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                <p className="font-bold text-4xl text-yellow-700 tracking-tight">₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm text-left font-sans">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 w-[35%]">Material Item</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[140px]">Unit Price (Editable)</th>
                                        <th className="px-4 py-3 text-right bg-yellow-50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-yellow-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">{item.qty}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <TablePriceInput
                                                    value={prices[item.priceKey] || 0}
                                                    onChange={(val) => updatePrice(item.priceKey, val)}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right text-yellow-900 font-extrabold bg-yellow-50/20">₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
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
