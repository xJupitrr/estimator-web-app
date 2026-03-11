import React, { useState, useEffect } from 'react';
import { Layers, Info, Box, LayoutTemplate, Columns, PenTool, Grid3X3, Paintbrush, Cloud, Hammer, SquareStack, Settings, Calculator, PlusCircle, Trash2, AlertCircle, CheckCircle2, XCircle, Eye, EyeOff, ArrowUp, Copy, Edit2, X } from 'lucide-react';
import ExportButtons from '../common/ExportButtons';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import { calculateSuspendedSlab, getSlabType, rebarDiameters, commonLengths, rebarOptions, DECKING_OPTIONS, FORMWORK_OPTIONS, FORM_FRAMING_OPTIONS, SUPPORT_TYPES, getDeckingLabel, isSteelDeck } from '../../utils/calculations/suspendedSlabCalculator';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { getDefaultPrices } from '../../constants/materials';

import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import TablePriceInput from '../common/TablePriceInput';
import { THEME_COLORS, TABLE_UI, INPUT_UI, CARD_UI } from '../../constants/designSystem';
import { CONCRETE_MIXES, DEFAULT_MIX } from '../../constants/concrete';

const THEME = THEME_COLORS.suspended_slab;

const getInitialSlab = () => ({
    id: Date.now() + Math.random(),
    quantity: "",
    length: "",
    width: "",
    thickness: "",
    mainBarSpec: "",
    tempBarSpec: "",
    mainSpacing: "",
    tempSpacing: "",
    deckingType: "",
    framingType: "",
    supportType: "",
    formworkType: "",
    description: "",
    mix: "",
    isExcluded: false,
});

export default function SuspendedSlab() {
    const [slabs, setSlabs] = useLocalStorage('suspended_slab_rows', [getInitialSlab()]);
    const [prices, setPrices] = useLocalStorage('app_material_prices', getDefaultPrices(), { mergeDefaults: true });
    const [result, setResult] = useLocalStorage('suspended_slab_result', null);
    const [error, setError] = useState(null);

    const handleSlabChange = (id, field, value) => {
        setSlabs(prev => prev.map(s => {
            if (s.id === id) {
                const updated = { ...s, [field]: value };
                // Auto-sync tempBarSpec only when mainBarSpec first changed AND tempBarSpec hasn't been independently set
                if (field === 'mainBarSpec' && s.tempBarSpec === s.mainBarSpec) {
                    updated.tempBarSpec = value;
                }
                return updated;
            }
            return s;
        }));
        setResult(null);
        setError(null);
    };

    const handleAddSlab = () => {
        setSlabs(prev => [...prev, getInitialSlab()]);
        setResult(null);
        setError(null);
    };

    const handleRemoveSlab = (id) => {
        setSlabs(prev => prev.filter(s => s.id !== id));
        setResult(null);
        setError(null);
    };

    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }
    const [editingDeckingId, setEditingDeckingId] = useState(null);

    const activeSlabForDecking = slabs.find(s => s.id === editingDeckingId);

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleAddRowAbove = (id) => {
        setSlabs(prev => {
            const index = prev.findIndex(s => s.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, getInitialSlab());
            return newRows;
        });
        setContextMenu(null);
        setResult(null);
    };

    const handleDuplicateRow = (id) => {
        setSlabs(prev => {
            const index = prev.findIndex(s => s.id === id);
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
        setSlabs(prev => prev.map(s => s.id === id ? { ...s, isExcluded: !s.isExcluded } : s));
        setContextMenu(null);
        setResult(null);
    };

    const performCalculation = () => {
        const invalid = slabs.some(s => !s.length || !s.width || !s.thickness);
        if (invalid) {
            setError("Please fill in all dimensions (Length, Width, Thickness) for all slabs.");
            setResult(null);
            return;
        }
        setError(null);

        const calcResult = calculateSuspendedSlab(slabs, prices);

        if (calcResult) {
            setResult(calcResult);
        } else {
            setResult(null);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('suspended_slab_total', result.total);
        } else {
            setSessionData('suspended_slab_total', null);
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
            {/* DECKING / FORMWORK MODAL */}
            {editingDeckingId && activeSlabForDecking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-zinc-200 flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50 rounded-t-xl">
                            <div>
                                <h3 className="font-bold text-lg text-zinc-800">Decking &amp; Formwork</h3>
                                <p className="text-xs text-zinc-500">Select the deck type and soffit formwork for this slab.</p>
                            </div>
                            <button onClick={() => setEditingDeckingId(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                                <X size={20} className="text-zinc-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Decking / Soffit Type</label>
                                <SelectInput
                                    value={activeSlabForDecking.deckingType}
                                    onChange={(val) => handleSlabChange(editingDeckingId, 'deckingType', val)}
                                    options={DECKING_OPTIONS}
                                    focusColor={THEME}
                                    placeholder="Select Decking..."
                                />
                            </div>
                            {isSteelDeck(activeSlabForDecking.deckingType) ? (
                                <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-xs text-amber-700 font-medium flex items-start gap-2">
                                    <span className="mt-0.5">ℹ️</span>
                                    <span>Steel deck acts as <strong>permanent soffit formwork</strong> — no additional formwork material required.</span>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Form Framing / Shoring System</label>
                                    <SelectInput
                                        value={activeSlabForDecking.framingType}
                                        onChange={(val) => handleSlabChange(editingDeckingId, 'framingType', val)}
                                        options={FORM_FRAMING_OPTIONS}
                                        focusColor={THEME}
                                        placeholder="Select Framing / Shoring..."
                                    />
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end rounded-b-xl">
                            <button
                                onClick={() => setEditingDeckingId(null)}
                                className={`px-6 py-2 bg-${THEME}-600 text-white rounded-lg font-bold text-sm hover:bg-${THEME}-700 transition-colors`}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
                        {slabs.find(s => s.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in Calculation</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude from Calculation</>
                        }
                    </button>
                </div>
            )}

            <Card className="border-t-4 shadow-md bg-white rounded-xl" style={{ borderTop: '4px solid #2563eb' }}>
                <SectionHeader
                    title="Suspended Slab Configuration"
                    icon={Layers}
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
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[36px]`} rowSpan="2">#</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[52px]`} rowSpan="2">Qty</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[160px]`} rowSpan="2">Description</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[92px]`} rowSpan="2">Length (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[92px]`} rowSpan="2">Width (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[82px]`} rowSpan="2">Type</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[105px]`} rowSpan="2">Thickness (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[120px]`} rowSpan="2">Concrete Mix</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} bg-indigo-50/70 text-center`} colSpan="2">Main Rebar</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} bg-amber-50/70 text-center`} colSpan="2">Temp. Bar</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[175px]`} rowSpan="2">Decking/Forms</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[44px]`} rowSpan="2"></th>
                            </tr>
                            <tr className="bg-slate-100">
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[162px] bg-indigo-50/40`}>Size</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[110px] bg-indigo-50/40`}>Spacing (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[162px] bg-amber-50/40`}>Size</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[110px] bg-amber-50/40`}>Spacing (m)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slabs.map((slab, index) => (
                                <tr
                                    key={slab.id}
                                    className={`${TABLE_UI.INPUT_ROW} ${slab.isExcluded ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                >
                                    <td
                                        className={`${TABLE_UI.INPUT_CELL} text-center text-xs text-gray-500 font-bold cursor-help relative group`}
                                        onContextMenu={(e) => {
                                            if (e.ctrlKey) {
                                                e.preventDefault();
                                                setContextMenu({ id: slab.id, x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        title="Ctrl + Right Click for options"
                                    >
                                        <div className={`transition-all ${slab.isExcluded ? 'text-red-400 line-through' : ''}`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput
                                            value={slab.quantity}
                                            onChange={(val) => handleSlabChange(slab.id, 'quantity', val)}
                                            className={INPUT_UI.TABLE_INPUT}
                                            placeholder="Qty"
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <input
                                            type="text"
                                            value={slab.description}
                                            onChange={(e) => handleSlabChange(slab.id, 'description', e.target.value)}
                                            className={INPUT_UI.TABLE_INPUT}
                                            placeholder="e.g., 2F Main Slab"
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput
                                            value={slab.length}
                                            onChange={(val) => handleSlabChange(slab.id, 'length', val)}
                                            className={INPUT_UI.TABLE_INPUT}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput
                                            value={slab.width}
                                            onChange={(val) => handleSlabChange(slab.id, 'width', val)}
                                            className={INPUT_UI.TABLE_INPUT}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className={`${TABLE_UI.INPUT_CELL} text-center`}>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider whitespace-nowrap ${getSlabType(slab.length, slab.width) === 'Two-Way' ? 'bg-indigo-100 text-indigo-700' : getSlabType(slab.length, slab.width) === 'One-Way' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {getSlabType(slab.length, slab.width)}
                                        </span>
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput
                                            value={slab.thickness}
                                            onChange={(val) => handleSlabChange(slab.id, 'thickness', val)}
                                            className={INPUT_UI.TABLE_INPUT}
                                            placeholder="0.15"
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput
                                            value={slab.mix}
                                            onChange={(val) => handleSlabChange(slab.id, 'mix', val)}
                                            options={CONCRETE_MIXES.map(m => ({ id: m.id, display: m.display }))}
                                            placeholder="Mix"
                                            focusColor={THEME}
                                            className="text-xs"
                                        />
                                    </td>
                                    <td className={`${TABLE_UI.INPUT_CELL} bg-indigo-50/20`}>
                                        <SelectInput
                                            value={slab.mainBarSpec}
                                            onChange={(val) => handleSlabChange(slab.id, 'mainBarSpec', val)}
                                            options={rebarOptions}
                                            focusColor={THEME}
                                            placeholder="Select Spec..."
                                        />
                                    </td>
                                    <td className={`${TABLE_UI.INPUT_CELL} bg-indigo-50/20`}>
                                        <MathInput
                                            value={slab.mainSpacing}
                                            onChange={(val) => handleSlabChange(slab.id, 'mainSpacing', val)}
                                            className={INPUT_UI.TABLE_INPUT}
                                            placeholder="0.20"
                                        />
                                    </td>
                                    <td className={`${TABLE_UI.INPUT_CELL} bg-amber-50/20`}>
                                        <SelectInput
                                            value={slab.tempBarSpec || slab.mainBarSpec}
                                            onChange={(val) => handleSlabChange(slab.id, 'tempBarSpec', val)}
                                            options={rebarOptions}
                                            focusColor={THEME}
                                            placeholder="Same as main"
                                            disabled={getSlabType(slab.length, slab.width) === 'Two-Way'}
                                            className={getSlabType(slab.length, slab.width) === 'Two-Way' ? 'opacity-50 cursor-not-allowed' : ''}
                                            title={getSlabType(slab.length, slab.width) === 'Two-Way' ? 'Two-Way slab: bars same in both directions' : 'Select temperature bar size'}
                                        />
                                    </td>
                                    <td className={`${TABLE_UI.INPUT_CELL} bg-amber-50/20`}>
                                        <MathInput
                                            value={slab.tempSpacing}
                                            onChange={(val) => handleSlabChange(slab.id, 'tempSpacing', val)}
                                            className={`${INPUT_UI.TABLE_INPUT} ${getSlabType(slab.length, slab.width) === 'Two-Way' ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                                            placeholder={getSlabType(slab.length, slab.width) === 'Two-Way' ? "N/A" : "0.20"}
                                            disabled={getSlabType(slab.length, slab.width) === 'Two-Way'}
                                            title={getSlabType(slab.length, slab.width) === 'Two-Way' ? "Not needed for Two-Way slab" : ""}
                                        />
                                    </td>
                                    <td className={`${TABLE_UI.INPUT_CELL} text-center`}>
                                        <button
                                            onClick={() => setEditingDeckingId(slab.id)}
                                            className={`px-3 py-1.5 bg-white hover:bg-${THEME}-50 text-${THEME}-600 hover:text-${THEME}-700 rounded border border-${THEME}-200 hover:border-${THEME}-300 text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5 w-full min-h-[40px]`}
                                        >
                                            <Edit2 size={12} className="opacity-70 flex-shrink-0" />
                                            <span className="truncate">
                                                {slab.deckingType || slab.formworkType
                                                    ? [
                                                        getDeckingLabel(slab.deckingType),
                                                        !isSteelDeck(slab.deckingType) && slab.formworkType
                                                            ? (FORMWORK_OPTIONS.find(o => o.id === slab.formworkType)?.display || slab.formworkType)
                                                            : null
                                                    ].filter(Boolean).join(' / ')
                                                    : 'Configure...'}
                                            </span>
                                        </button>
                                    </td>
                                    <td className={`${TABLE_UI.INPUT_CELL} text-center`}>
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
                    <ActionButton
                        onClick={performCalculation}
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
                        Configure your suspended slab specifications above, then click <span className={`font-bold text-${THEME}-600`}>'CALCULATE'</span>.
                    </p>
                </div>
            )}

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 mt-6 bg-white rounded-xl" style={{ borderLeft: '4px solid #2563eb' }}>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-8 gap-6">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 uppercase tracking-tight">Estimation Summary</h3>
                                <div className="flex flex-wrap gap-4 mt-3">
                                    <p className="text-sm text-gray-500">Total Slab Volume: <strong className="text-gray-900">{result.volume} m³</strong></p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className={`text-left md:text-right bg-${THEME}-50 px-5 py-3 rounded-xl border border-${THEME}-100 min-w-[300px]`}>
                                    <p className={`text-xs text-${THEME}-600 font-bold uppercase tracking-wide mb-1`}>Estimated Total Material Cost</p>
                                    <p className={`font-bold text-4xl text-${THEME}-700 tracking-tight`}>
                                        ₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <ExportButtons items={result.items} filename="suspended_slab_estimate.csv" />
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
                                                    onChange={(val) => handlePriceChange(item.priceKey, val)}
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



