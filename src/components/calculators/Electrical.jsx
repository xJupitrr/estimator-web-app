import React, { useState, useEffect } from 'react';
import ExportButtons from '../common/ExportButtons';
import { THEME_COLORS, TABLE_UI, INPUT_UI, CARD_UI } from '../../constants/designSystem';
import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import TablePriceInput from '../common/TablePriceInput';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { Settings, Calculator, PlusCircle, Trash2, Box, Info, AlertCircle, ClipboardCopy, Download, Zap, Eye, EyeOff, ArrowUp, Copy } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import MathInput from '../common/MathInput';
import { calculateElectrical, DEFAULT_PRICES } from '../../utils/calculations/electricalCalculator';
import SelectInput from '../common/SelectInput';

const THEME = THEME_COLORS.electrical;

// Local Card and TablePriceInput removed in favor of common versions.

const ELECTRICAL_CATEGORIES = [
    { id: 'lighting', label: 'Lighting Fixtures & Luminaires' },
    { id: 'devices', label: 'Wiring Devices / Outlets' },
    { id: 'rough_in', label: 'Rough-in Materials (Manual)' },
    { id: 'protection', label: 'Power Control & Protection' },
];

const ELECTRICAL_ITEMS = {
    lighting: [
        {
            group: 'Bulbs & Lamps',
            options: [
                { id: 'led_bulb_3w', label: 'LED Bulb 3W (E27)' },
                { id: 'led_bulb_5w', label: 'LED Bulb 5W (E27)' },
                { id: 'led_bulb_7w', label: 'LED Bulb 7W (E27)' },
                { id: 'led_bulb_9w', label: 'LED Bulb 9W (E27)' },
                { id: 'led_bulb_12w', label: 'LED Bulb 12W (E27)' },
                { id: 'led_bulb_15w', label: 'LED Bulb 15W (E27)' },
                { id: 'led_bulb_18w', label: 'LED Bulb 18W (E27)' },
                { id: 'led_bulb_gu10_3w', label: 'LED Bulb GU10 3W' },
                { id: 'led_bulb_gu10_5w', label: 'LED Bulb GU10 5W' },
                { id: 'led_bulb_gu10_7w', label: 'LED Bulb GU10 7W' },
                { id: 'gu10_socket', label: 'GU10 Socket' },
                { id: 'led_tube_t8', label: 'LED Tube T8 18W Set' },
                { id: 't5_led_batten', label: 'T5 LED Batten 1.2m' },
            ]
        },
        {
            group: 'Recessed Downlights (Fixture Only)',
            options: [
                { id: 'downlight_fixture_4', label: 'Vertical Fixture 4"' },
                { id: 'downlight_fixture_6', label: 'Vertical Fixture 6"' },
            ]
        },
        {
            group: 'Integrated LED Downlights',
            options: [
                { id: 'integrated_led_3w', label: 'LED Downlight 3W' },
                { id: 'integrated_led_6w', label: 'LED Downlight 6W' },
                { id: 'integrated_led_9w', label: 'LED Downlight 9W' },
                { id: 'integrated_led_12w', label: 'LED Downlight 12W' },
                { id: 'integrated_led_15w', label: 'LED Downlight 15W' },
                { id: 'integrated_led_18w', label: 'LED Downlight 18W' },
                { id: 'integrated_led_24w', label: 'LED Downlight 24W' },
                { id: 'surface_downlight_6w', label: 'Surface Type LED 6W' },
                { id: 'surface_downlight_12w', label: 'Surface Type LED 12W' },
                { id: 'surface_downlight_18w', label: 'Surface Type LED 18W' },
                { id: 'surface_downlight_24w', label: 'Surface Type LED 24W' },
                { id: 'step_light', label: 'LED Step Light' },
            ]
        },
        {
            group: 'Decorative & Commercial',
            options: [
                { id: 'track_rail_1m', label: 'Track Rail (1 Meter)' },
                { id: 'track_head_12w', label: 'Track Head (12W)' },
                { id: 'led_strip_5m', label: 'LED Strip (5m Roll)' },
                { id: 'led_driver_12v', label: 'LED Driver (12V/60W)' },
                { id: 'panel_light_300', label: 'Panel Light (300mm)' },
                { id: 'panel_light_600', label: 'Panel Light (600mm)' },
                { id: 'pendant_light', label: 'Pendant / Hanging Light' },
                { id: 'wall_sconce', label: 'Wall Lamp / Sconce' },
                { id: 'high_bay_light', label: 'Industrial High Bay 100W' },
            ]
        },
        {
            group: 'Outdoor & Safety',
            options: [
                { id: 'ceiling_receptacle', label: 'Ceiling Receptacle 4"' },
                { id: 'emergency_light', label: 'Emergency Light' },
                { id: 'exit_sign', label: 'Exit Sign' },
                { id: 'flood_light_10w', label: 'LED Flood Light 10W' },
                { id: 'flood_light_20w', label: 'LED Flood Light 20W' },
                { id: 'flood_light_30w', label: 'LED Flood Light 30W' },
                { id: 'flood_light_50w', label: 'LED Flood Light 50W' },
                { id: 'flood_light_100w', label: 'LED Flood Light 100W' },
                { id: 'flood_light_200w', label: 'LED Flood Light 200W' },
                { id: 'post_lamp', label: 'Garden Post Lamp' },
                { id: 'garden_spike_light', label: 'Garden Spike Light' },
                { id: 'solar_street_light', label: 'Solar Street Light 100W' },
                { id: 'rope_light', label: 'LED Rope Light' },
            ]
        }
    ],
    protection: [
        {
            group: 'Panel Boards',
            options: [
                { id: 'panel_board_4b', label: 'Panel Board (4 Branches)' },
                { id: 'panel_board_6b', label: 'Panel Board (6 Branches)' },
                { id: 'panel_board_8b', label: 'Panel Board (8 Branches)' },
                { id: 'panel_board_10b', label: 'Panel Board (10 Branches)' },
                { id: 'panel_board_12b', label: 'Panel Board (12 Branches)' },
                { id: 'panel_board_16b', label: 'Panel Board (16 Branches)' },
                { id: 'panel_board_20b', label: 'Panel Board (20 Branches)' },
            ]
        },
        {
            group: 'Circuit Breakers',
            options: [
                { id: 'breaker_15a', label: 'Circuit Breaker (15A)' },
                { id: 'breaker_20a', label: 'Circuit Breaker (20A)' },
                { id: 'breaker_30a', label: 'Circuit Breaker (30A)' },
                { id: 'breaker_40a', label: 'Circuit Breaker (40A)' },
                { id: 'breaker_50a', label: 'Circuit Breaker (50A)' },
                { id: 'breaker_60a', label: 'Circuit Breaker (60A)' },
                { id: 'breaker_100a', label: 'Circuit Breaker (100A)' },
            ]
        },
        {
            group: 'Service Entrance',
            options: [
                { id: 'meter_base', label: 'Meter Base (Round)' },
                { id: 'sub_meter', label: 'Electric Sub-meter' },
                { id: 'mts_switch', label: 'Manual Transfer Switch' },
            ]
        }
    ],
    devices: [
        {
            group: 'Switches & Controls',
            options: [
                { id: 'switch_1g', label: '1-Gang Switch' },
                { id: 'switch_2g', label: '2-Gang Switch' },
                { id: 'switch_3g', label: '3-Gang Switch' },
                { id: 'switch_3way', label: '3-Way Switch' },
                { id: 'dimmer_switch', label: 'Dimmer Switch' },
                { id: 'fan_control', label: 'Fan Control Switch' },
            ]
        },
        {
            group: 'Convenience Outlets',
            options: [
                { id: 'outlet_duplex', label: 'Duplex Conv. Outlet' },
                { id: 'outlet_universal', label: 'Universal Duplex Outlet' },
                { id: 'outlet_single', label: 'Single Conv. Outlet' },
                { id: 'outlet_gfci', label: 'GFCI Duplex Outlet' },
                { id: 'outlet_weatherproof', label: 'Weatherproof Outlet' },
                { id: 'weatherproof_enclosure', label: 'Weatherproof Enclosure' },
            ]
        },
        {
            group: 'Specialty Outlets & Safety',
            options: [
                { id: 'outlet_ac', label: 'Aircon Outlet' },
                { id: 'outlet_range', label: 'Range Outlet' },
                { id: 'water_heater_switch_20a', label: 'Water Heater Safety Switch 20A' },
                { id: 'water_heater_switch_30a', label: 'Water Heater Safety Switch 30A' },
                { id: 'data_outlet', label: 'LAN/Data Outlet' },
                { id: 'tel_outlet', label: 'Telephone Outlet' },
                { id: 'smoke_detector', label: 'Smoke Detector' },
                { id: 'doorbell', label: 'Doorbell Kit' },
            ]
        }
    ],
    rough_in: [
        {
            group: 'Wires (150m Roll)',
            options: [
                { id: 'thhn_2_0', label: 'THHN 2.0mm²' },
                { id: 'thhn_3_5', label: 'THHN 3.5mm²' },
                { id: 'thhn_5_5', label: 'THHN 5.5mm²' },
                { id: 'thhn_8_0', label: 'THHN 8.0mm²' },
                { id: 'thhn_14_0', label: 'THHN 14.0mm²' },
                { id: 'thhn_22_0', label: 'THHN 22.0mm²' },
                { id: 'thhn_30_0', label: 'THHN 30.0mm²' },
            ]
        },
        {
            group: 'PVC Conduit (3m)',
            options: [
                { id: 'pvc_pipe_20mm', label: 'PVC Pipe 20mm' },
                { id: 'pvc_pipe_25mm', label: 'PVC Pipe 25mm' },
                { id: 'pvc_pipe_32mm', label: 'PVC Pipe 32mm' },
                { id: 'pvc_adapter_20mm', label: 'PVC Adapter 20mm' },
                { id: 'pvc_adapter_25mm', label: 'PVC Adapter 25mm' },
                { id: 'pvc_adapter_32mm', label: 'PVC Adapter 32mm' },
                { id: 'pvc_locknut_20mm', label: 'PVC Locknut 20mm' },
                { id: 'pvc_locknut_25mm', label: 'PVC Locknut 25mm' },
                { id: 'pvc_locknut_32mm', label: 'PVC Locknut 32mm' },
            ]
        },
        {
            group: 'RSC Conduit (3m)',
            options: [
                { id: 'rsc_pipe_1_2', label: 'RSC Pipe 1/2"' },
                { id: 'rsc_pipe_3_4', label: 'RSC Pipe 3/4"' },
                { id: 'rsc_pipe_1', label: 'RSC Pipe 1"' },
                { id: 'rsc_elbow_1_2', label: 'RSC Elbow 1/2"' },
                { id: 'rsc_elbow_3_4', label: 'RSC Elbow 3/4"' },
                { id: 'rsc_elbow_1', label: 'RSC Elbow 1"' },
                { id: 'rsc_coupling_1_2', label: 'RSC Coupling 1/2"' },
                { id: 'rsc_coupling_3_4', label: 'RSC Coupling 3/4"' },
                { id: 'rsc_coupling_1', label: 'RSC Coupling 1"' },
                { id: 'rsc_locknut_bushing_1_2', label: 'RSC Locknut 1/2"' },
                { id: 'rsc_locknut_bushing_3_4', label: 'RSC Locknut 3/4"' },
                { id: 'rsc_locknut_bushing_1', label: 'RSC Locknut 1"' },
            ]
        },
        {
            group: 'Boxes & Accessories',
            options: [
                { id: 'utility_box_pvc', label: 'Utility Box (PVC)' },
                { id: 'utility_box_metal', label: 'Utility Box (Metal)' },
                { id: 'junction_box_pvc', label: 'Junction Box (PVC)' },
                { id: 'junction_box_metal', label: 'Junction Box (Metal)' },
                { id: 'square_box_metal', label: 'Square Box (Metal)' },
                { id: 'octagonal_box_pvc', label: 'Octagonal Box (PVC)' },
                { id: 'octagonal_box_metal', label: 'Octagonal Box (Metal)' },
                { id: 'box_cover_utility', label: 'Utility Cover' },
                { id: 'box_cover_square', label: 'Square Cover' },
            ]
        },
        {
            group: 'Flexible & Hardware',
            options: [
                { id: 'flex_hose_1_2', label: 'Flex Conduit 1/2"' },
                { id: 'flex_hose_3_4', label: 'Flex Conduit 3/4"' },
                { id: 'flex_connector_1_2', label: 'Flex Connector 1/2"' },
                { id: 'flex_connector_3_4', label: 'Flex Connector 3/4"' },
                { id: 'molding_3_4', label: 'Plastic Molding 3/4"' },
                { id: 'molding_1', label: 'Plastic Molding 1"' },
                { id: 'entrance_cap_1_2', label: 'Entrance Cap 1/2"' },
                { id: 'entrance_cap_3_4', label: 'Entrance Cap 3/4"' },
                { id: 'entrance_cap_1', label: 'Entrance Cap 1"' },
                { id: 'pipe_strap_1_2', label: 'Pipe Strap 1/2"' },
                { id: 'pipe_strap_3_4', label: 'Pipe Strap 3/4"' },
                { id: 'pipe_strap_1', label: 'Pipe Strap 1"' },
                { id: 'tox_screw', label: 'Tox & Screws' },
                { id: 'expansion_bolt', label: 'Expansion Bolt' },
                { id: 'pvc_solvent', label: 'PVC Solvent' },
                { id: 'electrical_tape', label: 'Electrical Tape' },
            ]
        },
        {
            group: 'Grounding & Solar',
            options: [
                { id: 'ground_rod', label: 'Ground Rod 5/8x8' },
                { id: 'ground_clamp', label: 'Ground Rod Clamp' },
                { id: 'bare_copper', label: 'Bare Copper Wire' },
                { id: 'cat6_cable', label: 'UTP CAT6 Cable' },
                { id: 'coax_cable', label: 'Coaxial Cable' },
                { id: 'pv_cable_4', label: 'Solar PV Cable' },
                { id: 'mc4_connector', label: 'MC4 Connector' },
            ]
        }
    ],
};

const getInitialRow = () => ({
    id: Date.now() + Math.random(),
    quantity: "",
    category: "",
    type: "",
    description: '',
    isExcluded: false,
});

export default function Electrical() {
    const [rows, setRows] = useLocalStorage('electrical_rows', [getInitialRow()]);
    const [prices, setPrices] = useLocalStorage('electrical_prices', DEFAULT_PRICES);
    const [result, setResult] = useLocalStorage('electrical_result', null);
    const [error, setError] = useState(null);
    const [contextMenu, setContextMenu] = useState(null); // { id, x, y }

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Migration: Fix legacy 'points' category if present in local storage
    useEffect(() => {
        setRows(prev => prev.map(r => {
            // Only migrate if category is NOT empty and either 'points' or not in items list
            if (r.category !== "" && (r.category === 'points' || !ELECTRICAL_ITEMS[r.category])) {
                return {
                    ...r,
                    category: 'devices',
                    type: ELECTRICAL_ITEMS['devices'][0].options[0].id
                };
            }
            return r;
        }));
    }, []);

    const handleRowChange = (id, field, value) => {
        setRows(prev => prev.map(r => {
            if (r.id === id) {
                const updatedRow = { ...r, [field]: value };
                // If category changed, reset type (item) to empty to force placeholder
                if (field === 'category') {
                    // Access the first option of the first group
                    updatedRow.type = "";
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
        const isValid = rows.some(r => r.quantity > 0 && !r.isExcluded);
        if (!isValid) {
            setError("Please add at least one active electrical point.");
            setResult(null);
            return;
        }
        setError(null);

        const calcResult = calculateElectrical(rows, prices);
        if (calcResult) {
            setResult(calcResult);
        } else {
            setResult(null);
        }
    };

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('electrical_total', result.total);
        } else {
            setSessionData('electrical_total', null);
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
                    title="Electrical Works Configuration"
                    icon={Zap}
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
                                <th className={TABLE_UI.INPUT_HEADER}>Equipment / Device Type</th>
                                <th className={TABLE_UI.INPUT_HEADER}>Description (Location/Notes)</th>
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
                                            options={ELECTRICAL_CATEGORIES.map(c => ({ id: c.id, display: c.label }))}
                                            focusColor={THEME}
                                            className="text-xs"
                                            placeholder="Select Category..."
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <SelectInput
                                            value={row.type}
                                            onChange={(val) => handleRowChange(row.id, 'type', val)}
                                            options={row.category ? (ELECTRICAL_ITEMS[row.category] || []) : []}
                                            focusColor={THEME}
                                            className="text-xs"
                                            placeholder="Select Equipment/Device..."
                                        />
                                    </td>
                                    <td className={TABLE_UI.INPUT_CELL}>
                                        <input
                                            type="text"
                                            value={row.description}
                                            onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                                            className={`${INPUT_UI.TABLE_INPUT} focus:ring-${THEME}-400 placeholder:text-zinc-400 placeholder:font-normal placeholder:italic`}
                                            placeholder="e.g. Master's Bedroom"
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
                    <h3 className="text-lg font-bold text-slate-600 mb-1">Ready to Estimate</h3>
                    <p className="max-w-md mx-auto text-sm">
                        Enter your electrical works configuration above, then click <span className={`font-bold text-${THEME}-600`}>'CALCULATE'</span>.
                    </p>
                </div>
            )}

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 bg-white rounded-xl" style={{ borderLeft: '4px solid #d97706' }}>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800">Electrical Result</h3>
                                <p className="text-sm text-gray-500 mt-1 italic flex items-center gap-1">
                                    <Info size={14} /> Estimates reflect selected items only (excludes automatic rough-ins)
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className={`text-left md:text-right bg-${THEME}-50 px-5 py-3 rounded-xl border border-${THEME}-100 w-full`}>
                                    <p className={`text-xs text-${THEME}-600 font-bold uppercase tracking-wide mb-1`}>Estimated Total Material Cost</p>
                                    <p className={`font-bold text-4xl text-${THEME}-700 tracking-tight`}>₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <ExportButtons
                                    onCopy={async () => {
                                        const success = await copyToClipboard(result.items);
                                        if (success) alert('Table copied to clipboard!');
                                    }}
                                    onDownload={() => downloadCSV(result.items, 'electrical_estimate.csv')}
                                />
                            </div>
                        </div>

                        <div className={TABLE_UI.CONTAINER}>
                            <table className={TABLE_UI.TABLE}>
                                <thead className={TABLE_UI.HEADER_ROW}>
                                    <tr>
                                        <th className={`${TABLE_UI.HEADER_CELL_LEFT} w-[35%]`}>Material Item</th>
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
                                            <td className={TABLE_UI.CELL_RIGHT}>{item.qty}</td>
                                            <td className={TABLE_UI.CELL_CENTER}>
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className={`${TABLE_UI.CELL} border-r-0`}>
                                                <TablePriceInput
                                                    value={prices[item.priceKey] || 0}
                                                    onChange={(val) => updatePrice(item.priceKey, val)}
                                                    colorTheme={THEME}
                                                />
                                            </td>
                                            <td className={`${TABLE_UI.CELL_RIGHT} font-extrabold text-${THEME}-900 bg-${THEME}-50/20`}>₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
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


