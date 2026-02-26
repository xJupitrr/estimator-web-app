import React, { useState, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Settings, Calculator, PlusCircle, Trash2, Box, Info, AlertCircle, ClipboardCopy, Download, Paintbrush, Eye, EyeOff, ArrowUp, Copy } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import { calculatePainting } from '../../utils/calculations/paintingCalculator';
import { getDefaultPrices } from '../../constants/materials';


import { THEME_COLORS, TABLE_UI, INPUT_UI, CARD_UI } from '../../constants/designSystem';
import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import TablePriceInput from '../common/TablePriceInput';

const THEME = THEME_COLORS.painting;

const getInitialRow = () => ({
    id: Date.now() + Math.random(),
    quantity: "",
    length_m: "",
    height_m: "",
    area_sqm: "",
    sides: "",
    description: "",
    isExcluded: false,
});

export default function Painting() {
    const [rows, setRows] = useLocalStorage('painting_rows', [getInitialRow()]);
    const [prices, setPrices] = useLocalStorage('app_material_prices', getDefaultPrices());
    const [result, setResult] = useLocalStorage('painting_result', null);
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
        const isValid = rows.some(r => r.area_sqm || (r.length_m && r.height_m));
        if (!isValid) {
            setError("Please fill in dimensions or area for at least one surface.");
            setResult(null);
            return;
        }
        setError(null);

        const calcResult = calculatePainting(rows, prices);
        if (calcResult) {
            setResult(calcResult);
        } else {
            setResult(null);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('painting_total', result.total);
        } else {
            setSessionData('painting_total', null);
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
                    <button onClick={() => handleDuplicateRow(contextMenu.id)} className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-${THEME}-50 transition-colors`}>
                        <Copy size={14} className="text-slate-400" /> Duplicate Row
                    </button>
                    <button onClick={() => handleAddRowAbove(contextMenu.id)} className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-${THEME}-50 transition-colors border-b border-${THEME}-500`}>
                        <ArrowUp size={14} className="text-slate-400" /> Add Row Above
                    </button>
                    <button onClick={() => handleToggleExcludeRow(contextMenu.id)} className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-${THEME}-50 transition-colors`}>
                        {rows.find(r => r.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in Calculation</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude from Calculation</>
                        }
                    </button>
                </div>
            )}

            <Card className="border-t-4 shadow-md bg-white rounded-xl" style={{ borderTop: '4px solid #059669' }}>
                <SectionHeader
                    title="Surface Painting Configuration"
                    icon={Paintbrush}
                    colorTheme={THEME}
                    actions={
                        <ActionButton
                            onClick={handleAddRow}
                            label="Add Row" variant="addRow"
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
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[200px]`}>Surface Description</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Length(M)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Width(M)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Area (sq.m.)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[80px]`}>Sides</th>
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
                                            placeholder="e.g. Partition Walls"
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
                                            value={row.height_m}
                                            onChange={(val) => handleRowChange(row.id, 'height_m', val)}
                                            className={INPUT_UI.TABLE_INPUT}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput
                                            value={row.area_sqm}
                                            onChange={(val) => handleRowChange(row.id, 'area_sqm', val)}
                                            className={INPUT_UI.TABLE_INPUT}
                                            placeholder="Auto"
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput
                                            value={row.sides}
                                            onChange={(val) => handleRowChange(row.id, 'sides', val)}
                                            options={[
                                                { id: '1', display: '1 Side' },
                                                { id: '2', display: '2 Sides' }
                                            ]}
                                            focusColor={THEME}
                                            placeholder="Select Sides..."
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
                        label="CALCULATE" variant="calculate"
                        icon={Calculator}
                        colorTheme={THEME}

                    />
                </div>
            </Card>

            {!result && !error && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Paintbrush size={40} className={`text-${THEME}-400`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 mb-1">Ready to Estimate</h3>
                    <p className="max-w-md mx-auto text-sm">
                        Enter your painting surface dimensions and specifications above, then click <span className={`font-bold text-${THEME}-600`}>'CALCULATE'</span>.
                    </p>
                </div>
            )}

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 bg-white rounded-xl" style={{ borderLeft: '4px solid #059669' }}>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Painting Result</h3>
                                <p className="text-sm text-gray-500 mt-1">Total Surface Area: <strong className="text-gray-700">{result.totalArea.toFixed(2)} m²</strong></p>
                            </div>
                            <div className={`text-left md:text-right bg-${THEME}-50 px-5 py-3 rounded-xl border border-${THEME}-100`}>
                                <p className={`text-xs text-${THEME}-600 font-bold uppercase tracking-wide mb-1`}>Estimated Total Material Cost</p>
                                <p className={`font-bold text-4xl text-${THEME}-700 tracking-tight`}>₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        <div className={TABLE_UI.CONTAINER}>
                            <table className={TABLE_UI.TABLE}>
                                <thead className={TABLE_UI.HEADER_ROW}>
                                    <tr>
                                        <th className={TABLE_UI.HEADER_CELL_LEFT}>Material Item</th>
                                        <th className={TABLE_UI.HEADER_CELL_RIGHT}>Quantity</th>
                                        <th className={TABLE_UI.HEADER_CELL}>Unit</th>
                                        <th className={`${TABLE_UI.HEADER_CELL_RIGHT} w-[140px]`}>Unit Price (Editable)</th>
                                        <th className={`${TABLE_UI.HEADER_CELL_RIGHT} bg-${THEME}-100/50`}>Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className={TABLE_UI.BODY_ROW}>
                                            <td className={`${TABLE_UI.CELL} text-${THEME}-900 font-medium`}>{item.name}</td>
                                            <td className={TABLE_UI.CELL_RIGHT}>{item.qty}</td>
                                            <td className={TABLE_UI.CELL_CENTER}><span className={`bg-${THEME}-100 px-2 py-1 rounded text-[10px] text-${THEME}-600 uppercase font-bold`}>{item.unit}</span></td>
                                            <td className={`${TABLE_UI.CELL} border-r-0`}>
                                                <TablePriceInput
                                                    value={prices[item.priceKey] || 0}
                                                    onChange={(val) => updatePrice(item.priceKey, val)}
                                                    colorTheme={THEME}
                                                />
                                            </td>
                                            <td className={`${TABLE_UI.CELL_RIGHT} text-${THEME}-900 font-extrabold bg-${THEME}-50/30`}>₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
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



