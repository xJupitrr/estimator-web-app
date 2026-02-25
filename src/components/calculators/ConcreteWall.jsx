import React, { useState, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Layers, Calculator, PlusCircle, Trash2, Download, ArrowUp, Copy, Eye, EyeOff, AlertCircle, ClipboardCopy } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import { calculateConcreteWall } from '../../utils/calculations/concreteWallCalculator';

import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import TablePriceInput from '../common/TablePriceInput';
import SelectInput from '../common/SelectInput';
import { THEME_COLORS, TABLE_UI, INPUT_UI } from '../../constants/designSystem';
import ExportButtons from '../common/ExportButtons';

const THEME = THEME_COLORS.concrete_wall;

const rebarDiameters = [10, 12, 16, 20];
const commonLengths = [6.0, 7.5, 9.0, 10.5, 12.0];
const rebarOptions = rebarDiameters.flatMap(size =>
    commonLengths.map(length => `${size}mm x ${length.toFixed(1)}m`)
);

const getInitialWall = () => ({
    id: Date.now() + Math.random(),
    length: "",
    height: "",
    thickness: "",
    vertSpacing: "",
    horizSpacing: "",
    vertRebarSpec: "",
    horizRebarSpec: "",
    layers: "",
    isExcluded: false,
    quantity: "1"
});

export default function ConcreteWall() {
    const [walls, setWalls] = useLocalStorage('concrete_walls', [getInitialWall()]);
    const [prices, setPrices] = useLocalStorage('concrete_wall_prices', {
        cement: 265,
        sand: 1200,
        gravel: 1400,
        rebar10mmPrice: 185,
        rebar12mmPrice: 285,
        rebar16mmPrice: 515,
        rebar20mmPrice: 835,
        tieWire: 85,
    });

    const [result, setResult] = useLocalStorage('concrete_wall_result', null);
    const [hasEstimated, setHasEstimated] = useLocalStorage('concrete_wall_has_estimated', false);
    const [error, setError] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleWallChange = (id, field, value) => {
        setWalls(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
        if (hasEstimated) setError(null);
    };

    const handleAddWall = () => {
        setWalls(prev => [...prev, getInitialWall()]);
    };

    const handleRemoveWall = (id) => {
        if (walls.length > 1) {
            setWalls(prev => prev.filter(w => w.id !== id));
        } else {
            setWalls([getInitialWall()]);
        }
    };

    const handleDuplicateRow = (id) => {
        setWalls(prev => {
            const index = prev.findIndex(w => w.id === id);
            const rowToCopy = prev[index];
            const duplicated = { ...JSON.parse(JSON.stringify(rowToCopy)), id: Date.now() + Math.random() };
            const newRows = [...prev];
            newRows.splice(index + 1, 0, duplicated);
            return newRows;
        });
        setContextMenu(null);
    };

    const handleAddRowAbove = (id) => {
        setWalls(prev => {
            const index = prev.findIndex(r => r.id === id);
            const newRows = [...prev];
            newRows.splice(index, 0, getInitialWall());
            return newRows;
        });
        setContextMenu(null);
    };

    const handleToggleExcludeRow = (id) => {
        setWalls(prev => prev.map(w => w.id === id ? { ...w, isExcluded: !w.isExcluded } : w));
        setContextMenu(null);
    };

    const handleCalculate = () => {
        const hasEmptyFields = walls.some(w => !w.isExcluded && (!w.length || !w.height || !w.thickness || !w.vertSpacing || !w.horizSpacing));
        if (hasEmptyFields) {
            setError("Please fill in all dimensions and spacing fields.");
            setResult(null);
            setHasEstimated(false);
            return;
        }
        setError(null);

        const res = calculateConcreteWall(walls, prices);
        if (res) {
            setResult(res);
            setHasEstimated(true);
        } else {
            setResult(null);
            setHasEstimated(false);
        }
    };

    // Calculate whenever inputs change (if already estimated)
    useEffect(() => {
        if (hasEstimated) {
            const res = calculateConcreteWall(walls, prices);
            setResult(res);
        }
    }, [walls, prices, hasEstimated]);

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('concrete_wall_total', result.total);
        } else {
            setSessionData('concrete_wall_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    const handlePriceChange = (key, val) => {
        setPrices(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
    };

    return (
        <div className="space-y-6 relative">
            {/* CONTEXT MENU */}
            {contextMenu && (
                <div
                    className="fixed z-[100] bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => handleDuplicateRow(contextMenu.id)}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-${THEME}-50 transition-colors`}
                    >
                        <Copy size={14} className="text-slate-400" /> Duplicate Wall
                    </button>
                    <button
                        onClick={() => handleAddRowAbove(contextMenu.id)}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-${THEME}-50 transition-colors border-b border-slate-50`}
                    >
                        <ArrowUp size={14} className="text-slate-400" /> Add Wall Above
                    </button>
                    <button
                        onClick={() => handleToggleExcludeRow(contextMenu.id)}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-${THEME}-50 transition-colors`}
                    >
                        {walls.find(w => w.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include Wall</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude Wall</>
                        }
                    </button>
                </div>
            )}

            <Card className="border-t-4 shadow-md bg-white rounded-xl" style={{ borderTop: '4px solid #2563eb' }}>
                <SectionHeader
                    title="Retaining / Shear Wall Configuration"
                    icon={Layers}
                    colorTheme={THEME}
                    actions={
                        <ActionButton
                            onClick={handleAddWall}
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
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Length (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Height (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Thkns (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[120px]`}>Vert. Rebar</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[90px]`}>V-Sp (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[120px]`}>Horiz. Rebar</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[90px]`}>H-Sp (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Layers</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[50px]`}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {walls.map((wall, index) => (
                                <tr key={wall.id} className={`${TABLE_UI.INPUT_ROW} ${wall.isExcluded ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                    <td
                                        className={`${TABLE_UI.INPUT_CELL} text-center text-xs text-slate-400 font-bold cursor-help`}
                                        onContextMenu={(e) => {
                                            if (e.ctrlKey) {
                                                e.preventDefault();
                                                setContextMenu({ id: wall.id, x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        title="Ctrl + Right Click for options"
                                    >
                                        <span className={wall.isExcluded ? 'line-through' : ''}>{index + 1}</span>
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={wall.quantity} onChange={(v) => handleWallChange(wall.id, 'quantity', v)} className={INPUT_UI.TABLE_INPUT} placeholder="1" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={wall.length} onChange={(v) => handleWallChange(wall.id, 'length', v)} className={INPUT_UI.TABLE_INPUT} placeholder="0.00" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={wall.height} onChange={(v) => handleWallChange(wall.id, 'height', v)} className={INPUT_UI.TABLE_INPUT} placeholder="0.00" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={wall.thickness} onChange={(v) => handleWallChange(wall.id, 'thickness', v)} className={INPUT_UI.TABLE_INPUT} placeholder="0.20" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput
                                            value={wall.vertRebarSpec}
                                            onChange={(v) => handleWallChange(wall.id, 'vertRebarSpec', v)}
                                            options={rebarOptions}
                                            focusColor={THEME}
                                            placeholder="Vert. Spec"
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={wall.vertSpacing} onChange={(v) => handleWallChange(wall.id, 'vertSpacing', v)} className={INPUT_UI.TABLE_INPUT} placeholder="0.20" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput
                                            value={wall.horizRebarSpec}
                                            onChange={(v) => handleWallChange(wall.id, 'horizRebarSpec', v)}
                                            options={rebarOptions}
                                            focusColor={THEME}
                                            placeholder="Horiz. Spec"
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={wall.horizSpacing} onChange={(v) => handleWallChange(wall.id, 'horizSpacing', v)} className={INPUT_UI.TABLE_INPUT} placeholder="0.20" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput
                                            value={wall.layers}
                                            onChange={(v) => handleWallChange(wall.id, 'layers', v)}
                                            options={[{ id: "1", display: "Single" }, { id: "2", display: "Double" }]}
                                            focusColor={THEME}
                                            placeholder="Layers"
                                        />
                                    </td>
                                    <td className={`${TABLE_UI.INPUT_CELL} text-center`}>
                                        <button onClick={() => handleRemoveWall(wall.id)} className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors" disabled={walls.length === 1}>
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
                        <Layers size={40} className={`text-${THEME}-400`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 mb-1">Ready to Estimate</h3>
                    <p className="max-w-md mx-auto text-sm">
                        Enter your wall dimensions and specifications above, then click <span className={`font-bold text-${THEME}-600`}>'CALCULATE'</span>.
                    </p>
                </div>
            )}

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 bg-white rounded-xl" style={{ borderLeft: '4px solid #2563eb' }}>
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                            <div>
                                <h3 className="font-bold text-2xl text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                    Estimation Summary
                                    <span className={`text-[10px] bg-${THEME}-100 text-${THEME}-700 px-2 py-0.5 rounded-full font-mono`}>RC-WALL-01</span>
                                </h3>
                                <div className="flex flex-wrap gap-4 mt-3">
                                    <p className="text-sm text-slate-500">Volume: <strong className="text-slate-900">{result.volume} m³</strong></p>
                                    <p className="text-sm text-slate-500">Area: <strong className="text-slate-900">{result.area} m²</strong></p>
                                    <p className="text-sm text-slate-500">Sections: <strong className="text-slate-900">{result.quantity}</strong></p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className={`text-left md:text-right bg-${THEME}-50 px-5 py-3 rounded-xl border border-${THEME}-100 w-full`}>
                                    <p className={`text-xs text-${THEME}-600 font-bold uppercase tracking-wide mb-1`}>Estimated Total Material Cost</p>
                                    <p className={`font-bold text-4xl text-${THEME}-700 tracking-tight`}>
                                        {result.total.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <ExportButtons
                                    onCopy={async () => {
                                        const success = await copyToClipboard(result.items);
                                        if (success) alert('Table copied to clipboard!');
                                    }}
                                    onDownload={() => downloadCSV(result.items, 'concrete_wall_estimate.csv')}
                                />
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
                                                    value={item.price}
                                                    onChange={(v) => handlePriceChange(item.priceKey, v)}
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



