import React, { useState, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Settings, Calculator, PlusCircle, Trash2, Box, ClipboardCopy, Download, AlertCircle, Tent, Eye, EyeOff, ArrowUp, Copy } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import { calculateRoofing as calculateRoofingUtil } from '../../utils/calculations/roofingCalculator';

import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import TablePriceInput from '../common/TablePriceInput';
import { THEME_COLORS, TABLE_UI, INPUT_UI, CARD_UI } from '../../constants/designSystem';

const THEME = THEME_COLORS.roofing;

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
    quantity: data.quantity || "",
    type: "",
    length_m: data.length_m || "",
    width_m: data.width_m || "",
    description: data.description || "",
    isExcluded: false,
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

    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

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
            setSessionData('roofing_total', result.grandTotal);
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

            <Card className={`border-t-4 border-t-${THEME}-500 shadow-md`}>
                <SectionHeader
                    title="Roofing Configuration"
                    icon={Tent}
                    colorTheme={THEME}
                    actions={
                        <ActionButton
                            onClick={handleAddRow}
                            label="Add Roof Area"
                            icon={PlusCircle}
                            colorTheme={THEME}
                        />
                    }
                />

                <div className="overflow-x-auto p-4">
                    <table className={TABLE_UI.INPUT_TABLE}>
                        <thead className="bg-slate-100">
                            <tr>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[40px]`}>#</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[60px]`}>Qty</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[200px]`}>Description</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[160px]`}>Roofing Type</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[120px]`}>Length (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[120px]`}>Width (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[50px]`}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr
                                    key={row.id}
                                    className={`${TABLE_UI.INPUT_ROW} ${row.isExcluded ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                >
                                    <td
                                        className={`${TABLE_UI.INPUT_CELL} text-center text-xs text-gray-500 font-bold cursor-help relative group`}
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
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput
                                            value={row.quantity}
                                            onChange={(val) => handleRowChange(row.id, 'quantity', val)}
                                            className={INPUT_UI.TABLE_INPUT}
                                            placeholder="Qty"
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <input
                                            type="text"
                                            value={row.description}
                                            onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                                            className={INPUT_UI.TABLE_INPUT}
                                            placeholder="e.g., Main Roof"
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput
                                            value={row.type}
                                            onChange={(val) => handleRowChange(row.id, 'type', val)}
                                            options={ROOFING_TYPES.map(t => ({ id: t.id, display: t.label }))}
                                            focusColor={THEME}
                                            placeholder="Select Type..."
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput
                                            value={row.length_m}
                                            onChange={(val) => handleRowChange(row.id, 'length_m', val)}
                                            className={INPUT_UI.TABLE_INPUT}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput
                                            value={row.width_m}
                                            onChange={(val) => handleRowChange(row.id, 'width_m', val)}
                                            className={INPUT_UI.TABLE_INPUT}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className={`${TABLE_UI.INPUT_CELL} text-center`}>
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
                    <ActionButton
                        onClick={handleCalculate}
                        label="CALCULATE"
                        icon={Calculator}
                        colorTheme={THEME}
                        className="w-full sm:w-auto px-8 py-3"
                    />
                </div>
            </Card>

            {!result && !error && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50 mt-6">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Tent size={40} className={`text-${THEME}-400`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 mb-1">Ready to Estimate</h3>
                    <p className="max-w-md mx-auto text-sm">
                        Enter your roof dimensions and specifications above, then click <span className={`font-bold text-${THEME}-600`}>'CALCULATE'</span>.
                    </p>
                </div>
            )}

            {result && (
                <Card className={`animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-${THEME}-500 mt-6`}>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Estimation Result</h3>
                                <p className="text-sm text-gray-500 mt-1">Total Roof Area: <strong className="text-gray-700">{parseFloat(result.area || 0).toFixed(2)} m²</strong></p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="text-left md:text-right bg-red-50 px-5 py-3 rounded-xl border border-red-100">
                                    <p className="text-xs text-red-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                    <p className="font-bold text-4xl text-red-700 tracking-tight">
                                        ₱{result.grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={TABLE_UI.CONTAINER}>
                            <table className={TABLE_UI.TABLE}>
                                <thead className={TABLE_UI.HEADER_ROW}>
                                    <tr>
                                        <th className={TABLE_UI.HEADER_CELL_LEFT}>Material Item</th>
                                        <th className={TABLE_UI.HEADER_CELL_RIGHT}>Quantity</th>
                                        <th className={TABLE_UI.HEADER_CELL}>Unit</th>
                                        <th className={TABLE_UI.HEADER_CELL_RIGHT}>Unit Price</th>
                                        <th className={`${TABLE_UI.HEADER_CELL_RIGHT} bg-gray-100/50`}>Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className={TABLE_UI.BODY_ROW}>
                                            <td className={`${TABLE_UI.CELL} font-medium text-gray-800`}>{item.name}</td>
                                            <td className={TABLE_UI.CELL_RIGHT}>{item.qty}</td>
                                            <td className={TABLE_UI.CELL_CENTER}>
                                                <span className={`bg-${THEME}-100 px-2 py-1 rounded text-xs font-bold uppercase text-${THEME}-700`}>{item.unit}</span>
                                            </td>
                                            <td className={`${TABLE_UI.CELL} border-r-0`}>
                                                <TablePriceInput
                                                    value={prices[item.priceKey] || 0}
                                                    onChange={(val) => updatePrice(item.priceKey, val)}
                                                    colorTheme={THEME}
                                                />
                                            </td>
                                            <td className={`${TABLE_UI.CELL_RIGHT} font-bold text-gray-900 bg-gray-50/50`}>
                                                ₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
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
