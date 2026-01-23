
import React, { useState, useEffect } from 'react';
import { Cloud, Settings, Calculator, PlusCircle, Trash2, AlertCircle, Info, ClipboardCopy, Download } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';

// --- Constants & Config ---

const MATERIAL_TYPES = {
    gypsum: { label: "Gypsum Board (9mm/12mm)", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_gypsum', fastenerName: "Gypsum Screws" },
    hardiflex: { label: "Fiber Cement / Hardiflex", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_hardiflex', fastenerName: "Hardiflex Screws" },
    plywood: { label: "Marine Plywood (1/4\")", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_metal', fastenerName: "Metal Screws" },
    spandrel: { label: "Spandrel Panel (PVC/Metal)", type: 'panel', defW: 0.15, defL: 6.0, fastener: 'rivets', fastenerName: "Blind Rivets" },
    pvc: { label: "PVC Ceiling Panel", type: 'panel', defW: 0.20, defL: 5.80, fastener: 'clips', fastenerName: "PVC Clips" }
};

// --- Components ---

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

const TableNumberInput = ({ value, onChange, placeholder, min = "0.01", step = "0.01", className = "" }) => (
    <input
        type="number"
        min={min}
        step={step}
        placeholder={placeholder}
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-cyan-400 outline-none font-medium bg-white text-slate-900 ${className}`}
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
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-5 pr-2 py-1 text-right text-sm border border-gray-300 rounded bg-white focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none text-gray-800 font-medium transition-colors"
        />
    </div>
);

// --- Helper Functions & Data ---

const getInitialRoom = () => ({
    id: crypto.randomUUID(),
    quantity: 1,
    length_m: "",
    width_m: "",
    type: 'gypsum' // Default type
});

import useLocalStorage from '../../hooks/useLocalStorage';

export default function Ceiling() {

    // --- State ---
    const [rooms, setRooms] = useLocalStorage('ceiling_rooms', [getInitialRoom()]);

    // Consumables & Material Prices
    const [prices, setPrices] = useLocalStorage('ceiling_prices', {
        // Boards/Panels
        gypsum: 450,
        hardiflex: 550,
        plywood: 600,
        spandrel: 350,   // Per piece
        pvc: 250,        // Per piece (PVC 2.9m/5.8m)

        // Framing
        wall_angle: 60,     // 3m
        furring: 120,       // 5m
        carrying: 150,      // 5m
        w_clip: 5,

        // Fasteners
        screw_gypsum: 0.50,
        screw_hardiflex: 0.75,
        screw_metal: 0.60,
        rivets: 0.40,
        clips: 5.00,       // PVC Clips + Screw set per piece
        mesh_tape: 150,    // Per Roll (e.g. 75m or 100m)
        jointing_compound: 850, // Per Pail/Bag (20kg)
        spandrel_molding: 120, // Per length (3m)
        pvc_u_molding: 80,     // Per length (3m)
        pvc_h_clip: 90,        // Per length (3m)
    });

    // Panel Configuration (Global for simplicity, or could be per row)
    const [config, setConfig] = useLocalStorage('ceiling_config', {
        spandrel_w: 0.15, // Effective width
        spandrel_l: 6.0,  // Stock length
        pvc_w: 0.20,      // Effective width (Standard PVC often 20cm or 25cm)
        pvc_l: 5.80       // Stock length (Standard often 2.90m or 5.80m)
    });

    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleRoomChange = (id, field, value) => {
        setRooms(prev =>
            prev.map(room => {
                if (room.id !== id) return room;
                return { ...room, [field]: value };
            })
        );
        setResult(null);
        setError(null);
    };

    const handleAddRow = () => {
        setRooms(prev => [...prev, getInitialRoom()]);
        setResult(null);
        setError(null);
    };

    const handleRemoveRow = (id) => {
        if (rooms.length > 1) {
            setRooms(prev => prev.filter(room => room.id !== id));
            setResult(null);
            setError(null);
        } else {
            setRooms([getInitialRoom()]);
        }
    };

    const calculateMaterials = () => {

        let totalPerimeter = 0;
        let totalFurringLM = 0;
        let totalCarryingLM = 0;
        let totalIntersections = 0;

        // Material Accumulators
        const materials = {
            gypsum: 0,
            hardiflex: 0,
            plywood: 0,
            spandrel: 0,
            pvc: 0,

            // Fasteners
            screw_gypsum: 0,
            screw_hardiflex: 0,
            screw_metal: 0,
            rivets: 0,
            clips: 0,

            // Accessories
            mesh_tape_m: 0,        // Linear meters needed
            compound_bag: 0,       // Bags/Pails needed
            spandrel_molding_lm: 0, // Linear meters
            pvc_u_molding_lm: 0,    // Linear meters
            pvc_h_clip_lm: 0        // Linear meters
        };

        const hasEmptyFields = rooms.some(room => room.length_m === "" || room.width_m === "");
        if (hasEmptyFields) {
            setError("Please fill in all dimensions.");
            setResult(null);
            return;
        }
        setError(null);

        const FURRING_SPACING = 0.40;
        const CARRYING_SPACING = 1.20;

        rooms.forEach(room => {
            const L = parseFloat(room.length_m) || 0;
            const W = parseFloat(room.width_m) || 0;
            const qty = parseInt(room.quantity) || 1;
            const typeKey = room.type;
            const typeData = MATERIAL_TYPES[typeKey];

            if (L <= 0 || W <= 0) return;

            // --- 1. FRAMING CALCULATION (Common for all) ---
            const perimeter = 2 * (L + W);

            // Approx runs. 
            // Carrying runs along Length (L) spaced across Width (W).
            const carryingRuns = Math.ceil(W / CARRYING_SPACING);
            const roomCarryingLM = carryingRuns * L;

            // Furring runs perpendicular to Carrying (along W, spaced across L).
            const furringRuns = Math.ceil(L / FURRING_SPACING);
            const roomFurringLM = furringRuns * W;

            const intersections = carryingRuns * furringRuns;

            totalPerimeter += (perimeter * qty);
            totalCarryingLM += (roomCarryingLM * qty);
            totalFurringLM += (roomFurringLM * qty);
            totalIntersections += (intersections * qty);

            // --- 2. CLADDING CALCULATION (Tiling Method) ---
            let pieces = 0;
            let fasteners = 0;

            if (typeData.type === 'sheet') {
                // Tiling: Rows * Cols
                // Size: w x l
                const cols = Math.ceil(W / typeData.w);
                const rows = Math.ceil(L / typeData.l);

                pieces = cols * rows;

                // Screws: Approx based on Furring length / spacing (e.g. 0.25m)
                // Metal Screws usage factor
                fasteners = Math.ceil(roomFurringLM / 0.25);

            } else if (typeData.type === 'panel') {
                // Strips / Panels (Spandrel / PVC)
                let panelW, panelL;

                if (typeKey === 'spandrel') {
                    panelW = config.spandrel_w;
                    panelL = config.spandrel_l;
                } else { // pvc
                    panelW = config.pvc_w;
                    panelL = config.pvc_l;
                }

                // Panels run along Length (L), so we count based on Width (W)
                const numStrips = Math.ceil(W / panelW);

                // Pieces per strip (based on L and PanelLength)
                const piecesPerStrip = Math.ceil(L / panelL);

                pieces = numStrips * piecesPerStrip;

                // Fasteners
                if (typeKey === 'spandrel') {
                    // Rivets: At intersections
                    fasteners = (numStrips * furringRuns) * 2;
                } else {
                    // PVC Clips
                    fasteners = numStrips * furringRuns;
                }
            }

            // Add to totals
            materials[typeKey] += (pieces * qty);
            materials[typeData.fastener] += (fasteners * qty);

            // --- 3. ACCESSORIES CALCULATION ---
            const area = L * W;

            if (typeKey === 'gypsum' || typeKey === 'hardiflex') {
                // Mesh Tape & Compound
                // Estimation: Tape ~1.5m per sqm of board area (joints + corners)
                materials.mesh_tape_m += (area * 1.5 * qty);
                // Compound: ~0.5kg - 0.8kg per sqm? Or 1 bag (20kg) covers 40sqm (approx 0.5kg/sqm).
                // Let's use 1 bag per 40sqm factor.
                materials.compound_bag += ((area / 40) * qty);

            } else if (typeKey === 'spandrel') {
                // Molding (J-Molding/End Trim) - Perimeter
                materials.spandrel_molding_lm += (perimeter * qty);

            } else if (typeKey === 'pvc') {
                // U-Molding - Perimeter
                materials.pvc_u_molding_lm += (perimeter * qty);

                // H-Clip (Joiner) - Only if panel length < room length (Needs splicing)
                // Logic: piecesPerStrip calculated earlier.
                // Assuming panels run along Length L.
                const panelL = config.pvc_l;
                const piecesPerStrip = Math.ceil(L / panelL);

                if (piecesPerStrip > 1) {
                    // Number of joints per strip = piecesPerStrip - 1
                    // Total Length of joiners = (Joints * Width of Strip) * Num Strips
                    // Actually, the joiner runs across the ROOM WIDTH (cutting across all strips), usually 1 continuous line or segmented.
                    // Total Joiner Length = (Number of joints along L) * Room Width W
                    const numJointsLong = piecesPerStrip - 1;
                    const totalJoinerLen = numJointsLong * W;
                    materials.pvc_h_clip_lm += (totalJoinerLen * qty);
                }
            }
        });

        // --- Hardware Totals ---
        const qtyWallAngle = Math.ceil(totalPerimeter / 3.0);
        const qtyCarrying = Math.ceil(totalCarryingLM / 5.0);
        const qtyFurring = Math.ceil(totalFurringLM / 5.0);
        const qtyWClips = totalIntersections;

        // Add framing rivets to the total rivets
        // 4 rivets per W-Clip
        const rivetsForFraming = qtyWClips * 4;
        materials['rivets'] += rivetsForFraming;


        // --- Cost Calculation ---
        const getItemTotal = (key, qty) => qty * (prices[key] || 0);

        const itemList = [];

        // 1. Boards/Panels
        if (materials.gypsum > 0) itemList.push({ name: MATERIAL_TYPES.gypsum.label, qty: materials.gypsum, unit: 'pcs', priceKey: 'gypsum', price: prices.gypsum, total: getItemTotal('gypsum', materials.gypsum) });
        if (materials.hardiflex > 0) itemList.push({ name: MATERIAL_TYPES.hardiflex.label, qty: materials.hardiflex, unit: 'pcs', priceKey: 'hardiflex', price: prices.hardiflex, total: getItemTotal('hardiflex', materials.hardiflex) });
        if (materials.plywood > 0) itemList.push({ name: MATERIAL_TYPES.plywood.label, qty: materials.plywood, unit: 'pcs', priceKey: 'plywood', price: prices.plywood, total: getItemTotal('plywood', materials.plywood) });
        if (materials.spandrel > 0) itemList.push({ name: `${MATERIAL_TYPES.spandrel.label} (${config.spandrel_l}m)`, qty: materials.spandrel, unit: 'pcs', priceKey: 'spandrel', price: prices.spandrel, total: getItemTotal('spandrel', materials.spandrel) });
        if (materials.pvc > 0) itemList.push({ name: `${MATERIAL_TYPES.pvc.label} (${config.pvc_l}m)`, qty: materials.pvc, unit: 'pcs', priceKey: 'pvc', price: prices.pvc, total: getItemTotal('pvc', materials.pvc) });

        // 2. Framing
        if (qtyWallAngle > 0) itemList.push({ name: "Wall Angle (3m)", qty: qtyWallAngle, unit: 'pcs', priceKey: 'wall_angle', price: prices.wall_angle, total: getItemTotal('wall_angle', qtyWallAngle) });
        if (qtyCarrying > 0) itemList.push({ name: "Carrying Channel (5m)", qty: qtyCarrying, unit: 'pcs', priceKey: 'carrying', price: prices.carrying, total: getItemTotal('carrying', qtyCarrying) });
        if (qtyFurring > 0) itemList.push({ name: "Metal Furring (5m)", qty: qtyFurring, unit: 'pcs', priceKey: 'furring', price: prices.furring, total: getItemTotal('furring', qtyFurring) });
        if (qtyWClips > 0) itemList.push({ name: "W-Clips", qty: qtyWClips, unit: 'pcs', priceKey: 'w_clip', price: prices.w_clip, total: getItemTotal('w_clip', qtyWClips) });

        // 3. Fasteners
        if (materials.screw_gypsum > 0) itemList.push({ name: "Gypsum Screws", qty: materials.screw_gypsum, unit: 'pcs', priceKey: 'screw_gypsum', price: prices.screw_gypsum, total: getItemTotal('screw_gypsum', materials.screw_gypsum) });
        if (materials.screw_hardiflex > 0) itemList.push({ name: "Hardiflex Screws", qty: materials.screw_hardiflex, unit: 'pcs', priceKey: 'screw_hardiflex', price: prices.screw_hardiflex, total: getItemTotal('screw_hardiflex', materials.screw_hardiflex) });
        if (materials.screw_metal > 0) itemList.push({ name: "Metal Screws (Plywood)", qty: materials.screw_metal, unit: 'pcs', priceKey: 'screw_metal', price: prices.screw_metal, total: getItemTotal('screw_metal', materials.screw_metal) });
        if (materials.rivets > 0) itemList.push({ name: "Blind Rivets", qty: materials.rivets, unit: 'pcs', priceKey: 'rivets', price: prices.rivets, total: getItemTotal('rivets', materials.rivets) });
        if (materials.clips > 0) itemList.push({ name: "PVC Clips + Screws", qty: materials.clips, unit: 'sets', priceKey: 'clips', price: prices.clips, total: getItemTotal('clips', materials.clips) });

        // 4. Accessories
        if (materials.mesh_tape_m > 0) {
            const rolls = Math.ceil(materials.mesh_tape_m / 75); // 75m roll
            itemList.push({ name: "Mesh Tape (75m Roll)", qty: rolls, unit: 'rolls', priceKey: 'mesh_tape', price: prices.mesh_tape, total: getItemTotal('mesh_tape', rolls) });
        }
        if (materials.compound_bag > 0) {
            const bags = Math.ceil(materials.compound_bag);
            itemList.push({ name: "Jointing Compound (20kg)", qty: bags, unit: 'pails', priceKey: 'jointing_compound', price: prices.jointing_compound, total: getItemTotal('jointing_compound', bags) });
        }
        if (materials.spandrel_molding_lm > 0) {
            const pcs = Math.ceil(materials.spandrel_molding_lm / 3.0); // 3m length
            itemList.push({ name: "Spandrel Molding / J-Trim (3m)", qty: pcs, unit: 'pcs', priceKey: 'spandrel_molding', price: prices.spandrel_molding, total: getItemTotal('spandrel_molding', pcs) });
        }
        if (materials.pvc_u_molding_lm > 0) {
            const pcs = Math.ceil(materials.pvc_u_molding_lm / 3.0);
            itemList.push({ name: "PVC U-Molding (3m)", qty: pcs, unit: 'pcs', priceKey: 'pvc_u_molding', price: prices.pvc_u_molding, total: getItemTotal('pvc_u_molding', pcs) });
        }
        if (materials.pvc_h_clip_lm > 0) {
            const pcs = Math.ceil(materials.pvc_h_clip_lm / 3.0);
            itemList.push({ name: "PVC H-Clip / Joiner (3m)", qty: pcs, unit: 'pcs', priceKey: 'pvc_h_clip', price: prices.pvc_h_clip, total: getItemTotal('pvc_h_clip', pcs) });
        }


        const grandTotal = itemList.reduce((acc, item) => acc + item.total, 0);

        setResult({
            items: itemList,
            total: grandTotal
        });
    };

    useEffect(() => {
        if (result) calculateMaterials();
    }, [prices, config]);


    return (
        <div className="space-y-6">
            <Card className="border-t-4 border-t-cyan-700 shadow-md">
                <div className="p-4 bg-cyan-50 border-b border-cyan-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="font-bold text-cyan-900 flex items-center gap-2">
                        <Settings size={18} /> Ceiling Configuration
                    </h2>
                    <button
                        onClick={handleAddRow}
                        className="flex items-center gap-1 px-4 py-2 bg-cyan-700 text-white rounded-md text-xs font-bold hover:bg-cyan-800 transition-colors active:scale-95 shadow-sm"
                    >
                        <PlusCircle size={14} /> Add Area
                    </button>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-lg min-w-[700px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[40px]">#</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[300px]">Type</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center w-[80px]">Qty</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center">Length (m)</th>
                                <th className="px-3 py-2 font-bold border border-slate-300 text-center">Width (m)</th>
                                <th className="px-2 py-2 font-bold border border-slate-300 text-center w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rooms.map((room, index) => (
                                <tr key={room.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 align-middle text-center text-xs text-gray-500 font-bold">{index + 1}</td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <select
                                            value={room.type}
                                            onChange={(e) => handleRoomChange(room.id, 'type', e.target.value)}
                                            className="w-full p-2 text-sm border border-gray-300 rounded font-medium bg-white focus:ring-2 focus:ring-cyan-400 outline-none text-slate-800"
                                        >
                                            {Object.entries(MATERIAL_TYPES).map(([key, data]) => (
                                                <option key={key} value={key}>{data.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput
                                            value={room.quantity}
                                            onChange={(val) => handleRoomChange(room.id, 'quantity', val)}
                                            min="1" step="1" className="font-bold"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput
                                            value={room.length_m}
                                            onChange={(val) => handleRoomChange(room.id, 'length_m', val)}
                                            placeholder="Room Length"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle">
                                        <TableNumberInput
                                            value={room.width_m}
                                            onChange={(val) => handleRoomChange(room.id, 'width_m', val)}
                                            placeholder="Room Width"
                                        />
                                    </td>
                                    <td className="p-2 border border-slate-300 align-middle text-center">
                                        <button
                                            onClick={() => handleRemoveRow(room.id)}
                                            disabled={rooms.length === 1}
                                            className={`p-2 rounded-full transition-colors ${rooms.length > 1 ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Configuration Panel for Panels */}
                <div className="px-6 pb-4 flex flex-col gap-2 text-xs text-gray-500">
                    <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="font-bold uppercase flex items-center gap-1 text-slate-600"><Info size={14} /> Settings:</span>
                        <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">Spandrel Size:</span>
                            <input type="number" step="0.01" value={config.spandrel_w} onChange={(e) => setConfig({ ...config, spandrel_w: parseFloat(e.target.value) })} className="w-16 p-1 border rounded text-center" />
                            <span className="text-gray-400">x</span>
                            <input type="number" step="0.1" value={config.spandrel_l} onChange={(e) => setConfig({ ...config, spandrel_l: parseFloat(e.target.value) })} className="w-16 p-1 border rounded text-center" />
                            <span className="text-gray-400">m</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300 mx-2 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">PVC Size:</span>
                            <input type="number" step="0.01" value={config.pvc_w} onChange={(e) => setConfig({ ...config, pvc_w: parseFloat(e.target.value) })} className="w-16 p-1 border rounded text-center" />
                            <span className="text-gray-400">x</span>
                            <input type="number" step="0.1" value={config.pvc_l} onChange={(e) => setConfig({ ...config, pvc_l: parseFloat(e.target.value) })} className="w-16 p-1 border rounded text-center" />
                            <span className="text-gray-400">m</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border-t border-red-200 text-red-700 text-sm font-medium flex items-center justify-center gap-2 animate-pulse">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button onClick={calculateMaterials} className="w-full md:w-auto px-8 py-3 bg-cyan-700 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-all hover:bg-cyan-800 uppercase tracking-wider text-sm flex items-center justify-center gap-2 min-w-[200px]">
                        <Calculator size={18} /> Calculate
                    </button>
                </div>
            </Card>

            {result && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-md border-l-4 border-l-cyan-700">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                                    Result
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Material Estimation (Tiling Method)
                                </p>
                            </div>
                            <div className="text-left md:text-right bg-cyan-50 px-5 py-3 rounded-xl border border-cyan-100">
                                <p className="text-xs text-cyan-800 font-bold uppercase tracking-wide mb-1">Estimated Cost</p>
                                <p className="font-bold text-4xl text-cyan-700 tracking-tight">₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex justify-end gap-2 mb-4">
                            <button
                                onClick={() => copyToClipboard(result.items)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                                title="Copy table to clipboard"
                            >
                                <ClipboardCopy size={14} /> Copy
                            </button>
                            <button
                                onClick={() => downloadCSV(result.items, 'ceiling_estimation.csv')}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                                title="Download as CSV"
                            >
                                <Download size={14} /> CSV
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">Material</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3 text-center">Unit</th>
                                        <th className="px-4 py-3 text-right w-[140px]">Unit Price</th>
                                        <th className="px-4 py-3 text-right bg-gray-100/50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-800 font-medium">{item.qty.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-500">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <TablePriceInput
                                                    value={prices[item.priceKey]}
                                                    onChange={(val) => setPrices({ ...prices, [item.priceKey]: val })}
                                                />
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
                    <Cloud size={32} className="text-cyan-600 mb-4" />
                    <p className="font-medium text-center">
                        Select material type and enter room dimensions to calculate.
                    </p>
                </div>
            )}
        </div>
    );
}
