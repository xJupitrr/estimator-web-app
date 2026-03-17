import React, { useState, useEffect } from 'react';
import { THEME_COLORS, TABLE_UI, INPUT_UI, CARD_UI } from '../../constants/designSystem';
import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Calculator, PlusCircle, Trash2, Info, AlertCircle, Zap, Eye, EyeOff, ArrowUp, Copy, Lightbulb, Fan, ShieldCheck, ZapIcon, CheckCircle2 } from 'lucide-react';
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

    const generateDesignAnalysisExport = (res) => {
        if (!res || !res.designAnalysis) return [];
        const da = res.designAnalysis;
        return [
            { isDesignAnalysis: true, key: "STEP 1: GENERAL DEMAND FACTORS", value: "" },
            { isDesignAnalysis: true, key: "Total Connected Gen. Load", value: `${da.lightingRecepTotal.toLocaleString()} VA` },
            { isDesignAnalysis: true, key: "First 3,000 VA @ 100% Demand", value: `${Math.min(da.lightingRecepTotal, 3000).toLocaleString()} VA` },
            ...(da.lightingRecepTotal > 3000 ? [
                { isDesignAnalysis: true, key: `Next 117,000 VA @ 35% Demand`, value: `${(Math.min(117000, da.lightingRecepTotal - 3000) * 0.35).toLocaleString()} VA` }
            ] : []),
            ...(da.lightingRecepTotal > 120000 ? [
                { isDesignAnalysis: true, key: `Remainder > 120,000 VA @ 25% Demand`, value: `${((da.lightingRecepTotal - 120000) * 0.25).toLocaleString()} VA` }
            ] : []),
            { isDesignAnalysis: true, key: `Net General Load`, value: `${da.lightingRecepNet.toLocaleString()} VA` },
            { isDesignAnalysis: true, key: "", value: "" },
            { isDesignAnalysis: true, key: "STEP 2: SPECIFIC APPLIANCE & MOTOR LOADS", value: "" },
            { isDesignAnalysis: true, key: "Continuous Duty (125% Safe Factor)", value: `${da.continuousNet.toLocaleString()} VA` },
            { isDesignAnalysis: true, key: "Non-Continuous Standard Loads (100%)", value: `${(da.nonContinuousNet || da.nonContinuousTotal || 0).toLocaleString()} VA` },
            { isDesignAnalysis: true, key: "", value: "" },
            { isDesignAnalysis: true, key: "MAIN FEEDER ENGINE", value: "" },
            { isDesignAnalysis: true, key: "Total VA Capacity", value: `${res.totalVA.toLocaleString()} VA` },
            { isDesignAnalysis: true, key: "Final Computed Net Load", value: `${res.netTotalVA.toLocaleString()} VA` },
            { isDesignAnalysis: true, key: "Base Ampacity (Net VA / 230V)", value: `${res.mainAmps.toFixed(2)} A` },
            { isDesignAnalysis: true, key: "", value: "" },
            { isDesignAnalysis: true, key: "SERVICE ENTRANCE PEC SPECS", value: "" },
            { isDesignAnalysis: true, key: "Design Ampacity Rating", value: `${da.wireMainDesignAmps.toFixed(2)} A` },
            { isDesignAnalysis: true, key: "Main Circuit Breaker", value: `${da.mainBreakerAT}AT, 2P` },
            { isDesignAnalysis: true, key: "Line Conductors", value: `2 - ${da.wireMain}` },
            { isDesignAnalysis: true, key: "PEC Table 3.10.1.16", value: `THHN rated up to ${da.wireMainMaxAmpacity}A @ 75°C` },
            { isDesignAnalysis: true, key: "Ground Conductor", value: `1 - ${da.groundWire}` },
            { isDesignAnalysis: true, key: "Final Assessed Output", value: `${res.mainBreaker} | ${res.mainWire}` },
        ];
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
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="flex gap-2">
                                    <ExportButtons items={result.circuits} filename="electrical_load_schedule.csv" />
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

                        {/* ======================= DESIGN ANALYSIS SECTION ======================= */}
                        <div className="mt-8 border-t border-slate-200 pt-8">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                                <h4 className="font-black text-xl text-slate-800 tracking-tight flex items-center gap-2">
                                    <div className={`p-2 bg-${THEME}-100 text-${THEME}-600 rounded-lg`}>
                                        <Calculator size={20} />
                                    </div>
                                    Design Analysis & Computation Proof
                                </h4>
                                <div className="flex gap-2">
                                    <ExportButtons items={generateDesignAnalysisExport(result)} filename="electrical_computation_proof.csv" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column: Load Breakdown Steps */}
                                <div className="space-y-6">
                                    {/* STEP 1: General Loads */}
                                    <div className="bg-white rounded-xl p-5 border shadow-sm border-amber-100 hover:border-amber-300 transition-colors">
                                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                                            <div className="bg-amber-100 p-2 rounded-full text-amber-600"><Lightbulb size={18} /></div>
                                            <h5 className="font-bold text-slate-700">Step 1: General Demand Factors</h5>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3">[PEC 2.20.3.3] Standard lighting and convenience receptacles</p>
                                        
                                        <div className="space-y-2 text-sm font-medium">
                                            <div className="flex justify-between text-slate-500 pb-2">
                                                <span>Total Connected Gen. Load:</span>
                                                <span className="font-bold">{result?.designAnalysis?.lightingRecepTotal?.toLocaleString() || 0} VA</span>
                                            </div>
                                            
                                            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200 shadow-sm mt-3">
                                                <span className="text-slate-600">First 3,000 VA @ <span className="text-amber-600 font-bold">100% Demand:</span></span>
                                                <span className="text-slate-800 font-bold">
                                                    {Math.min(result?.designAnalysis?.lightingRecepTotal || 0, 3000).toLocaleString()} VA
                                                </span>
                                            </div>
                                            
                                            {(result?.designAnalysis?.lightingRecepTotal || 0) > 3000 && (
                                                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200 shadow-sm">
                                                    <span className="text-slate-600">
                                                        {(result?.designAnalysis?.lightingRecepTotal || 0) > 120000 
                                                            ? "Next 117,000 VA" 
                                                            : "Remainder > 3,000 VA"}
                                                        {" @ "}<span className="text-amber-600 font-bold">35% Demand:</span>
                                                    </span>
                                                    <span className="text-slate-800 font-bold">
                                                        {Math.min(117000, ((result?.designAnalysis?.lightingRecepTotal || 0) - 3000)) * 0.35} VA
                                                    </span>
                                                </div>
                                            )}

                                            {(result?.designAnalysis?.lightingRecepTotal || 0) > 120000 && (
                                                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200 shadow-sm">
                                                    <span className="text-slate-600">Remainder &gt; 120,000 VA @ <span className="text-amber-600 font-bold">25% Demand:</span></span>
                                                    <span className="text-slate-800 font-bold">
                                                        {((result?.designAnalysis?.lightingRecepTotal || 0) - 120000) * 0.25} VA
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 bg-amber-50/50 p-2 rounded">
                                                <span className="text-amber-900 font-bold">Net General Load = </span>
                                                <span className={`text-amber-700 font-black text-base`}>
                                                    {result?.designAnalysis?.lightingRecepNet?.toLocaleString() || 0} VA
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* STEP 2: Specific Loads */}
                                    <div className="bg-white rounded-xl p-5 border shadow-sm border-blue-100 hover:border-blue-300 transition-colors">
                                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                                            <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Fan size={18} /></div>
                                            <h5 className="font-bold text-slate-700">Step 2: Specific Appliance & Motor Loads</h5>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3">[PEC 2.15.1.2] Continuous vs Non-Continuous factoring</p>
                                        
                                        <div className="space-y-3 text-sm font-medium">
                                            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200 shadow-sm">
                                                <span className="text-slate-600">Continuous Duty (ACU/Motor/EV) <br/><span className="text-[10px] text-blue-600 font-bold tracking-wider uppercase">Applied 125% Safe Factor Rating</span></span>
                                                <span className="text-slate-800 font-bold text-base">
                                                    {result?.designAnalysis?.continuousNet?.toLocaleString() || 0} VA
                                                </span>
                                            </div>
                                            
                                            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200 shadow-sm">
                                                <span className="text-slate-600">Non-Continuous Standard Loads <br/><span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Applied 100% Demand</span></span>
                                                <span className="text-slate-800 font-bold text-base">
                                                    {result?.designAnalysis?.nonContinuousNet?.toLocaleString() || result?.designAnalysis?.nonContinuousTotal?.toLocaleString() || 0} VA
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Master Feeder & Specs */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl p-6 border shadow-md border-slate-200 text-slate-800 flex flex-col h-full relative overflow-hidden">
                                        
                                        <div className="absolute -right-6 -top-6 text-slate-200 opacity-50">
                                            <ZapIcon size={120} />
                                        </div>

                                        <div className="relative z-10 flex-grow">
                                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                                                <div className={`bg-emerald-500 p-2 rounded-full text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]`}><ShieldCheck size={20} /></div>
                                                <h5 className="font-black text-xl text-slate-800 tracking-wide">Main Feeder Engine</h5>
                                            </div>

                                            <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-widest">Final Computed Net Load</p>
                                            <div className="text-4xl font-black text-emerald-600 tracking-tight drop-shadow-sm mb-1">
                                                {result.netTotalVA.toLocaleString()} VA
                                            </div>
                                            <p className="text-xs text-slate-500 mb-8 font-mono">Total VA ÷ 230 Volts = <span className="text-slate-800 font-bold">{result.mainAmps.toFixed(2)} Base Ampacity</span></p>


                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                                                <h6 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Service Entrance PEC Specs</h6>
                                                
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-600">Design Ampacity Rating:</span>
                                                        <span className="font-bold text-slate-800 bg-white border border-slate-200 shadow-sm px-2 py-0.5 rounded text-xs">{result?.designAnalysis?.wireMainDesignAmps?.toFixed(2)} A</span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-600">Main Circuit Breaker:</span>
                                                        <span className="font-black text-emerald-600 text-base">{result?.designAnalysis?.mainBreakerAT}AT, 2P</span>
                                                    </div>
                                                    
                                                    <div className="flex flex-col pt-2 border-t border-slate-200">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-slate-600">Line Conductors:</span>
                                                            <span className="font-bold text-blue-600">2 - {result?.designAnalysis?.wireMain}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 italic font-mono mb-2">
                                                            PEC Table 3.10.1.16: THHN rated up to {result?.designAnalysis?.wireMainMaxAmpacity}A @ 75°C
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                                        <span className="text-slate-600">Ground Conductor:</span>
                                                        <span className="font-bold text-emerald-600">1 - {result?.designAnalysis?.groundWire}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-6 bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-xl shadow-lg border border-emerald-400 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 -mr-4 -mt-4 text-emerald-400 opacity-30">
                                                    <ShieldCheck size={100} />
                                                </div>
                                                <div className="relative z-10">
                                                    <p className="flex items-center gap-2 text-[10px] text-emerald-100 font-bold uppercase tracking-widest mb-3">
                                                        <CheckCircle2 size={14} /> Final Assessed Output
                                                    </p>
                                                    <p className={`font-black text-3xl text-white tracking-tight drop-shadow-sm`}>{result.mainBreaker}</p>
                                                    <div className="mt-3 inline-block bg-emerald-900/40 px-3 py-1.5 rounded text-sm font-mono text-white border border-emerald-400/30">
                                                        {result.mainWire}
                                                    </div>
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
