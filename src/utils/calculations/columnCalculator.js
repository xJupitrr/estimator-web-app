
// Helper within module for now
const getSkuDetails = (skuId) => {
    if (!skuId) return { diameter: 10, length: 6.0, priceKey: 'rebar_10' };
    const [diameter, length] = skuId.split('_').map(Number);
    return {
        diameter,
        length,
        priceKey: `rebar_${diameter}`
    };
};

export const calculateColumn = (columns, prices, wastePct = 5) => {
    if (!columns || columns.length === 0) return null;

    let totalVolConcrete = 0;
    let totalCementBags = 0;
    let totalSandCum = 0;
    let totalGravelCum = 0;
    let totalTieWireKg = 0;

    const rebarRequirements = {};
    const concreteCover = 0.04;
    const wireMetersPerKg = 53;

    // Validation
    const validColumns = columns.filter(col => {
        const L = parseFloat(col.length_m);
        const W = parseFloat(col.width_m);
        const H = parseFloat(col.height_m);
        return L > 0 && W > 0 && H > 0;
    });

    if (validColumns.length === 0) return null;

    validColumns.forEach(col => {
        const qty = parseInt(col.quantity) || 1;
        const L = parseFloat(col.length_m) || 0;
        const W = parseFloat(col.width_m) || 0;
        const H = parseFloat(col.height_m) || 0;

        const mainSku = col.main_bar_sku;
        const mainCount = parseInt(col.main_bar_count) || 4;

        const tieSku = col.tie_bar_sku;
        const tieSpacing = parseFloat(col.tie_spacing_mm) || 200;

        // 1. Concrete Volume
        const volume = L * W * H * qty;
        totalVolConcrete += volume;

        const wasteMult = 1 + (wastePct / 100);

        totalCementBags += volume * 9.0 * wasteMult;
        totalSandCum += volume * 0.5 * wasteMult;
        totalGravelCum += volume * 1.0 * wasteMult;

        // 2. Main Reinforcement
        const mainSkuDetails = getSkuDetails(mainSku);
        const mainDiameter_m = mainSkuDetails.diameter / 1000;
        const L_dowel_splice = 40 * mainDiameter_m;
        let mainBarCutLength = H + L_dowel_splice; // Simplified assumption from original code

        const totalMainBarPieces = mainCount * qty;

        if (!rebarRequirements[mainSku]) {
            rebarRequirements[mainSku] = [];
        }
        rebarRequirements[mainSku].push({
            cutLength: mainBarCutLength,
            count: totalMainBarPieces
        });

        // 3. Lateral Ties
        const tieSkuDetails = getSkuDetails(tieSku);
        const tieDiameter_m = tieSkuDetails.diameter / 1000;

        const L_tie = L - (2 * concreteCover);
        const W_tie = W - (2 * concreteCover);
        const tiePerimeter = 2 * (L_tie + W_tie);
        const hookLength = Math.max(12 * tieDiameter_m, 0.075);
        let tieCutLength = tiePerimeter + (2 * hookLength);

        if (L_tie <= 0 || W_tie <= 0) tieCutLength = 0;

        const numTiesPerCol = Math.ceil((H * 1000) / tieSpacing) + 1;
        const totalTiePieces = numTiesPerCol * qty;

        if (tieCutLength > 0) {
            if (!rebarRequirements[tieSku]) {
                rebarRequirements[tieSku] = [];
            }
            rebarRequirements[tieSku].push({
                cutLength: tieCutLength,
                count: totalTiePieces
            });
        }

        // 4. Tie Wire
        const intersections = mainCount * numTiesPerCol * qty;
        const wireMeters = intersections * 0.35;
        totalTieWireKg += wireMeters / wireMetersPerKg;
    });

    const items = [];
    let subTotal = 0;

    const addItem = (name, qty, unit, priceKey, priceDefault) => {
        if (qty <= 0) return;
        const price = prices[priceKey] !== undefined ? prices[priceKey] : priceDefault;
        const total = qty * price;
        subTotal += total;
        items.push({ name, qty, unit, priceKey, price, total });
    };

    addItem("Portland Cement (40kg)", Math.ceil(totalCementBags), "bags", "cement", 240);
    addItem("Wash Sand (S1)", Math.ceil(totalSandCum * 10) / 10, "cu.m", "sand", 1200);
    addItem("Crushed Gravel (3/4)", Math.ceil(totalGravelCum * 10) / 10, "cu.m", "gravel", 1400);

    Object.keys(rebarRequirements).forEach(skuId => {
        const requirements = rebarRequirements[skuId];
        const { diameter, length: commercialLength, priceKey } = getSkuDetails(skuId);

        let totalCommercialBars = 0;

        requirements.forEach(req => {
            const { cutLength, count } = req;
            if (cutLength <= 0 || count <= 0) return;

            const piecesPerBar = Math.floor(commercialLength / cutLength);

            if (piecesPerBar > 0) {
                const barsNeededForCut = Math.ceil(count / piecesPerBar);
                totalCommercialBars += barsNeededForCut;
            } else {
                const spliceLength = 40 * (diameter / 1000);
                const effectiveLengthPerAdditionalBar = commercialLength - spliceLength;

                if (effectiveLengthPerAdditionalBar > 0) {
                    const additionalPiecesNeeded = Math.ceil((cutLength - commercialLength) / effectiveLengthPerAdditionalBar);
                    const piecesPerRun = 1 + additionalPiecesNeeded;
                    totalCommercialBars += (piecesPerRun * count);
                } else {
                    totalCommercialBars += Math.ceil(cutLength / commercialLength) * count;
                }
            }
        });

        if (totalCommercialBars > 0) {
            addItem(`Corrugated Rebar (${diameter}mm x ${commercialLength}m)`, totalCommercialBars, "pcs", priceKey, 200);
        }
    });

    addItem("G.I. Tie Wire (#16)", Math.ceil(totalTieWireKg), "kg", "tie_wire", 85);

    return {
        volume: totalVolConcrete.toFixed(2),
        items: items,
        grandTotal: subTotal
    };
};
