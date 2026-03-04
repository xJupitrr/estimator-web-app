import React, { useState, useEffect } from 'react';
import { Settings, Calculator, PlusCircle, Trash2, AlertCircle, ClipboardCopy, Download, Eye, EyeOff, ArrowUp, Copy, DoorOpen } from 'lucide-react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { getDefaultPrices } from '../../constants/materials';
import { copyToClipboard, downloadCSV } from '../../utils/export';
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
    id: Date.now() + Math.random(),
    quantity: "",
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
    const [prices, setPrices] = useLocalStorage('app_material_prices', getDefaultPrices(), { mergeDefaults: true });
    const [result, setResult] = useLocalStorage('doorswindows_result', null);
    const [error, setError] = useState(null);

    const defaultMaterialMap = {
        "Sliding Window": { frame: "Aluminum (Powder Coated)", leaf: "Sliding Panel (Aluminum/Glass)" },
        "Casement Window": { frame: "Aluminum (Powder Coated)", leaf: "Casement Panel (Aluminum/Glass)" },
        "Awning Window": { frame: "Aluminum (Powder Coated)", leaf: "Casement Panel (Aluminum/Glass)" },
        "Fixed Window": { frame: "Aluminum (Powder Coated)", leaf: "Clear Glass (6mm)" },
        "Jalousie Window": { frame: "Aluminum (Powder Coated)", leaf: "Jalousie (Glass Blades Only)" },
        "Swing Door": { frame: "Wood (Mahogany)", leaf: "Mahogany Door Leaf" },
        "Flush Door": { frame: "Wood (Tanguile)", leaf: "Flush Door (Hollow Core)" },
        "Sliding Door": { frame: "Aluminum (Powder Coated)", leaf: "Sliding Panel (Aluminum/Glass)" },
        "Bi-Fold Door": { frame: "Aluminum (Powder Coated)", leaf: "Casement Panel (Aluminum/Glass)" },
        "French Door": { frame: "Wood (Mahogany)", leaf: "Tempered Glass (6mm)" },
        "Screen Door": { frame: "Aluminum (Anodized)", leaf: "Clear Glass (6mm)" },
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
                    <ExportButtons items={result.items} filename="doors_windows_estimation.csv" />
                </div>
                            </div>
                        </div >

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
                    </div >
                </Card >
            )
}


        </div >
    );
}


