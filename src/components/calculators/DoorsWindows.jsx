import React, { useState, useEffect } from 'react';
import { Settings, Calculator, PlusCircle, Trash2, DoorOpen, AlertCircle, ClipboardCopy, Download } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import useLocalStorage from '../../hooks/useLocalStorage';

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


// --- Helper Functions & Data ---

const itemTypes = [
    "Sliding Window",
    "Casement Window",
    "Awning Window",
    "Fixed Window",
    "Jalousie Window",
    "Main Door (Swing)",
    "Main Door (Flush)",
    "Panel Door",
    "Sliding Door",
    "Bi-Fold Door",
    "French Door",
    "Screen Door",
    "PVC Door",
];

const frameMaterials = [
    { name: "Aluminum (Powder Coated)", pricePerLM: 1250 },
    { name: "Aluminum (Anodized)", pricePerLM: 1100 },
    { name: "Aluminum (Bronze)", pricePerLM: 1150 },
    { name: "PVC/UPVC (White)", pricePerLM: 950 },
    { name: "PVC/UPVC (Woodgrain)", pricePerLM: 1250 },
    { name: "Wood (Mahogany)", pricePerLM: 480 },
    { name: "Wood (Narra)", pricePerLM: 550 },
    { name: "Wood (Tanguile)", pricePerLM: 420 },
    { name: "Steel (Galvanized)", pricePerLM: 850 },
    { name: "Steel (Powder Coated)", pricePerLM: 1100 },
];

const leafMaterials = [
    { name: "Clear Glass (6mm)", pricePerSqm: 1800 },
    { name: "Clear Glass (8mm)", pricePerSqm: 2200 },
    { name: "Tinted Glass (6mm)", pricePerSqm: 2000 },
    { name: "Tempered Glass (6mm)", pricePerSqm: 2800 },
    { name: "Tempered Glass (10mm)", pricePerSqm: 3500 },
    { name: "Laminated Glass (6mm)", pricePerSqm: 3200 },
    { name: "Double Glazed (IGU)", pricePerSqm: 5500 },
    { name: "Frosted/Obscure Glass", pricePerSqm: 2100 },
    { name: "Jalousie (Glass Blades Only)", pricePerSqm: 720 },
    { name: "Louver Glass Blades", pricePerSqm: 720 },
    { name: "Sliding Panel (Aluminum/Glass)", pricePerSqm: 5800 },
    { name: "Casement Panel (Aluminum/Glass)", pricePerSqm: 5000 },
    { name: "Steel Casement (Awning/Swing)", pricePerSqm: 1950 },
    { name: "uPVC Sliding Panel (White)", pricePerSqm: 3500 },
    { name: "uPVC Casement Panel (White)", pricePerSqm: 4100 },
    { name: "uPVC Awning Panel (White)", pricePerSqm: 3600 },
    { name: "Mahogany Door Leaf", pricePerSqm: 2600 },
    { name: "Narra Door Leaf", pricePerSqm: 5650 },
    { name: "Tanguile Door Leaf", pricePerSqm: 4900 },
    { name: "Flush Door (Hollow Core)", pricePerSqm: 935 },
    { name: "PVC Door (Full Panel)", pricePerSqm: 900 },
    { name: "Steel Door Leaf", pricePerSqm: 1900 },
    { name: "Solid Panel (No Glass)", pricePerSqm: 0 },
];

const getInitialItem = () => ({
    id: crypto.randomUUID(),
    quantity: 1,
    itemType: "Sliding Window",
    width_m: "",
    height_m: "",
    frameMaterial: "Aluminum (Powder Coated)",
    leafMaterial: "Clear Glass (6mm)",
    customFramePrice: "",
    customLeafPrice: "",
    customHardwarePrice: "",
    description: "",
});

export default function DoorsWindows() {

    const [items, setItems] = useLocalStorage('doorswindows_rows', [getInitialItem()]);

    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const getFramePrice = (materialName) => {
        const material = frameMaterials.find(m => m.name === materialName);
        return material ? material.pricePerLM : 0;
    };

    const getLeafPrice = (materialName) => {
        const material = leafMaterials.find(m => m.name === materialName);
        return material ? material.pricePerSqm : 0;
    };

    const getHardwareCost = (itemType, width, height, quantity) => {
        const typeLower = itemType.toLowerCase();
        const area = width * height;

        // Base hardware costs per opening (Philippine market 2024-2025)
        const hingeSet = 120; // Per hinge (typically 2-4 per door/window)
        const lockset = 800; // Standard lockset
        const doorKnob = 600; // Basic doorknob
        const lever = 900; // Door lever
        const slidingRail = 350; // Per linear meter of rail
        const roller = 250; // Per roller set (2 per panel)
        const casementOperator = 400; // Casement window crank/operator
        const awningOperator = 380; // Awning window operator
        const bifoldfoldTrack = 300; // Per linear meter
        const jalousieOperator = 350; // Jalousie crank mechanism

        let hardwareCost = 0;

        // Sliding Windows/Doors
        if (typeLower.includes('sliding')) {
            const railLength = width * 2; // Top and bottom rails
            const rollerSets = 1; // Standard 1 set per panel
            hardwareCost = (slidingRail * railLength) + (roller * rollerSets) + 300; // +300 for handles/locks

            if (typeLower.includes('door')) {
                hardwareCost += 500; // Better lockset for doors
            }
        }
        // Casement Windows
        else if (typeLower.includes('casement')) {
            const numHinges = height > 1.5 ? 3 : 2; // More hinges for taller windows
            hardwareCost = (hingeSet * numHinges) + casementOperator + 200; // +200 for handles
        }
        // Awning Windows
        else if (typeLower.includes('awning')) {
            const numHinges = 2; // Typically 2 hinges
            hardwareCost = (hingeSet * numHinges) + awningOperator + 150; // +150 for handles
        }
        // Jalousie Windows
        else if (typeLower.includes('jalousie')) {
            hardwareCost = jalousieOperator + 200; // Operator mechanism + handle
        }
        // Bi-fold Doors
        else if (typeLower.includes('bi-fold') || typeLower.includes('bifold')) {
            const trackLength = width;
            const numHinges = 4; // Hinges between panels
            hardwareCost = (bifoldfoldTrack * trackLength) + (hingeSet * numHinges) + 400; // +400 for handles
        }
        // French Doors
        else if (typeLower.includes('french')) {
            const numHinges = height > 2.0 ? 4 : 3; // More hinges for taller doors
            hardwareCost = (hingeSet * numHinges) + lockset + lever;
        }
        // Main Doors (Swing/Flush/Panel)
        else if (typeLower.includes('main door') || typeLower.includes('panel door')) {
            const numHinges = height > 2.0 ? 4 : 3; // More hinges for taller doors
            const isHeavy = area > 2.0; // Large doors need better hardware
            hardwareCost = (hingeSet * numHinges) + lockset + (isHeavy ? lever : doorKnob) + 300; // +300 for deadbolt/additional security
        }
        // Screen Doors
        else if (typeLower.includes('screen')) {
            hardwareCost = (hingeSet * 2) + 250; // Simple hinges + handle
        }
        // PVC Doors
        else if (typeLower.includes('pvc door')) {
            const numHinges = 3;
            hardwareCost = (hingeSet * numHinges) + lockset + 200;
        }
        // Fixed Windows (minimal hardware)
        else if (typeLower.includes('fixed')) {
            hardwareCost = 150; // Just clips/fasteners
        }
        // Default fallback
        else {
            hardwareCost = 800; // Basic hardware set
        }

        return hardwareCost * quantity;
    };

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
        let totalAreaSqm = 0;
        let grandTotal = 0;
        const materializedItems = [];

        const hasEmptyFields = items.some(item => item.width_m === "" || item.height_m === "");
        if (hasEmptyFields) {
            setError("Please fill in all required dimension fields (Width, Height) before calculating.");
            setResult(null);
            return;
        }
        setError(null);

        items.forEach((item) => {
            const width = parseFloat(item.width_m) || 0;
            const height = parseFloat(item.height_m) || 0;
            const quantity = parseInt(item.quantity) || 1;

            if (width <= 0 || height <= 0) return;

            const singleAreaSqm = width * height;
            const totalItemAreaSqm = singleAreaSqm * quantity;

            const isDoor = item.itemType.toLowerCase().includes('door');
            // Door Jamb: 2 heights + 1 width (no bottom jamb usually)
            // Window Frame: 2 heights + 2 widths
            const perimeterLM = isDoor ? (2 * height + width) : (2 * height + 2 * width);
            const totalPerimeterLM = perimeterLM * quantity;

            const wasteMultiplier = 1; // No waste factor applied

            totalAreaSqm += totalItemAreaSqm;

            // Component Prices - Robustly handle potential undefined/empty strings from legacy state
            const framePrice = (item.customFramePrice && item.customFramePrice !== "")
                ? parseFloat(item.customFramePrice)
                : getFramePrice(item.frameMaterial);

            const leafPrice = (item.customLeafPrice && item.customLeafPrice !== "")
                ? parseFloat(item.customLeafPrice)
                : getLeafPrice(item.leafMaterial);

            // Itemize
            const frameCost = totalPerimeterLM * framePrice * wasteMultiplier;
            const leafCost = totalItemAreaSqm * leafPrice * wasteMultiplier;
            const hardwareCostTotal = getHardwareCost(item.itemType, width, height, quantity);

            // Add Leaf/Panel item
            if (isDoor) {
                materializedItems.push({
                    name: `${item.itemType} ${item.leafMaterial}`,
                    qty: totalItemAreaSqm.toFixed(2),
                    unit: 'sq.m',
                    price: leafPrice,
                    total: leafCost,
                    isComponent: true,
                    itemId: item.id,
                    priceType: 'leaf'
                });
            } else if (leafPrice > 0 || item.leafMaterial !== "Solid Panel (No Glass)") {
                materializedItems.push({
                    name: `${item.itemType} ${item.leafMaterial}`,
                    qty: totalItemAreaSqm.toFixed(2),
                    unit: 'sq.m',
                    price: leafPrice,
                    total: leafCost,
                    isComponent: true,
                    itemId: item.id,
                    priceType: 'leaf'
                });
            }

            // Add Frame/Jamb item (Linear Meters)
            materializedItems.push({
                name: `${item.itemType} ${item.frameMaterial}`,
                qty: totalPerimeterLM.toFixed(2),
                unit: 'LM',
                price: framePrice,
                total: frameCost,
                isComponent: true,
                itemId: item.id,
                priceType: 'frame'
            });

            // Add Hardware item
            const hardwarePrice = (item.customHardwarePrice && item.customHardwarePrice !== "")
                ? parseFloat(item.customHardwarePrice) * quantity
                : hardwareCostTotal;

            materializedItems.push({
                name: `${item.itemType} - Hardware Set`,
                qty: quantity,
                unit: 'sets',
                price: hardwarePrice / quantity,
                total: hardwarePrice,
                isComponent: true,
                priceType: 'hardware',
                itemId: item.id
            });

            grandTotal += frameCost + leafCost + hardwarePrice;
        });

        // Consolidate duplicate items
        const consolidatedItems = [];
        const itemMap = new Map();

        materializedItems.forEach(item => {
            const key = `${item.name}|${item.unit}|${item.price}|${item.priceType || ''}`;

            if (itemMap.has(key)) {
                const existing = itemMap.get(key);
                existing.qty = (parseFloat(existing.qty) + parseFloat(item.qty)).toFixed(2);
                existing.total += item.total;
            } else {
                itemMap.set(key, { ...item });
            }
        });

        itemMap.forEach(item => consolidatedItems.push(item));

        if (totalAreaSqm <= 0) {
            setResult(null);
            return;
        }

        setResult({
            totalArea: totalAreaSqm.toFixed(2),
            items: consolidatedItems,
            grandTotal: grandTotal
        });
    };

    return (
        <div className="space-y-6">

            {/* INPUT CARD */}
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
                                <tr key={item.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold">
                                        {index + 1}
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
                                        <select
                                            value={item.itemType}
                                            onChange={(e) => handleItemChange(item.id, 'itemType', e.target.value)}
                                            className="w-full p-1.5 text-left border border-amber-200 rounded bg-white focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer text-xs font-medium text-slate-800"
                                        >
                                            {itemTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
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
                                        <select
                                            value={item.frameMaterial}
                                            onChange={(e) => handleItemChange(item.id, 'frameMaterial', e.target.value)}
                                            className="w-full p-1.5 text-left border border-amber-200 rounded bg-white focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer text-xs font-medium text-slate-800"
                                        >
                                            {frameMaterials.map(mat => (
                                                <option key={mat.name} value={mat.name}>
                                                    {mat.name} (₱{mat.pricePerLM.toLocaleString()}/LM)
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-sky-50">
                                        <select
                                            value={item.leafMaterial}
                                            onChange={(e) => handleItemChange(item.id, 'leafMaterial', e.target.value)}
                                            className="w-full p-1.5 text-left border border-sky-200 rounded bg-white focus:ring-2 focus:ring-sky-400 outline-none cursor-pointer text-xs font-medium text-slate-800"
                                        >
                                            {leafMaterials.map(mat => (
                                                <option key={mat.name} value={mat.name}>
                                                    {mat.name} (₱{mat.pricePerSqm.toLocaleString()}/sqm)
                                                </option>
                                            ))}
                                        </select>
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
                        <Calculator size={18} /> Calculate
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
                                        <th className="px-4 py-3">Material Item</th>
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
                        Enter your door/window specifications, then click <span className="font-bold text-amber-600">'Calculate'</span> to get itemized cost estimates.
                    </p>
                </div>
            )}
        </div>
    );
}
