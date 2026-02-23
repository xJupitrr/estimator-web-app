import React, { useState, useMemo, useEffect } from 'react';
import { Settings, Info, Calculator, DoorOpen, ClipboardCopy, Download, Box } from 'lucide-react';
import { calculateLintelBeam } from '../../utils/calculations/lintelBeamCalculator';
import { copyToClipboard, downloadCSV } from '../../utils/export';
import useLocalStorage, { setSessionData } from '../../hooks/useLocalStorage';
import { THEME_COLORS, TABLE_UI, INPUT_UI } from '../../constants/designSystem';
import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import ActionButton from '../common/ActionButton';
import TablePriceInput from '../common/TablePriceInput';
import MathInput from '../common/MathInput';
import SelectInput from '../common/SelectInput';

const THEME = THEME_COLORS.lintel;

// --- CONSTANTS ---

const CONCRETE_WASTE_PCT = 5;
const L_ANCHOR_DEV_FACTOR = 40;
const BEARING_LENGTH = 0.20; // 200mm bearing each side (Total 400mm added to opening width)

const DEFAULT_PRICES = {
    cement: 240,
    sand: 1200,
    gravel: 1400,
    rebar_10: 180,
    rebar_12: 260,
    rebar_16: 480,
    tie_wire: 85,
};

const DEFAULT_SPECS = {
    lintelDepth: "", // 150mm standard depth (wall thickness)
    lintelHeight: "", // 200mm standard height
    mainBarSku: '',
    mainBarCount: "",
    tieSku: '',
    tieSpacing: "", // mm
};

const AVAILABLE_REBAR_SKUS = [
    { id: '10_6.0', diameter: 10, length: 6.0, display: '10mm x 6.0m' },
    { id: '12_6.0', diameter: 12, length: 6.0, display: '12mm x 6.0m' },
    { id: '16_6.0', diameter: 16, length: 6.0, display: '16mm x 6.0m' },
    { id: '16_9.0', diameter: 16, length: 9.0, display: '16mm x 9.0m' },
];

const AVAILABLE_TIE_SKUS = [
    { id: '10_6.0', diameter: 10, length: 6.0, display: '10mm x 6.0m' },
    { id: '12_6.0', diameter: 12, length: 6.0, display: '12mm x 6.0m' },
];

// --- HELPER FUNCTIONS ---

const getSkuDetails = (skuId) => {
    if (!skuId) return { diameter: 0, length: 0, priceKey: '' };
    const [diameter, length] = skuId.split('_').map(Number);
    return { diameter, length, priceKey: `rebar_${diameter}` };
};

// --- UI COMPONENTS ---

// Local Card and TablePriceInput removed in favor of common versions.

const NumberInput = ({ value, onChange, placeholder, className = "" }) => (
    <MathInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${INPUT_UI.TABLE_INPUT} focus:ring-${THEME}-400 ${className}`}
    />
);



// --- MAIN COMPONENT ---

export default function LintelBeam() {
    // --- STATE ---

    // We source the openings from the "Doors & Windows" module
    const [doorsWindowsItems] = useLocalStorage('doorswindows_rows', []);

    // Config: Main Bars & Ties (Persisted for Global Calc)
    const [specs, setSpecs] = useLocalStorage('lintelbeam_specs', {
        lintelDepth: "", // 150mm standard depth (wall thickness)
        lintelHeight: "", // 200mm standard height
        mainBarSku: '',  // e.g. '12_6.0'
        mainBarCount: "",
        tieSku: '',      // e.g. '10_6.0'
        tieSpacing: "", // mm
    });

    const [prices, setPrices] = useLocalStorage('lintelbeam_prices', {
        cement: 240,
        sand: 1200,
        gravel: 1400,
        rebar_10: 185,
        rebar_12: 260,
        rebar_16: 480,
        tie_wire: 85,
    });

    const [showResult, setShowResult] = useLocalStorage('lintelbeam_show_result', false);
    const [resultData, setResultData] = useLocalStorage('lintelbeam_result', null); // For Global Sync logic

    // Transform to lintel beams
    const lintelBeams = useMemo(() => {
        const depth = parseFloat(specs.lintelDepth) || 0.15;
        return doorsWindowsItems
            .filter(item => item && item.width_m && item.height_m)
            .map(item => ({
                id: item.id,
                openingType: item.itemType || 'Opening',
                openingWidth: parseFloat(item.width_m) || 0,
                openingHeight: parseFloat(item.height_m) || 0,
                quantity: parseInt(item.quantity) || 1,
                lintelWidth: (parseFloat(item.width_m) || 0) + (2 * BEARING_LENGTH),
                lintelDepth: depth,
                mainBarSku: specs.mainBarSku,
                mainBarCount: parseInt(specs.mainBarCount) || 2,
                tieSku: specs.tieSku,
                tieSpacing: parseInt(specs.tieSpacing) || 150, // mm
            }));
    }, [doorsWindowsItems, specs]);

    // Reset results when input data changes
    useEffect(() => {
        setShowResult(false);
    }, [doorsWindowsItems]);

    const handleCalculate = () => {
        if (!specs.mainBarSku || !specs.tieSku) {
            alert("Please select rebar specifications for both main bars and ties.");
            return;
        }
        setShowResult(true);
    };

    const handleSpecChange = (field, value) => {
        setSpecs(prev => ({ ...prev, [field]: value }));
        setShowResult(false);
    };

    // ... inside component ...

    // --- CALCULATION ENGINE ---
    const result = useMemo(() => {
        if (!showResult) return null;
        // Pass lintelBeams (transformed data) and prices. 
        // We pass 'specs' just to ensure we have context but calculateLintelBeam handles pre-processed data too.
        // Actually, looking at my utility implementation, if I pass 'specs' it assumes raw input.
        // If I pass array as first arg and NO specs, it assumes processed.
        // `lintelBeams` in this component IS PROCESSED (has lintelWidth, mainBarSku etc).
        // BUT it relies on `specs.lintelHeight` being in the object if not passed via specs?
        // My utility adds `lintelHeight` from specs if available.
        // So I should pass specs OR add lintelHeight to the map above.
        // The map above ALREADY includes `specs.mainBarSku` etc but NOT `lintelHeight` explicitly in the mapped object?
        // Wait, line 108: `lintelDepth: depth`.
        // I don't see `lintelHeight` in the map in LintelBeam.jsx. It uses `specs.lintelHeight` in the calc.

        // I will update the utility call to pass specs so the utility can grab the height.
        return calculateLintelBeam(lintelBeams, prices, specs);
    }, [lintelBeams, prices, specs, showResult]);

    // Global Cost Sync
    useEffect(() => {
        if (result) {
            setSessionData('lintel_beam_total', result.grandTotal);
        } else {
            setSessionData('lintel_beam_total', null);
        }
        window.dispatchEvent(new CustomEvent('project-total-update'));
    }, [result]);

    return (
        <div className="space-y-6">
            <Card className={`border-t-4 border-t-${THEME}-500 shadow-md`}>
                <SectionHeader
                    title="Lintel Beam General Specifications"
                    icon={Settings}
                    colorTheme={THEME}
                />
                <div className="overflow-x-auto p-4">
                    <table className={TABLE_UI.INPUT_TABLE}>
                        <thead className="bg-slate-100">
                            <tr>
                                <th className={`${TABLE_UI.INPUT_HEADER} bg-cyan-50 text-cyan-900`} colSpan="2">Dimensions (m)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} bg-orange-50 text-orange-900`} colSpan="2">Main Reinforcement</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} bg-emerald-50 text-emerald-900`} colSpan="2">Ties / Stirrups</th>
                            </tr>
                            <tr>
                                <th className={`${TABLE_UI.INPUT_HEADER} bg-cyan-50/50`}>Depth (W)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} bg-cyan-50/50`}>Height (H)</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} bg-orange-50/50`}>Bar Size</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} bg-orange-50/50`}>Count</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} bg-emerald-50/50`}>Tie Size</th>
                                <th className={`${TABLE_UI.INPUT_HEADER} bg-emerald-50/50`}>Spacing (mm)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className={TABLE_UI.INPUT_ROW}>
                                <td className={TABLE_UI.INPUT_CELL}>
                                    <NumberInput
                                        value={specs.lintelDepth}
                                        onChange={(v) => handleSpecChange('lintelDepth', v)}
                                        placeholder="0.15"
                                        className="text-center"
                                    />
                                </td>
                                <td className={TABLE_UI.INPUT_CELL}>
                                    <NumberInput
                                        value={specs.lintelHeight}
                                        onChange={(v) => handleSpecChange('lintelHeight', v)}
                                        placeholder="0.20"
                                        className="text-center"
                                    />
                                </td>
                                <td className={`${TABLE_UI.INPUT_CELL} bg-orange-50/10`}>
                                    <SelectInput
                                        value={specs.mainBarSku}
                                        onChange={(v) => handleSpecChange('mainBarSku', v)}
                                        options={AVAILABLE_REBAR_SKUS}
                                        placeholder="Select Main Bar..."
                                        focusColor={THEME}
                                        className="text-center"
                                    />
                                </td>
                                <td className={`${TABLE_UI.INPUT_CELL} bg-orange-50/10`}>
                                    <NumberInput
                                        value={specs.mainBarCount}
                                        onChange={(v) => handleSpecChange('mainBarCount', v)}
                                        placeholder="2"
                                        min="1"
                                        step="1"
                                        className="text-center"
                                    />
                                </td>
                                <td className={`${TABLE_UI.INPUT_CELL} bg-emerald-50/10`}>
                                    <SelectInput
                                        value={specs.tieSku}
                                        onChange={(v) => handleSpecChange('tieSku', v)}
                                        options={AVAILABLE_TIE_SKUS}
                                        placeholder="Select Tie..."
                                        focusColor={THEME}
                                        className="text-center"
                                    />
                                </td>
                                <td className={`${TABLE_UI.INPUT_CELL} bg-emerald-50/10`}>
                                    <NumberInput
                                        value={specs.tieSpacing}
                                        onChange={(v) => handleSpecChange('tieSpacing', v)}
                                        placeholder="150"
                                        min="50"
                                        step="10"
                                        className="text-center"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="mt-2 text-[10px] text-gray-400 italic px-1 flex items-center gap-1">
                        <Info size={10} /> These specifications apply to all lintel beams generated from door and window openings.
                    </div>
                </div>
            </Card>

            <Card className={`border-t-4 border-t-${THEME}-500 shadow-md`}>
                <SectionHeader
                    title="Opening Detection"
                    icon={DoorOpen}
                    colorTheme={THEME}
                    description={`${lintelBeams.length} opening${lintelBeams.length !== 1 ? 's' : ''} detected from Doors & Windows tab`}
                />

                {lintelBeams.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <DoorOpen size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-medium">No openings found in Doors & Windows tab.</p>
                        <p className="text-xs">Add openings there to see them here.</p>
                    </div>
                ) : (
                    <div className={TABLE_UI.CONTAINER}>
                        <table className={TABLE_UI.TABLE}>
                            <thead className={TABLE_UI.HEADER_ROW}>
                                <tr>
                                    <th className={TABLE_UI.HEADER_CELL}>#</th>
                                    <th className={TABLE_UI.HEADER_CELL_LEFT}>Opening Type</th>
                                    <th className={TABLE_UI.HEADER_CELL}>Qty</th>
                                    <th className={`${TABLE_UI.HEADER_CELL} bg-${THEME}-50/30`}>Opening Width</th>
                                    <th className={`${TABLE_UI.HEADER_CELL} text-${THEME}-700 bg-${THEME}-50/50`}>Lintel Length</th>
                                    <th className={TABLE_UI.HEADER_CELL}>Depth</th>
                                    <th className={TABLE_UI.HEADER_CELL}>Height</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {lintelBeams.map((beam, idx) => (
                                    <tr key={beam.id} className={TABLE_UI.BODY_ROW}>
                                        <td className={TABLE_UI.CELL_CENTER}>{idx + 1}</td>
                                        <td className={`${TABLE_UI.CELL} font-bold`}>{beam.openingType}</td>
                                        <td className={TABLE_UI.CELL_CENTER}>{beam.quantity}</td>
                                        <td className={`${TABLE_UI.CELL_CENTER} bg-${THEME}-50/10 tabular-nums`}>{beam.openingWidth.toFixed(2)}m</td>
                                        <td className={`${TABLE_UI.CELL_CENTER} bg-${THEME}-50/30 font-bold text-${THEME}-700 tabular-nums`}>{beam.lintelWidth.toFixed(2)}m</td>
                                        <td className={`${TABLE_UI.CELL_CENTER} text-xs`}>{specs.mainBarCount} - {getSkuDetails(specs.mainBarSku).diameter}mm</td>
                                        <td className={`${TABLE_UI.CELL_CENTER} text-xs`}>{getSkuDetails(specs.tieSku).diameter}mm @ {specs.tieSpacing}mm</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <ActionButton
                        onClick={handleCalculate}
                        disabled={lintelBeams.length === 0}
                        label="CALCULATE"
                        icon={Calculator}
                        colorTheme={THEME}
                        className="py-3 px-8"
                    />
                </div>
            </Card>

            {!showResult && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50 mt-6">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Box size={40} className={`text-${THEME}-400`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 mb-1">Ready to Estimate</h3>
                    <p className="max-w-md mx-auto text-sm">
                        Configure your lintel specifications and click <span className={`font-bold text-${THEME}-600`}>'CALCULATE'</span>. Make sure to add openings from the Doors & Windows tab first.
                    </p>
                </div>
            )}

            {showResult && result && (
                <Card className={`animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-${THEME}-500`}>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                    Estimation Result
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Total Lintel concrete volume: <strong className="text-gray-700">{result.volume} m³</strong>
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-3 text-right">
                                <div className={`bg-${THEME}-50 p-4 rounded-xl border border-${THEME}-100`}>
                                    <p className={`text-[10px] text-${THEME}-600 font-bold uppercase tracking-widest mb-1`}>Total Estimated Cost</p>
                                    <p className={`font-bold text-4xl text-${THEME}-700 tabular-nums`}>₱{result.grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => copyToClipboard(result.items)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                                        <ClipboardCopy size={13} /> Copy Result
                                    </button>
                                    <button onClick={() => downloadCSV(result.items, 'lintel_estimation.csv')} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                                        <Download size={13} /> Export CSV
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={TABLE_UI.CONTAINER}>
                            <table className={TABLE_UI.TABLE}>
                                <thead className={TABLE_UI.HEADER_ROW}>
                                    <tr>
                                        <th className={TABLE_UI.HEADER_CELL_LEFT}>Material Description</th>
                                        <th className={TABLE_UI.HEADER_CELL_RIGHT}>Quantity</th>
                                        <th className={TABLE_UI.HEADER_CELL}>Unit</th>
                                        <th className={`${TABLE_UI.HEADER_CELL_RIGHT} w-[150px]`}>Unit Price (Editable)</th>
                                        <th className={`${TABLE_UI.HEADER_CELL_RIGHT} bg-gray-50/50`}>Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className={TABLE_UI.BODY_ROW}>
                                            <td className={TABLE_UI.CELL}>{item.name}</td>
                                            <td className={TABLE_UI.CELL_RIGHT}>{item.qty.toLocaleString()}</td>
                                            <td className={TABLE_UI.CELL_CENTER}>
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 uppercase">{item.unit}</span>
                                            </td>
                                            <td className={`${TABLE_UI.CELL} border-r-0`}>
                                                <TablePriceInput
                                                    value={prices[item.priceKey] !== undefined ? prices[item.priceKey] : item.price}
                                                    onChange={(val) => setPrices(prev => ({ ...prev, [item.priceKey]: val }))}
                                                    colorTheme={THEME}
                                                />
                                            </td>
                                            <td className={`${TABLE_UI.CELL_RIGHT} font-bold text-slate-900 bg-slate-50/30 tabular-nums`}>₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex items-start gap-2 text-gray-400 px-1">
                            <Info size={14} className="mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] italic leading-relaxed">
                                Lintel length = opening width + 0.40m (200mm bearing each side). Calculations use Concrete Class A (1:2:4) with 5% waste factor.
                                Rebar quantities include 40D anchorage length. Formworks are excluded here as they are handled in the Formworks tab.
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
