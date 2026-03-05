
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
    let totalUnderlayM2 = 0;          // for SPC/Laminated/Vinyl/Hardwood
    let totalLevelingClips = 0;       // for tiles >= 60x60cm

    // Key: "Material - WxH (cm)", Value: { baseQty, price, unit, priceKey }
    const tileRequirements = new Map();

    if (!areas || areas.length === 0) return null;

    areas.forEach(area => {
        if (area.isExcluded) return;
        const x_len = parseFloat(area.length_m) || 0; // Room Length (m)
        const y_len = parseFloat(area.width_m) || 0;  // Room Width (m)
        const quantity = parseInt(area.quantity) || 1;

        // Tile size handling
        let tile_w_m = 0.6;
        let tile_h_m = 0.6;
        if (area.tile_size_cm) {
            const parts = area.tile_size_cm.split('x').map(p => parseFloat(p) / 100);
            tile_w_m = parts[0];
            tile_h_m = parts[1];
        }

        if (x_len <= 0 || y_len <= 0 || tile_w_m <= 0 || tile_h_m <= 0) return;

        const singleArea = x_len * y_len;
        const totalRowArea = singleArea * quantity;
        totalAreaM2 += totalRowArea;

        // Tile Count Calculation
        const cols1 = Math.ceil(x_len / tile_w_m);
        const rows1 = Math.ceil(y_len / tile_h_m);
        const total1 = cols1 * rows1;

        const cols2 = Math.ceil(x_len / tile_h_m);
        const rows2 = Math.ceil(y_len / tile_w_m);
        const total2 = cols2 * rows2;

        const baseTileCountPerRoom = Math.min(total1, total2);
        const totalBaseTilesForRow = baseTileCountPerRoom * quantity;

        // Build label: "Ceramic Tile – 60x60"
        const materialLabel = area.material_type
            ? (TILE_MATERIALS.find(m => m.id === area.material_type)?.label || area.material_type)
            : 'Tile';
        const fullKey = area.tile_size_cm
            ? `${materialLabel} (${area.tile_size_cm} cm)`
            : `${materialLabel}`;

        if (tileRequirements.has(fullKey)) {
            tileRequirements.set(fullKey, {
                ...tileRequirements.get(fullKey),
                baseQty: tileRequirements.get(fullKey).baseQty + totalBaseTilesForRow
            });
        } else {
            const priceKey = `tile_${area.material_type || 'ceramic'}_${area.tile_size_cm || '60x60'}`;
            tileRequirements.set(fullKey, {
                baseQty: totalBaseTilesForRow,
                price: parseFloat(prices[priceKey]) || parseFloat(prices[`tile_${area.tile_size_cm}`]) || 150,
                unit: 'pcs',
                priceKey: priceKey
            });
        }

        // ── Leveling clips (for large-format tiles: area >= 0.36m² i.e. 60×60cm+) ──
        const tileArea = tile_w_m * tile_h_m;
        if (tileArea >= 0.36) {
            const tilesWithWaste = Math.ceil(totalBaseTilesForRow * 1.05);
            totalLevelingClips += tilesWithWaste * 4; // ~4 clips per tile
        }

        // ── Consumables by install type ──────────────────────────────────────────
        const isWetInstall = !DRY_INSTALL.includes(area.material_type);
        if (isWetInstall) {
            totalAdhesiveBags += totalRowArea / 4.0;
            totalGroutKg += totalRowArea * 0.3;
        } else {
            // Dry-install materials need underlay
            totalUnderlayM2 += totalRowArea;
        }
    });

    if (totalAreaM2 <= 0) return null;

    const items = [];
    let totalCost = 0;

    tileRequirements.forEach((data, name) => {
        const qtyWithWaste = Math.ceil(data.baseQty * 1.05); // 5% waste
        const lineTotal = qtyWithWaste * data.price;
        totalCost += lineTotal;
        items.push({
            name: name,
            qty: qtyWithWaste,
            unit: 'pcs',
            priceKey: data.priceKey,
            price: data.price,
            total: lineTotal
        });
    });

    if (totalAdhesiveBags > 0) {
        const finalAdhesive = Math.ceil(totalAdhesiveBags);
        const adhesiveCost = finalAdhesive * (parseFloat(prices.tile_adhesive) || 850);
        totalCost += adhesiveCost;
        items.push({
            name: "Tile Adhesive (25kg Bag)",
            qty: finalAdhesive,
            unit: 'bags',
            priceKey: 'tile_adhesive',
            price: parseFloat(prices.tile_adhesive) || 850,
            total: adhesiveCost
        });
    }

    if (totalGroutKg > 0) {
        const finalGrout = Math.ceil(totalGroutKg);
        const groutCost = finalGrout * (parseFloat(prices.tile_grout) || 120);
        totalCost += groutCost;
        items.push({
            name: "Tile Grout (kg)",
            qty: finalGrout,
            unit: 'kg',
            priceKey: 'tile_grout',
            price: parseFloat(prices.tile_grout) || 120,
            total: groutCost
        });
    }

    // ── Underlay rolls (dry-install only) ────────────────────────────────────────
    if (totalUnderlayM2 > 0) {
        const rolls = Math.ceil(totalUnderlayM2 / 15); // 1 roll covers 15m²
        const underlayPrice = parseFloat(prices.tile_underlay_roll) || 380;
        const underlayCost = rolls * underlayPrice;
        totalCost += underlayCost;
        items.push({
            name: "PE Foam Underlay (15m² Roll)",
            qty: rolls,
            unit: 'rolls',
            priceKey: 'tile_underlay_roll',
            price: underlayPrice,
            total: underlayCost
        });
    }

    // ── Tile leveling clips (large-format tiles ≥60×60cm) ────────────────────────
    if (totalLevelingClips > 0) {
        const packs = Math.ceil(totalLevelingClips / 50); // 50 clips per pack
        const clipPrice = parseFloat(prices.tile_leveling_clips) || 250;
        const clipCost = packs * clipPrice;
        totalCost += clipCost;
        items.push({
            name: "Tile Leveling Clip System (50-pc Pack)",
            qty: packs,
            unit: 'packs',
            priceKey: 'tile_leveling_clips',
            price: clipPrice,
            total: clipCost
        });
    }

    return {
        totalArea: totalAreaM2,
        items: items,
        total: totalCost
    };
};
