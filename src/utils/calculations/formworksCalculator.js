
import { MATERIAL_DEFAULTS } from '../../constants/materials';

export const DEFAULT_PRICES = {
    plywood_phenolic_1_2: MATERIAL_DEFAULTS.plywood_phenolic_1_2.price,
    plywood_phenolic_3_4: MATERIAL_DEFAULTS.plywood_phenolic_3_4.price,
    plywood_marine_1_2: MATERIAL_DEFAULTS.plywood_marine_1_2.price,
    lumber_2x2: MATERIAL_DEFAULTS.lumber_2x2.price,
    lumber_2x3: MATERIAL_DEFAULTS.lumber_2x3.price,
    lumber_2x4: MATERIAL_DEFAULTS.lumber_2x4.price,
    common_nails_kg: MATERIAL_DEFAULTS.common_nails_kg.price,
    snap_tie: MATERIAL_DEFAULTS.snap_tie.price,
    form_kicker_set: MATERIAL_DEFAULTS.form_kicker_set.price,
};

export const PLYWOOD_OPTIONS = [
    { id: 'plywood_phenolic_1_2', label: '1/2" Phenolic (4×8)', area_sqm: 2.9768, thickness_in: 0.5 },
    { id: 'plywood_phenolic_3_4', label: '3/4" Phenolic (4×8)', area_sqm: 2.9768, thickness_in: 0.75 },
    { id: 'plywood_marine_1_2', label: '1/2" Marine Plywood (4×8)', area_sqm: 2.9768, thickness_in: 0.5 },
];

export const LUMBER_OPTIONS = [
    { id: 'lumber_2x2', label: '2"×2"', bf_per_meter: 1.09361 },
    { id: 'lumber_2x3', label: '2"×3"', bf_per_meter: 1.64042 },
    { id: 'lumber_2x4', label: '2"×4"', bf_per_meter: 2.18722 },
];

// Form type options shown in the table dropdown
export const FORM_TYPE_OPTIONS = [
    { id: 'box', display: 'General Form (Box)' },
    { id: 'wall', display: 'Wall / Retaining Wall' },
    { id: 'column', display: 'Column Form (No Bottom)' },
];

// ─── Sheet constants (4×8 plywood) ───────────────────────────────────────────
const SHEET_W = 1.22; // m  (4 ft)
const SHEET_L = 2.44; // m  (8 ft — bin capacity for FFD)

// Snap-tie / kicker defaults for wall forms
const TIE_SPACING_H = 0.50;  // 500 mm horizontal OC
const TIE_SPACING_V = 0.50;  // 500 mm vertical OC
const KICKER_SPACING = 1.50; // 1500 mm OC along wall length

// ─── First Fit Decreasing bin packing ────────────────────────────────────────
function firstFitDecreasing(strips, binCap) {
    const sorted = [...strips].sort((a, b) => b - a);
    const bins = [];
    for (const h of sorted) {
        let placed = false;
        for (let i = 0; i < bins.length; i++) {
            if (bins[i] >= h - 1e-9) { bins[i] -= h; placed = true; break; }
        }
        if (!placed) bins.push(binCap - h);
    }
    return bins.length;
}

// ─── 2D-aware strip generator ────────────────────────────────────────────────
// Width efficiency: if L < SHEET_W, floor(SHEET_W/L) face-width pieces fit from
// one sheet-width cut, reducing the strip count proportionally.
function stripsForFace(L, H, qty) {
    const strips = [];
    let stripsPerCourse;
    if (L >= SHEET_W) {
        stripsPerCourse = Math.ceil(L / SHEET_W) * qty;
    } else {
        const piecesPerCut = Math.floor(SHEET_W / L);
        stripsPerCourse = Math.ceil(qty / piecesPerCut);
    }
    let yLeft = H;
    while (yLeft > 1e-9) {
        const sh = Math.min(SHEET_L, yLeft);
        for (let i = 0; i < stripsPerCourse; i++) strips.push(sh);
        yLeft -= sh;
    }
    return strips;
}

// ─── Face sets per form type ──────────────────────────────────────────────────
function facesForRow(L, W, H, formType) {
    switch (formType) {
        case 'wall': {
            // Two main faces (front + back) — always required
            const faces = [
                { l: L, w: H, type: 'vertical' }, // front face
                { l: L, w: H, type: 'vertical' }, // back  face
            ];
            // End caps only when wall thickness (W) is provided
            if (W > 0) {
                faces.push({ l: W, w: H, type: 'vertical' }); // end cap A
                faces.push({ l: W, w: H, type: 'vertical' }); // end cap B
            }
            return faces;
        }
        case 'column':
            // Four vertical sides only — no bottom (poured on footing/slab)
            return [
                { l: L, w: H, type: 'vertical' },
                { l: L, w: H, type: 'vertical' },
                { l: W, w: H, type: 'vertical' },
                { l: W, w: H, type: 'vertical' },
            ];
        case 'box':
        default:
            // Four sides + bottom soffit (stairs, pedestals, generic forms)
            return [
                { l: L, w: H, type: 'vertical' },
                { l: L, w: H, type: 'vertical' },
                { l: W, w: H, type: 'vertical' },
                { l: W, w: H, type: 'vertical' },
                { l: L, w: W, type: 'soffit' },
            ];
    }
}

// ─── Main calculator ──────────────────────────────────────────────────────────
export const calculateFormworks = (rows, config, prices) => {
    const columns = config.columns || [];
    const beams = config.beams || [];
    let totalAreaAccumulator = 0;
    let totalSnapTies = 0; // wall forms only
    let totalKickerSets = 0; // wall forms only
    const plywoodByType = {};
    const lumberByType = {};

    const pWasteFactor = 1 + (config.wastePlywood / 100);
    const lWasteFactor = 1 + (config.wasteLumber / 100);

    // ── Core face processor ───────────────────────────────────────────────────
    const processItem = (faces, qty, pType, lType) => {
        const pSpec = PLYWOOD_OPTIONS.find(p => p.id === pType);
        faces.forEach(face => {
            const faceL = face.l;
            const faceH = face.w;
            const faceType = face.type || 'vertical';

            totalAreaAccumulator += faceL * faceH * qty;

            // Plywood strips (2D-aware FFD pool)
            if (pSpec) {
                if (!plywoodByType[pType]) plywoodByType[pType] = { strips: [], spec: pSpec };
                plywoodByType[pType].strips.push(...stripsForFace(faceL, faceH, qty));
            }

            // Lumber framing: vertical → studs + walers; soffit → joists + stringers
            if (!lumberByType[lType]) {
                lumberByType[lType] = { linear: 0, spec: LUMBER_OPTIONS.find(l => l.id === lType) };
            }
            if (faceType === 'soffit') {
                const jSpacing = 0.40, sSpacing = 0.60;
                const nJoists = Math.ceil(faceL / jSpacing) + 1;
                const nStringers = Math.ceil(faceH / sSpacing) + 1;
                lumberByType[lType].linear +=
                    (nJoists * (faceH + 0.10) + nStringers * (faceL + 0.10)) * qty;
            } else {
                const sp = 0.60;
                lumberByType[lType].linear +=
                    ((Math.ceil(faceL / sp) + 1) * faceH +
                        (Math.ceil(faceH / sp) + 1) * faceL) * qty;
            }
        });
    };

    // ── 1. Manual rows ────────────────────────────────────────────────────────
    rows.forEach(row => {
        if (row.isExcluded) return;
        const Q = parseInt(row.quantity) || 0;
        const L = parseFloat(row.length_m) || 0;
        const W = parseFloat(row.width_m) || 0;  // optional for wall type
        const H = parseFloat(row.height_m) || 0;
        const FT = row.formType || 'box';

        // Wall type: W (thickness) is optional — controls end caps only.
        // All other form types require L, W, and H.
        const hasMinDims = FT === 'wall'
            ? (Q > 0 && L > 0 && H > 0)
            : (Q > 0 && L > 0 && W > 0 && H > 0);

        if (hasMinDims) {
            processItem(facesForRow(L, W, H, FT), Q, row.plywood_type, row.lumber_size);

            // Wall / Retaining Wall: snap ties + kicker braces (if enabled)
            if (FT === 'wall' && config.includeWallExtras) {
                // Snap ties on each face: grid of H×V spacing
                const tiesPerFace = (Math.ceil(L / TIE_SPACING_H) + 1) *
                    (Math.ceil(H / TIE_SPACING_V) + 1);
                totalSnapTies += tiesPerFace * Q; // ties serve both faces simultaneously

                // Kicker braces: one brace set every KICKER_SPACING along front face
                totalKickerSets += (Math.ceil(L / KICKER_SPACING) + 1) * Q;
            }
        }
    });

    // ── 2. Imported columns ───────────────────────────────────────────────────
    if (config.includeColumns) {
        columns.forEach(col => {
            if (col.isExcluded) return;
            const Q = parseInt(col.quantity) || 0;
            const L = parseFloat(col.length_m) || 0;
            const W = parseFloat(col.width_m) || 0;
            const H = parseFloat(col.height_m) || 0;
            if (Q > 0 && L > 0 && W > 0 && H > 0)
                processItem(facesForRow(L, W, H, 'column'), Q, config.importPlywood, config.importLumber);
        });
    }

    // ── 3. Imported beams ─────────────────────────────────────────────────────
    // RC Beam tab maps: length_m=B (width), width_m=D (depth), height_m=L (span)
    if (config.includeBeams) {
        beams.forEach(beam => {
            if (beam.isExcluded) return;
            const Q = parseInt(beam.quantity) || 0;
            const B = parseFloat(beam.length_m) || 0;
            const D = parseFloat(beam.width_m) || 0;
            const L = parseFloat(beam.height_m) || 0;
            if (Q > 0 && B > 0 && D > 0 && L > 0)
                processItem([
                    { l: L, w: D, type: 'vertical' }, // sides
                    { l: L, w: D, type: 'vertical' },
                    { l: L, w: B, type: 'soffit' }, // bottom soffit
                ], Q, config.importPlywood, config.importLumber);
        });
    }

    if (totalAreaAccumulator === 0) return null;

    // ── Final assembly ─────────────────────────────────────────────────────────
    const finalItems = [];
    let grandTotal = 0;

    // Plywood
    Object.keys(plywoodByType).forEach(pId => {
        const { strips, spec } = plywoodByType[pId];
        if (!spec || strips.length === 0) return;
        const totalSheets = Math.ceil(firstFitDecreasing(strips, SHEET_L) * pWasteFactor);
        const price = prices[pId] ?? MATERIAL_DEFAULTS[pId]?.price ?? 0;
        const name = MATERIAL_DEFAULTS[pId]?.name ?? spec.label;
        const total = totalSheets * price;
        grandTotal += total;
        finalItems.push({ name, qty: totalSheets, unit: 'sheets', priceKey: pId, price, total });
    });

    // Lumber
    Object.keys(lumberByType).forEach(lId => {
        const { linear, spec } = lumberByType[lId];
        if (!spec) return;
        const bf = Math.ceil(linear * spec.bf_per_meter * lWasteFactor);
        const price = prices[lId] ?? MATERIAL_DEFAULTS[lId]?.price ?? 0;
        const name = MATERIAL_DEFAULTS[lId]?.name ?? `Lumber (${spec.label})`;
        const total = bf * price;
        grandTotal += total;
        finalItems.push({ name, qty: bf, unit: 'BF', priceKey: lId, price, total });
    });

    // Common nails
    const nailsKg = Math.ceil(totalAreaAccumulator * 0.15 * lWasteFactor);
    const nailPrice = prices['common_nails_kg'] ?? MATERIAL_DEFAULTS['common_nails_kg'].price;
    const nailTotal = nailsKg * nailPrice;
    grandTotal += nailTotal;
    finalItems.push({ name: MATERIAL_DEFAULTS['common_nails_kg'].name, qty: nailsKg, unit: 'kg', priceKey: 'common_nails_kg', price: nailPrice, total: nailTotal });

    // Snap ties (wall forms only, when enabled)
    if (totalSnapTies > 0) {
        const snapPrice = prices['snap_tie'] ?? MATERIAL_DEFAULTS['snap_tie'].price;
        const snapTotal = totalSnapTies * snapPrice;
        grandTotal += snapTotal;
        finalItems.push({ name: MATERIAL_DEFAULTS['snap_tie'].name, qty: totalSnapTies, unit: 'pcs', priceKey: 'snap_tie', price: snapPrice, total: snapTotal });
    }

    // Kicker brace sets (wall forms only, when enabled)
    if (totalKickerSets > 0) {
        const kickerPrice = prices['form_kicker_set'] ?? MATERIAL_DEFAULTS['form_kicker_set'].price;
        const kickerTotal = totalKickerSets * kickerPrice;
        grandTotal += kickerTotal;
        finalItems.push({ name: MATERIAL_DEFAULTS['form_kicker_set'].name, qty: totalKickerSets, unit: 'sets', priceKey: 'form_kicker_set', price: kickerPrice, total: kickerTotal });
    }

    return { totalArea: totalAreaAccumulator, items: finalItems, grandTotal, total: grandTotal };
};
