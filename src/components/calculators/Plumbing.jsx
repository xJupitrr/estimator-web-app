import React, { useState, useEffect } from 'react';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Settings, Calculator, PlusCircle, Trash2, Box, Info, AlertCircle, ClipboardCopy, Download, Droplets, Eye, EyeOff, ArrowUp, Copy } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import { calculatePlumbing } from '../../utils/calculations/plumbingCalculator';
import { getDefaultPrices } from '../../constants/materials';


import SelectInput from '../common/SelectInput';
import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import TablePriceInput from '../common/TablePriceInput';
import { THEME_COLORS, TABLE_UI, INPUT_UI, CARD_UI } from '../../constants/designSystem';

const THEME = THEME_COLORS.plumbing;




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
    category: "",
    type: "",
    description: '',
    isExcluded: false,
});

export default function Plumbing() {
    const [rows, setRows] = useLocalStorage('plumbing_rows', [getInitialRow()]);
    const [prices, setPrices] = useLocalStorage('app_material_prices', getDefaultPrices());
    const [result, setResult] = useLocalStorage('plumbing_result', null);
    const [error, setError] = useState(null);

    const handleRowChange = (id, field, value) => {
        setRows(prev => prev.map(r => {
            if (r.id === id) {
                const updatedRow = { ...r, [field]: value };
                // If category changed, reset type (item) to empty to allow placeholder text
                if (field === 'category') {
                    updatedRow.type = "";
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
                    title="Plumbing Works Configuration"
                    icon={Droplets}
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
                                <th className={`${TABLE_UI.INPUT_HEADER} w-[90px]`}>Qty</th>
                                <th className={TABLE_UI.INPUT_HEADER}>Category</th>
                                <th className={TABLE_UI.INPUT_HEADER}>Item / Fixture</th>
                                <th className={TABLE_UI.INPUT_HEADER}>Description (Location)</th>
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
                                        className={`${TABLE_UI.INPUT_CELL} text-center text-xs text-gray-500 font-bold cursor-help relative group`}
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
                                        <MathInput value={row.quantity} onChange={(val) => handleRowChange(row.id, 'quantity', val)} className={INPUT_UI.TABLE_INPUT} placeholder="Qty" />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput
                                            value={row.category}
                                            onChange={(val) => handleRowChange(row.id, 'category', val)}
                                            options={PLUMBING_CATEGORIES.map(c => ({ id: c.id, display: c.label }))}
                                            focusColor={THEME}
                                            className="text-xs"
                                            placeholder="Select Category..."
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput
                                            value={row.type}
                                            onChange={(val) => handleRowChange(row.id, 'type', val)}
                                            options={row.category ? (PLUMBING_ITEMS[row.category].map(t => ({ id: t.id, display: t.label }))) : []}
                                            focusColor={THEME}
                                            className="text-xs"
                                            placeholder="Select Fixture/Material..."
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <input
                                            type="text"
                                            value={row.description}
                                            onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                                            className={INPUT_UI.TABLE_INPUT}
                                            placeholder="e.g. Ground Floor"
                                        />
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
                        Add your plumbing fixtures and piping materials above, then click <span className={`font-bold text-${THEME}-600`}>'CALCULATE'</span>.
                    </p>
                </div>
            )}

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 mt-6 bg-white rounded-xl" style={{ borderLeft: '4px solid #d97706' }}>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Plumbing Result</h3>
                                <p className="text-sm text-gray-500 mt-1 italic flex items-center gap-1">
                                    <Info size={14} /> Estimates reflect selected items only (excludes automatic rough-ins)
                                </p>
                            </div>
                            <div className={`text-left md:text-right bg-${THEME}-50 px-5 py-3 rounded-xl border border-${THEME}-100`}>
                                <p className={`text-xs text-${THEME}-600 font-bold uppercase tracking-wide mb-1`}>Estimated Total Material Cost</p>
                                <p className={`font-bold text-4xl text-${THEME}-700 tracking-tight`}>₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
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
                                        <th className={`${TABLE_UI.HEADER_CELL_RIGHT} bg-${THEME}-50`}>Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className={TABLE_UI.BODY_ROW}>
                                            <td className={`${TABLE_UI.CELL} font-medium text-slate-800`}>{item.name}</td>
                                            <td className={`${TABLE_UI.CELL_RIGHT} font-medium text-gray-800`}>{item.qty}</td>
                                            <td className={`${TABLE_UI.CELL_CENTER} text-gray-600`}>
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className={`${TABLE_UI.CELL} border-r-0`}>
                                                <TablePriceInput
                                                    value={prices[item.priceKey] || 0}
                                                    onChange={(val) => updatePrice(item.priceKey, val)}
                                                    colorTheme={THEME}
                                                />
                                            </td>
                                            <td className={`${TABLE_UI.CELL_RIGHT} font-extrabold text-${THEME}-900 bg-${THEME}-50/20 tabular-nums`}>₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
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


