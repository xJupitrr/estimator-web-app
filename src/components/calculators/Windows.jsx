import React, { useState, useEffect } from 'react';
import { Settings, Calculator, PlusCircle, Trash2, AlertCircle, Eye, EyeOff, ArrowUp, Copy, LayoutTemplate, Edit2, X } from 'lucide-react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { getDefaultPrices } from '../../constants/materials';
import SelectInput from '../common/SelectInput';
import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import TablePriceInput from '../common/TablePriceInput';
import ExportButtons from '../common/ExportButtons';
import MathInput from '../common/MathInput';
import { calculateDoorsWindows, itemTypes, frameMaterials, groupedFrameOptions, leafMaterials, groupedLeafOptions } from '../../utils/calculations/doorsWindowsCalculator';
import { THEME_COLORS, TABLE_UI, INPUT_UI, CARD_UI } from '../../constants/designSystem';

const THEME = THEME_COLORS.doors;

// --- Constants (Imported from Utility) ---
// itemTypes, frameMaterials, leafMaterials are now imported.

const getInitialItem = () => ({
    quantity: "",
    itemType: "Window",
    width_m: "",
    height_m: "",
    frameMaterial: "",
    panel_configs: [{ type: "Fixed Window", material: "Clear Glass (6mm)", count: 1 }],
    customFramePrice: "",
    customLeafPrice: "",
    customHardwarePrice: "",
    description: "",
    isExcluded: false,
});

export default function Windows() {
    const [items, setItems] = useLocalStorage('windows_rows', [getInitialItem()]);
    const [prices, setPrices] = useLocalStorage('app_material_prices', getDefaultPrices(), { mergeDefaults: true });
    const [result, setResult] = useLocalStorage('windows_result', null);
    const [error, setError] = useState(null);
    const [editingPanelsId, setEditingPanelsId] = useState(null);

    // Migration hook
    useEffect(() => {
        if (!items || !Array.isArray(items)) return;
        const needsMigration = items.some(i => i && (!Array.isArray(i.panel_configs) || i.panel_configs.some(p => !p.type || !p.material)));
        if (needsMigration) {
            setItems(prev => {
                if (!Array.isArray(prev)) return [getInitialItem()];
                return prev.map(item => {
                    if (item && !Array.isArray(item.panel_configs)) {
                         const panels = [];
                         const totalPanels = item.totalPanels ? parseInt(item.totalPanels) : 1;
                         const mainPanelsCount = (item.mainPanelsCount !== undefined) ? parseInt(item.mainPanelsCount) : totalPanels;
                        
                         panels.push({ type: item.itemType || "Fixed Window", material: item.leafMaterial || "Clear Glass (6mm)", count: mainPanelsCount });
                        
                         if (totalPanels > mainPanelsCount) {
                             panels.push({ type: "Fixed Window", material: item.secondaryLeafMaterial || "Clear Glass (6mm)", count: totalPanels - mainPanelsCount });
                         }
                        
                         return { ...item, panel_configs: panels, itemType: "Window" };
                    } else if (item && Array.isArray(item.panel_configs)) {
                         const fixedPanels = item.panel_configs.map(p => ({
                              type: p.type || p.material || item.itemType || "Fixed Window",
                              material: p.material && !p.type ? p.material : (item.leafMaterial || "Clear Glass (6mm)"),
                              count: p.count || 1
                         }));
                         return { ...item, panel_configs: fixedPanels, itemType: "Window" };
                    }
                    return item;
                });
            });
        }
    }, [items, setItems]);

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;

            const updatedItem = { ...item, [field]: value };
            return updatedItem;
        }));
        setResult(null);
        setError(null);
    };

    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleAddRowAbove = (id) => {
        setItems(prev => {
            const index = prev.findIndex(item => item.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, getInitialItem());
            return newRows;
        });
        setContextMenu(null);
        setResult(null);
    };

    const handleDuplicateRow = (id) => {
        setItems(prev => {
            const index = prev.findIndex(item => item.id === id);
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
        setItems(prev => prev.map(item => item.id === id ? { ...item, isExcluded: !item.isExcluded } : item));
        setContextMenu(null);
        setResult(null);
    };

    const handleAddRow = () => {
        setItems(prev => [...prev, getInitialItem()]);
        setResult(null);
        setError(null);
    };

    const handleRemoveRow = (id) => {
        if (items.length > 1) {
            setItems(prev => prev.filter(item => item.id !== id));
            setResult(null);
            setError(null);
        } else {
            setItems([getInitialItem()]);
        }
    };

    const calculateMaterials = () => {
        const hasEmptyFields = items.some(item =>
            !item.isExcluded && (
                item.width_m === "" || item.height_m === "" ||
                item.frameMaterial === "" ||
                (item.panel_configs || []).some(p => !p.type || !p.material || !p.count)
            )
        );
        if (hasEmptyFields) {
            setError("Please ensure Width, Height, Frame Material, and all Paneling inside the 'Panel Configuration' modal are filled out.");
            setResult(null);
            return;
        }
        setError(null);

        const calcResult = calculateDoorsWindows(items, prices);

        if (calcResult) {
            setResult(calcResult);
        } else {
            setResult(null);
        }
    };

    const updatePrice = (key, value) => {
        if (!key) return;
        setPrices(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    };

    // Auto-recalculate if prices change and we have a result
    useEffect(() => {
        if (result) {
            const calcResult = calculateDoorsWindows(items, prices);
            if (calcResult) setResult(calcResult);
        }
    }, [prices]);

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('windows_total', result.grandTotal);
        } else {
            setSessionData('windows_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

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
                        className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 transition-colors`}
                    >
                        <Copy size={14} className="text-slate-400" /> Duplicate Row
                    </button>
                    <button
                        onClick={() => handleAddRowAbove(contextMenu.id)}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 transition-colors border-b border-slate-50`}
                    >
                        <ArrowUp size={14} className="text-slate-400" /> Add Row Above
                    </button>
                    <button
                        onClick={() => handleToggleExcludeRow(contextMenu.id)}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 transition-colors`}
                    >
                        {items.find(i => i.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include Row</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude Row</>
                        }
                    </button>
                </div>
            )}

            <Card className="border-t-4 shadow-md bg-white rounded-xl" style={{ borderTop: `4px solid ${THEME}` }}>
                <SectionHeader
                    title="Windows Specification"
                    icon={LayoutTemplate}
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
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Qty</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[250px]`}>Width(m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[250px]`}>Height(m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[300px]`}>Frame Material</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[400px]`}>Panel Config</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} min-w-[200px]`}>Description</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[40px]`}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id} className={`${TABLE_UI.INPUT_ROW} ${item.isExcluded ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                                    <td
                                        className={`${TABLE_UI.INPUT_CELL} text-center text-xs text-slate-400 font-bold cursor-help`}
                                        onContextMenu={(e) => {
                                            if (e.ctrlKey) {
                                                e.preventDefault();
                                                setContextMenu({ id: item.id, x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        title="Ctrl + Right Click for options"
                                    >
                                        <div className={`transition-all ${item.isExcluded ? 'text-red-400 line-through' : ''}`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput
                                            value={item.quantity}
                                            onChange={(value) => handleItemChange(item.id, 'quantity', value)}
                                            placeholder="Qty"
                                            className={`${INPUT_UI.TABLE_INPUT} font-bold`}
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput
                                            value={item.width_m}
                                            onChange={(value) => handleItemChange(item.id, 'width_m', value)}
                                            placeholder="1.20"
                                            className={INPUT_UI.TABLE_INPUT}
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput
                                            value={item.height_m}
                                            onChange={(value) => handleItemChange(item.id, 'height_m', value)}
                                            placeholder="1.50"
                                            className={INPUT_UI.TABLE_INPUT}
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput
                                            value={item.frameMaterial}
                                            onChange={(val) => handleItemChange(item.id, 'frameMaterial', val)}
                                            options={groupedFrameOptions}
                                            placeholder="Select Frame..."
                                            focusColor={THEME}
                                            className="text-xs"
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <button
                                            onClick={() => setEditingPanelsId(item.id)}
                                            className={`px-3 py-1.5 bg-white hover:bg-${THEME}-100 text-${THEME}-600 hover:text-${THEME}-700 rounded border border-${THEME}-200 hover:border-${THEME}-300 text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5 w-full min-h-[40px]`}
                                        >
                                            <Edit2 size={12} className="opacity-70 flex-shrink-0" />
                                            <span className="truncate">
                                                {(item.panel_configs || []).filter(p => p.type && p.material && p.count).length > 0
                                                    ? (item.panel_configs || [])
                                                        .filter(p => p.type && p.material && p.count)
                                                        .map(p => `${p.count}x ${p.type.replace(' Window', '')}`)
                                                        .join(', ')
                                                    : "Set Panels"
                                                }
                                            </span>
                                        </button>
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <input
                                            type="text"
                                            value={item.description || ""}
                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                            placeholder="e.g. Living Room"
                                            className={INPUT_UI.TABLE_INPUT}
                                        />
                                    </td>
                                    <td className={`${TABLE_UI.INPUT_CELL} text-center`}>
                                        <button
                                            onClick={() => handleRemoveRow(item.id)}
                                            disabled={items.length === 1}
                                            className={`p-2 rounded-full transition-colors ${items.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
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
                    <div className="p-4 bg-red-50 border-t border-red-200 text-red-700 text-sm font-medium flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end rounded-b-xl">
                    <ActionButton
                        onClick={calculateMaterials}
                        label="CALCULATE" variant="calculate"
                        icon={Calculator}
                        colorTheme={THEME}
                    />
                </div>
            </Card>

            {!result && !error && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <LayoutTemplate size={40} className={`text-${THEME}-400`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 mb-1">Ready to Estimate</h3>
                    <p className="max-w-md mx-auto text-sm">
                        Enter your window specifications above, then click <span className={`font-bold text-${THEME}-600`}>'CALCULATE'</span>.
                    </p>
                </div>
            )}

            {/* RESULT CARD */}
            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 bg-white rounded-xl" style={{ borderLeft: '4px solid #059669' }}>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-8 gap-6">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 uppercase tracking-tight">
                                    Estimation Summary
                                </h3>
                                <div className="flex flex-wrap gap-4 mt-3">
                                    <p className="text-sm text-gray-500">
                                        Total Opening Area: <strong className="text-gray-900">{result.totalArea} m²</strong>
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className={`text-left md:text-right bg-${THEME}-50 px-5 py-3 rounded-xl border border-${THEME}-100 min-w-[300px]`}>
                                    <p className={`text-xs text-${THEME}-600 font-bold uppercase tracking-wide mb-1`}>Estimated Total Material Cost</p>
                                    <p className={`font-bold text-4xl text-${THEME}-700 tracking-tight`}>
                                        ₱{result.grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <ExportButtons items={result.items} filename="windows_estimate.csv" />
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
                                        <th className={`${TABLE_UI.HEADER_CELL_RIGHT} w-[140px]`}>Unit Price (Editable)</th>
                                        <th className={`${TABLE_UI.HEADER_CELL_RIGHT} bg-gray-100/50`}>Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className={TABLE_UI.BODY_ROW}>
                                            <td className={`${TABLE_UI.CELL} font-medium text-gray-800`}>{item.name}</td>
                                            <td className={`${TABLE_UI.CELL_RIGHT} font-medium text-gray-800`}>
                                                {item.qty}
                                            </td>
                                            <td className={`${TABLE_UI.CELL_CENTER} text-gray-600`}>
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className={`${TABLE_UI.CELL} border-r-0`}>
                                                <TablePriceInput
                                                    value={item.price}
                                                    onChange={(newValue) => {
                                                        if (item.priceKey) {
                                                            updatePrice(item.priceKey, newValue);
                                                        } else {
                                                            let priceField;
                                                            if (item.priceType === 'frame') priceField = 'customFramePrice';
                                                            else if (item.priceType === 'leaf') priceField = 'customLeafPrice';
                                                            else if (item.priceType === 'hardware') priceField = 'customHardwarePrice';

                                                            if (priceField) {
                                                                handleItemChange(item.itemId, priceField, newValue);
                                                                setTimeout(() => calculateMaterials(), 50);
                                                            }
                                                        }
                                                    }}
                                                    colorTheme={THEME}
                                                />
                                            </td>
                                            <td className={`${TABLE_UI.CELL_RIGHT} font-bold text-gray-900 bg-gray-50/50`}>₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            )}

            {/* Set Panel Config Modal */}
            {
                editingPanelsId && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingPanelsId(null)}></div>
                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                            <div className={`px-6 py-4 bg-${THEME}-50 border-b border-${THEME}-200 flex justify-between items-center`}>
                                <div>
                                    <h3 className={`font-bold text-${THEME}-800 flex items-center gap-2 uppercase tracking-wide text-sm leading-none`}>
                                        <Edit2 size={16} className={`text-${THEME}-600`} /> Panel Configuration
                                    </h3>
                                    <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-widest leading-none">Window ID: W{(items.findIndex(c => c.id === editingPanelsId) + 1)}</p>
                                </div>
                                <button onClick={() => setEditingPanelsId(null)} className={`p-2 hover:bg-${THEME}-100 rounded-full transition-colors text-slate-400`}><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <table className="w-full border-collapse border border-slate-100 mb-2">
                                    <thead>
                                        <tr className="text-xs font-bold text-slate-500 uppercase tracking-widest text-left bg-slate-50 border-b border-slate-100">
                                            <th className="p-3 w-40">Panel Type</th>
                                            <th className="p-3">Glass / Material</th>
                                            <th className="p-3 text-center w-24">Count</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(items.find(i => i.id === editingPanelsId)?.panel_configs || []).map((panel, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="p-2">
                                                    <SelectInput
                                                        value={panel.type}
                                                        onChange={(val) => {
                                                            const activeItem = items.find(i => i.id === editingPanelsId);
                                                            const newConfigs = [...activeItem.panel_configs];
                                                            newConfigs[idx].type = val;
                                                            handleItemChange(editingPanelsId, 'panel_configs', newConfigs);
                                                        }}
                                                        options={itemTypes.filter(g => g.group === 'Windows')}
                                                        className="h-10 text-[11px]"
                                                        focusColor={THEME}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <SelectInput
                                                        value={panel.material}
                                                        onChange={(val) => {
                                                            const activeItem = items.find(i => i.id === editingPanelsId);
                                                            const newConfigs = [...activeItem.panel_configs];
                                                            newConfigs[idx].material = val;
                                                            handleItemChange(editingPanelsId, 'panel_configs', newConfigs);
                                                        }}
                                                        options={groupedLeafOptions.filter(g => g.group !== 'Wood Doors' && g.group !== 'Other Doors').map(g => ({ ...g, options: g.options.filter(opt => !opt.id.toLowerCase().includes('door')) })).filter(g => g.options.length > 0)}
                                                        className="h-10 text-[11px]"
                                                        focusColor={THEME}
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <MathInput
                                                        value={panel.count}
                                                        onChange={(val) => {
                                                            const activeItem = items.find(i => i.id === editingPanelsId);
                                                            const newConfigs = [...activeItem.panel_configs];
                                                            newConfigs[idx].count = val ? parseInt(val) : 1;
                                                            handleItemChange(editingPanelsId, 'panel_configs', newConfigs);
                                                        }}
                                                        placeholder="1"
                                                        className={`${INPUT_UI.TABLE_INPUT} h-10 font-bold text-sm text-center w-full`}
                                                    />
                                                </td>
                                                <td className="p-2 text-right">
                                                    <button onClick={() => {
                                                        const activeItem = items.find(i => i.id === editingPanelsId);
                                                        const newConfigs = activeItem.panel_configs.filter((_, i) => i !== idx);
                                                        handleItemChange(editingPanelsId, 'panel_configs', newConfigs.length > 0 ? newConfigs : [{ type: 'Fixed Window', material: 'Clear Glass (6mm)', count: 1 }]);
                                                    }} className="p-2 text-slate-300 hover:text-red-500 transition-colors hover:bg-red-50 rounded-full"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button onClick={() => {
                                    const activeItem = items.find(i => i.id === editingPanelsId);
                                    const newConfigs = [...(activeItem?.panel_configs || []), { type: 'Fixed Window', material: 'Clear Glass (6mm)', count: 1 }];
                                    handleItemChange(editingPanelsId, 'panel_configs', newConfigs);
                                }} className={`w-full py-2.5 bg-${THEME}-50 border border-dashed border-${THEME}-200 rounded text-[9px] font-bold text-${THEME}-600 hover:bg-${THEME}-100 uppercase tracking-widest transition-all shadow-sm`}>+ Add Panel Configuration</button>
                            </div>
                            <div className={`p-4 bg-${THEME}-50 border-t border-${THEME}-100 flex justify-end`}>
                                <button onClick={() => setEditingPanelsId(null)} className={`px-10 py-2.5 bg-${THEME}-600 text-white rounded font-bold text-xs uppercase tracking-widest hover:bg-${THEME}-700 transition-all shadow-lg shadow-${THEME}-100`}>Confirm Panels</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
