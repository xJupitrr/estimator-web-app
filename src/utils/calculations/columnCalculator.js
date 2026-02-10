import { optimizeCuts } from '../optimization/cuttingStock';

// Constants
const L_ANCHOR_DEV_FACTOR = 40;

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
        if (col.isExcluded) return false;
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

        const addsShortCutReq = (skuId, length, quantity) => {
            if (length <= 0 || quantity <= 0) return;
            const { length: commercialLength } = getSkuDetails(skuId);
            if (!rebarRequirements[skuId]) rebarRequirements[skuId] = { shortCuts: [], splicedBarsPieces: 0, commercialLength };
            rebarRequirements[skuId].shortCuts.push({ length, quantity });
        };

        const addsSplicedBarReq = (skuId, totalBars) => {
            if (totalBars <= 0) return;
            const { length: commercialLength } = getSkuDetails(skuId);
            if (!rebarRequirements[skuId]) rebarRequirements[skuId] = { shortCuts: [], splicedBarsPieces: 0, commercialLength };
            rebarRequirements[skuId].splicedBarsPieces += totalBars;
        };

        // 1. Concrete Volume
        const volume = L * W * H * qty;
        totalVolConcrete += volume;
        const wasteMult = 1 + (wastePct / 100);
        totalCementBags += volume * 9.0 * wasteMult;
        totalSandCum += volume * 0.5 * wasteMult;
        totalGravelCum += volume * 1.0 * wasteMult;

        // 2. Main Reinforcement
        let mainCount = 0;
        if (col.main_rebar_cuts && col.main_rebar_cuts.length > 0) {
            col.main_rebar_cuts.forEach(cutSet => {
                const skuId = cutSet.sku;
                const count = parseInt(cutSet.quantity) || 0;
                if (skuId && count > 0) {
                    mainCount += count;
                    const { diameter, length: commercialLength } = getSkuDetails(skuId);
                    const mainDiameter_m = diameter / 1000;
                    const L_dowel_splice = L_ANCHOR_DEV_FACTOR * mainDiameter_m;
                    const cutLen = H + L_dowel_splice;

                    if (cutLen > commercialLength && commercialLength > 0) {
                        const spliceLength = L_ANCHOR_DEV_FACTOR * mainDiameter_m;
                        const effectiveLengthPerAdditionalBar = commercialLength - spliceLength;
                        const barsPerRun = effectiveLengthPerAdditionalBar > 0
                            ? Math.ceil((cutLen - commercialLength) / effectiveLengthPerAdditionalBar) + 1
                            : Math.ceil(cutLen / commercialLength);
                        addsSplicedBarReq(skuId, barsPerRun * count * qty);
                    } else {
                        addsShortCutReq(skuId, cutLen, count * qty);
                    }
                }
            });
        } else if (col.main_bar_sku) {
            const skuId = col.main_bar_sku;
            const count = parseInt(col.main_bar_count) || 4;
            mainCount = count;
            const { diameter, length: commercialLength } = getSkuDetails(skuId);
            const mainDiameter_m = diameter / 1000;
            const L_dowel_splice = L_ANCHOR_DEV_FACTOR * mainDiameter_m;
            const cutLen = H + L_dowel_splice;

            if (cutLen > commercialLength && commercialLength > 0) {
                const spliceLength = L_ANCHOR_DEV_FACTOR * mainDiameter_m;
                const effectiveLengthPerAdditionalBar = commercialLength - spliceLength;
                const barsPerRun = effectiveLengthPerAdditionalBar > 0
                    ? Math.ceil((cutLen - commercialLength) / effectiveLengthPerAdditionalBar) + 1
                    : Math.ceil(cutLen / commercialLength);
                addsSplicedBarReq(skuId, barsPerRun * count * qty);
            } else {
                addsShortCutReq(skuId, cutLen, count * qty);
            }
        }

        // 3. Lateral Ties
        const tieSku = col.tie_bar_sku;
        const tieSpacing = parseFloat(col.tie_spacing_mm) || 200;
        const tieSkuDetails = getSkuDetails(tieSku);
        const tieDiameter_m = tieSkuDetails.diameter / 1000;

        const L_tie = L - (2 * concreteCover);
        const W_tie = W - (2 * concreteCover);
        const tiePerimeter = 2 * (L_tie + W_tie);
        const hookLength = Math.max(12 * tieDiameter_m, 0.075);
        let tieCutLength = tiePerimeter + (2 * hookLength);

        if (L_tie > 0 && W_tie > 0) {
            const numTiesPerCol = Math.ceil((H * 1000) / tieSpacing) + 1;
            const totalTiePieces = numTiesPerCol * qty;
            addsShortCutReq(tieSku, tieCutLength, totalTiePieces);

            // 4. Tie Wire
            const intersections = mainCount * numTiesPerCol * qty;
            const wireMeters = intersections * 0.35;
            totalTieWireKg += wireMeters / wireMetersPerKg;
        }
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
        const { shortCuts, splicedBarsPieces, commercialLength } = rebarRequirements[skuId];
        const { diameter, priceKey } = getSkuDetails(skuId);

        let totalBars = splicedBarsPieces;

        if (shortCuts.length > 0) {
            // Optimize all short cuts for this SKU
            const optimization = optimizeCuts(shortCuts, commercialLength, 0.005);
            totalBars += optimization.barsRequired;
        }

        if (totalBars > 0) addItem(`Corrugated Rebar (${diameter}mm x ${commercialLength}m)`, totalBars, "pcs", priceKey, 200);
    });

    addItem("G.I. Tie Wire (#16)", Math.ceil(totalTieWireKg), "kg", "tie_wire", 85);

    return {
        volume: totalVolConcrete.toFixed(2),
        items: items,
        grandTotal: subTotal
    };
};
