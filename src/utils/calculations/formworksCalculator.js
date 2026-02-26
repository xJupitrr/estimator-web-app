
import { MATERIAL_DEFAULTS } from '../../constants/materials';

export const DEFAULT_PRICES = {
    plywood_phenolic_1_2: MATERIAL_DEFAULTS.plywood_phenolic_1_2.price,
    plywood_phenolic_3_4: MATERIAL_DEFAULTS.plywood_phenolic_3_4.price,
    plywood_marine_1_2: MATERIAL_DEFAULTS.plywood_marine_1_2.price,
    lumber_2x2: MATERIAL_DEFAULTS.lumber_2x2.price,
    lumber_2x3: MATERIAL_DEFAULTS.lumber_2x3.price,
    lumber_2x4: MATERIAL_DEFAULTS.lumber_2x4.price,
    common_nails_kg: MATERIAL_DEFAULTS.common_nails_kg.price,
};

export const PLYWOOD_OPTIONS = [
    { id: 'plywood_phenolic_1_2', label: '1/2" Phenolic (4x8)', area_sqm: 2.9768, thickness_in: 0.5 },
    { id: 'plywood_phenolic_3_4', label: '3/4" Phenolic (4x8)', area_sqm: 2.9768, thickness_in: 0.75 },
    { id: 'plywood_marine_1_2', label: '1/2" Marine Plywood (4x8)', area_sqm: 2.9768, thickness_in: 0.5 },
];

export const LUMBER_OPTIONS = [
    { id: 'lumber_2x2', label: '2"x2"', bf_per_meter: 1.09361 },
    { id: 'lumber_2x3', label: '2"x3"', bf_per_meter: 1.64042 },
    { id: 'lumber_2x4', label: '2"x4"', bf_per_meter: 2.18722 },
];

/**
 * Calculates materials and costs for Formworks.
 * @param {Array} rows - Manual rows { quantity, length_m, width_m, height_m, plywood_type, lumber_size ... }
 * @param {Array} columns - Column items (for automated import)
 * @param {Array} beams - Beam items (for automated import)
 * @param {Object} prices - Price mapping
 * @param {Object} config - Configuration { wastePlywood, wasteLumber, includeColumns, includeBeams, importPlywood, importLumber }
 * @returns {Object} Result object { area, items, grandTotal } or null
 */
export const calculateFormworks = (rows, config, prices) => {
    const columns = config.columns || [];
    const beams = config.beams || [];
    let totalAreaAccumulator = 0;
    const plywoodByType = {};
    const lumberByType = {};

    const pWasteFactor = 1 + (config.wastePlywood / 100);
    const lWasteFactor = 1 + (config.wasteLumber / 100);

    // Utility to process material impact
    const processItem = (faces, qty, pType, lType) => {
        // faces: Array of { l, w } rectangles
        let totalAreaPerUnit = 0;
        let sheetsPerUnit = 0;
        const pSpec = PLYWOOD_OPTIONS.find(p => p.id === pType);

        faces.forEach(face => {
            totalAreaPerUnit += face.l * face.w;

            if (pSpec) {
                // Tiling Method: 4x8 sheet is 1.22m x 2.44m
                const sW = 1.22;
                const sL = 2.44;

                // We try both orientations and pick the one with fewer sheets
                const sheets1 = Math.ceil(face.l / sW) * Math.ceil(face.w / sL);
                const sheets2 = Math.ceil(face.l / sL) * Math.ceil(face.w / sW);
                sheetsPerUnit += Math.min(sheets1, sheets2);
            }
        });

        totalAreaAccumulator += totalAreaPerUnit * qty;

        // Plywood
        if (!plywoodByType[pType]) {
            plywoodByType[pType] = { sheets: 0, spec: pSpec };
        }
        plywoodByType[pType].sheets += (sheetsPerUnit * qty);

        // Lumber calculation (Studs and Walers/Yokes) - simplified heuristic
        faces.forEach(face => {
            const perimeter = 2 * (face.l + face.w);
            const numStuds = Math.max(4, Math.ceil(perimeter / 0.6) * 2);
            const lumberStuds = numStuds * face.w; // assuming face.w is height

            const numWalers = Math.max(2, Math.ceil(face.w / 0.6) + 1);
            const lumberWalers = numWalers * 2 * perimeter;
            const totalLumberLinear = (lumberStuds + lumberWalers) * qty;

            if (!lumberByType[lType]) {
                lumberByType[lType] = { linear: 0, spec: LUMBER_OPTIONS.find(l => l.id === lType) };
            }
            lumberByType[lType].linear += totalLumberLinear;
        });
    };

    // 1. Process Manual Rows (Treat as 4 sides + bottom)
    rows.forEach(row => {
        if (row.isExcluded) return;
        const Q = parseInt(row.quantity) || 0;
        const L = parseFloat(row.length_m) || 0;
        const W = parseFloat(row.width_m) || 0;
        const H = parseFloat(row.height_m) || 0;
        if (Q > 0 && L > 0 && W > 0 && H > 0) {
            const faces = [
                { l: L, w: H }, { l: L, w: H }, // sides
                { l: W, w: H }, { l: W, w: H }, // sides
                { l: L, w: W } // bottom
            ];
            processItem(faces, Q, row.plywood_type, row.lumber_size);
        }
    });

    // 2. Process Columns (Treat as 4 vertical sides)
    if (config.includeColumns) {
        columns.forEach(col => {
            if (col.isExcluded) return;
            const Q = parseInt(col.quantity) || 0;
            const L = parseFloat(col.length_m) || 0;
            const W = parseFloat(col.width_m) || 0;
            const H = parseFloat(col.height_m) || 0;
            if (Q > 0 && L > 0 && W > 0 && H > 0) {
                const faces = [
                    { l: L, w: H }, { l: L, w: H },
                    { l: W, w: H }, { l: W, w: H }
                ];
                processItem(faces, Q, config.importPlywood, config.importLumber);
            }
        });
    }

    // 3. Process Beams (Treat as 2 sides + bottom)
    if (config.includeBeams) {
        beams.forEach(beam => {
            if (beam.isExcluded) return;
            const Q = parseInt(beam.quantity) || 0;
            const B = parseFloat(beam.length_m) || 0; // Width (B)
            const H = parseFloat(beam.width_m) || 0;  // Depth (H)
            const L = parseFloat(beam.height_m) || 0; // Length (L)
            if (Q > 0 && B > 0 && H > 0 && L > 0) {
                const faces = [
                    { l: L, w: H }, { l: L, w: H }, // sides
                    { l: L, w: B } // bottom
                ];
                processItem(faces, Q, config.importPlywood, config.importLumber);
            }
        });
    }

    if (totalAreaAccumulator === 0) {
        return null;
    }

    // Final Items Assembly
    const finalItems = [];
    let grandTotal = 0;

    Object.keys(plywoodByType).forEach(pId => {
        const { sheets, spec } = plywoodByType[pId];
        if (!spec) return;
        const totalSheets = Math.ceil(sheets * pWasteFactor);

        const price = prices[pId] || (MATERIAL_DEFAULTS[pId] ? MATERIAL_DEFAULTS[pId].price : 0);
        const name = MATERIAL_DEFAULTS[pId] ? MATERIAL_DEFAULTS[pId].name : spec.label;

        const total = totalSheets * price;
        grandTotal += total;
        finalItems.push({ name, qty: totalSheets, unit: "sheets", priceKey: pId, price, total });
    });

    Object.keys(lumberByType).forEach(lId => {
        const { linear, spec } = lumberByType[lId];
        if (!spec) return;
        const bf = Math.ceil(linear * spec.bf_per_meter * lWasteFactor);

        const price = prices[lId] || (MATERIAL_DEFAULTS[lId] ? MATERIAL_DEFAULTS[lId].price : 0);
        const name = MATERIAL_DEFAULTS[lId] ? MATERIAL_DEFAULTS[lId].name : `Lumber (${spec.label})`;

        const total = bf * price;
        grandTotal += total;
        finalItems.push({ name, qty: bf, unit: "BF", priceKey: lId, price, total });
    });

    const nailsKg = Math.ceil(totalAreaAccumulator * 0.15 * lWasteFactor);
    const nailKey = 'common_nails_kg';
    const nailPrice = prices[nailKey] || MATERIAL_DEFAULTS[nailKey].price;
    const nailTotal = nailsKg * nailPrice;
    grandTotal += nailTotal;
    finalItems.push({ name: MATERIAL_DEFAULTS[nailKey].name, qty: nailsKg, unit: "kg", priceKey: nailKey, price: nailPrice, total: nailTotal });

    return {
        totalArea: totalAreaAccumulator,
        items: finalItems,
        grandTotal: grandTotal,
        total: grandTotal
    };
};
