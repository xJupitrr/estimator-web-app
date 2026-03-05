
/**
 * Calculates materials and costs for Tile works.
 * @param {Array} areas - Array of area objects { length, width, tileDimensions... }
 * @param {Object} prices - Price mapping for consumables
 * @returns {Object} Result object { area, items, total } or null
 */

/**
 * Material type definitions with their commonly available sizes.
 * id: unique key  |  label: display name  |  sizes: available tile sizes for this material
 */
export const TILE_MATERIALS = [
    {
        id: 'ceramic',
        label: 'Ceramic Tile',
        sizes: [
            { id: '20x20', display: '20cm × 20cm' },
            { id: '30x30', display: '30cm × 30cm' },
            { id: '40x40', display: '40cm × 40cm' },
            { id: '60x60', display: '60cm × 60cm' },
        ],
    },
    {
        id: 'porcelain',
        label: 'Porcelain Tile',
        sizes: [
            { id: '30x30', display: '30cm × 30cm' },
            { id: '60x60', display: '60cm × 60cm' },
            { id: '60x120', display: '60cm × 120cm' },
            { id: '80x80', display: '80cm × 80cm' },
        ],
    },
    {
        id: 'spc_plank',
        label: 'SPC Plank',
        sizes: [
            { id: '18x120', display: '18cm × 120cm' },
            { id: '22x152', display: '22cm × 152cm' },
            { id: '23x183', display: '23cm × 183cm' },
        ],
    },
    {
        id: 'laminated',
        label: 'Laminated Flooring',
        sizes: [
            { id: '19x138', display: '19cm × 138cm' },
            { id: '20x138', display: '20cm × 138cm' },
            { id: '20x182', display: '20cm × 182cm' },
        ],
    },
    {
        id: 'marble',
        label: 'Marble Tile',
        sizes: [
            { id: '30x30', display: '30cm × 30cm' },
            { id: '60x60', display: '60cm × 60cm' },
            { id: '60x120', display: '60cm × 120cm' },
            { id: '80x80', display: '80cm × 80cm' },
        ],
    },
    {
        id: 'granite',
        label: 'Granite Tile',
        sizes: [
            { id: '30x30', display: '30cm × 30cm' },
            { id: '60x60', display: '60cm × 60cm' },
            { id: '60x120', display: '60cm × 120cm' },
        ],
    },
    {
        id: 'vinyl',
        label: 'Vinyl Tile (LVT)',
        sizes: [
            { id: '30x30', display: '30cm × 30cm' },
            { id: '45x45', display: '45cm × 45cm' },
            { id: '30x60', display: '30cm × 60cm' },
            { id: '18x122', display: '18cm × 122cm (Plank)' },
        ],
    },
    {
        id: 'hardwood',
        label: 'Hardwood Flooring',
        sizes: [
            { id: '9x90', display: '9cm × 90cm' },
            { id: '12x90', display: '12cm × 90cm' },
            { id: '15x90', display: '15cm × 90cm' },
            { id: '15x120', display: '15cm × 120cm' },
            { id: '19x90', display: '19cm × 90cm' },
        ],
    },
];

export const DEFAULT_PRICES = {
    tile_adhesive: 850,
    tile_grout: 120,
};

export const TILE_CONSUMABLES = [
    { id: 'adhesive', label: 'Tile Adhesive (25kg)', unit: 'bags' },
    { id: 'grout', label: 'Tile Grout (kg)', unit: 'kg' },
];


const DRY_INSTALL = ['spc_plank', 'laminated', 'vinyl', 'hardwood'];

export const calculateTiles = (areas, prices) => {
    let totalAreaM2 = 0;
    let totalAdhesiveBags = 0;
    let totalGroutKg = 0;
    let totalUnderlayM2 = 0;
    let totalLevelingClips = 0;

    // Key: "Material Label (WxH cm)", Value: { baseQty, tileAreaM2, price, priceKey }
    const tileRequirements = new Map();

    if (!areas || areas.length === 0) return null;

    areas.forEach(area => {
        if (area.isExcluded) return;
        const x_len = parseFloat(area.length_m) || 0; // Room Length (m)
        const y_len = parseFloat(area.width_m) || 0;  // Room Width (m)
        const quantity = parseInt(area.quantity) || 1;

        // ── Parse tile dimensions ─────────────────────────────────────────────────
        let tile_w_m = 0.6;
        let tile_h_m = 0.6;
        if (area.tile_size_cm) {
            const parts = area.tile_size_cm.split('x').map(p => parseFloat(p) / 100);
            tile_w_m = parts[0];
            tile_h_m = parts[1];
        }

        if (x_len <= 0 || y_len <= 0 || tile_w_m <= 0 || tile_h_m <= 0) return;

        const singleRoomArea = x_len * y_len;
        totalAreaM2 += singleRoomArea * quantity;

        // ── Tiling Method: count tiles in a grid, choose best orientation ─────────
        // Orientation A: tile's W along room length, tile's H along room width
        const colsA = Math.ceil(x_len / tile_w_m);
        const rowsA = Math.ceil(y_len / tile_h_m);
        const countA = colsA * rowsA;

        // Orientation B: tile rotated 90°
        const colsB = Math.ceil(x_len / tile_h_m);
        const rowsB = Math.ceil(y_len / tile_w_m);
        const countB = colsB * rowsB;

        // Pick orientation that yields fewer tiles (avoids over-ordering)
        const baseTileCountPerRoom = Math.min(countA, countB);
        const totalBaseTiles = baseTileCountPerRoom * quantity;

        // ── Tile area (used for consumable derivation, not room area) ─────────────
        const tileAreaM2 = tile_w_m * tile_h_m;
        // Physical area actually covered by these un-wasted tiles
        const coveredAreaM2 = totalBaseTiles * tileAreaM2;

        // ── Accumulate by material+size key ──────────────────────────────────────
        const materialLabel = area.material_type
            ? (TILE_MATERIALS.find(m => m.id === area.material_type)?.label || area.material_type)
            : 'Tile';
        const fullKey = area.tile_size_cm
            ? `${materialLabel} (${area.tile_size_cm} cm)`
            : `${materialLabel}`;

        if (tileRequirements.has(fullKey)) {
            const existing = tileRequirements.get(fullKey);
            tileRequirements.set(fullKey, {
                ...existing,
                baseQty: existing.baseQty + totalBaseTiles,
                coveredAreaM2: existing.coveredAreaM2 + coveredAreaM2,
            });
        } else {
            const priceKey = `tile_${area.material_type || 'ceramic'}_${area.tile_size_cm || '60x60'}`;
            tileRequirements.set(fullKey, {
                baseQty: totalBaseTiles,
                coveredAreaM2,
                tileAreaM2,
                price: parseFloat(prices[priceKey]) || parseFloat(prices[`tile_${area.tile_size_cm}`]) || 150,
                unit: 'pcs',
                priceKey,
            });
        }

        // ── Leveling clips for large-format tiles (≥60×60 cm = 0.36 m²) ──────────
        if (tileAreaM2 >= 0.36) {
            const tilesWithWaste = Math.ceil(totalBaseTiles * 1.05);
            totalLevelingClips += tilesWithWaste * 4; // ~4 clips per tile
        }

        // ── Consumables derived from actual tile count × tile area ────────────────
        const isWetInstall = !DRY_INSTALL.includes(area.material_type);
        if (isWetInstall) {
            // Adhesive: 1 bag (25kg) covers ~4 m² of tiled surface
            // Use covered area from actual tiles (not raw room area)
            const wasteFactor = 1.05;
            totalAdhesiveBags += (coveredAreaM2 * wasteFactor) / 4.0;

            // Grout consumption based on joint perimeter per tile:
            // Formula: kg = (tile_area_m2 × grout_density × joint_width × joint_depth) / (tile_w × tile_h)
            // Simplified industry rule: ~0.3 kg/m² for standard joints
            totalGroutKg += coveredAreaM2 * wasteFactor * 0.3;
        } else {
            // Dry-install: underlay based on actual covered area
            totalUnderlayM2 += coveredAreaM2;
        }
    });

    if (totalAreaM2 <= 0) return null;

    const items = [];
    let totalCost = 0;

    // ── Tiles (with 5% waste added to grid count) ─────────────────────────────
    tileRequirements.forEach((data, name) => {
        const qtyWithWaste = Math.ceil(data.baseQty * 1.05);
        const lineTotal = qtyWithWaste * data.price;
        totalCost += lineTotal;
        items.push({
            name,
            qty: qtyWithWaste,
            unit: 'pcs',
            priceKey: data.priceKey,
            price: data.price,
            total: lineTotal,
        });
    });

    // ── Tile Adhesive ─────────────────────────────────────────────────────────
    if (totalAdhesiveBags > 0) {
        const finalAdhesive = Math.ceil(totalAdhesiveBags);
        const adhesivePrice = parseFloat(prices.tile_adhesive) || 850;
        const adhesiveCost = finalAdhesive * adhesivePrice;
        totalCost += adhesiveCost;
        items.push({
            name: 'Tile Adhesive (25kg Bag)',
            qty: finalAdhesive,
            unit: 'bags',
            priceKey: 'tile_adhesive',
            price: adhesivePrice,
            total: adhesiveCost,
        });
    }

    // ── Tile Grout ────────────────────────────────────────────────────────────
    if (totalGroutKg > 0) {
        const finalGrout = Math.ceil(totalGroutKg);
        const groutPrice = parseFloat(prices.tile_grout) || 120;
        const groutCost = finalGrout * groutPrice;
        totalCost += groutCost;
        items.push({
            name: 'Tile Grout (kg)',
            qty: finalGrout,
            unit: 'kg',
            priceKey: 'tile_grout',
            price: groutPrice,
            total: groutCost,
        });
    }

    // ── PE Foam Underlay (dry-install only) ───────────────────────────────────
    if (totalUnderlayM2 > 0) {
        const rolls = Math.ceil(totalUnderlayM2 / 15); // 1 roll = 15 m²
        const underlayPrice = parseFloat(prices.tile_underlay_roll) || 380;
        const underlayCost = rolls * underlayPrice;
        totalCost += underlayCost;
        items.push({
            name: 'PE Foam Underlay (15m² Roll)',
            qty: rolls,
            unit: 'rolls',
            priceKey: 'tile_underlay_roll',
            price: underlayPrice,
            total: underlayCost,
        });
    }

    // ── Tile Leveling Clips ───────────────────────────────────────────────────
    if (totalLevelingClips > 0) {
        const packs = Math.ceil(totalLevelingClips / 50); // 50 clips per pack
        const clipPrice = parseFloat(prices.tile_leveling_clips) || 250;
        const clipCost = packs * clipPrice;
        totalCost += clipCost;
        items.push({
            name: 'Tile Leveling Clip System (50-pc Pack)',
            qty: packs,
            unit: 'packs',
            priceKey: 'tile_leveling_clips',
            price: clipPrice,
            total: clipCost,
        });
    }

    return {
        totalArea: totalAreaM2,
        items,
        total: totalCost,
    };
};

