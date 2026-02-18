import React, { useState, useEffect } from 'react';
import { Settings, Calculator, PlusCircle, Trash2, AlertCircle, ClipboardCopy, Download, Eye, EyeOff, ArrowUp, Copy } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import { calculateMasonry } from '../../utils/calculations/masonryCalculator';
import { getDefaultPrices } from '../../constants/materials';
import { THEME_COLORS } from '../../constants/theme';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import TablePriceInput from '../common/TablePriceInput';

const THEME = THEME_COLORS.masonry;

// Format number to Philippine Peso (₱)
const formatPrice = (value) => {
    return value ? parseFloat(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
};

// --- Helper Functions ---

const rebarDiameters = ["10mm", "12mm"];
const commonLengths = [6.0, 7.5, 9.0, 10.5, 12.0];
const rebarOptions = rebarDiameters.flatMap(size =>
    commonLengths.map(length => `${size} x ${length.toFixed(1)}m`)
);

// Initial Wall Configuration Template
const getInitialWall = () => ({
    id: Date.now() + Math.random(),
    length: "",
    height: "",
    quantity: "",
    chbSize: "",
    plasterSides: "",
    // Note: Spacing variables reflect the direction *along which* the spacing is measured.
    horizSpacing: "", // Spacing along the length (controls vertical bars)
    vertSpacing: "", // Spacing along the height (controls horizontal bars)
    horizRebarSpec: "", // 10mm x 6.0m
    vertRebarSpec: "", // 12mm x 6.0m
    isExcluded: false,
});

import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';

export default function Masonry() { // Renamed to Masonry

    // --- Wall Configurations State (Array of walls) ---
    const [walls, setWalls] = useLocalStorage('masonry_walls', [getInitialWall()]);

    // Material Prices
    const [wallPrices, setWallPrices] = useLocalStorage('masonry_prices', getDefaultPrices());

    const [wallResult, setWallResult] = useLocalStorage('masonry_result', null);
    // Track if an estimate has been run at least once to enable auto-recalc
    const [hasEstimated, setHasEstimated] = useLocalStorage('masonry_has_estimated', false);
    const [error, setError] = useState(null);

    // Handler to update a specific wall in the array
    const handleWallChange = (id, field, value) => {
        setWalls(prevWalls =>
            prevWalls.map(wall => (
                wall.id === id ? { ...wall, [field]: value } : wall
            ))
        );
        setError(null);
    };

    // Handler to add a new wall
    const handleAddWall = () => {
        setWalls(prevWalls => [...prevWalls, getInitialWall()]);
        setHasEstimated(false);
        setWallResult(null);
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
        setWalls(prev => {
            const index = prev.findIndex(w => w.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, getInitialWall());
            return newRows;
        });
        setContextMenu(null);
        setWallResult(null);
    };

    const handleDuplicateRow = (id) => {
        setWalls(prev => {
            const index = prev.findIndex(w => w.id === id);
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
        setWallResult(null);
    };

    const handleToggleExcludeRow = (id) => {
        setWalls(prev => prev.map(w => w.id === id ? { ...w, isExcluded: !w.isExcluded } : w));
        setContextMenu(null);
        setWallResult(null);
    };

    // Auto-update suggested price for the *first* wall when size changes
    useEffect(() => {
        const firstWallSize = walls[0]?.chbSize;
        if (firstWallSize) {
            setWallPrices(prev => ({
                ...prev,
                chb: firstWallSize === "4" ? 15 : 22
            }));
        }
    }, [walls[0]?.chbSize]); // Only trigger if CHB size changes

    // Re-calculate automatically when prices change IF we already have a result
    useEffect(() => {
        if (hasEstimated) {
            calculateWall();
        }
    }, [wallPrices]);

    const calculateWall = () => {
        const hasEmptyFields = walls.some(wall =>
            wall.length === "" || wall.height === "" || wall.vertSpacing === "" || wall.horizSpacing === "" ||
            wall.chbSize === "" || wall.plasterSides === "" || wall.horizRebarSpec === "" || wall.vertRebarSpec === ""
        );

        if (hasEmptyFields) {
            setError("Please fill in all fields (Dimensions, Spacing, and Material Specs) before calculating.");
            setWallResult(null);
            setHasEstimated(false);
            return;
        }
        setError(null);

        const result = calculateMasonry(walls, wallPrices);

        if (result) {
            setWallResult(result);
            setHasEstimated(true);
        } else {
            setWallResult(null);
            setHasEstimated(false);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (wallResult) {
            setSessionData('masonry_total', wallResult.total);
        } else {
            setSessionData('masonry_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [wallResult]);

    const handlePriceChange = (key, newValue) => {
        setWallPrices(prev => ({
            ...prev,
            [key]: parseFloat(newValue) || 0
        }));
        // Calculate is handled by useEffect
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
                        {walls.find(w => w.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in Calculation</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude from Calculation</>
                        }
                    </button>
                </div>
            )}

            {/* INPUT CARD */}
            <Card className={`border-t-4 border-t-${THEME}-500 shadow-md`}>
                <SectionHeader
                    title={`Wall Configuration (${walls.length} Total)`}
                    icon={Settings}
                    colorTheme={THEME}
                    actions={
                        <ActionButton
                            onClick={handleAddWall}
                            label="Add Row"
                            icon={PlusCircle}
                            colorTheme={THEME}
                            title="Add another wall configuration row"
                        />
                    }
                />

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[1000px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[60px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">Length (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">Height (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">CMU Size</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">Plaster</th>

                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">V. Rebar Spacing</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Horiz. Rebar Spec</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">H. Rebar Spacing</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[120px]">Vert. Rebar Spec</th>

                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {walls.map((wall, index) => (
                                <tr
                                    key={wall.id}
                                    className={`transition-colors ${wall.isExcluded ? 'bg-slate-50/50 opacity-60 grayscale-[0.5]' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    {/* Index */}
                                    <td
                                        className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold cursor-help relative group"
                                        onContextMenu={(e) => {
                                            if (e.ctrlKey) {
                                                e.preventDefault();
                                                setContextMenu({ id: wall.id, x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        title="Ctrl + Right Click for options"
                                    >
                                        <div className={`transition-all ${wall.isExcluded ? 'text-red-400 line-through' : ''}`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    {/* Quantity */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <MathInput
                                            placeholder="Qty"
                                            value={wall.quantity}
                                            onChange={(val) => handleWallChange(wall.id, 'quantity', val)}
                                            className="w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none font-bold bg-white text-slate-900"
                                        />
                                    </td>
                                    {/* Length */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <MathInput
                                                placeholder="3.00"
                                                value={wall.length}
                                                onChange={(val) => handleWallChange(wall.id, 'length', val)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>
                                    {/* Height */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <MathInput
                                                placeholder="2.70"
                                                value={wall.height}
                                                onChange={(val) => handleWallChange(wall.id, 'height', val)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>
                                    {/* CMU Size */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <SelectInput
                                            value={wall.chbSize}
                                            onChange={(val) => handleWallChange(wall.id, 'chbSize', val)}
                                            options={[
                                                { id: "4", display: '4" (10cm)' },
                                                { id: "6", display: '6" (15cm)' }
                                            ]}
                                            placeholder="Select Size..."
                                            focusColor="orange"
                                        />
                                    </td>
                                    {/* Plaster Sides */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <SelectInput
                                            value={wall.plasterSides}
                                            onChange={(val) => handleWallChange(wall.id, 'plasterSides', val)}
                                            options={[
                                                { id: "0", display: 'None' },
                                                { id: "1", display: '1 Side' },
                                                { id: "2", display: '2 Sides' }
                                            ]}
                                            placeholder="Select Plaster..."
                                            focusColor="orange"
                                        />
                                    </td>

                                    {/* V. Rebar Spacing */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <MathInput
                                                placeholder="0.60"
                                                value={wall.vertSpacing}
                                                onChange={(val) => handleWallChange(wall.id, 'vertSpacing', val)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>

                                    {/* Horizontal Rebar Spec */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <SelectInput
                                            value={wall.horizRebarSpec}
                                            onChange={(val) => handleWallChange(wall.id, 'horizRebarSpec', val)}
                                            options={rebarOptions}
                                            placeholder="Select Spec..."
                                            focusColor="orange"
                                        />
                                    </td>

                                    {/* H. Rebar Spacing */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <div className="relative">
                                            <MathInput
                                                placeholder="0.60"
                                                value={wall.horizSpacing}
                                                onChange={(val) => handleWallChange(wall.id, 'horizSpacing', val)}
                                                className="w-full p-1.5 pr-6 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-400 outline-none font-medium bg-white text-slate-900"
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">m</span>
                                        </div>
                                    </td>

                                    {/* Vertical Rebar Spec */}
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <SelectInput
                                            value={wall.vertRebarSpec}
                                            onChange={(val) => handleWallChange(wall.id, 'vertRebarSpec', val)}
                                            options={rebarOptions}
                                            placeholder="Select Spec..."
                                            focusColor="orange"
                                        />
                                    </td>
                                    {/* Delete Button */}
                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <button
                                            onClick={() => handleRemoveWall(wall.id)}
                                            disabled={walls.length === 1}
                                            className={`p-2 rounded-full transition-colors ${walls.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
                                            title={walls.length === 1 ? 'Minimum one wall is required' : 'Remove Wall'}
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
                    <ActionButton
                        onClick={calculateWall}
                        label="CALCULATE"
                        icon={Calculator}
                        colorTheme={THEME}
                        className="w-full md:w-auto px-8 py-3 uppercase tracking-wider text-sm min-w-[200px]"
                    />
                </div>
            </Card>

            {/* RESULT CARD */}
            {wallResult && (
                <Card className={`animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-${THEME}-500`}>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                    Estimation Result
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Based on <strong className="text-gray-700">{wallResult.quantity}</strong> wall configurations totaling <strong className="text-gray-700">{wallResult.area} m²</strong> area.</p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className={`text-left md:text-right bg-${THEME}-50 px-5 py-3 rounded-xl border border-${THEME}-100`}>
                                    <p className={`text-xs text-${THEME}-600 font-bold uppercase tracking-wide mb-1`}>Estimated Total Material Cost</p>
                                    <p className={`font-bold text-4xl text-${THEME}-700 tracking-tight`}>
                                        {wallResult.total.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            const success = await copyToClipboard(wallResult.items);
                                            if (success) alert('Table copied to clipboard!');
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                                        title="Copy table to clipboard for Excel"
                                    >
                                        <ClipboardCopy size={14} /> Copy to Clipboard
                                    </button>
                                    <button
                                        onClick={() => downloadCSV(wallResult.items, 'masonry_estimate.csv')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                                        title="Download as CSV"
                                    >
                                        <Download size={14} /> Download CSV
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200 mb-2">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr><th className="px-4 py-3">Material Item</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[140px]">Unit Price (Editable)</th>
                                        <th className="px-4 py-3 text-right bg-gray-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {wallResult.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">
                                                {item.qty}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            {/* Editable Price Column using TablePriceInput */}
                                            <td className="px-4 py-2">
                                                <TablePriceInput
                                                    value={item.price}
                                                    onChange={(newValue) => handlePriceChange(item.priceKey, newValue)}
                                                    colorTheme={THEME}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 bg-gray-50/50">
                                                {item.total.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </Card>
            )}

            {!wallResult && !error && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Calculator size={32} className={`text-${THEME}-500`} />
                    </div>
                    <p className="font-medium text-center max-w-md">
                        Enter your wall dimensions above, then click <span className={`font-bold text-${THEME}-600`}>'CALCULATE'</span> to generate the material list.
                    </p>
                </div>
            )}
        </div>
    );
}
