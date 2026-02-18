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

const CONCRETE_WASTE_PCT = 5;

export const calculateColumn = (columns, prices) => {
    if (!columns || columns.length === 0) return null;

    let totalVolConcrete = 0;
    let totalCementBags = 0;
    let totalSandCum = 0;
    let totalGravelCum = 0;
    let totalTieWireKg = 0;

    const rebarRequirements = {};
    const concreteCover = 0.04;
    const wireMetersPerKg = 53;

    // Helpers within calculation scope
    const addRebarReq = (skuId, length, quantity, label) => {
        if (length <= 0 || quantity <= 0) return;
        const { diameter, length: commercialLength } = getSkuDetails(skuId);
        if (!rebarRequirements[skuId]) {
            rebarRequirements[skuId] = {
                cuts: [],
                diameter,
                commercialLength
            };
        }
        rebarRequirements[skuId].cuts.push({ length, quantity, label });
    };

    // Validation
    const validColumns = columns.filter(col => {
        if (col.isExcluded) return false;
        const L = parseFloat(col.length_m);
        const W = parseFloat(col.width_m);
        const H = parseFloat(col.height_m);
        return L > 0 && W > 0 && H > 0;
    });

    if (validColumns.length === 0) return null;

    validColumns.forEach((col, index) => {
        const qty = parseInt(col.quantity) || 1;
        const L = parseFloat(col.length_m) || 0;
        const W = parseFloat(col.width_m) || 0;
        const H = parseFloat(col.height_m) || 0;
        const colLabel = `C${index + 1}`;

        // 1. Concrete Volume
        const volume = L * W * H * qty;
        totalVolConcrete += volume;
        const wasteMult = 1 + (CONCRETE_WASTE_PCT / 100);
        totalCementBags += volume * 9.0 * wasteMult;
        totalSandCum += volume * 0.5 * wasteMult;
        totalGravelCum += volume * 1.0 * wasteMult;

        // 2. Main Reinforcement
        let mainCount = 0;
        if (col.main_rebar_cuts && col.main_rebar_cuts.length > 0 && col.main_rebar_cuts.some(c => c.sku)) {
            col.main_rebar_cuts.forEach(cutSet => {
                const skuId = cutSet.sku;
                const count = parseInt(cutSet.quantity) || 0;
                if (skuId && count > 0) {
                    mainCount += count;
                    const { diameter } = getSkuDetails(skuId);
                    let cutLen = parseFloat(cutSet.length) || 0;
                    if (cutLen <= 0) {
                        const mainDiameter_m = diameter / 1000;
                        const L_dowel_splice = L_ANCHOR_DEV_FACTOR * mainDiameter_m;
                        cutLen = H + L_dowel_splice;
                    }
                    addRebarReq(skuId, cutLen, count * qty, `${colLabel} Main`);
                }
            });
        } else if (col.main_bar_sku) {
            // Fallback for legacy data
            const skuId = col.main_bar_sku;
            const count = parseInt(col.main_bar_count) || 4;
            mainCount = count;
            const { diameter } = getSkuDetails(skuId);
            const mainDiameter_m = diameter / 1000;
            const L_dowel_splice = L_ANCHOR_DEV_FACTOR * mainDiameter_m;
            const cutLen = H + L_dowel_splice;
            addRebarReq(skuId, cutLen, count * qty, `${colLabel} Main`);
        }

        // 3. Lateral Ties
        const tieSku = col.tie_bar_sku;
        const tieSpacing = parseFloat(col.tie_spacing_mm) || 200;
        const tieSkuDetails = getSkuDetails(tieSku);
        const tieDiameter_m = (tieSkuDetails.diameter || 10) / 1000;

        const L_tie = L - (2 * concreteCover);
        const W_tie = W - (2 * concreteCover);
        const tiePerimeter = 2 * (L_tie + W_tie);
        const hookLength = Math.max(12 * tieDiameter_m, 0.075);
        let tieCutLength = tiePerimeter + (2 * hookLength);

        if (L_tie > 0 && W_tie > 0) {
            const numTiesPerCol = Math.ceil((H * 1000) / tieSpacing) + 1;
            const totalTiePieces = numTiesPerCol * qty;
            addRebarReq(tieSku, tieCutLength, totalTiePieces, `${colLabel} Tie`);

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
        const finalQty = Number.isInteger(qty) ? qty : Math.ceil(qty * 100) / 100;
        const priceValue = prices[priceKey] !== undefined ? prices[priceKey] : priceDefault;
        const price = parseFloat(priceValue) || 0;
        const total = finalQty * price;
        subTotal += total;
        items.push({ name, qty: finalQty, unit, priceKey, price, total });
    };

    addItem("Portland Cement (40kg)", Math.ceil(totalCementBags), "bags", "cement", 240);
    addItem("Wash Sand (S1)", totalSandCum, "cu.m", "sand", 1200);
    addItem("Crushed Gravel (3/4)", totalGravelCum, "cu.m", "gravel", 1400);

    // Rebar Yield Processing
    Object.keys(rebarRequirements).forEach(skuId => {
        const { cuts, diameter, commercialLength } = rebarRequirements[skuId];
        const { priceKey } = getSkuDetails(skuId);

        if (cuts.length > 0) {
            const spliceLen = 40 * (diameter / 1000); // 40d splice
            const optimization = optimizeCuts(cuts, commercialLength, 0.005, spliceLen);
            const totalBars = optimization.barsRequired;

            if (totalBars > 0) {
                const name = `Corrugated Rebar (${diameter}mm x ${commercialLength}m)`;
                const price = prices[priceKey] !== undefined ? parseFloat(prices[priceKey]) : 200;
                const total = totalBars * price;
                subTotal += total;
                items.push({
                    name,
                    qty: totalBars,
                    unit: "pcs",
                    priceKey,
                    price,
                    total,
                    optimization // Store full optimization for UI
                });
            }
        }
    });

    addItem("G.I. Tie Wire (#16)", Math.ceil(totalTieWireKg), "kg", "tie_wire", 85);

    return {
        volume: totalVolConcrete.toFixed(2),
        items: items,
        grandTotal: subTotal
    };
};
