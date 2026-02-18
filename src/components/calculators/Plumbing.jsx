import React, { useState, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Settings, Calculator, PlusCircle, Trash2, Box, Info, AlertCircle, ClipboardCopy, Download, Droplets, Eye, EyeOff, ArrowUp, Copy } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import { calculatePlumbing, DEFAULT_PRICES } from '../../utils/calculations/plumbingCalculator';


import SelectInput from '../common/SelectInput';

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

const TablePriceInput = ({ value, onChange }) => (
    <div className="flex items-center justify-end">
        <div className="bg-gray-100/50 px-2 py-1.5 text-gray-600 text-sm font-bold flex items-center border border-gray-300 rounded-l-lg border-r-0 h-full">
            ₱
        </div>
        <input
            type="number"
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 pl-2 pr-2 py-1.5 text-right text-sm border border-slate-300 rounded-r-lg bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none text-gray-800 font-medium transition-colors border-l-0"
        />
    </div>
);


const PLUMBING_CATEGORIES = [
    { id: 'fixtures', label: 'Plumbing Fixtures' },
    { id: 'waterline', label: 'Waterline System (PPR)' },
    { id: 'pvc', label: 'uPVC Pipe & Fittings' },
];

const PLUMBING_ITEMS = {
    fixtures: [
        { id: 'wc', label: 'Water Closet (WC)' },
        { id: 'lavatory', label: 'Lavatory' },
        { id: 'sink', label: 'Kitchen Sink' },
        { id: 'shower', label: 'Shower' },
        { id: 'hose_bibb', label: 'Hose Bibb / Faucet' },
        { id: 'floor_drain', label: 'Floor Drain (4x4)' },
        { id: 'roof_drain', label: 'Roof Drain' },
        { id: 'catch_basin', label: 'Catch Basin' },
        { id: 'urinal', label: 'Urinal (Wall-hung)' },
        { id: 'bidet', label: 'Bidet Spray' },
        { id: 'bathtub', label: 'Bathtub (Standard)' },
        { id: 'grease_trap', label: 'Grease Trap' },
        { id: 'water_heater_single', label: 'Water Heater (Single Point)' },
        { id: 'water_heater_multi', label: 'Water Heater (Multi Point)' },
        { id: 'kitchen_faucet', label: 'Kitchen Faucet (Gooseneck)' },
        { id: 'lavatory_faucet', label: 'Lavatory Faucet' },
        { id: 'angle_valve', label: 'Angle Valve (1/2"x1/2")' },
        { id: 'flex_hose', label: 'Flexible Hose (Stainless)' },
        { id: 'laundry_tray', label: 'Laundry Tray' },
    ],
    waterline: [
        // 20mm Group (1/2")
        { id: 'ppr_pipe_20mm', label: '20mm PPR Pipe (1/2")' },
        { id: 'ppr_elbow_90_20mm', label: '20mm PPR Elbow 90°' },
        { id: 'ppr_elbow_45_20mm', label: '20mm PPR Elbow 45°' },
        { id: 'ppr_tee_20mm', label: '20mm PPR Tee' },
        { id: 'ppr_coupling_20mm', label: '20mm PPR Coupling' },
        { id: 'ppr_female_elbow_20mm', label: '20mm PPR Female Elbow' },
        { id: 'ppr_male_elbow_20mm', label: '20mm PPR Male Elbow' },
        { id: 'ppr_female_adapter_20mm', label: '20mm PPR Female Adapter' },
        { id: 'ppr_male_adapter_20mm', label: '20mm PPR Male Adapter' },
        { id: 'ppr_union_patente_20mm', label: '20mm PPR Union Patente' },
        { id: 'ppr_gate_valve_20mm', label: '20mm PPR Gate Valve' },
        { id: 'ppr_ball_valve_20mm', label: '20mm PPR Ball Valve' },
        { id: 'ppr_end_cap_20mm', label: '20mm PPR End Cap' },

        // 25mm Group (3/4")
        { id: 'ppr_pipe_25mm', label: '25mm PPR Pipe (3/4")' },
        { id: 'ppr_elbow_90_25mm', label: '25mm PPR Elbow 90°' },
        { id: 'ppr_elbow_45_25mm', label: '25mm PPR Elbow 45°' },
        { id: 'ppr_tee_25mm', label: '25mm PPR Tee' },
        { id: 'ppr_coupling_25mm', label: '25mm PPR Coupling' },
        { id: 'ppr_female_elbow_25mm', label: '25mm PPR Female Elbow' },
        { id: 'ppr_male_elbow_25mm', label: '25mm PPR Male Elbow' },
        { id: 'ppr_female_adapter_25mm', label: '25mm PPR Female Adapter' },
        { id: 'ppr_male_adapter_25mm', label: '25mm PPR Male Adapter' },
        { id: 'ppr_union_patente_25mm', label: '25mm PPR Union Patente' },
        { id: 'ppr_gate_valve_25mm', label: '25mm PPR Gate Valve' },
        { id: 'ppr_ball_valve_25mm', label: '25mm PPR Ball Valve' },
        { id: 'ppr_end_cap_25mm', label: '25mm PPR End Cap' },

        { id: 'teflon_tape', label: 'Teflon Tape' },
    ],
    pvc: [
        // 4" Group
        { id: 'pvc_pipe_100mm', label: '4" uPVC Pipe' },
        { id: 'pvc_elbow_90_100mm', label: '4" uPVC Elbow 90°' },
        { id: 'pvc_elbow_45_100mm', label: '4" uPVC Elbow 45°' },
        { id: 'pvc_sanitary_tee_100mm', label: '4" uPVC Sanitary Tee' },
        { id: 'pvc_wye_100mm', label: '4" uPVC Wye' },
        { id: 'pvc_cleanout_100mm', label: '4" uPVC Cleanout' },
        { id: 'pvc_p_trap_100mm', label: '4" uPVC P-Trap' },
        { id: 'pvc_vent_cap_100mm', label: '4" uPVC Vent Cap' },
        { id: 'pipe_clamp_100mm', label: '4" uPVC Pipe Clamp' },

        // 3" Group
        { id: 'pvc_pipe_75mm', label: '3" uPVC Pipe' },
        { id: 'pvc_elbow_90_75mm', label: '3" uPVC Elbow 90°' },
        { id: 'pvc_elbow_45_75mm', label: '3" uPVC Elbow 45°' },
        { id: 'pvc_sanitary_tee_75mm', label: '3" uPVC Sanitary Tee' },
        { id: 'pvc_wye_75mm', label: '3" uPVC Wye' },
        { id: 'pvc_cleanout_75mm', label: '3" uPVC Cleanout' },
        { id: 'pipe_clamp_75mm', label: '3" uPVC Pipe Clamp' },

        // 2" Group
        { id: 'pvc_pipe_50mm', label: '2" uPVC Pipe' },
        { id: 'pvc_elbow_90_50mm', label: '2" uPVC Elbow 90°' },
        { id: 'pvc_elbow_45_50mm', label: '2" uPVC Elbow 45°' },
        { id: 'pvc_wye_50mm', label: '2" uPVC Wye' },
        { id: 'pvc_p_trap_50mm', label: '2" uPVC P-Trap' },
        { id: 'pvc_vent_cap_50mm', label: '2" uPVC Vent Cap' },

        // Reducers & Mixed
        { id: 'pvc_sanitary_tee_100x75', label: '4"x3" uPVC Sanitary Tee' },
        { id: 'pvc_sanitary_tee_100x50', label: '4"x2" uPVC Sanitary Tee' },
        { id: 'pvc_wye_100x75', label: '4"x3" uPVC Wye' },
        { id: 'pvc_wye_100x50', label: '4"x2" uPVC Wye' },
        { id: 'pvc_reducer_100x75', label: '4"x3" uPVC Reducer' },
        { id: 'pvc_reducer_100x50', label: '4"x2" uPVC Reducer' },
        { id: 'roof_drain', label: 'Roof Drain (Dome Type)' },
        { id: 'solvent_cement', label: 'Solvent Cement' },
    ]
};

const getInitialRow = () => ({
    id: Date.now() + Math.random(),
    quantity: "",
    category: 'fixtures',
    type: 'wc',
    description: '',
    isExcluded: false,
});

export default function Plumbing() {
    const [rows, setRows] = useLocalStorage('plumbing_rows', [getInitialRow()]);
    const [prices, setPrices] = useLocalStorage('plumbing_prices', DEFAULT_PRICES);
    const [result, setResult] = useLocalStorage('plumbing_result', null);
    const [error, setError] = useState(null);

    const handleRowChange = (id, field, value) => {
        setRows(prev => prev.map(r => {
            if (r.id === id) {
                const updatedRow = { ...r, [field]: value };
                // If category changed, reset type (item) to first available in new category
                if (field === 'category') {
                    updatedRow.type = PLUMBING_ITEMS[value][0].id;
                }
                return updatedRow;
            }
            return r;
        }));
        setResult(null);
    };

    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

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
        const isValid = rows.some(r => r.quantity > 0);
        if (!isValid) {
            setError("Please add at least one plumbing fixture.");
            setResult(null);
            return;
        }
        setError(null);

        const calcResult = calculatePlumbing(rows, prices);
        if (calcResult) {
            setResult(calcResult);
        } else {
            setResult(null);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('plumbing_total', result.total);
        } else {
            setSessionData('plumbing_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    const updatePrice = (key, value) => {
        setPrices(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
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
                        {rows.find(r => r.id === contextMenu.id)?.isExcluded
                            ? <><Eye size={14} className="text-emerald-500" /> Include in Calculation</>
                            : <><EyeOff size={14} className="text-red-500" /> Exclude from Calculation</>
                        }
                    </button>
                </div>
            )}

            <Card className="border-t-4 border-t-blue-500 shadow-md">
                <div className="p-4 bg-blue-50 border-b border-blue-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-blue-900 flex items-center gap-2">
                        <Droplets size={18} /> Plumbing Works Configuration
                    </h2>
                    <button
                        onClick={handleAddRow}
                        className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-sm justify-center"
                    >
                        <PlusCircle size={14} /> Add Row
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[750px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-3 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-3 font-bold border border-slate-300 text-center w-[90px]">Qty</th>
                                <th className="px-3 py-3 font-bold border border-slate-300 text-center">Category</th>
                                <th className="px-3 py-3 font-bold border border-slate-300 text-center">Item / Fixture</th>
                                <th className="px-3 py-3 font-bold border border-slate-300 text-center">Description (Location)</th>
                                <th className="px-2 py-3 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr
                                    key={row.id}
                                    className={`transition-colors ${row.isExcluded ? 'bg-slate-50/50 opacity-60 grayscale-[0.5]' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    <td
                                        className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold cursor-help relative group"
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
                                    <td className="p-2 border border-slate-300">
                                        <MathInput value={row.quantity} onChange={(val) => handleRowChange(row.id, 'quantity', val)} className="w-full p-2 text-center border-gray-300 rounded text-sm font-bold" placeholder="Qty" />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput
                                            value={row.category}
                                            onChange={(val) => handleRowChange(row.id, 'category', val)}
                                            options={PLUMBING_CATEGORIES.map(c => ({ id: c.id, display: c.label }))}
                                            focusColor="blue"
                                            className="text-xs"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <SelectInput
                                            value={row.type}
                                            onChange={(val) => handleRowChange(row.id, 'type', val)}
                                            options={PLUMBING_ITEMS[row.category].map(t => ({ id: t.id, display: t.label }))}
                                            focusColor="blue"
                                            className="text-xs"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300">
                                        <input
                                            type="text"
                                            value={row.description}
                                            onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded text-sm placeholder:text-zinc-400 placeholder:font-normal placeholder:italic"
                                            placeholder="e.g. Ground Floor T&B"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center">
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
                    <button onClick={handleCalculate} className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Calculator size={18} /> CALCULATE
                    </button>
                </div>
            </Card>

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-blue-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Plumbing Result</h3>
                                <p className="text-sm text-gray-500 mt-1 italic flex items-center gap-1">
                                    <Info size={14} /> Estimates reflect selected items only (excludes automatic rough-ins)
                                </p>
                            </div>
                            <div className="text-left md:text-right bg-blue-50 px-5 py-3 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Estimated Total Material Cost</p>
                                <p className="font-bold text-4xl text-blue-700 tracking-tight">₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm text-left font-sans">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 w-[35%]">Material Item</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[140px]">Unit Price (Editable)</th>
                                        <th className="px-4 py-3 text-right bg-blue-50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">{item.qty}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <TablePriceInput
                                                    value={prices[item.priceKey] || 0}
                                                    onChange={(val) => updatePrice(item.priceKey, val)}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right text-blue-900 font-extrabold bg-blue-50/20">₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
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
