
export const DEFAULT_PRICES = {
    phenolic_1_2: 2400,
    phenolic_3_4: 2800,
    plywood_1_2: 1250,
    lumber_2x2: 35,
    lumber_2x3: 45,
    lumber_2x4: 65,
    nails_kg: 85,
};

export const PLYWOOD_OPTIONS = [
    { id: 'phenolic_1_2', label: '1/2" Phenolic (4x8)', area_sqm: 2.9768, thickness_in: 0.5 },
    { id: 'phenolic_3_4', label: '3/4" Phenolic (4x8)', area_sqm: 2.9768, thickness_in: 0.75 },
    { id: 'plywood_1_2', label: '1/2" Marine Plywood (4x8)', area_sqm: 2.9768, thickness_in: 0.5 },
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
export const calculateFormworks = (rows, columns, beams, prices, config) => {
    let totalAreaAccumulator = 0;
    const plywoodByType = {};
    const lumberByType = {};

    const pWasteFactor = 1 + (config.wastePlywood / 100);
    const lWasteFactor = 1 + (config.wasteLumber / 100);

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
    if (config.includeColumns) {
        columns.forEach(col => {
            const Q = parseInt(col.quantity) || 0;
            const L = parseFloat(col.length_m) || 0;
            const W = parseFloat(col.width_m) || 0;
            const H = parseFloat(col.height_m) || 0;
            if (Q > 0 && L > 0 && W > 0 && H > 0) {
                const area = (2 * L * H) + (2 * W * H); // Periphery * Height
                processItem(area, L, W, H, Q, config.importPlywood, config.importLumber);
            }
        });
    }

    // 3. Process Beams (Treat as 2 sides + bottom)
    if (config.includeBeams) {
        beams.forEach(beam => {
            const Q = parseInt(beam.quantity) || 0;
            const B = parseFloat(beam.length_m) || 0; // Width (B)
            const H = parseFloat(beam.width_m) || 0;  // Depth (H)
            const L = parseFloat(beam.height_m) || 0; // Length (L)
            if (Q > 0 && B > 0 && H > 0 && L > 0) {
                const area = (2 * H * L) + (B * L); // 2 Sides + Bottom
                processItem(area, B, H, L, Q, config.importPlywood, config.importLumber);
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

    return {
        area: totalAreaAccumulator.toFixed(2),
        items: finalItems,
        grandTotal: grandTotal,
        total: grandTotal
    };
};
