import React, { useState, useEffect } from 'react';
import { Info, Settings, Calculator, PlusCircle, Trash2, Box, Package, Hammer, AlertCircle, ClipboardCopy, Download, Copy, CheckSquare } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';

// --- Components ---

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

const TableNumberInput = ({ value, onChange, placeholder, min = "0", step = "any", className = "" }) => (
    <input
        type="number"
        min={min}
        step={step}
        placeholder={placeholder}
        value={value === null || value === undefined ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-1.5 text-center border border-slate-300 rounded text-sm focus:ring-2 focus:ring-yellow-500 outline-none font-medium bg-white text-slate-900 ${className}`}
    />
);

const TablePriceInput = ({ value, onChange, placeholder = "0.00" }) => (
    <div className="flex items-center justify-end relative">
        <span className="absolute left-1 text-gray-400 font-bold text-[10px] pointer-events-none">₱</span>
        <input
            type="number"
            min="0"
            step="0.01"
            placeholder={placeholder}
            value={value === null || value === undefined ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-5 pr-2 py-1.5 text-right text-sm border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none text-gray-800 font-medium transition-colors"
        />
    </div>
);

// --- Constants & Defaults ---

const DEFAULT_PRICES = {
    phenolic_1_2: 2400,
    phenolic_3_4: 2800,
    plywood_1_2: 1250,
    lumber_2x2: 35,
    lumber_2x3: 45,
    lumber_2x4: 65,
    nails_kg: 85,
};

const PLYWOOD_OPTIONS = [
    { id: 'phenolic_1_2', label: '1/2" Phenolic (4x8)', area_sqm: 2.9768, thickness_in: 0.5 },
    { id: 'phenolic_3_4', label: '3/4" Phenolic (4x8)', area_sqm: 2.9768, thickness_in: 0.75 },
    { id: 'plywood_1_2', label: '1/2" Marine Plywood (4x8)', area_sqm: 2.9768, thickness_in: 0.5 },
];

const LUMBER_OPTIONS = [
    { id: 'lumber_2x2', label: '2"x2"', bf_per_meter: 1.09361 },
    { id: 'lumber_2x3', label: '2"x3"', bf_per_meter: 1.64042 },
    { id: 'lumber_2x4', label: '2"x4"', bf_per_meter: 2.18722 },
];

// Initial Row Template
const getInitialRow = (data = {}) => ({
    id: Date.now() + Math.random(),
    quantity: data.quantity || 1,
    length_m: data.length_m || "",
    width_m: data.width_m || "",
    height_m: data.height_m || "",
    description: data.description || "",
    plywood_type: 'phenolic_1_2',
    lumber_size: 'lumber_2x3',
});

export default function Formworks({ columns = [], beams = [] }) {

    // --- State ---
    const [rows, setRows] = useState([getInitialRow()]);
    const [prices, setPrices] = useState(DEFAULT_PRICES);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [wastePlywood, setWastePlywood] = useState(15);
    const [wasteLumber, setWasteLumber] = useState(10);

    // Automation States
    const [includeColumns, setIncludeColumns] = useState(false);
    const [includeBeams, setIncludeBeams] = useState(false);
    const [importPlywood, setImportPlywood] = useState('phenolic_1_2');
    const [importLumber, setImportLumber] = useState('lumber_2x3');

    const handleRowChange = (id, field, value) => {
        setRows(prev =>
            prev.map(row => {
                if (row.id !== id) return row;
                return { ...row, [field]: value };
            })
        );
        setResult(null);
        setError(null);
    };

    const handleAddRow = () => {
        setRows(prev => [...prev, getInitialRow()]);
        setResult(null);
        setError(null);
    };

    const handleRemoveRow = (id) => {
        if (rows.length > 1) {
            setRows(prev => prev.filter(row => row.id !== id));
            setResult(null);
            setError(null);
        } else {
            setRows([getInitialRow()]);
        }
    };

    // --- Calculation Engine ---
    const calculateFormworks = () => {
        let totalAreaAccumulator = 0;
        const plywoodByType = {};
        const lumberByType = {};

        const pWasteFactor = 1 + (wastePlywood / 100);
        const lWasteFactor = 1 + (wasteLumber / 100);

        // Utility to process material impact
        const processItem = (areaPerUnit, L, W, H, qty, pType, lType) => {
            totalAreaAccumulator += areaPerUnit * qty;

            // Plywood
            if (!plywoodByType[pType]) {
                plywoodByType[pType] = { area: 0, spec: PLYWOOD_OPTIONS.find(p => p.id === pType) };
            }
            plywoodByType[pType].area += areaPerUnit * qty;

            // Lumber
            const perimeter = 2 * (L + W);
            const numStuds = Math.ceil(perimeter / 0.6) * 2;
            const lumberStuds = numStuds * H;
            let numWalers = 2;
            if (H > 0.50 && H <= 1.0) numWalers = 3;
            else if (H > 1.0) numWalers = 4;
            const lumberWalers = numWalers * 2 * perimeter;
            const totalLumberLinear = (lumberStuds + lumberWalers) * qty;

            if (!lumberByType[lType]) {
                lumberByType[lType] = { linear: 0, spec: LUMBER_OPTIONS.find(l => l.id === lType) };
            }
            lumberByType[lType].linear += totalLumberLinear;
        };

        // 1. Process Manual Rows (Treat as 4 sides + bottom)
        rows.forEach(row => {
            const Q = parseInt(row.quantity) || 0;
            const L = parseFloat(row.length_m) || 0;
            const W = parseFloat(row.width_m) || 0;
            const H = parseFloat(row.height_m) || 0;
            if (Q > 0 && L > 0 && W > 0 && H > 0) {
                const area = (2 * L * H) + (2 * W * H) + (L * W);
                processItem(area, L, W, H, Q, row.plywood_type, row.lumber_size);
            }
        });

        // 2. Process Columns (Treat as 4 vertical sides)
        if (includeColumns) {
            columns.forEach(col => {
                const Q = parseInt(col.quantity) || 0;
                const L = parseFloat(col.length_m) || 0;
                const W = parseFloat(col.width_m) || 0;
                const H = parseFloat(col.height_m) || 0;
                if (Q > 0 && L > 0 && W > 0 && H > 0) {
                    const area = (2 * L * H) + (2 * W * H); // Periphery * Height
                    processItem(area, L, W, H, Q, importPlywood, importLumber);
                }
            });
        }

        // 3. Process Beams (Treat as 2 sides + bottom)
        if (includeBeams) {
            beams.forEach(beam => {
                const Q = parseInt(beam.quantity) || 0;
                const B = parseFloat(beam.length_m) || 0; // Width (B)
                const H = parseFloat(beam.width_m) || 0;  // Depth (H)
                const L = parseFloat(beam.height_m) || 0; // Length (L)
                if (Q > 0 && B > 0 && H > 0 && L > 0) {
                    const area = (2 * H * L) + (B * L); // 2 Sides + Bottom
                    processItem(area, B, H, L, Q, importPlywood, importLumber);
                }
            });
        }

        if (totalAreaAccumulator === 0) {
            setError("No valid elements found. Ensure manual entries or toggled imports have valid dimensions.");
            setResult(null);
            return;
        }
        setError(null);

        // Final Items Assembly
        const finalItems = [];
        let grandTotal = 0;

        Object.keys(plywoodByType).forEach(pId => {
            const { area, spec } = plywoodByType[pId];
            const sheets = Math.ceil((area / spec.area_sqm) * pWasteFactor);
            const price = prices[pId] || DEFAULT_PRICES[pId];
            const total = sheets * price;
            grandTotal += total;
            finalItems.push({ name: spec.label, qty: sheets, unit: "sheets", priceKey: pId, price, total });
        });

        Object.keys(lumberByType).forEach(lId => {
            const { linear, spec } = lumberByType[lId];
            const bf = Math.ceil(linear * spec.bf_per_meter * lWasteFactor);
            const price = prices[lId] || DEFAULT_PRICES[lId];
            const total = bf * price;
            grandTotal += total;
            finalItems.push({ name: `Lumber (${spec.label})`, qty: bf, unit: "BF", priceKey: lId, price, total });
        });

        const nailsKg = Math.ceil(totalAreaAccumulator * 0.15 * lWasteFactor);
        const nailPrice = prices.nails_kg || DEFAULT_PRICES.nails_kg;
        const nailTotal = nailsKg * nailPrice;
        grandTotal += nailTotal;
        finalItems.push({ name: "Common Nails (Assorted)", qty: nailsKg, unit: "kg", priceKey: "nails_kg", price: nailPrice, total: nailTotal });

        setResult({
            area: totalAreaAccumulator.toFixed(2),
            items: finalItems,
            grandTotal: grandTotal
        });
    };

    return (
        <div className="space-y-6">

            {/* INPUT CARD */}
            <Card className="border-t-4 border-t-yellow-600 shadow-md">
                <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <Settings size={18} /> Formworks Configuration
                    </h2>
                    <button
                        onClick={handleAddRow}
                        className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600 text-white rounded-md text-xs font-bold hover:bg-yellow-700 transition-colors active:scale-95 shadow-sm"
                    >
                        <PlusCircle size={14} /> Add Manual Row
                    </button>
                </div>

                {/* Integration Bar */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-4 py-1.5 px-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={includeColumns}
                                    onChange={(e) => setIncludeColumns(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-yellow-600 focus:ring-yellow-500"
                                />
                                <div>
                                    <p className={`text-[11px] font-bold uppercase tracking-wider ${includeColumns ? 'text-yellow-700' : 'text-slate-400'}`}>Columns</p>
                                    <p className="text-[10px] text-slate-400 font-medium leading-none">{columns.length} items</p>
                                </div>
                            </label>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={includeBeams}
                                    onChange={(e) => setIncludeBeams(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-yellow-600 focus:ring-yellow-500"
                                />
                                <div>
                                    <p className={`text-[11px] font-bold uppercase tracking-wider ${includeBeams ? 'text-yellow-700' : 'text-slate-400'}`}>Beams</p>
                                    <p className="text-[10px] text-slate-400 font-medium leading-none">{beams.length} items</p>
                                </div>
                            </label>
                        </div>

                        {(includeColumns || includeBeams) && (
                            <div className="flex items-center gap-4 bg-yellow-50 px-4 py-1 rounded-lg border border-yellow-100">
                                <span className="text-[10px] font-black text-yellow-800 uppercase tracking-tighter">Import Specs:</span>
                                <select
                                    value={importPlywood}
                                    onChange={(e) => setImportPlywood(e.target.value)}
                                    className="bg-transparent text-[10px] font-bold text-yellow-900 focus:outline-none border-b border-yellow-300"
                                >
                                    {PLYWOOD_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                </select>
                                <select
                                    value={importLumber}
                                    onChange={(e) => setImportLumber(e.target.value)}
                                    className="bg-transparent text-[10px] font-bold text-yellow-900 focus:outline-none border-b border-yellow-300"
                                >
                                    {LUMBER_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Plywood<br />Waste %</label>
                            <input
                                type="number"
                                value={wastePlywood}
                                onChange={(e) => setWastePlywood(e.target.value)}
                                className="w-12 p-1.5 text-center text-sm font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-yellow-400 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Lumber<br />Waste %</label>
                            <input
                                type="number"
                                value={wasteLumber}
                                onChange={(e) => setWasteLumber(e.target.value)}
                                className="w-12 p-1.5 text-center text-sm font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-yellow-400 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto p-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-1">
                        <Box size={14} className="text-yellow-500/50" /> Manual Elements Calculation
                    </h3>
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[850px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[30px]" rowSpan="2">#</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[60px]" rowSpan="2">Qty</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-yellow-50 text-yellow-900" colSpan="3">Bounding Box (m)</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center bg-amber-50 text-amber-900" colSpan="2">Specifications</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[160px]" rowSpan="2">Description</th>
                                <th className="px-1 py-2 font-bold border border-slate-300 text-center w-[30px]" rowSpan="2"></th>
                            </tr>
                            <tr>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[80px] bg-yellow-50/50">L</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[80px] bg-yellow-50/50">W</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[80px] bg-yellow-50/50">H</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[115px] bg-amber-50/50">Plywood</th>
                                <th className="px-2 py-2 font-semibold border border-slate-300 text-center w-[125px] bg-amber-50/50">Lumber</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors text-xs font-semibold">
                                    <td className="p-2 border border-slate-300 align-middle text-center text-gray-500 font-bold">{index + 1}</td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput value={row.quantity} onChange={(v) => handleRowChange(row.id, 'quantity', v)} min="1" step="1" className="font-bold" />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={row.length_m} onChange={(v) => handleRowChange(row.id, 'length_m', v)} placeholder="0.30" /></td>
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={row.width_m} onChange={(v) => handleRowChange(row.id, 'width_m', v)} placeholder="0.30" /></td>
                                    <td className="p-2 border border-slate-300 align-middle"><TableNumberInput value={row.height_m} onChange={(v) => handleRowChange(row.id, 'height_m', v)} placeholder="3.00" /></td>
                                    <td className="p-2 border border-slate-300 align-middle bg-amber-50/20">
                                        <select value={row.plywood_type} onChange={(e) => handleRowChange(row.id, 'plywood_type', e.target.value)} className="w-full p-1 text-center border border-slate-300 rounded bg-white outline-none cursor-pointer text-xs font-medium h-[26px]">
                                            {PLYWOOD_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle bg-amber-50/20">
                                        <select value={row.lumber_size} onChange={(e) => handleRowChange(row.id, 'lumber_size', e.target.value)} className="w-full p-1 text-center border border-slate-300 rounded bg-white outline-none cursor-pointer text-xs font-medium h-[26px]">
                                            {LUMBER_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <input type="text" value={row.description} onChange={(e) => handleRowChange(row.id, 'description', e.target.value)} placeholder="e.g. C-1" className="w-full p-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-yellow-400 outline-none" />
                                    </td>
                                    <td className="p-1 border border-slate-300 align-middle text-center">
                                        <button onClick={() => handleRemoveRow(row.id)} disabled={rows.length === 1} className={`p-1.5 rounded-full transition-colors ${rows.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}><Trash2 size={14} /></button>
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

                <div className="p-6 bg-slate-50 border-t border-gray-200 flex justify-end">
                    <button onClick={calculateFormworks} className="w-full md:w-auto px-8 py-3 bg-yellow-600 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-all hover:bg-yellow-700 uppercase tracking-wider text-sm flex items-center justify-center gap-2 min-w-[200px]">
                        <Calculator size={18} /> Calculate Final Estimate
                    </button>
                </div>
            </Card>

            {/* RESULTS */}
            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-emerald-500">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">Estimation Summary</h3>
                                <div className="flex gap-4 mt-2">
                                    <div className="bg-yellow-50 px-3 py-1 rounded text-sm text-yellow-700 border border-yellow-100">
                                        Total Contact Area: <strong>{result.area} sq.m</strong>
                                    </div>
                                </div>
                            </div>
                            <div className="text-left md:text-right bg-emerald-50 px-5 py-3 rounded-xl border border-emerald-100 flex flex-col items-end">
                                <p className="text-xs text-emerald-800 font-bold uppercase tracking-wide mb-1">Total Material Cost</p>
                                <p className="font-bold text-4xl text-emerald-700 tracking-tight">₱{result.grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mb-4">
                            <button onClick={() => copyToClipboard(result.items)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"><ClipboardCopy size={14} /> Copy</button>
                            <button onClick={() => downloadCSV(result.items, 'formworks.csv')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"><Download size={14} /> CSV</button>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Material Item</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[140px]">Base Price</th>
                                        <th className="px-4 py-3 text-right bg-gray-100/50">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900">{item.qty.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-slate-500">{item.unit}</span></td>
                                            <td className="px-4 py-1.5"><TablePriceInput value={prices[item.priceKey] || item.price} onChange={(v) => { setPrices(p => ({ ...p, [item.priceKey]: v })); setResult(null); }} /></td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 bg-gray-50/50">₱{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            )}

            {!result && (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                    <div className="bg-white p-5 rounded-2xl shadow-sm mb-5"><Hammer size={40} className="text-yellow-500" /></div>
                    <p className="font-bold text-lg text-slate-600">Formworks Calculator</p>
                    <p className="max-w-xs text-center text-sm mt-1 leading-relaxed">Enter manual dimensions or toggle **Automated Imports** above to calculate formwork area for Columns and Beams.</p>
                </div>
            )}
        </div>
    );
}
