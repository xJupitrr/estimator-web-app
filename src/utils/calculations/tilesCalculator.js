
/**
 * Calculates materials and costs for Tile works.
 * @param {Array} areas - Array of area objects { length, width, tileDimensions... }
 * @param {Object} prices - Price mapping for consumables
 * @returns {Object} Result object { area, items, total } or null
 */

export const DEFAULT_PRICES = {
    adhesive: 850,
    grout: 120,
};

export const TILE_CONSUMABLES = [
    { id: 'adhesive', label: 'Tile Adhesive (25kg)', unit: 'bags' },
    { id: 'grout', label: 'Tile Grout (kg)', unit: 'kg' },
];

export const calculateTiles = (areas, prices) => {
    let totalAreaM2 = 0;
    let totalAdhesiveBags = 0;
    let totalGroutKg = 0;

    // Key: "Material - WxH (cm)", Value: { baseQty, price, unit, priceKey }
    const tileRequirements = new Map();

    if (!areas || areas.length === 0) return null;

    areas.forEach(area => {
        if (area.isExcluded) return;
        const x_len = parseFloat(area.length_m) || 0; // Room Length (m)
        const y_len = parseFloat(area.width_m) || 0; // Room Width (m)
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

        const fullKey = `${area.tile_size_cm} Tiles`;

        if (tileRequirements.has(fullKey)) {
            tileRequirements.set(fullKey, {
                ...tileRequirements.get(fullKey),
                baseQty: tileRequirements.get(fullKey).baseQty + totalBaseTilesForRow
            });
        } else {
            tileRequirements.set(fullKey, {
                baseQty: totalBaseTilesForRow,
                price: parseFloat(prices[`tile_${area.tile_size_cm}`]) || 150,
                unit: 'pcs',
                priceKey: `tile_${area.tile_size_cm}`
            });
        }

        // Consumables
        totalAdhesiveBags += totalRowArea / 4.0;
        totalGroutKg += totalRowArea * 0.3;
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

    const finalAdhesive = Math.ceil(totalAdhesiveBags);
    const adhesiveCost = finalAdhesive * (parseFloat(prices.adhesive) || 850);
    totalCost += adhesiveCost;
    items.push({
        name: "Tile Adhesive (25kg Bag)",
        qty: finalAdhesive,
        unit: 'bags',
        priceKey: 'adhesive',
        price: parseFloat(prices.adhesive) || 850,
        total: adhesiveCost
    });

    const finalGrout = Math.ceil(totalGroutKg);
    const groutCost = finalGrout * (parseFloat(prices.grout) || 120);
    totalCost += groutCost;
    items.push({
        name: "Tile Grout (kg)",
        qty: finalGrout,
        unit: 'kg',
        priceKey: 'grout',
        price: parseFloat(prices.grout) || 120,
        total: groutCost
    });

    return {
        totalArea: totalAreaM2,
        items: items,
        total: totalCost
    };
};
