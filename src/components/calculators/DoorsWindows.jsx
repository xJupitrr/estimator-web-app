import React, { useState, useEffect } from 'react';
import { Settings, Calculator, PlusCircle, Trash2, DoorOpen, AlertCircle, ClipboardCopy, Download, Eye, EyeOff, ArrowUp, Copy } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import SelectInput from '../common/SelectInput';

// --- Components ---

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

// Helper component for currency inputs (Mirrored from Masonry layout with Amber theme)
const TablePriceInput = ({ value, onChange }) => (
    <div className="flex items-center justify-end">
        <div className="bg-gray-100/50 px-2 py-1.5 text-gray-600 text-sm font-bold flex items-center border border-gray-300 rounded-l-lg border-r-0 h-full">
            ₱
        </div>
        <input
            type="number"
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-24 pl-2 pr-2 py-1.5 text-right text-sm border border-gray-300 rounded-r-lg bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none text-gray-800 font-medium transition-colors border-l-0"
        />
    </div>
);

// Helper component for generic number inputs
const TableNumberInput = ({ value, onChange, placeholder, className = "" }) => (
    <MathInput
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-amber-400 outline-none font-medium bg-white text-slate-900 ${className}`}
    />
);


import { calculateDoorsWindows, itemTypes, frameMaterials, leafMaterials } from '../../utils/calculations/doorsWindowsCalculator';

// --- Constants (Imported from Utility) ---
// itemTypes, frameMaterials, leafMaterials are now imported.

const getInitialItem = () => ({
    id: Date.now() + Math.random(),
    quantity: 1,
    itemType: "",
    width_m: "",
    height_m: "",
    frameMaterial: "",
    leafMaterial: "",
    customFramePrice: "",
    customLeafPrice: "",
    customHardwarePrice: "",
    description: "",
    isExcluded: false,
});

export default function DoorsWindows() {
    const [items, setItems] = useLocalStorage('doorswindows_rows', [getInitialItem()]);
    const [result, setResult] = useLocalStorage('doorswindows_result', null);
    const [error, setError] = useState(null);

    const defaultMaterialMap = {
        "Sliding Window": { frame: "Aluminum (Powder Coated)", leaf: "Sliding Panel (Aluminum/Glass)" },
        "Casement Window": { frame: "Aluminum (Powder Coated)", leaf: "Casement Panel (Aluminum/Glass)" },
        "Awning Window": { frame: "Aluminum (Powder Coated)", leaf: "Casement Panel (Aluminum/Glass)" },
        "Fixed Window": { frame: "Aluminum (Powder Coated)", leaf: "Clear Glass (6mm)" },
        "Jalousie Window": { frame: "Aluminum (Powder Coated)", leaf: "Jalousie (Glass Blades Only)" },
        "Main Door (Swing)": { frame: "Wood (Mahogany)", leaf: "Mahogany Door Leaf" },
        "Main Door (Flush)": { frame: "Wood (Tanguile)", leaf: "Flush Door (Hollow Core)" },
        "Panel Door": { frame: "Wood (Tanguile)", leaf: "Tanguile Door Leaf" },
        "Sliding Door": { frame: "Aluminum (Powder Coated)", leaf: "Sliding Panel (Aluminum/Glass)" },
        "Bi-Fold Door": { frame: "Aluminum (Powder Coated)", leaf: "Casement Panel (Aluminum/Glass)" },
        "French Door": { frame: "Wood (Mahogany)", leaf: "Tempered Glass (6mm)" },
        "Screen Door": { frame: "Aluminum (Anodized)", leaf: "Clear Glass (6mm)" },
        "PVC Door": { frame: "PVC/UPVC (White)", leaf: "PVC Door (Full Panel)" },
    };

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;

            const updatedItem = { ...item, [field]: value };

            // Auto-update materials if Type changes and user hasn't set custom prices
            if (field === 'itemType' && defaultMaterialMap[value]) {
                updatedItem.frameMaterial = defaultMaterialMap[value].frame;
                updatedItem.leafMaterial = defaultMaterialMap[value].leaf;
            }

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
            item.width_m === "" || item.height_m === "" ||
            item.itemType === "" || item.frameMaterial === "" || item.leafMaterial === ""
        );
        if (hasEmptyFields) {
            setError("Please fill in all required fields (Type, Dimensions, and Materials) before calculating.");
            setResult(null);
            return;
        }
        setError(null);

        const calcResult = calculateDoorsWindows(items);

        if (calcResult) {
            setResult({
                totalArea: calcResult.totalArea,
                items: calcResult.items,
                grandTotal: calcResult.grandTotal
            });
        } else {
            setResult(null);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('doors_windows_total', result.grandTotal);
        } else {
            setSessionData('doors_windows_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    return (
        <div className="space-y-6">

            {/* INPUT CARD */}
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
                        {items.find(i => i.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in Calculation</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude from Calculation</>
                        }
                    </button>
                </div>
            )}

            <Card className="border-t-4 border-t-amber-600 shadow-md">
                <div className="p-4 bg-amber-50 border-b border-amber-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-amber-900 flex items-center gap-2">
                        <DoorOpen size={18} /> Door & Window Specification ({items.length} Total)
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddRow}
                            className="flex items-center gap-1 px-4 py-2 bg-amber-600 text-white rounded-md text-xs font-bold hover:bg-amber-700 transition-colors active:scale-95 shadow-sm"
                        >
                            <PlusCircle size={14} /> Add Row
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[1100px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[60px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[160px] bg-amber-100 text-amber-900">Opening Type</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[90px]">Width (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[90px]">Height (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[180px] bg-amber-100 text-amber-900">Frame Material</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[180px] bg-sky-100 text-sky-900">Leaf/Glass Type</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[140px]">Description</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className={`transition-colors ${item.isExcluded ? 'bg-slate-50/50 opacity-60 grayscale-[0.5]' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    <td
                                        className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold cursor-help relative group"
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
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput
                                            value={item.quantity}
                                            onChange={(value) => handleItemChange(item.id, 'quantity', value)}
                                            min="1"
                                            step="1"
                                            className="font-bold"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-amber-50">
                                        <SelectInput
                                            value={item.itemType}
                                            onChange={(val) => handleItemChange(item.id, 'itemType', val)}
                                            options={itemTypes}
                                            placeholder="Select Type..."
                                            focusColor="amber"
                                            className="text-xs"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput
                                            value={item.width_m}
                                            onChange={(value) => handleItemChange(item.id, 'width_m', value)}
                                            placeholder="1.20"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput
                                            value={item.height_m}
                                            onChange={(value) => handleItemChange(item.id, 'height_m', value)}
                                            placeholder="1.50"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-amber-50">
                                        <SelectInput
                                            value={item.frameMaterial}
                                            onChange={(val) => handleItemChange(item.id, 'frameMaterial', val)}
                                            options={frameMaterials.map(mat => ({ id: mat.name, display: `${mat.name} (₱${mat.pricePerLM.toLocaleString()}/LM)` }))}
                                            placeholder="Select Frame..."
                                            focusColor="amber"
                                            className="text-xs"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-sky-50">
                                        <SelectInput
                                            value={item.leafMaterial}
                                            onChange={(val) => handleItemChange(item.id, 'leafMaterial', val)}
                                            options={leafMaterials.map(mat => ({ id: mat.name, display: `${mat.name} (₱${mat.pricePerSqm.toLocaleString()}/sqm)` }))}
                                            placeholder="Select Leaf..."
                                            focusColor="amber"
                                            className="text-xs"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <input
                                            type="text"
                                            value={item.description || ""}
                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                            placeholder="e.g. Living Room"
                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-amber-400 outline-none text-slate-800"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle text-center">
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

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button onClick={calculateMaterials} className="w-full md:w-auto px-8 py-3 bg-amber-600 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-all hover:bg-amber-700 uppercase tracking-wider text-sm flex items-center justify-center gap-2 min-w-[200px]">
                        <Calculator size={18} /> CALCULATE
                    </button>
                </div>
            </Card>

            {/* RESULT CARD */}
            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-amber-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                    Estimation Result
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Total Opening Area: <strong className="text-gray-700">{result.totalArea} m²</strong>
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="text-left md:text-right bg-amber-50 px-5 py-3 rounded-xl border border-amber-100">
                                    <p className="text-xs text-amber-800 font-bold uppercase tracking-wide mb-1">Grand Total Estimated Cost</p>
                                    <p className="font-bold text-4xl text-amber-700 tracking-tight">₱{result.grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => copyToClipboard(result.items)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                                        title="Copy table to clipboard"
                                    >
                                        <ClipboardCopy size={14} /> Copy
                                    </button>
                                    <button
                                        onClick={() => downloadCSV(result.items, 'doors_windows_estimation.csv')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                                        title="Download as CSV"
                                    >
                                        <Download size={14} /> CSV
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200 mb-2">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 w-[35%]">Material Item</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[140px]">Unit Price (Editable)</th>
                                        <th className="px-4 py-3 text-right bg-gray-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">
                                                {item.qty}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                {item.priceType === 'hardware' || item.priceType === 'frame' || item.priceType === 'leaf' ? (
                                                    <TablePriceInput
                                                        value={item.price}
                                                        onChange={(newValue) => {
                                                            let priceField;
                                                            if (item.priceType === 'frame') priceField = 'customFramePrice';
                                                            else if (item.priceType === 'leaf') priceField = 'customLeafPrice';
                                                            else if (item.priceType === 'hardware') priceField = 'customHardwarePrice';

                                                            if (priceField) {
                                                                handleItemChange(item.itemId, priceField, newValue);
                                                                setTimeout(() => calculateMaterials(), 50);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="text-right text-sm text-gray-500 font-bold px-2 py-1.5">
                                                        ₱{item.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 bg-gray-50/50">₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            )}

            {!result && !error && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <DoorOpen size={32} className="text-amber-500" />
                    </div>
                    <p className="font-medium text-center max-w-md">
                        Enter your door/window specifications, then click <span className="font-bold text-amber-600">'CALCULATE'</span> to get itemized cost estimates.
                    </p>
                </div>
            )}
        </div>
    );
}
