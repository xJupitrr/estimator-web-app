import React, { useMemo, useState } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Scissors, Download, Printer, Info, AlertCircle, ChevronDown, ChevronUp, RefreshCw, Layers } from 'lucide-react';
import { TABLE_UI, CARD_UI } from '../../constants/designSystem';
import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';
import { downloadCSV } from '../../utils/export';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BEND_COLORS = {
    10: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50', border: 'border-blue-200' },
    12: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-200' },
    16: { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50', border: 'border-orange-200' },
    20: { bg: 'bg-violet-500', text: 'text-violet-700', light: 'bg-violet-50', border: 'border-violet-200' },
    25: { bg: 'bg-rose-500', text: 'text-rose-700', light: 'bg-rose-50', border: 'border-rose-200' },
    default: { bg: 'bg-zinc-500', text: 'text-zinc-700', light: 'bg-zinc-50', border: 'border-zinc-200' },
};

const MODULES = [
    { key: 'footing', label: 'RC Footing', color: 'emerald', storageKey: 'footing_rows', pricesKey: 'footing_prices', type: 'footing' },
    { key: 'column', label: 'RC Column', color: 'indigo', storageKey: 'column_elements', type: 'column' },
    { key: 'beam', label: 'RC Beam', color: 'violet', storageKey: 'beam_elements', type: 'beam' },
    { key: 'lintel', label: 'Lintel Beams', color: 'teal', storageKey: null, specsKey: 'lintelbeam_specs', type: 'lintel' },
    { key: 'slab_grade', label: 'Slab on Grade', color: 'cyan', storageKey: 'slab_rows', type: 'slab_grade' },
    { key: 'suspended', label: 'Suspended Slab', color: 'purple', storageKey: 'suspended_slab_rows', type: 'suspended' },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — parse all stored rebar cuts into a unified flat schedule
// ─────────────────────────────────────────────────────────────────────────────

/** Parse "10mm x 6.0m" → { diameter: 10, stockLength: 6.0 } */
const parseSpec = (spec) => {
    if (!spec) return null;
    const m = spec.match(/(\d+)mm\s*x\s*([\d.]+)m?/);
    if (!m) return null;
    return { diameter: parseInt(m[1]), stockLength: parseFloat(m[2]) };
};

/** Parse SKU id "10_6.0" → { diameter: 10, stockLength: 6.0 } */
const parseSku = (sku) => {
    if (!sku) return null;
    const parts = sku.split('_').map(Number);
    if (parts.length < 2 || isNaN(parts[0])) return null;
    return { diameter: parts[0], stockLength: parts[1] };
};

const L_ANCHOR = 40; // 40d anchor/development length
const BEARING = 0.20;  // lintel bearing each side
const COVER = 0.04;    // concrete cover for ties

/**
 * Build a unified rebar schedule entry list from all calculator localStorage data.
 * Returns: Array<{ module, moduleColor, label, diameter, stockLength, cutLength, quantity, bendType, hookLength }>
 */
const buildSchedule = (data) => {
    const entries = [];
    let seqId = 1;

    const push = (module, moduleColor, label, diameter, stockLength, cutLength, quantity, bendType = 'Straight', hookLength = 0) => {
        if (!diameter || !stockLength || cutLength <= 0 || quantity <= 0) return;
        entries.push({
            id: seqId++,
            module,
            moduleColor,
            label,
            diameter,
            stockLength,
            cutLength: Math.round(cutLength * 1000) / 1000,
            quantity: Math.ceil(quantity),
            bendType,
            hookLength: Math.round(hookLength * 1000) / 1000,
            totalLength: Math.round(cutLength * quantity * 1000) / 1000,
        });
    };

    // ── RC FOOTING ──────────────────────────────────────────────────────────
    const footings = data.footing_rows || [];
    footings.forEach((f, i) => {
        if (f.isExcluded) return;
        const Q = parseFloat(f.quantity) || 0;
        const X = parseFloat(f.x_len) || 0;
        const Y = parseFloat(f.y_len) || 0;
        if (X <= 0 || Y <= 0 || Q <= 0) return;

        const spec = parseSpec(f.rebarSpec || '12mm x 6.0m');
        if (!spec) return;
        const { diameter, stockLength } = spec;
        const hookLen = 0.1; // 100mm std hook
        const label = f.description || `FTG-${i + 1}`;
        const cntX = parseInt(f.rebar_x_count) || 0;
        const cntY = parseInt(f.rebar_y_count) || 0;

        if (cntX > 0) push('RC Footing', 'emerald', `${label} (Along X)`, diameter, stockLength, X + 2 * hookLen, cntX * Q, '180° Hook', hookLen);
        if (cntY > 0) push('RC Footing', 'emerald', `${label} (Along Y)`, diameter, stockLength, Y + 2 * hookLen, cntY * Q, '180° Hook', hookLen);
    });

    // ── RC COLUMN ───────────────────────────────────────────────────────────
    const columns = data.column_elements || [];
    columns.forEach((col, i) => {
        if (col.isExcluded) return;
        const qty = parseInt(col.quantity) || 1;
        const H = parseFloat(col.height_m) || 0;
        const L = parseFloat(col.length_m) || 0;
        const W = parseFloat(col.width_m) || 0;
        if (H <= 0 || L <= 0 || W <= 0) return;
        const label = `COL-${i + 1}`;

        // Main bars
        (col.main_rebar_cuts || []).forEach((cut) => {
            const sku = parseSku(cut.sku);
            if (!sku) return;
            const count = parseInt(cut.quantity) || 0;
            const customLen = parseFloat(cut.length) || 0;
            const anchorLen = (L_ANCHOR * sku.diameter) / 1000;
            const cutLen = customLen > 0 ? customLen : H + anchorLen;
            push('RC Column', 'indigo', `${label} Main Bars`, sku.diameter, sku.stockLength, cutLen, count * qty, 'Straight + Hook', anchorLen);
        });

        // Ties
        if (col.tie_bar_sku && col.tie_spacing_mm) {
            const sku = parseSku(col.tie_bar_sku);
            if (sku) {
                const spacing = parseFloat(col.tie_spacing_mm) / 1000;
                const numTies = spacing > 0 ? (Math.ceil(H / spacing) + 1) : 0;
                const tieDia_m = sku.diameter / 1000;
                const L_tie = L - (2 * COVER);
                const W_tie = W - (2 * COVER);
                const hookLen = Math.max(12 * tieDia_m, 0.075);
                const tieCutLen = 2 * (L_tie + W_tie) + 2 * hookLen;
                push('RC Column', 'indigo', `${label} Ties/Stirrups`, sku.diameter, sku.stockLength, tieCutLen, numTies * qty, '135° Stirrup', hookLen);
            }
        }
    });

    // ── RC BEAM ─────────────────────────────────────────────────────────────
    const beams = data.beam_elements || [];
    beams.forEach((beam, i) => {
        if (beam.isExcluded) return;
        const qty = parseInt(beam.quantity) || 1;
        const L = parseFloat(beam.height_m) || 0; // height_m = beam LENGTH
        const B = parseFloat(beam.length_m) || 0; // length_m = beam WIDTH (B)
        const H = parseFloat(beam.width_m) || 0;  // width_m = beam DEPTH (H)
        if (L <= 0 || B <= 0 || H <= 0) return;
        const label = `BM-${i + 1}`;

        // Main bars
        (beam.main_rebar_cuts || []).forEach((cut) => {
            const sku = parseSku(cut.sku);
            if (!sku) return;
            const count = parseInt(cut.quantity) || 0;
            const anchorLen = (L_ANCHOR * sku.diameter) / 1000;
            const cutLen = L + 2 * anchorLen;
            push('RC Beam', 'violet', `${label} Main Bars`, sku.diameter, sku.stockLength, cutLen, count * qty, 'Straight + Hook', anchorLen);
        });

        // Cut support bars (top at support)
        (beam.cut_support_cuts || []).forEach((cut) => {
            const sku = parseSku(cut.sku);
            if (!sku) return;
            const count = parseInt(cut.quantity) || 0;
            const anchorLen = (L_ANCHOR * sku.diameter) / 1000;
            const cutLen = H * 0.3 + 2 * anchorLen;
            push('RC Beam', 'violet', `${label} Support Bars`, sku.diameter, sku.stockLength, cutLen, count * qty, 'Truss Bar', anchorLen);
        });

        // Cut midspan bars (bottom at midspan)
        (beam.cut_midspan_cuts || []).forEach((cut) => {
            const sku = parseSku(cut.sku);
            if (!sku) return;
            const count = parseInt(cut.quantity) || 0;
            const anchorLen = (L_ANCHOR * sku.diameter) / 1000;
            const cutLen = H * 0.4 + 2 * anchorLen;
            push('RC Beam', 'violet', `${label} Midspan Bars`, sku.diameter, sku.stockLength, cutLen, count * qty, 'Truss Bar', anchorLen);
        });

        // Ties/Stirrups
        if (beam.tie_bar_sku && beam.tie_spacing_mm) {
            const sku = parseSku(beam.tie_bar_sku);
            if (sku) {
                const spacing = parseFloat(beam.tie_spacing_mm) / 1000;
                const numTies = spacing > 0 ? (Math.ceil(L / spacing) + 1) : 0;
                const tieDia_m = sku.diameter / 1000;
                const H_tie = H - 2 * COVER;
                const B_tie = B - 2 * COVER;
                const hookLen = Math.max(12 * tieDia_m, 0.075);
                const tieCutLen = 2 * (H_tie + B_tie) + 2 * hookLen;
                push('RC Beam', 'violet', `${label} Stirrups`, sku.diameter, sku.stockLength, tieCutLen, numTies * qty, '135° Stirrup', hookLen);
            }
        }
    });

    // ── LINTEL BEAM ─────────────────────────────────────────────────────────
    const lintelSpecs = data.lintelbeam_specs;
    const doorsWindows = data.doorswindows_rows || [];
    if (lintelSpecs && lintelSpecs.mainBarSku && doorsWindows.length > 0) {
        const mainSku = parseSku(lintelSpecs.mainBarSku);
        const tieSku = parseSku(lintelSpecs.tieSku);
        const mainCount = parseInt(lintelSpecs.mainBarCount) || 2;
        const tieSpacingMM = parseFloat(lintelSpecs.tieSpacing) || 150;
        const depth = parseFloat(lintelSpecs.lintelDepth) || 0.15;
        const height = parseFloat(lintelSpecs.lintelHeight) || 0.20;

        doorsWindows.filter(dw => dw.width_m && dw.height_m).forEach((dw, i) => {
            const qty = parseInt(dw.quantity) || 1;
            const lintelLen = parseFloat(dw.width_m) + 2 * BEARING;
            const label = `LB-${i + 1} (${dw.itemType || 'Opening'})`;

            if (mainSku) {
                const anchorLen = (L_ANCHOR * mainSku.diameter) / 1000;
                push('Lintel Beam', 'teal', `${label} Main Bars`, mainSku.diameter, mainSku.stockLength, lintelLen + 2 * anchorLen, mainCount * qty, 'Straight + Hook', anchorLen);
            }

            if (tieSku) {
                const spacing = tieSpacingMM / 1000;
                const numTies = spacing > 0 ? (Math.ceil(lintelLen / spacing) + 1) : 0;
                const tieDia_m = tieSku.diameter / 1000;
                const H_tie = height - 2 * 0.025;
                const D_tie = depth - 2 * 0.025;
                const hookLen = Math.max(12 * tieDia_m, 0.075);
                const tieCutLen = 2 * (H_tie + D_tie) + 2 * hookLen;
                push('Lintel Beam', 'teal', `${label} Ties`, tieSku.diameter, tieSku.stockLength, tieCutLen, numTies * qty, '135° Stirrup', hookLen);
            }
        });
    }

    // ── SLAB ON GRADE — splice-aware ──────────────────────────────────────
    const slabRows = data.slab_rows || [];
    slabRows.forEach((slab, i) => {
        if (slab.isExcluded) return;
        const qty = parseInt(slab.quantity) || 1;
        const length = parseFloat(slab.length) || 0;
        const width = parseFloat(slab.width) || 0;
        const spacing = parseFloat(slab.spacing) || 0.40;
        if (length <= 0 || width <= 0 || !slab.barSize) return;

        const spec = parseSpec(slab.barSize);
        if (!spec) return;
        const { diameter, stockLength } = spec;
        const spliceLen = 40 * (diameter / 1000); // 40d lap
        const label = slab.description || `SOG-${i + 1}`;

        const numAlongWidth = spacing > 0 ? Math.ceil(width / spacing) + 1 : 0;
        const numAlongLength = spacing > 0 ? Math.ceil(length / spacing) + 1 : 0;

        // Emit actual physical cut lengths respecting the commercial bar length
        const pushSogCuts = (span, count, direction) => {
            if (span <= 0 || count <= 0) return;
            const totalCount = count * qty;

            if (span <= stockLength) {
                // Single straight cut — no splice needed
                entries.push({
                    id: seqId++, module: 'Slab on Grade', moduleColor: 'cyan',
                    label: `${label} (${direction})`,
                    diameter, stockLength,
                    cutLength: Math.round(span * 1000) / 1000,
                    quantity: totalCount,
                    bendType: 'Straight', hookLength: 0, spliced: false,
                    totalLength: Math.round(span * totalCount * 1000) / 1000,
                });
            } else {
                // Splice required — break into full-bar cuts + tail cut
                const effectivePerBar = stockLength - spliceLen;
                if (effectivePerBar <= 0) return;
                const additionalFullBars = Math.floor((span - stockLength) / effectivePerBar);
                const numFullBars = 1 + additionalFullBars;
                const coveredByFull = stockLength + additionalFullBars * effectivePerBar;
                const rawTail = span - coveredByFull;
                const tailCutLen = rawTail > 0.05 ? rawTail + spliceLen : 0;

                entries.push({
                    id: seqId++, module: 'Slab on Grade', moduleColor: 'cyan',
                    label: `${label} ${direction} — Full Bar (${stockLength}m, 40d lap)`,
                    diameter, stockLength,
                    cutLength: stockLength,
                    quantity: numFullBars * totalCount,
                    bendType: 'Straight', hookLength: 0, spliced: true,
                    totalLength: Math.round(stockLength * numFullBars * totalCount * 1000) / 1000,
                });
                if (tailCutLen > 0.05) {
                    entries.push({
                        id: seqId++, module: 'Slab on Grade', moduleColor: 'cyan',
                        label: `${label} ${direction} — Tail Cut`,
                        diameter, stockLength,
                        cutLength: Math.round(tailCutLen * 1000) / 1000,
                        quantity: totalCount,
                        bendType: 'Straight', hookLength: 0, spliced: true,
                        totalLength: Math.round(tailCutLen * totalCount * 1000) / 1000,
                    });
                }
            }
        };

        pushSogCuts(length, numAlongWidth, 'Along Length');
        pushSogCuts(width, numAlongLength, 'Along Width');
    });

    // ── SUSPENDED SLAB ──────────────────────────────────────────────────────
    const suspRows = data.suspended_slab_rows || [];
    suspRows.forEach((slab, i) => {
        if (slab.isExcluded) return;
        const qty = parseInt(slab.quantity) || 1;
        const L = parseFloat(slab.length_m) || 0;
        const W = parseFloat(slab.width_m) || 0;
        if (L <= 0 || W <= 0) return;
        const label = slab.description || `SS-${i + 1}`;

        const processRebarSpec = (spec, direction, span, count) => {
            const parsed = parseSpec(spec);
            if (!parsed || count <= 0) return;
            const { diameter, stockLength } = parsed;
            const anchorLen = (L_ANCHOR * diameter) / 1000;
            // Main bottom bars: span + 2 anchor
            push('Suspended Slab', 'purple', `${label} ${direction} Bottom`, diameter, stockLength, span + 2 * anchorLen, count * qty, 'Straight + Hook', anchorLen);
        };

        if (slab.short_main_spec) processRebarSpec(slab.short_main_spec, 'Short (Main)', Math.min(L, W), parseInt(slab.short_main_count) || 0);
        if (slab.long_dist_spec) processRebarSpec(slab.long_dist_spec, 'Long (Dist)', Math.max(L, W), parseInt(slab.long_dist_count) || 0);
        if (slab.top_short_spec) processRebarSpec(slab.top_short_spec, 'Top Short', Math.min(L, W) * 0.3, parseInt(slab.top_short_count) || 0);
        if (slab.top_long_spec) processRebarSpec(slab.top_long_spec, 'Top Long', Math.max(L, W) * 0.3, parseInt(slab.top_long_count) || 0);
    });

    return entries;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Visual bar diagram */
const BarDiagram = ({ entry }) => {
    const { cutLength, hookLength, bendType, diameter, stockLength } = entry;
    const totalBar = cutLength;
    const straightLen = totalBar - (2 * (hookLength || 0));
    const isStirrup = bendType?.includes('Stirrup');
    const hasHook = hookLength > 0 && !isStirrup;

    const colors = BEND_COLORS[diameter] || BEND_COLORS.default;

    return (
        <div className="flex items-center gap-2 my-1">
            <div className="flex items-center gap-0 h-5 flex-1 max-w-[200px]">
                {/* Left hook */}
                {hasHook && (
                    <div className={`h-full w-3 ${colors.bg} rounded-l-sm opacity-70 border-r border-white/30 flex-shrink-0`} title={`Hook: ${hookLength}m`} />
                )}
                {isStirrup && (
                    <div className={`h-full w-3 ${colors.bg} rounded-l-sm opacity-80 border-r border-white/30 flex-shrink-0`} />
                )}
                {/* Main body */}
                <div
                    className={`h-full ${colors.bg} flex-1 flex items-center justify-center overflow-hidden`}
                    title={`Straight: ${straightLen.toFixed(3)}m`}
                >
                    <span className="text-white text-[9px] font-mono px-1 truncate">{cutLength.toFixed(3)}m</span>
                </div>
                {/* Right hook */}
                {hasHook && (
                    <div className={`h-full w-3 ${colors.bg} rounded-r-sm opacity-70 border-l border-white/30 flex-shrink-0`} title={`Hook: ${hookLength}m`} />
                )}
                {isStirrup && (
                    <div className={`h-full w-3 ${colors.bg} rounded-r-sm opacity-80 border-l border-white/30 flex-shrink-0`} />
                )}
            </div>
            <span className="text-[10px] font-mono text-zinc-400 whitespace-nowrap">{stockLength}m bar</span>
        </div>
    );
};

/** Summary stat box */
const StatBox = ({ label, value, unit, colorClass }) => (
    <div className={`flex flex-col px-4 py-3 rounded-lg border ${colorClass || 'bg-zinc-50 border-zinc-200'}`}>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{label}</span>
        <span className="text-lg font-bold text-zinc-800 tabular-nums">{value} <span className="text-xs font-normal text-zinc-400">{unit}</span></span>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function RebarSchedule() {
    // Read from all relevant localStorage keys
    const [footingRows] = useLocalStorage('footing_rows', []);
    const [columnElements] = useLocalStorage('column_elements', []);
    const [beamElements] = useLocalStorage('beam_elements', []);
    const [lintelSpecs] = useLocalStorage('lintelbeam_specs', null);
    const [doorsWindowsRows] = useLocalStorage('doorswindows_rows', []);
    const [slabRows] = useLocalStorage('slab_rows', []);
    const [suspendedRows] = useLocalStorage('suspended_slab_rows', []);

    const [expandedModules, setExpandedModules] = useState({});
    const [groupBy, setGroupBy] = useState('module'); // 'module' | 'diameter'
    const [filterDiameter, setFilterDiameter] = useState('all');
    const [filterModule, setFilterModule] = useState('all');
    const [refreshKey, setRefreshKey] = useState(0);

    // Aggregate all data
    const allData = useMemo(() => ({
        footing_rows: footingRows,
        column_elements: columnElements,
        beam_elements: beamElements,
        lintelbeam_specs: lintelSpecs,
        doorswindows_rows: doorsWindowsRows,
        slab_rows: slabRows,
        suspended_slab_rows: suspendedRows,
    }), [footingRows, columnElements, beamElements, lintelSpecs, doorsWindowsRows, slabRows, suspendedRows, refreshKey]);

    const schedule = useMemo(() => buildSchedule(allData), [allData]);

    // Filter
    const filtered = useMemo(() => schedule.filter(e => {
        if (filterDiameter !== 'all' && e.diameter !== parseInt(filterDiameter)) return false;
        if (filterModule !== 'all' && e.module !== filterModule) return false;
        return true;
    }), [schedule, filterDiameter, filterModule]);

    // Stats
    const stats = useMemo(() => {
        const totalBars = filtered.reduce((a, e) => a + e.quantity, 0);
        const totalLength = filtered.reduce((a, e) => a + e.totalLength, 0);
        const byDiameter = {};
        filtered.forEach(e => {
            if (!byDiameter[e.diameter]) byDiameter[e.diameter] = { bars: 0, length: 0, weight: 0 };
            const w = (Math.PI / 4) * Math.pow(e.diameter / 1000, 2) * 7850; // kg/m
            byDiameter[e.diameter].bars += e.quantity;
            byDiameter[e.diameter].length += e.totalLength;
            byDiameter[e.diameter].weight += e.cutLength * e.quantity * w;
        });
        const totalWeight = Object.values(byDiameter).reduce((a, d) => a + d.weight, 0);
        return { totalBars, totalLength, totalWeight, byDiameter };
    }, [filtered]);

    // Group
    const grouped = useMemo(() => {
        const groups = {};
        filtered.forEach(e => {
            const key = groupBy === 'diameter' ? `${e.diameter}mm` : e.module;
            if (!groups[key]) groups[key] = { label: key, color: e.moduleColor, entries: [] };
            groups[key].entries.push(e);
        });
        return Object.values(groups).sort((a, b) => {
            if (groupBy === 'diameter') return parseInt(a.label) - parseInt(b.label);
            return a.label.localeCompare(b.label);
        });
    }, [filtered, groupBy]);

    const allModules = useMemo(() => [...new Set(schedule.map(e => e.module))], [schedule]);
    const allDiameters = useMemo(() => [...new Set(schedule.map(e => e.diameter))].sort((a, b) => a - b), [schedule]);

    const toggleModule = (key) => setExpandedModules(prev => ({ ...prev, [key]: !prev[key] }));

    const handleExport = () => {
        const items = filtered.map(e => ({
            name: `[${e.module}] ${e.label} — ∅${e.diameter}mm × ${e.cutLength}m`,
            qty: e.quantity,
            unit: 'pcs',
            price: 0,
            total: 0,
        }));
        downloadCSV(items, 'rebar_bending_schedule.csv');
    };

    const isEmpty = schedule.length === 0;

    return (
        <div className="space-y-6 print:space-y-4">
            {/* ── HEADER ── */}
            <Card className="border-t-4 border-t-zinc-800 shadow-md">
                <SectionHeader
                    title="Schedule of Rebar Bends (BBS)"
                    icon={Scissors}
                    colorTheme="zinc"
                    description="Aggregated bar bending schedule from all structural calculators"
                    actions={
                        <div className="flex items-center gap-2 no-print">
                            <button
                                onClick={() => setRefreshKey(k => k + 1)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-600 bg-white border border-zinc-300 rounded hover:bg-zinc-50 transition-colors"
                                title="Refresh from calculators"
                            >
                                <RefreshCw size={13} /> Refresh
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-600 bg-white border border-zinc-300 rounded hover:bg-zinc-50 transition-colors"
                            >
                                <Download size={13} /> CSV
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-zinc-800 rounded hover:bg-zinc-900 transition-colors"
                            >
                                <Printer size={13} /> Print
                            </button>
                        </div>
                    }
                />

                {/* Stats row */}
                {!isEmpty && (
                    <div className="px-4 pb-4 flex flex-wrap gap-3">
                        <StatBox label="Total Bars" value={stats.totalBars.toLocaleString()} unit="pcs" colorClass="bg-zinc-50 border-zinc-200" />
                        <StatBox label="Total Cut Length" value={stats.totalLength.toFixed(1)} unit="m" colorClass="bg-blue-50 border-blue-200" />
                        <StatBox label="Est. Total Weight" value={stats.totalWeight.toFixed(1)} unit="kg" colorClass="bg-amber-50 border-amber-200" />
                        {Object.entries(stats.byDiameter).map(([dia, d]) => {
                            const colors = BEND_COLORS[parseInt(dia)] || BEND_COLORS.default;
                            return (
                                <StatBox
                                    key={dia}
                                    label={`∅${dia}mm`}
                                    value={d.bars.toLocaleString()}
                                    unit={`pcs · ${d.weight.toFixed(0)}kg`}
                                    colorClass={`${colors.light} ${colors.border} border`}
                                />
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* ── FILTERS & CONTROLS ── */}
            {!isEmpty && (
                <Card className="no-print">
                    <div className="p-4 flex flex-wrap gap-4 items-end">
                        {/* Group By */}
                        <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">Group By</label>
                            <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-xs font-bold">
                                {['module', 'diameter'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setGroupBy(opt)}
                                        className={`px-4 py-2 transition-colors capitalize ${groupBy === opt ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filter by Diameter */}
                        <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">Filter Diameter</label>
                            <select
                                value={filterDiameter}
                                onChange={e => setFilterDiameter(e.target.value)}
                                className="px-3 py-2 text-xs border border-zinc-200 rounded-lg bg-white focus:ring-2 focus:ring-zinc-400 outline-none"
                            >
                                <option value="all">All Diameters</option>
                                {allDiameters.map(d => <option key={d} value={d}>∅{d}mm</option>)}
                            </select>
                        </div>

                        {/* Filter by Module */}
                        <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">Filter Module</label>
                            <select
                                value={filterModule}
                                onChange={e => setFilterModule(e.target.value)}
                                className="px-3 py-2 text-xs border border-zinc-200 rounded-lg bg-white focus:ring-2 focus:ring-zinc-400 outline-none"
                            >
                                <option value="all">All Modules</option>
                                {allModules.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div className="ml-auto text-right text-xs text-zinc-400">
                            <span className="font-mono">{filtered.length} bar types</span>
                        </div>
                    </div>
                </Card>
            )}

            {/* ── EMPTY STATE ── */}
            {isEmpty && (
                <div className="border-2 border-dashed border-zinc-300 rounded-xl p-16 flex flex-col items-center justify-center text-center text-zinc-400 bg-zinc-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Scissors size={40} className="text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-600 mb-1">No Rebar Data Yet</h3>
                    <p className="max-w-md text-sm">
                        Add rebar inputs in the <span className="font-bold text-zinc-700">Footing, Column, Beam, Lintel Beam, Slab on Grade,</span> or <span className="font-bold text-zinc-700">Suspended Slab</span> tabs, then return here to see the full Bar Bending Schedule.
                    </p>
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                        {MODULES.map(m => (
                            <div key={m.key} className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-zinc-200 text-zinc-500">
                                <div className={`w-2 h-2 rounded-full bg-${m.color}-400 flex-shrink-0`} />
                                {m.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── GROUPED SCHEDULE ── */}
            {grouped.map((group) => {
                const isExpanded = expandedModules[group.label] !== false; // default open
                const groupColors = BEND_COLORS[parseInt(group.label)] || BEND_COLORS.default;
                const groupWeight = group.entries.reduce((a, e) => {
                    const w = (Math.PI / 4) * Math.pow(e.diameter / 1000, 2) * 7850;
                    return a + e.cutLength * e.quantity * w;
                }, 0);

                return (
                    <Card key={group.label} className={`shadow-sm overflow-hidden border-l-4 border-l-${group.color || 'zinc'}-500`}>
                        {/* Group Header */}
                        <button
                            onClick={() => toggleModule(group.label)}
                            className="w-full flex items-center justify-between px-5 py-3.5 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full bg-${group.color || 'zinc'}-500`} />
                                <span className="font-bold text-zinc-800 uppercase tracking-wide text-sm">{group.label}</span>
                                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded-full">{group.entries.length} types · {group.entries.reduce((a, e) => a + e.quantity, 0)} pcs</span>
                                <span className="text-[10px] font-mono text-zinc-500">~{groupWeight.toFixed(1)} kg</span>
                            </div>
                            {isExpanded ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
                        </button>

                        {/* Group Table */}
                        {isExpanded && (
                            <div className={TABLE_UI.CONTAINER} style={{ borderRadius: 0, margin: 0, border: 'none' }}>
                                <table className={TABLE_UI.TABLE}>
                                    <thead className="bg-zinc-100 border-b border-zinc-200 print:bg-zinc-100">
                                        <tr>
                                            <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center w-10">#</th>
                                            <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-left">Element / Label</th>
                                            <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Dia.</th>
                                            <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Bend Type</th>
                                            <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Diagram</th>
                                            <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Cut Length</th>
                                            <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Hook</th>
                                            <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Stock Bar</th>
                                            <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Qty</th>
                                            <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right bg-zinc-200/50">Total Length</th>
                                            <th className="px-3 py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Est. Weight</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {group.entries.map((entry, idx) => {
                                            const colors = BEND_COLORS[entry.diameter] || BEND_COLORS.default;
                                            const weight = (Math.PI / 4) * Math.pow(entry.diameter / 1000, 2) * 7850 * entry.cutLength * entry.quantity;
                                            return (
                                                <tr key={entry.id} className="hover:bg-zinc-50/50 transition-colors">
                                                    <td className="px-3 py-2 text-[10px] font-mono text-zinc-400 text-center">{idx + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <div className="text-xs font-semibold text-zinc-700">{entry.label}</div>
                                                        <div className="text-[10px] text-zinc-400 font-mono">{entry.module}</div>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.bg} text-white`}>
                                                            ∅{entry.diameter}mm
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${colors.border} ${colors.light} ${colors.text}`}>
                                                            {entry.bendType}
                                                        </span>
                                                        {entry.spliced && (
                                                            <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 rounded-full">SPLICED</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 min-w-[160px]">
                                                        <BarDiagram entry={entry} />
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-mono text-xs font-bold text-zinc-800">
                                                        {entry.cutLength.toFixed(3)} m
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-mono text-[11px] text-zinc-500">
                                                        {entry.hookLength > 0 ? `${(entry.hookLength * 1000).toFixed(0)}mm` : '—'}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-mono text-[11px] text-zinc-500">
                                                        {entry.stockLength}m
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-bold text-sm text-zinc-900">
                                                        {entry.quantity.toLocaleString()}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-mono text-xs bg-zinc-50/50 text-zinc-700">
                                                        {entry.totalLength.toFixed(2)} m
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-mono text-[11px] text-zinc-500">
                                                        {weight.toFixed(1)} kg
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    {/* Group subtotal */}
                                    <tfoot className="bg-zinc-100 border-t-2 border-zinc-300">
                                        <tr>
                                            <td colSpan={8} className="px-3 py-2 text-xs font-bold text-zinc-600 uppercase tracking-wide text-right">
                                                Group Total:
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-sm text-zinc-900">
                                                {group.entries.reduce((a, e) => a + e.quantity, 0).toLocaleString()} pcs
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-xs font-bold text-zinc-800 bg-zinc-200/50">
                                                {group.entries.reduce((a, e) => a + e.totalLength, 0).toFixed(2)} m
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-xs font-bold text-zinc-700">
                                                {groupWeight.toFixed(1)} kg
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </Card>
                );
            })}

            {/* ── GRAND TOTAL ── */}
            {!isEmpty && filtered.length > 0 && (
                <Card className="shadow-md border-l-4 border-l-zinc-800">
                    <div className="p-5 flex flex-wrap gap-4 items-center justify-between">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">Grand Totals (All Rebar)</p>
                            <p className="text-2xl font-bold text-zinc-900 tabular-nums">
                                {stats.totalBars.toLocaleString()} <span className="text-sm font-normal text-zinc-400">pcs</span>
                                <span className="mx-3 text-zinc-300">·</span>
                                {stats.totalLength.toFixed(1)} <span className="text-sm font-normal text-zinc-400">m</span>
                                <span className="mx-3 text-zinc-300">·</span>
                                {stats.totalWeight.toFixed(1)} <span className="text-sm font-normal text-zinc-400">kg</span>
                            </p>
                        </div>
                        <div className="flex items-start gap-2 text-zinc-400 max-w-sm">
                            <Info size={14} className="flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] italic leading-relaxed">Weight calculated using steel density 7850 kg/m³ and circular section. Quantities are rounded up. Development/anchorage lengths use 40d. Run calculations in each module tab first to populate data.</p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
