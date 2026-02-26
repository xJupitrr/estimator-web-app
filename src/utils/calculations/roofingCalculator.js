
const ROOFING_TYPES = [
    { id: 'rib_type', label: 'Rib-Type (Long Span)', eff_width: 1.0, default_price: 480 },
    { id: 'corrugated', label: 'Corrugated (Standard)', eff_width: 0.76, default_price: 380 },
    { id: 'tile_span', label: 'Tile Span (Premium)', eff_width: 1.0, default_price: 550 },
    { id: 'gi_sheet', label: 'G.I. Sheet (Plain)', eff_width: 0.80, default_price: 450 },
];

export const calculateRoofing = (rows, prices, settings) => {
    if (!rows || rows.length === 0) return null;

    let totalSheetsCount = 0;
    let totalAreaRaw = 0;
    const typeGroups = {};
    let isValid = false;

    rows.forEach(row => {
        if (row.isExcluded) return;
        const Q = parseInt(row.quantity) || 0;
        const L = parseFloat(row.length_m) || 0;
        const W = parseFloat(row.width_m) || 0;
        const typeId = row.type;
        const typeSpec = ROOFING_TYPES.find(t => t.id === typeId) || ROOFING_TYPES[0];
        const effWidth = typeSpec.eff_width;

        if (Q > 0 && L > 0 && W > 0) {
            isValid = true;
            const sheetsRequired = Math.ceil(W / effWidth);
            const rowLinearMeters = sheetsRequired * L * Q;

            totalSheetsCount += sheetsRequired * Q;
            totalAreaRaw += (L * W) * Q;

            if (!typeGroups[typeId]) {
                typeGroups[typeId] = {
                    linearMeters: 0,
                    spec: typeSpec,
                    area: 0
                };
            }
            typeGroups[typeId].linearMeters += rowLinearMeters;
            typeGroups[typeId].area += (L * W) * Q;
        }
    });

    if (!isValid) return null;

    const wasteMultiplier = 1 + (parseFloat(settings.wasteFactor) / 100);

    const finalItems = [];
    let grandTotal = 0;
    let totalLM_AllTypes = 0;

    // 1. Process Groups
    Object.keys(typeGroups).forEach(typeId => {
        const group = typeGroups[typeId];
        const finalLM = Math.ceil(group.linearMeters * wasteMultiplier);
        const priceKey = typeId === 'gi_sheet' ? 'roof_corrugated' : `roof_${typeId}`;
        const price = prices[priceKey] || group.spec.default_price;
        const total = finalLM * price;

        grandTotal += total;
        totalLM_AllTypes += finalLM;

        finalItems.push({
            name: `Roof Sheets (${group.spec.label})`,
            qty: finalLM,
            unit: "LM",
            priceKey: priceKey,
            price: price,
            total: total
        });
    });

    // 2. Tek Screws
    const fastenersCount = Math.ceil(totalLM_AllTypes * 5);
    const screwPrice = prices.roof_tekscrew || 0;
    const screwTotal = fastenersCount * screwPrice;
    grandTotal += screwTotal;

    finalItems.push({
        name: "Tek Screws (Estimate)",
        qty: fastenersCount,
        unit: "pcs",
        priceKey: "roof_tekscrew",
        price: screwPrice,
        total: screwTotal
    });

    return {
        area: totalAreaRaw.toFixed(2),
        items: finalItems,
        grandTotal: grandTotal,
        totalSheets: totalSheetsCount
    };
};
