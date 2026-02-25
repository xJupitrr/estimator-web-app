import React, { useState, useEffect } from 'react';
import { Settings, Calculator, PlusCircle, Trash2, AlertCircle, ClipboardCopy, Download, Eye, EyeOff, ArrowUp, Copy, Box } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import { calculateSlabOnGrade } from '../../utils/calculations/slabOnGradeCalculator';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { MATERIAL_DEFAULTS } from '../../constants/materials';

import { THEME_COLORS, TABLE_UI, INPUT_UI } from '../../constants/designSystem';
import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import TablePriceInput from '../common/TablePriceInput';

const THEME = THEME_COLORS.slab;

const rebarDiameters = [10, 12, 16];
const commonLengths = [6.0, 7.5, 9.0, 10.5, 12.0];
const rebarOptions = rebarDiameters.flatMap(size =>
    commonLengths.map(length => `${size}mm x ${length.toFixed(1)}m`)
);

const getInitialSlab = () => ({
    id: Date.now() + Math.random(),
    quantity: "",
    length: "",
    width: "",
    thickness: "",
    gravelBeddingThickness: "",
    barSize: "",
    spacing: "",
    description: "",
    isExcluded: false,
});

export default function SlabOnGrade() {
    const [slabs, setSlabs] = useLocalStorage('slab_rows', [getInitialSlab()]);
    const [prices, setPrices] = useLocalStorage('slab_prices', {
        cement: MATERIAL_DEFAULTS.cement_40kg.price,
        sand: MATERIAL_DEFAULTS.sand_wash.price,
        gravel: MATERIAL_DEFAULTS.gravel_3_4.price,
        rebar: MATERIAL_DEFAULTS.rebar_10mm.price,
        rebar10mmPrice: 185,
        rebar12mmPrice: 285,
        rebar16mmPrice: 515,
        tieWire: MATERIAL_DEFAULTS.tie_wire_kg.price,
        gravelBeddingPrice: MATERIAL_DEFAULTS.gravel_bedding.price,
    });
    const [result, setResult] = useLocalStorage('slab_result', null);
    const [hasEstimated, setHasEstimated] = useLocalStorage('slab_has_estimated', false);
    const [error, setError] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    const handleSlabChange = (id, field, value) => {
        setSlabs(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
        if (hasEstimated) setError(null);
    };

    const handleAddSlab = () => {
        setSlabs(prev => [...prev, getInitialSlab()]);
    };

    const handleRemoveRow = (id) => {
        if (slabs.length > 1) {
            setSlabs(prev => prev.filter(s => s.id !== id));
        } else {
            setSlabs([getInitialSlab()]);
        }
    };

    const handleDuplicateRow = (id) => {
        setSlabs(prev => {
            const index = prev.findIndex(s => s.id === id);
            const rowToCopy = prev[index];
            const duplicated = { ...JSON.parse(JSON.stringify(rowToCopy)), id: Date.now() + Math.random() };
            const newRows = [...prev];
            newRows.splice(index + 1, 0, duplicated);
            return newRows;
        });
        setContextMenu(null);
    };

    const handleAddRowAbove = (id) => {
        setSlabs(prev => {
            const index = prev.findIndex(s => s.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, getInitialSlab());
            return newRows;
        });
        setContextMenu(null);
    };

    const handleToggleExcludeRow = (id) => {
        setSlabs(prev => prev.map(s => s.id === id ? { ...s, isExcluded: !s.isExcluded } : s));
        setContextMenu(null);
    };

    const handleCalculate = () => {
        const hasEmptyFields = slabs.some(s => !s.isExcluded && (!s.length || !s.width || !s.thickness));
        if (hasEmptyFields) {
            setError("Please fill in length, width, and thickness for all included slabs.");
            setResult(null);
            setHasEstimated(false);
            return;
        }
        setError(null);

        const res = calculateSlabOnGrade(slabs, prices);
        if (res) {
            setResult(res);
            setHasEstimated(true);
        } else {
            setResult(null);
            setHasEstimated(false);
        }
    };

    // Auto-recalculate
    useEffect(() => {
        if (hasEstimated) {
            const res = calculateSlabOnGrade(slabs, prices);
            setResult(res);
        }
    }, [slabs, prices, hasEstimated]);

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
        setPrices(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    };

    // Close context menu
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

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
                        {slabs.find(s => s.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include Row</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude Row</>
                        }
                    </button>
                </div>
            )}

            <Card className="border-t-4 shadow-md bg-white rounded-xl" style={{ borderTop: '4px solid #2563eb' }}>
                <SectionHeader
                    title="Slab Configurations"
                    icon={Settings}
                    colorTheme={THEME}
                    actions={
                        <ActionButton
                            onClick={handleAddSlab}
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
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[200px]`}>Description</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Length (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Width (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Thkns (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Gravel (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[150px]`}>Bar Spec</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Spacing (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[50px]`}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {slabs.map((slab, index) => (
                                <tr key={slab.id} className={`${TABLE_UI.INPUT_ROW} ${slab.isExcluded ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                    <td
                                        className={`${TABLE_UI.INPUT_CELL} text-center text-xs text-gray-500 font-bold cursor-help`}
                                        onContextMenu={(e) => {
                                            if (e.ctrlKey) {
                                                e.preventDefault();
                                                setContextMenu({ id: slab.id, x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        title="Ctrl + Right Click for options"
                                    >
                                        <span className={slab.isExcluded ? 'line-through' : ''}>{index + 1}</span>
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={slab.quantity} onChange={(v) => handleSlabChange(slab.id, 'quantity', v)} className={INPUT_UI.TABLE_INPUT} placeholder="1" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <input type="text" value={slab.description} onChange={(e) => handleSlabChange(slab.id, 'description', e.target.value)} className={INPUT_UI.TABLE_INPUT} placeholder="e.g., Garage Slab" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={slab.length} onChange={(v) => handleSlabChange(slab.id, 'length', v)} className={INPUT_UI.TABLE_INPUT} placeholder="0.00" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={slab.width} onChange={(v) => handleSlabChange(slab.id, 'width', v)} className={INPUT_UI.TABLE_INPUT} placeholder="0.00" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={slab.thickness} onChange={(v) => handleSlabChange(slab.id, 'thickness', v)} className={INPUT_UI.TABLE_INPUT} placeholder="0.10" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={slab.gravelBeddingThickness} onChange={(v) => handleSlabChange(slab.id, 'gravelBeddingThickness', v)} className={INPUT_UI.TABLE_INPUT} placeholder="0.05" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput value={slab.barSize} onChange={(v) => handleSlabChange(slab.id, 'barSize', v)} options={rebarOptions} focusColor={THEME} placeholder="Select Spec..." />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={slab.spacing} onChange={(v) => handleSlabChange(slab.id, 'spacing', v)} className={INPUT_UI.TABLE_INPUT} placeholder="0.20" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <button onClick={() => handleRemoveRow(slab.id)} disabled={slabs.length === 1} className={`p-2 rounded-full transition-colors ${slabs.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-400 cursor-not-allowed'}`}>
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
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50 mt-6">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Box size={40} className={`text-${THEME}-400`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 mb-1">Ready to Estimate</h3>
                    <p className="max-w-md mx-auto text-sm">
                        Enter your slab dimensions and specifications above, then click <span className={`font-bold text-${THEME}-600`}>'CALCULATE'</span>.
                    </p>
                </div>
            )}

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 mt-6 bg-white rounded-xl" style={{ borderLeft: '4px solid #2563eb' }}>
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-8 gap-6">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 uppercase tracking-tight">Estimation Summary</h3>
                                <div className="flex flex-wrap gap-4 mt-3">
                                    <p className="text-sm text-gray-500">Total Area: <strong className="text-gray-900">{result.totalArea.toFixed(2)} m²</strong></p>
                                    <p className="text-sm text-gray-500">Total Volume: <strong className="text-gray-900">{result.totalVolume.toFixed(2)} m³</strong></p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className={`text-left md:text-right bg-${THEME}-50 px-5 py-3 rounded-xl border border-${THEME}-100 min-w-[300px]`}>
                                    <p className={`text-xs text-${THEME}-600 font-bold uppercase tracking-wide mb-1`}>Estimated Total Material Cost</p>
                                    <p className={`font-bold text-4xl text-${THEME}-700 tracking-tight`}>
                                        {result.total.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            const success = await copyToClipboard(result.items);
                                            if (success) alert('Table copied to clipboard!');
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                                        title="Copy table to clipboard for Excel"
                                    >
                                        <ClipboardCopy size={14} /> Copy to Clipboard
                                    </button>
                                    <button
                                        onClick={() => downloadCSV(result.items, 'slab_estimate.csv')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                                        title="Download as CSV"
                                    >
                                        <Download size={14} /> Download CSV
                                    </button>
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
                                        <th className={`${TABLE_UI.HEADER_CELL_RIGHT} bg-slate-50/50`}>Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className={TABLE_UI.BODY_ROW}>
                                            <td className={`${TABLE_UI.CELL} font-semibold text-slate-800`}>{item.name}</td>
                                            <td className={`${TABLE_UI.CELL_RIGHT} tabular-nums`}>{item.qty}</td>
                                            <td className={TABLE_UI.CELL_CENTER}>
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500`}>{item.unit}</span>
                                            </td>
                                            <td className={`${TABLE_UI.CELL} border-r-0`}>
                                                <TablePriceInput
                                                    value={prices[item.priceKey] || item.price || 0}
                                                    onChange={(val) => handlePriceChange(item.priceKey, val)}
                                                    colorTheme={THEME}
                                                />
                                            </td>
                                            <td className={`${TABLE_UI.CELL_RIGHT} font-bold text-slate-900 bg-slate-50/30 tabular-nums`}>₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
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



