import React, { useState, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Info, Settings, Calculator, PlusCircle, Trash2, Box, Package, Hammer, AlertCircle, ClipboardCopy, Download, Copy, CheckSquare, LayoutTemplate, ArrowUp, EyeOff, Eye } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import { calculateFormworks, DEFAULT_PRICES, PLYWOOD_OPTIONS, LUMBER_OPTIONS } from '../../utils/calculations/formworksCalculator';
import { THEME_COLORS, TABLE_UI, INPUT_UI, CARD_UI } from '../../constants/designSystem';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import TablePriceInput from '../common/TablePriceInput';

const THEME = THEME_COLORS.formworks;

const getInitialRow = (data = {}) => ({
    id: Date.now() + Math.random(),
    quantity: data.quantity || "",
    length_m: data.length_m || "",
    width_m: data.width_m || "",
    height_m: data.height_m || "",
    description: data.description || "",
    plywood_type: data.plywood_type || "",
    lumber_size: data.lumber_size || "",
    isExcluded: false,
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
    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

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
            {/* AUTOMATED IMPORT BARD */}
            {/* AUTOMATED IMPORT BARD */}
            <Card className={`p-4 border-l-4 border-l-${THEME}-600 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <h2 className={`font-bold text-${THEME}-900 flex items-center gap-2 text-sm whitespace-nowrap`}>
                        <LayoutTemplate size={18} /> Automated Import
                    </h2>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-md transition-colors border border-transparent hover:border-gray-200">
                            <input
                                type="checkbox"
                                checked={includeColumns}
                                onChange={(e) => setIncludeColumns(e.target.checked)}
                                className={`w-4 h-4 rounded text-${THEME}-600 focus:ring-${THEME}-500 border-gray-300`}
                            />
                            <span className="text-sm font-medium text-gray-700">Include Columns <span className="text-xs text-gray-400 font-normal">({columns.length})</span></span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-md transition-colors border border-transparent hover:border-gray-200">
                            <input
                                type="checkbox"
                                checked={includeBeams}
                                onChange={(e) => setIncludeBeams(e.target.checked)}
                                className={`w-4 h-4 rounded text-${THEME}-600 focus:ring-${THEME}-500 border-gray-300`}
                            />
                            <span className="text-sm font-medium text-gray-700">Include Beams <span className="text-xs text-gray-400 font-normal">({beams.length})</span></span>
                        </label>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Plywood</span>
                        </div>
                        <select
                            value={importPlywood}
                            onChange={(e) => setImportPlywood(e.target.value)}
                            className={`bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-${THEME}-500 focus:border-${THEME}-500 block w-full pl-16 p-2 font-medium hover:bg-white transition-colors cursor-pointer`}
                        >
                            {PLYWOOD_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                        </select>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Lumber</span>
                        </div>
                        <select
                            value={importLumber}
                            onChange={(e) => setImportLumber(e.target.value)}
                            className={`bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-${THEME}-500 focus:border-${THEME}-500 block w-full pl-14 p-2 font-medium hover:bg-white transition-colors cursor-pointer`}
                        >
                            {LUMBER_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

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
                    title="Manual Formwork Entry"
                    icon={Hammer}
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
                                <th className={TABLE_UI.INPUT_HEADER}>Description</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Length(M)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Width(M)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Height(M)</th>
                                <th className={TABLE_UI.INPUT_HEADER}>Plywood</th>
                                <th className={TABLE_UI.INPUT_HEADER}>Lumber</th>
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
                                        className={`${TABLE_UI.INPUT_CELL} align-middle text-center text-xs text-slate-400 font-bold cursor-help relative group`}
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
                                        <MathInput value={row.quantity} onChange={(val) => handleRowChange(row.id, 'quantity', val)} className={`${INPUT_UI.TABLE_INPUT} focus:ring-${THEME}-400 text-center font-bold`} placeholder="Qty" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <input type="text" value={row.description} onChange={(e) => handleRowChange(row.id, 'description', e.target.value)} className={`${INPUT_UI.TABLE_INPUT} focus:ring-${THEME}-400 placeholder:text-zinc-400 placeholder:font-normal placeholder:italic`} placeholder="e.g. Stair Formwork" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={row.length_m} onChange={(val) => handleRowChange(row.id, 'length_m', val)} className={`${INPUT_UI.TABLE_INPUT} focus:ring-${THEME}-400 text-center`} placeholder="0.00" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={row.width_m} onChange={(val) => handleRowChange(row.id, 'width_m', val)} className={`${INPUT_UI.TABLE_INPUT} focus:ring-${THEME}-400 text-center`} placeholder="0.00" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={row.height_m} onChange={(val) => handleRowChange(row.id, 'height_m', val)} className={`${INPUT_UI.TABLE_INPUT} focus:ring-${THEME}-400 text-center`} placeholder="0.00" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput
                                            value={row.plywood_type}
                                            onChange={(val) => handleRowChange(row.id, 'plywood_type', val)}
                                            options={PLYWOOD_OPTIONS.map(opt => ({ id: opt.id, display: opt.label }))}
                                            placeholder="Select Plywood..."
                                            className="text-[10px] h-8"
                                            focusColor={THEME}
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput
                                            value={row.lumber_size}
                                            onChange={(val) => handleRowChange(row.id, 'lumber_size', val)}
                                            options={LUMBER_OPTIONS.map(opt => ({ id: opt.id, display: opt.label }))}
                                            placeholder="Select Lumber..."
                                            className="text-[10px] h-8"
                                            focusColor={THEME}
                                        />
                                    </td>
                                    <td className={`${TABLE_UI.INPUT_CELL} text-center`}>
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
                    <div className="flex gap-4 font-mono font-bold text-slate-600">
                        <label className="flex items-center gap-2 text-xs">
                            Plywood Waste %
                            <input type="number" value={wastePlywood} onChange={(e) => setWastePlywood(parseInt(e.target.value) || 0)} className="w-16 p-1 border rounded text-center focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </label>
                        <label className="flex items-center gap-2 text-xs">
                            Lumber Waste %
                            <input type="number" value={wasteLumber} onChange={(e) => setWasteLumber(parseInt(e.target.value) || 0)} className="w-16 p-1 border rounded text-center focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </label>
                    </div>
                    <ActionButton
                        onClick={performCalculation}
                        label="CALCULATE" variant="calculate"
                        icon={Calculator}
                        colorTheme={THEME}

                    />
                </div>
            </Card>

            {!result && !error && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Hammer size={40} className={`text-${THEME}-400`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 mb-1">Ready to Estimate</h3>
                    <p className="max-w-md mx-auto text-sm">
                        Enter your formworks dimensions and specifications above, then click <span className={`font-bold text-${THEME}-600`}>'CALCULATE'</span>.
                    </p>
                </div>
            )}

            {result && (
                <Card className={`animate-in fade-in slide-in-from-bottom-4 duration-500 border-l-4 border-l-${THEME}-600`}>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Formwork Result</h3>
                                <p className="text-sm text-gray-500 mt-1">Total Contact Area: <strong className="text-gray-700">{result?.totalArea?.toFixed(2) || "0.00"} m²</strong></p>
                            </div>
                            <div className={`text-left md:text-right bg-${THEME}-50 px-5 py-3 rounded-xl border border-${THEME}-100 min-w-[300px]`}>
                                <p className={`text-xs text-${THEME}-600 font-bold uppercase tracking-wide mb-1`}>Estimated Total Material Cost</p>
                                <p className={`font-bold text-4xl text-${THEME}-700 tracking-tight`}>₱{result?.total?.toLocaleString('en-PH', { minimumFractionDigits: 2 }) || "0.00"}</p>
                            </div>
                        </div>

                        <div className={TABLE_UI.CONTAINER}>
                            <table className={TABLE_UI.TABLE}>
                                <thead className={TABLE_UI.HEADER_ROW}>
                                    <tr>
                                        <th className={`${TABLE_UI.HEADER_CELL_LEFT} w-[35%]`}>Material Item</th>
                                        <th className={TABLE_UI.HEADER_CELL_RIGHT}>Quantity</th>
                                        <th className={TABLE_UI.HEADER_CELL}>Unit</th>
                                        <th className={TABLE_UI.HEADER_CELL_RIGHT}>Unit Price</th>
                                        <th className={`${TABLE_UI.HEADER_CELL_RIGHT} bg-slate-100/50`}>Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className={TABLE_UI.BODY_ROW}>
                                            <td className={`${TABLE_UI.CELL} text-slate-800 font-medium`}>{item.name}</td>
                                            <td className={TABLE_UI.CELL_RIGHT}>{item.qty}</td>
                                            <td className={TABLE_UI.CELL_CENTER}><span className="bg-slate-100 px-2 py-1 rounded text-[10px] text-slate-500 uppercase font-bold">{item.unit}</span></td>
                                            <td className={`${TABLE_UI.CELL} border-r-0`}>
                                                <TablePriceInput
                                                    value={prices[item.priceKey] || 0}
                                                    onChange={(val) => updatePrice(item.priceKey, val)}
                                                    colorTheme={THEME}
                                                />
                                            </td>
                                            <td className={`${TABLE_UI.CELL_RIGHT} text-slate-900 font-extrabold bg-slate-50/50`}>₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
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



