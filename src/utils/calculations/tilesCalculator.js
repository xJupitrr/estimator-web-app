
/**
 * Calculates materials and costs for Tile / Flooring works.
 * Supports tiles (sold per pc), planks/vinyl (sold per box/sq.m), and laminate.
 */

// ─── Material catalog: id, label, unit-of-sale, and available sizes ──────────
export const FLOORING_MATERIALS = [
    {
        id: 'porcelain',
        label: 'Porcelain Tile',
        soldBy: 'pcs',   // count individual pieces
        consumables: ['adhesive', 'grout', 'spacer'],
        sizes: [
            { id: '30x30', display: '30cm × 30cm' },
            { id: '40x40', display: '40cm × 40cm' },
            { id: '45x45', display: '45cm × 45cm' },
            { id: '60x60', display: '60cm × 60cm' },
            { id: '60x120', display: '60cm × 120cm' },
            { id: '80x80', display: '80cm × 80cm' },
            { id: '100x100', display: '100cm × 100cm' },
        ],
    },
    {
        id: 'ceramic',
        label: 'Ceramic Tile',
        soldBy: 'pcs',
        consumables: ['adhesive', 'grout', 'spacer'],
        sizes: [
            { id: '20x20', display: '20cm × 20cm' },
            { id: '25x25', display: '25cm × 25cm' },
            { id: '30x30', display: '30cm × 30cm' },
            { id: '40x40', display: '40cm × 40cm' },
            { id: '60x60', display: '60cm × 60cm' },
        ],
    },
    {
        id: 'homogeneous',
        label: 'Homogeneous Tile',
        soldBy: 'pcs',
        consumables: ['adhesive', 'grout', 'spacer'],
        sizes: [
            { id: '60x60', display: '60cm × 60cm' },
            { id: '60x120', display: '60cm × 120cm' },
            { id: '80x80', display: '80cm × 80cm' },
            { id: '100x100', display: '100cm × 100cm' },
        ],
    },
    {
        id: 'granite',
        label: 'Granite / Natural Stone',
        soldBy: 'pcs',
        consumables: ['adhesive', 'grout', 'spacer'],
        sizes: [
            { id: '30x30', display: '30cm × 30cm' },
            { id: '40x40', display: '40cm × 40cm' },
            { id: '60x60', display: '60cm × 60cm' },
            { id: '60x120', display: '60cm × 120cm' },
        ],
    },
    {
        id: 'mosaic',
        label: 'Mosaic Tile',
        soldBy: 'pcs',   // each 30×30cm mesh-backed sheet counted as 1 piece
        consumables: ['adhesive', 'grout'],
        sizes: [
            { id: '30x30', display: '30cm × 30cm (sheet)' },
        ],
    },
    {
        id: 'wall_ceramic',
        label: 'Wall Ceramic Tile',
        soldBy: 'pcs',
        consumables: ['adhesive', 'grout', 'spacer'],
        sizes: [
            { id: '20x25', display: '20cm × 25cm' },
            { id: '20x30', display: '20cm × 30cm' },
            { id: '25x40', display: '25cm × 40cm' },
            { id: '30x60', display: '30cm × 60cm' },
        ],
    },
    {
        id: 'spc',
        label: 'SPC Vinyl Plank',
        soldBy: 'box',   // each box covers ~1.67–2.23 m²
        sqmPerBox: 1.86, // typical SPC box coverage
        consumables: [],  // no adhesive/grout for click-lock
        sizes: [
            { id: '18x120', display: '18cm × 120cm (plank)' },
            { id: '22x122', display: '22cm × 122cm (plank)' },
        ],
    },
    {
        id: 'vinyl_plank',
        label: 'Vinyl Plank (LVT)',
        soldBy: 'box',
        sqmPerBox: 2.0,
        consumables: [],
        sizes: [
            { id: '15x91', display: '15cm × 91cm (plank)' },
            { id: '18x122', display: '18cm × 122cm (plank)' },
        ],
    },
    {
        id: 'vinyl_sheet',
        label: 'Vinyl Sheet',
        soldBy: 'sqm_pcs', // counted as individual 1m cuts from a 2m-wide roll
        sqmPerPiece: 2.0,  // 1 cut (200cm × 100cm) = 2.0 m²
        consumables: ['vinyl_adhesive'],
        sizes: [
            { id: '200x100', display: '200cm × 100cm (1m cut, 2m-wide roll)' },
        ],
    },
    {
        id: 'laminate',
        label: 'Laminated Wood Flooring',
        soldBy: 'box',
        sqmPerBox: 2.131, // 7 planks × 19.2cm × 128.5cm per box
        consumables: [],
        sizes: [
            { id: '19x129', display: '19cm × 129cm, 12mm AC4 (standard)' },
            { id: '19x128', display: '19cm × 128cm, 8mm AC3 (budget)' },
        ],
    },
    {
        id: 'hardwood',
        label: 'Solid Hardwood / Engineered Wood',
        soldBy: 'sqm_pcs', // counted as individual strips
        sqmPerPiece: null, // derived from sizeId dimensions
        consumables: [],
        sizes: [
            { id: '7x90', display: '7cm × 90cm (strip)' },
            { id: '10x90', display: '10cm × 90cm (strip)' },
        ],
    },
];

// Helper: get material config by id
export const getMaterialConfig = (materialId) =>
    FLOORING_MATERIALS.find(m => m.id === materialId) || FLOORING_MATERIALS[0];

// ─── Main Calculate Function ─────────────────────────────────────────────────
export const calculateTiles = (areas, prices) => {
    if (!areas || areas.length === 0) return null;

    let totalAreaM2 = 0;
    let totalAdhesiveBags = 0;
    let totalGroutKg = 0;
    let totalSpacers = 0;
    let totalVinylAdhesive = 0;

    // keyed by "materialId|size" for aggregation
    const lineItems = new Map();

    areas.forEach(area => {
        if (area.isExcluded) return;
        const x_len = parseFloat(area.length_m) || 0;
        const y_len = parseFloat(area.width_m) || 0;
        const qty = parseInt(area.quantity) || 1;
        if (x_len <= 0 || y_len <= 0) return;

        const singleArea = x_len * y_len;
        const rowArea = singleArea * qty;
        totalAreaM2 += rowArea;

        const matId = area.material || 'porcelain';
        const mat = getMaterialConfig(matId);
        const sizeId = area.tile_size_cm || (mat.sizes[0]?.id ?? '60x60');

        // ── LINE ITEM ACCUMULATION ──────────────────────────────────────────
        const lineKey = `${matId}|${sizeId}`;

        if (mat.soldBy === 'pcs') {
            // ── STANDARD TILING METHOD ──────────────────────────────────────
            // Parse tile size from sizeId (e.g. "60x60" → 0.60m × 0.60m)
            const parts = sizeId.split('x').map(p => parseFloat(p) / 100);
            const tileL = parts[0] || 0.60; // tile dimension 1 (metres)
            const tileW = parts[1] || 0.60; // tile dimension 2 (metres)

            // Standard piece count: rows × columns (ceiling each, fixed orientation)
            // Tiles are always laid with the longer tile dimension along the longer room axis
            const roomLong = Math.max(x_len, y_len);
            const roomShort = Math.min(x_len, y_len);
            const tileLong = Math.max(tileL, tileW);
            const tileShort = Math.min(tileL, tileW);

            const tilesAlongLong = Math.ceil(roomLong / tileLong);
            const tilesAlongShort = Math.ceil(roomShort / tileShort);
            const baseCount = tilesAlongLong * tilesAlongShort * qty;

            const priceKey = `tile_${matId}_${sizeId}`;
            const fallbackKey = `tile_${sizeId}`;
            const price = parseFloat(prices[priceKey]) || parseFloat(prices[fallbackKey]) || 150;

            // Tile label: "60cm × 60cm" format
            const tileLabelCm = `${Math.round(tileLong * 100)}cm × ${Math.round(tileShort * 100)}cm`;

            const existing = lineItems.get(lineKey);
            if (existing) {
                existing.baseQty += baseCount;
            } else {
                lineItems.set(lineKey, {
                    name: `${mat.label} (${tileLabelCm})`,
                    baseQty: baseCount,
                    unit: 'pcs',
                    priceKey: priceKey,
                    fallbackKey: fallbackKey,
                    price: price,
                });
            }

            // ── ADHESIVE: 1 bag (25kg) covers 5 sq.m at 3–4mm bed ──────────
            if (mat.consumables.includes('adhesive')) {
                totalAdhesiveBags += rowArea / 5.0;
            }

            // ── GROUT: kg/m² varies by tile size (joint exposure) ───────────
            // Formula: grout_kg/m² = joint_width_m × tile_perimeter_m / tile_area_m² × grout_density
            // Simplified standard rates (2mm joint, 1.8 g/cm³ grout density):
            if (mat.consumables.includes('grout')) {
                const tileArea = tileLong * tileShort;
                let groutRate;
                if (tileArea <= 0.04) groutRate = 0.50; // ≤20×20 cm
                else if (tileArea <= 0.09) groutRate = 0.42; // 30×30 cm
                else if (tileArea <= 0.16) groutRate = 0.35; // 40×40 cm
                else if (tileArea <= 0.25) groutRate = 0.28; // 45×45 cm
                else if (tileArea <= 0.36) groutRate = 0.22; // 60×60 cm
                else if (tileArea <= 0.50) groutRate = 0.18; // 60×80 cm
                else groutRate = 0.15; // 60×120, 80×80, 100×100
                totalGroutKg += rowArea * groutRate;
            }

            // ── SPACERS: ~1 spacer per tile for standard grid layouts ───────
            if (mat.consumables.includes('spacer')) {
                totalSpacers += baseCount;
            }

        } else if (mat.soldBy === 'box') {
            // ── BOX FLOORING: count individual PLANKS using row × column ────
            // Parse plank dimensions from sizeId (e.g. '18x120' → 0.18m × 1.20m)
            const parts = sizeId.split('x').map(p => parseFloat(p) / 100);
            const plankL = parts[0] || 0.18;
            const plankW = parts[1] || 1.20;
            const plankArea = plankL * plankW; // m² per plank

            // Row × column count (longer plank dimension along longer room axis)
            const roomLong2 = Math.max(x_len, y_len);
            const roomShort2 = Math.min(x_len, y_len);
            const plankLong = Math.max(plankL, plankW);
            const plankShort = Math.min(plankL, plankW);

            const planksAlongLong = Math.ceil(roomLong2 / plankLong);
            const planksAlongShort = Math.ceil(roomShort2 / plankShort);
            const basePlanks = planksAlongLong * planksAlongShort * qty;

            // Derive price per plank from box price + sqmPerBox
            const sqmPerBox = mat.sqmPerBox || 2.0;
            const rawBoxPrice = parseFloat(prices[`flooring_${matId}`]) || 1800;
            const pricePerPlank = rawBoxPrice * (plankArea / sqmPerBox);

            // Label removes trailing ' — box' since qty is now planks
            const plankLabel = `${Math.round(plankLong * 100)}cm × ${Math.round(plankShort * 100)}cm`;

            const existing = lineItems.get(lineKey);
            if (existing) {
                existing.baseQty += basePlanks;
            } else {
                lineItems.set(lineKey, {
                    name: `${mat.label} (${plankLabel})`,
                    baseQty: basePlanks,
                    unit: 'pcs',
                    priceKey: `flooring_${matId}`,
                    price: pricePerPlank,
                });
            }

        } else if (mat.soldBy === 'sqm_pcs') {
            // ── SQ.M ITEMS COUNTED AS PIECES (Vinyl Sheet cuts, Hardwood strips) ─
            // Piece area: from sizeId if parseable, else from sqmPerPiece
            const parts = sizeId.split('x').map(p => parseFloat(p) / 100);
            const pieceL = parts[0] > 0 ? parts[0] : 1.0;
            const pieceW = parts[1] > 0 ? parts[1] : 1.0;
            const pieceArea = (pieceL * pieceW) || mat.sqmPerPiece || 1.0;

            // Row × column with longer piece dimension along longer room axis
            const roomLong3 = Math.max(x_len, y_len);
            const roomShort3 = Math.min(x_len, y_len);
            const pieceLong = Math.max(pieceL, pieceW);
            const pieceShort = Math.min(pieceL, pieceW);

            const piecesAlongLong = Math.ceil(roomLong3 / pieceLong);
            const piecesAlongShort = Math.ceil(roomShort3 / pieceShort);
            const basePieces = piecesAlongLong * piecesAlongShort * qty;

            // Derive price per piece from sqm price
            const sqmPrice = parseFloat(prices[`flooring_${matId}`]) || 800;
            const pricePerPc = sqmPrice * pieceArea;

            const pieceLabel = `${Math.round(pieceLong * 100)}cm × ${Math.round(pieceShort * 100)}cm`;

            const existing = lineItems.get(lineKey);
            if (existing) {
                existing.baseQty += basePieces;
            } else {
                lineItems.set(lineKey, {
                    name: `${mat.label} (${pieceLabel})`,
                    baseQty: basePieces,
                    unit: 'pcs',
                    priceKey: `flooring_${matId}`,
                    price: pricePerPc,
                });
            }

            // Vinyl adhesive still accumulated by floor area
            if (mat.consumables.includes('vinyl_adhesive')) totalVinylAdhesive += rowArea;
        }

    });

    if (totalAreaM2 <= 0) return null;

    const items = [];
    let totalCost = 0;

    // Main flooring items — 10% waste allowance (industry standard)
    lineItems.forEach((data) => {
        const finalQty = Math.ceil(data.baseQty * 1.10);

        const lineTotal = finalQty * data.price;
        totalCost += lineTotal;
        items.push({
            name: data.name,
            qty: finalQty,
            unit: data.unit,
            priceKey: data.priceKey,
            price: data.price,
            total: lineTotal,
        });
    });

    // Consumables
    if (totalAdhesiveBags > 0) {
        const finalAdh = Math.ceil(totalAdhesiveBags);
        const adhPrice = parseFloat(prices.tile_adhesive) || 850;
        const adhTotal = finalAdh * adhPrice;
        totalCost += adhTotal;
        items.push({ name: 'Tile Adhesive (25kg Bag)', qty: finalAdh, unit: 'bags', priceKey: 'tile_adhesive', price: adhPrice, total: adhTotal });
    }

    if (totalGroutKg > 0) {
        const finalGrout = Math.ceil(totalGroutKg);
        const groutPrice = parseFloat(prices.tile_grout) || 120;
        const groutTotal = finalGrout * groutPrice;
        totalCost += groutTotal;
        items.push({ name: 'Tile Grout (kg)', qty: finalGrout, unit: 'kg', priceKey: 'tile_grout', price: groutPrice, total: groutTotal });
    }

    if (totalSpacers > 0) {
        // Tile spacers are usually sold in bags of 500 pcs
        const finalSpacers = Math.ceil(totalSpacers / 500.0);
        const spacerPrice = parseFloat(prices.tile_spacer_2mm) || 58;
        const spacerTotal = finalSpacers * spacerPrice;
        totalCost += spacerTotal;
        items.push({ name: 'Tile Spacers 2mm (500pcs/bag)', qty: finalSpacers, unit: 'bags', priceKey: 'tile_spacer_2mm', price: spacerPrice, total: spacerTotal });
    }

    if (totalVinylAdhesive > 0) {
        const finalVA = parseFloat((totalVinylAdhesive * 1.05).toFixed(2));
        const vaPrice = parseFloat(prices.vinyl_adhesive_sqm) || 80;
        const vaTotal = finalVA * vaPrice;
        totalCost += vaTotal;
        items.push({ name: 'Vinyl / Sheet Adhesive (sq.m)', qty: finalVA, unit: 'sq.m', priceKey: 'vinyl_adhesive_sqm', price: vaPrice, total: vaTotal });
    }

    return { totalArea: totalAreaM2, items, total: totalCost };
};
