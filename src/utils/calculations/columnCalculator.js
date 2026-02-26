import { optimizeCuts } from '../optimization/cuttingStock';
import { MATERIAL_DEFAULTS } from '../../constants/materials';
import { CONCRETE_MIXES, DEFAULT_MIX } from '../../constants/concrete';
import { getHookLength } from '../rebarUtils';

// Constants
const L_ANCHOR_DEV_FACTOR = 40;

// Helper within module for now
const getSkuDetails = (skuId) => {
    if (!skuId) return { diameter: 10, length: 6.0, priceKey: 'rebar_10' };
    const [diameter, length] = skuId.split('_').map(Number);
    return {
        diameter,
        length,
        priceKey: `rebar_${diameter}mm`
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

        // Fetch Mix Proportions
        const mixId = col.mix || DEFAULT_MIX;
        const mixSpec = CONCRETE_MIXES.find(m => m.id === mixId) || CONCRETE_MIXES[1]; // Fallback to Class A

        totalCementBags += volume * mixSpec.cement * wasteMult;
        totalSandCum += volume * mixSpec.sand * wasteMult;
        totalGravelCum += volume * mixSpec.gravel * wasteMult;

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
                        const L_footing_hook = getHookLength(diameter, 'main_90');
                        cutLen = H + L_dowel_splice + L_footing_hook;
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
            const L_footing_hook = getHookLength(diameter, 'main_90');
            const cutLen = H + L_dowel_splice + L_footing_hook;
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
        const hookLength = getHookLength(tieSkuDetails.diameter, 'stirrup_135');
        let tieCutLength = tiePerimeter + (2 * hookLength);

        if (L_tie > 0 && W_tie > 0) {
            const numTiesPerCol = Math.ceil((H * 1000) / tieSpacing) + 1;
            const totalTiePieces = numTiesPerCol * qty;
            addRebarReq(tieSku, tieCutLength, totalTiePieces, `${colLabel} Tie`);

            // 4. Tie Wire — 0.35m of wire per main-bar/tie intersection
            // Each tie has mainCount corner points; totalTiePieces ties per group of columns
            const intersections = totalTiePieces * mainCount;
            const wireMeters = intersections * 0.35;
            // 1.05 is the 5% waste factor
            totalTieWireKg += (wireMeters / wireMetersPerKg) * 1.05;
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

    addItem(MATERIAL_DEFAULTS.cement_40kg.name, Math.ceil(totalCementBags), "bags", "cement_40kg", 240);
    addItem(MATERIAL_DEFAULTS.sand_wash.name, totalSandCum, "cu.m", "sand_wash", 1200);
    addItem(MATERIAL_DEFAULTS.gravel_3_4.name, totalGravelCum, "cu.m", "gravel_3_4", 1400);

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

    addItem(MATERIAL_DEFAULTS.tie_wire_kg.name, Math.ceil(totalTieWireKg), "kg", "tie_wire_kg", 85);

    return {
        volume: totalVolConcrete.toFixed(2),
        items: items,
        grandTotal: subTotal
    };
};
