import React, { useState, useEffect } from 'react';
import { THEME_COLORS, TABLE_UI, INPUT_UI, CARD_UI } from '../../constants/designSystem';
import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Calculator, PlusCircle, Trash2, Info, AlertCircle, Zap, Eye, EyeOff, ArrowUp, Copy } from 'lucide-react';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';
import { calculateElectricalLoad } from '../../utils/calculations/electricalLoadCalculator';
import ExportButtons from '../common/ExportButtons';

const THEME = THEME_COLORS.electrical;

const LOAD_CATEGORIES = [
    { id: 'lighting', label: 'Lighting Outlet' },
    { id: 'receptacle', label: 'Convenience Outlet (Receptacle)' },
    { id: 'acu', label: 'Air Conditioning Unit (ACU)' },
    { id: 'water_heater', label: 'Water Heater' },
    { id: 'washing_machine', label: 'Washing Machine / Laundry' },
    { id: 'refrigerator', label: 'Refrigerator' },
    { id: 'microwave', label: 'Microwave Oven' },
    { id: 'induction', label: 'Induction Cooker' },
    { id: 'dishwasher', label: 'Dishwasher' },
    { id: 'water_pump', label: 'Water Pump / Deep Well' },
    { id: 'motor', label: 'Motor Load / Pump' },
    { id: 'exhaust_fan', label: 'Exhaust / Blower Fan' },
    { id: 'ev_charger', label: 'EV Charger' },
    { id: 'range', label: 'Electric Range / Oven' },
    { id: 'other', label: 'Other Special Load' },
];

const CATEGORY_DEFAULT_VA = {
    lighting: 100,
    receptacle: 180,
    acu: 1600,
    water_heater: 3500,
    washing_machine: 1500,
    refrigerator: 1000,
    microwave: 1500,
    induction: 2000,
    dishwasher: 1500,
    water_pump: 1500,
    motor: 1000,
    exhaust_fan: 300,
    ev_charger: 7200,
    range: 8000,
    other: "",
};

const getInitialRow = () => ({
    id: Date.now() + Math.random(),
    quantity: "",
    category: "lighting",
    description: '',
    unitVA: 100,
    isExcluded: false,
});

export default function ElectricalLoadAnalysis() {
    const [rows, setRows] = useLocalStorage('electrical_load_rows', [getInitialRow()]);
    const [result, setResult] = useLocalStorage('electrical_load_result', null);
    const [error, setError] = useState(null);
    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleRowChange = (id, field, value) => {
        setRows(prev => prev.map(r => {
            if (r.id === id) {
                const updatedRow = { ...r, [field]: value };
                if (field === 'category') {
                    updatedRow.unitVA = CATEGORY_DEFAULT_VA[value] !== undefined ? CATEGORY_DEFAULT_VA[value] : "";
                }
                return updatedRow;
            }
            return r;
        }));
        setResult(null);
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

    const handleCalculate = () => {
        const isValid = rows.some(r => r.quantity > 0 && r.unitVA > 0 && !r.isExcluded);
        if (!isValid) {
            setError("Please fill out at least one valid row with Quantity and Unit VA.");
            setResult(null);
            return;
        }
        setError(null);

        const calcResult = calculateElectricalLoad(rows);
        setResult(calcResult);
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
                        className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-${THEME}-50 transition-colors`}
                    >
                        <Copy size={14} className="text-slate-400" /> Duplicate to Next Row
                    </button>
                    <button
                        onClick={() => handleAddRowAbove(contextMenu.id)}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-${THEME}-50 transition-colors border-b border-slate-50`}
                    >
                        <ArrowUp size={14} className="text-slate-400" /> Add Row Above
                    </button>
                    <button
                        onClick={() => handleToggleExcludeRow(contextMenu.id)}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-${THEME}-50 transition-colors`}
                    >
                        {rows.find(r => r.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in Calculation</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude from Calculation</>
                        }
                    </button>
                </div>
            )}

            <Card className="border-t-4 shadow-md bg-white rounded-xl" style={{ borderTop: '4px solid #d97706' }}>
                <SectionHeader
                    title="Electrical Load Schedule Input"
                    icon={Zap}
                    colorTheme={THEME}
                    actions={
                        <ActionButton
                            onClick={handleAddRow}
                            label="Add Load (Row)" variant="addRow"
                            icon={PlusCircle}
                            colorTheme={THEME}
                        />
                    }
                />

                <div className="overflow-x-auto p-4">
                    <table className={TABLE_UI.INPUT_TABLE}>
                        <thead className="bg-slate-100">
                            <tr>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[50px]`}>#</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[100px]`}>Qty</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[300px]`}>Load Category</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} min-w-[300px]`}>Description</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[140px]`}>Unit VA</th>
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
                                        <SelectInput
                                            value={row.category}
                                            onChange={(val) => handleRowChange(row.id, 'category', val)}
                                            options={LOAD_CATEGORIES.map(c => ({ value: c.id, label: c.label }))}
                                            className={`${INPUT_UI.TABLE_INPUT} focus:ring-${THEME}-400 text-xs`}
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <input
                                            type="text"
                                            value={row.description}
                                            onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                                            className={`${INPUT_UI.TABLE_INPUT} focus:ring-${THEME}-400 placeholder:text-zinc-400 placeholder:font-normal placeholder:italic`}
                                            placeholder="e.g. Master's BR Lights"
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <MathInput value={row.unitVA} onChange={(val) => handleRowChange(row.id, 'unitVA', val)} className={`${INPUT_UI.TABLE_INPUT} focus:ring-${THEME}-400 text-center font-bold`} placeholder="e.g. 100" />
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

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <ActionButton
                        onClick={handleCalculate}
                        label="CALCULATE LOAD" variant="calculate"
                        icon={Calculator}
                        colorTheme={THEME}

                    />
                </div>
            </Card>

            {error && (
                <div className="p-4 bg-red-50 border-t border-red-200 text-red-700 text-sm font-medium flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {!result && !error && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Zap size={40} className={`text-${THEME}-400`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 mb-1">Ready to Analyze Electrical Load</h3>
                    <p className="max-w-md mx-auto text-sm">
                        Enter your electrical loads above to generate a Schedule of Loads, computing Total VA, Amperes, Breaker Size, and Wire Specifications.
                    </p>
                </div>
            )}

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 bg-white rounded-xl" style={{ borderLeft: '4px solid #d97706' }}>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-8 gap-6">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 uppercase tracking-tight">Schedule of Loads</h3>
                                <div className="flex flex-wrap gap-4 mt-3">
                                    <div className="bg-slate-100 px-3 py-1.5 rounded-md text-xs font-mono text-slate-600">
                                        Total Connected Load: <span className="font-bold text-slate-800">{result.totalVA.toLocaleString()} VA</span>
                                    </div>
                                    <div className="bg-slate-100 px-3 py-1.5 rounded-md text-xs font-mono text-slate-600">
                                        Net Computed Load: <span className="font-bold text-slate-800">{result.netTotalVA.toLocaleString()} VA</span>
                                    </div>
                                    <div className="bg-slate-100 px-3 py-1.5 rounded-md text-xs font-mono text-slate-600">
                                        Main Feeder Ampacity: <span className="font-bold text-slate-800">{result.mainAmps.toFixed(2)} A</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className={`text-left md:text-right bg-${THEME}-50 px-5 py-3 rounded-xl border border-${THEME}-100 w-full`}>
                                    <p className={`text-[10px] text-${THEME}-600 font-bold uppercase tracking-widest mb-1`}>Recommended Main Breaker & Wire</p>
                                    <p className={`font-bold text-xl text-${THEME}-700 tracking-tight`}>{result.mainBreaker}</p>
                                    <p className={`font-mono text-sm text-${THEME}-600`}>{result.mainWire}</p>
                                </div>
                            </div>
                        </div>

                        <div className={TABLE_UI.CONTAINER}>
                            <table className={TABLE_UI.TABLE}>
                                <thead className={TABLE_UI.HEADER_ROW}>
                                    <tr>
                                        <th className={TABLE_UI.HEADER_CELL_LEFT}>Ckt No.</th>
                                        <th className={TABLE_UI.HEADER_CELL_LEFT}>Load Description</th>
                                        <th className={TABLE_UI.HEADER_CELL_CENTER}>Qty</th>
                                        <th className={TABLE_UI.HEADER_CELL_RIGHT}>VA</th>
                                        <th className={TABLE_UI.HEADER_CELL_RIGHT}>Total VA</th>
                                        <th className={TABLE_UI.HEADER_CELL_RIGHT}>Amps</th>
                                        <th className={TABLE_UI.HEADER_CELL_CENTER}>CB Rating</th>
                                        <th className={TABLE_UI.HEADER_CELL_CENTER}>Wire Size</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.circuits.map((item, idx) => (
                                        <tr key={idx} className={TABLE_UI.BODY_ROW}>
                                            <td className={`${TABLE_UI.CELL} font-bold text-slate-500`}>{item.circuitNo}</td>
                                            <td className={`${TABLE_UI.CELL} font-medium text-slate-800`}>{item.description}</td>
                                            <td className={TABLE_UI.CELL_CENTER}>{item.qty}</td>
                                            <td className={TABLE_UI.CELL_RIGHT}>{item.unitVA.toLocaleString()}</td>
                                            <td className={TABLE_UI.CELL_RIGHT}>{item.totalVA.toLocaleString()}</td>
                                            <td className={TABLE_UI.CELL_RIGHT}>{item.amps.toFixed(2)}</td>
                                            <td className={TABLE_UI.CELL_CENTER}>
                                                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{item.breaker}</span>
                                            </td>
                                            <td className={TABLE_UI.CELL_CENTER}>
                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{item.wire}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* DESIGN ANALYSIS SECTION */}
                        <div className="mt-8 border-t border-slate-200 pt-6">
                            <h4 className="font-bold text-lg text-slate-700 mb-4 tracking-tight flex items-center gap-2">
                                <Calculator size={18} className={`text-${THEME}-500`} /> 
                                Design Analysis (Computation)
                            </h4>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Demand Factors */}
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                    <h5 className="font-bold text-sm text-slate-600 mb-3 border-b border-slate-200 pb-2">1. General Lighting & Receptacle Loads [PEC 2.20.3.3]</h5>
                                    
                                    <div className="space-y-2 text-sm font-medium">
                                        <div className="flex justify-between text-slate-500">
                                            <span>Total Connected Lighting & Receptacle Load:</span>
                                            <span>{result?.designAnalysis?.lightingRecepTotal?.toLocaleString() || 0} VA</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 shadow-sm mt-3">
                                            <span className="text-slate-600">First 3,000 VA @ 100% Demand:</span>
                                            <span className="text-slate-800 font-bold">
                                                {Math.min(result?.designAnalysis?.lightingRecepTotal || 0, 3000).toLocaleString()} VA
                                            </span>
                                        </div>
                                        
                                        {(result?.designAnalysis?.lightingRecepTotal || 0) > 3000 && (
                                            <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 shadow-sm">
                                                <span className="text-slate-600">
                                                    {(result?.designAnalysis?.lightingRecepTotal || 0) > 120000 
                                                        ? "3,001 to 120,000 VA @ 35% Demand:" 
                                                        : "Remainder > 3,000 VA @ 35% Demand:"}
                                                </span>
                                                <span className="text-slate-800 font-bold">
                                                    {Math.min(117000, ((result?.designAnalysis?.lightingRecepTotal || 0) - 3000)) * 0.35} VA
                                                </span>
                                            </div>
                                        )}

                                        {(result?.designAnalysis?.lightingRecepTotal || 0) > 120000 && (
                                            <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 shadow-sm">
                                                <span className="text-slate-600">Remainder &gt; 120,000 VA @ 25% Demand:</span>
                                                <span className="text-slate-800 font-bold">
                                                    {((result?.designAnalysis?.lightingRecepTotal || 0) - 120000) * 0.25} VA
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200">
                                            <span className="text-slate-700 font-bold">Net General Load:</span>
                                            <span className={`text-${THEME}-600 font-bold text-base`}>
                                                {result?.designAnalysis?.lightingRecepNet?.toLocaleString() || 0} VA
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Specific Loads & Feeder */}
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col justify-between">
                                    <div>
                                        <h5 className="font-bold text-sm text-slate-600 mb-3 border-b border-slate-200 pb-2">2. Specific Appliance / Motor Loads [PEC 2.15.1.2]</h5>
                                        
                                        <div className="space-y-2 text-sm font-medium">
                                            <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 shadow-sm">
                                                <span className="text-slate-600">Continuous Loads (ACU/Motor/Heater) @ 125%:</span>
                                                <span className="text-slate-800 font-bold">
                                                    {result?.designAnalysis?.continuousNet?.toLocaleString() || 0} VA
                                                </span>
                                            </div>
                                            
                                            <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 shadow-sm">
                                                <span className="text-slate-600">Non-Continuous / Special Loads @ 100%:</span>
                                                <span className="text-slate-800 font-bold">
                                                    {result?.designAnalysis?.nonContinuousNet?.toLocaleString() || result?.designAnalysis?.nonContinuousTotal?.toLocaleString() || 0} VA
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t-2 border-slate-200 border-dashed">
                                        <h5 className="font-bold text-sm text-slate-600 mb-3">3. Main Service Feeder Total</h5>
                                        <div className="flex justify-between items-end mb-4">
                                            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                                                Net Computed Load
                                                <div className="normal-case tracking-normal font-medium text-slate-400">Total VA ÷ 230V = Feeder Ampacity</div>
                                            </div>
                                            <div className={`text-${THEME}-600 font-black text-2xl tracking-tight text-right`}>
                                                {result.netTotalVA.toLocaleString()} VA
                                                <div className="text-sm font-medium text-slate-500 normal-case tracking-normal">
                                                    {result.mainAmps.toFixed(2)} Amperes
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm mt-2">
                                            <h6 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Service Entrance Specs</h6>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-600">Main Breaker Rating [PEC 2.30.7.10]:</span>
                                                    <span className="font-bold text-amber-700">{result?.designAnalysis?.mainBreakerAT}AT, 2P</span>
                                                </div>
                                                <div className="flex justify-between items-start bg-slate-50 p-2 rounded text-xs border border-slate-100">
                                                    <div className="text-slate-600">
                                                        <span className="font-semibold text-slate-700">Wire Design Ampacity</span><br/>
                                                        Highest value between Computed Load ({result.mainAmps.toFixed(2)}A)<br/>
                                                        and Main Breaker Rating ({result?.designAnalysis?.mainBreakerAT}A)
                                                    </div>
                                                    <span className="font-bold text-slate-800 text-sm mt-1">{result?.designAnalysis?.wireMainDesignAmps?.toFixed(2)} A</span>
                                                </div>
                                                <div className="flex justify-between items-start pt-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-600">Line Conductors (THHN):</span>
                                                    </div>
                                                    <span className="font-bold text-blue-700">2 - {result?.designAnalysis?.wireMain}</span>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded text-xs border border-slate-100 flex flex-col text-slate-500">
                                                    <span className="font-semibold text-slate-700 mb-1">Conductor Sizing [PEC Table 3.10.1.16]</span>
                                                    <span>
                                                        Selected {result?.designAnalysis?.wireMain} THHN is rated for up to <span className="font-bold text-slate-700">{result?.designAnalysis?.wireMainMaxAmpacity}A </span> 
                                                        at 75°C, safely exceeding the {result?.designAnalysis?.wireMainDesignAmps?.toFixed(2)}A requirement.
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Grounding Conductor [PEC 2.50.6.13]:</span>
                                                    <span className="font-bold text-emerald-700">1 - {result?.designAnalysis?.groundWire}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
