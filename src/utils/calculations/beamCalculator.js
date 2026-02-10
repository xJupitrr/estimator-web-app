import { optimizeCuts } from '../optimization/cuttingStock';

// Constants
const CONCRETE_WASTE_PCT = 5;
const LUMBER_NAIL_WASTE = 1.10; // 10%
const PLYWOOD_WASTE = 1.15;     // 15%
const PLYWOOD_AREA_SQM = 2.9768; // 1.22m x 2.44m
const STUD_SPACING_M = 0.60;
const PROP_SPACING_M = 1.00;
const STANDARD_PROP_LENGTH_M = 3.00;
const L_ANCHOR_DEV_FACTOR = 40;

const getSkuDetails = (skuId) => {
    if (!skuId) return { diameter: 0, length: 0, priceKey: '' };
    const [diameter, length] = skuId.split('_').map(Number);
    return { diameter, length, priceKey: `rebar_${diameter}` };
};

/**
 * Calculates Lumber (BF) using Direct Counting Method
 */
export const calculateLumberVolumeBF = (beams) => {
    let totalLinearMeters_2x3 = 0;

    beams.forEach(col => {
        if (col.isExcluded) return;
        const qty = parseInt(col.quantity) || 1;
        const D_cross = parseFloat(col.width_m) || 0; // Depth
        const L_elem = parseFloat(col.height_m) || 0; // Length

        if (D_cross <= 0 || L_elem <= 0) return;

        // 1. Vertical Studs (Frame Sides)
        const numStudsPerSide = Math.ceil(L_elem / STUD_SPACING_M) + 1;
        const totalStuds = numStudsPerSide * 2;
        const linearMetersStuds = totalStuds * D_cross;

        // 2. Horizontal Walers (Frame Sides)
        let numWalersPerSide = 2;
        if (D_cross > 0.50 && D_cross <= 1.0) numWalersPerSide = 3;
        else if (D_cross > 1.0) numWalersPerSide = 4;

        const totalWalers = numWalersPerSide * 2;
        const linearMetersWalers = totalWalers * L_elem;

        // 3. Vertical Props (Bottom)
        const numPropsPerBeam = Math.ceil(L_elem / PROP_SPACING_M) + 1;
        const linearMetersProps = numPropsPerBeam * STANDARD_PROP_LENGTH_M;

        totalLinearMeters_2x3 += (linearMetersStuds + linearMetersWalers + linearMetersProps) * qty;
    });

    // 2"x3" => 0.5 BF/ft. 1m = 3.28084ft. Factor = 0.5 * 3.28084 = 1.64042
    const BF_PER_LINEAR_METER = 1.64042;
    return totalLinearMeters_2x3 * BF_PER_LINEAR_METER * LUMBER_NAIL_WASTE;
};

export const calculateBeam = (beams, prices) => {
    if (!beams || beams.length === 0) return null;

    let totalVolConcrete = 0;
    let totalAreaFormwork = 0;
    let totalCementBags = 0;
    let totalSandCum = 0;
    let totalGravelCum = 0;
    let totalTieWireKg = 0;

    // Rebar Tracking
    const rebarRequirements = {};
    const concreteCover = 0.04;
    const wireMetersPerKg = 53;

    // Helpers within calculation scope
    const addShortCutReq = (skuId, length, quantity) => {
        if (length <= 0 || quantity <= 0) return;
        const { length: commercialLength } = getSkuDetails(skuId);
        if (!rebarRequirements[skuId]) rebarRequirements[skuId] = { shortCuts: [], splicedBarsPieces: 0, commercialLength };
        rebarRequirements[skuId].shortCuts.push({ length, quantity });
    };

    const addSplicedBarReq = (skuId, totalBars) => {
        if (totalBars <= 0) return;
        const { length: commercialLength } = getSkuDetails(skuId);
        if (!rebarRequirements[skuId]) rebarRequirements[skuId] = { shortCuts: [], splicedBarsPieces: 0, commercialLength };
        rebarRequirements[skuId].splicedBarsPieces += totalBars;
    };

    beams.forEach(col => {
        if (col.isExcluded) return;
        const qty = parseInt(col.quantity) || 1;
        const W_cross = parseFloat(col.length_m) || 0; // Width
        const D_cross = parseFloat(col.width_m) || 0;  // Depth
        const L_elem = parseFloat(col.height_m) || 0;  // Length

        if (W_cross <= 0 || D_cross <= 0 || L_elem <= 0) return;

        // 1. Concrete
        const vol = W_cross * D_cross * L_elem * qty;
        totalVolConcrete += vol;
        const wasteMult = 1 + (CONCRETE_WASTE_PCT / 100);
        totalCementBags += vol * 9.0 * wasteMult;
        totalSandCum += vol * 0.5 * wasteMult;
        totalGravelCum += vol * 1.0 * wasteMult;

        // 2. Formwork Area (Sides + Bottom)
        totalAreaFormwork += (2 * D_cross * L_elem + W_cross * L_elem) * qty;

        // 3. Rebar - Main
        let mainCount = 0;
        if (col.main_rebar_cuts && col.main_rebar_cuts.length > 0) {
            col.main_rebar_cuts.forEach(cut => {
                const skuId = cut.sku;
                const count = parseInt(cut.quantity) || 0;
                let len = parseFloat(cut.length);

                if (skuId && count > 0) {
                    mainCount += count;
                    const { diameter, length: commercialLength } = getSkuDetails(skuId);
                    if (isNaN(len) || len <= 0) {
                        const mainDiaM = diameter / 1000;
                        const L_dev = L_ANCHOR_DEV_FACTOR * mainDiaM;
                        len = L_elem + (2 * L_dev);
                    }

                    if (len > commercialLength && commercialLength > 0) {
                        // Spliced
                        const mainDiaM = diameter / 1000;
                        const spliceLength = L_ANCHOR_DEV_FACTOR * mainDiaM;
                        const effectiveLengthPerAdditionalBar = commercialLength - spliceLength;
                        const barsPerRun = effectiveLengthPerAdditionalBar > 0
                            ? Math.ceil((len - commercialLength) / effectiveLengthPerAdditionalBar) + 1
                            : Math.ceil(len / commercialLength);
                        addSplicedBarReq(skuId, barsPerRun * count * qty);
                    } else {
                        addShortCutReq(skuId, len, count * qty);
                    }
                }
            });
        } else if (col.main_bar_sku) {
            // Fallback for old state
            const mainSkuDetails = getSkuDetails(col.main_bar_sku);
            const mainDiaM = mainSkuDetails.diameter / 1000;
            const L_dev = L_ANCHOR_DEV_FACTOR * mainDiaM;
            mainCount = parseInt(col.main_bar_count) || 4;
            const totalMainPieces = mainCount * qty;

            if (L_elem > mainSkuDetails.length) {
                // Spliced
                const spliceLength = L_ANCHOR_DEV_FACTOR * mainDiaM;
                const effectiveLengthPerAdditionalBar = mainSkuDetails.length - spliceLength;
                const barsPerRun = effectiveLengthPerAdditionalBar > 0
                    ? Math.ceil((L_elem - mainSkuDetails.length) / effectiveLengthPerAdditionalBar) + 1
                    : Math.ceil(L_elem / mainSkuDetails.length);
                addSplicedBarReq(col.main_bar_sku, barsPerRun * totalMainPieces);
            } else {
                // Not Spliced (Add 2x Development Length)
                addShortCutReq(col.main_bar_sku, L_elem + (2 * L_dev), totalMainPieces);
            }
        }

        // 4. Rebar - Ties
        const tieSkuDetails = getSkuDetails(col.tie_bar_sku);
        const W_tie = W_cross - (2 * concreteCover);
        const D_tie = D_cross - (2 * concreteCover);
        const hookLength = Math.max(12 * (tieSkuDetails.diameter / 1000), 0.075);
        const tieCutLength = (2 * (W_tie + D_tie)) + (2 * hookLength);

        if (W_tie > 0 && D_tie > 0) {
            const spacingM = (parseFloat(col.tie_spacing_mm) || 150) / 1000;
            const tiesPerBeam = Math.ceil(L_elem / spacingM) + 1;
            addShortCutReq(col.tie_bar_sku, tieCutLength, tiesPerBeam * qty);

            // Tie Wire calculations: calculate total number of bars passing through this tie
            const supportBarsCount = (col.cut_support_cuts || []).reduce((sum, c) => sum + (parseInt(c.quantity) || 0), 0);
            const midspanBarsCount = (col.cut_midspan_cuts || []).reduce((sum, c) => sum + (parseInt(c.quantity) || 0), 0);

            // Formula: (Main Bars + 2*Support Bars (Top) + Midspan Bars (Bottom)) * Ties * Qty
            const intersections = (mainCount + (supportBarsCount * 2) + midspanBarsCount) * tiesPerBeam * qty;
            totalTieWireKg += (intersections * 0.35) / wireMetersPerKg;
        }

        // 5. Cut Bars - Support
        if (col.cut_support_cuts && col.cut_support_cuts.length > 0) {
            col.cut_support_cuts.forEach(cutSet => {
                const skuId = cutSet.sku;
                const qtyPerPos = parseInt(cutSet.quantity) || 0;
                if (skuId && qtyPerPos > 0) {
                    const supportDetails = getSkuDetails(skuId);
                    const L_dev_sup = L_ANCHOR_DEV_FACTOR * (supportDetails.diameter / 1000);
                    const reqLen = (0.3 * L_elem) + (2 * L_dev_sup);
                    const totalPieces = qtyPerPos * qty * 2; // 2 supports

                    if (reqLen > supportDetails.length) {
                        const spliceLength = L_ANCHOR_DEV_FACTOR * (supportDetails.diameter / 1000);
                        const effectiveLengthPerAdditionalBar = supportDetails.length - spliceLength;
                        const barsPerRun = effectiveLengthPerAdditionalBar > 0
                            ? Math.ceil((reqLen - supportDetails.length) / effectiveLengthPerAdditionalBar) + 1
                            : Math.ceil(reqLen / supportDetails.length);
                        addSplicedBarReq(skuId, barsPerRun * totalPieces);
                    } else {
                        addShortCutReq(skuId, reqLen, totalPieces);
                    }
                }
            });
        }

        // 6. Cut Bars - Midspan
        if (col.cut_midspan_cuts && col.cut_midspan_cuts.length > 0) {
            col.cut_midspan_cuts.forEach(cutSet => {
                const skuId = cutSet.sku;
                const qtyPerPos = parseInt(cutSet.quantity) || 0;
                if (skuId && qtyPerPos > 0) {
                    const midDetails = getSkuDetails(skuId);
                    const L_dev_mid = L_ANCHOR_DEV_FACTOR * (midDetails.diameter / 1000);
                    const reqLen = (0.4 * L_elem) + (2 * L_dev_mid);
                    const totalPieces = qtyPerPos * qty;

                    if (reqLen > midDetails.length) {
                        const spliceLength = L_ANCHOR_DEV_FACTOR * (midDetails.diameter / 1000);
                        const effectiveLengthPerAdditionalBar = midDetails.length - spliceLength;
                        const barsPerRun = effectiveLengthPerAdditionalBar > 0
                            ? Math.ceil((reqLen - midDetails.length) / effectiveLengthPerAdditionalBar) + 1
                            : Math.ceil(reqLen / midDetails.length);
                        addSplicedBarReq(skuId, barsPerRun * totalPieces);
                    } else {
                        addShortCutReq(skuId, reqLen, totalPieces);
                    }
                }
            });
        }
    });

    // --- Finalize Quantities ---
    const items = [];
    let subTotal = 0;

    const addItem = (name, qty, unit, priceKey, priceDefault) => {
        if (qty <= 0) return;

        // Apply a soft round for display consistency if it's not an integer
        let finalQty = qty;
        if (!Number.isInteger(qty)) {
            finalQty = Math.ceil(qty * 100) / 100; // Round to 2 decimals
        }

        const price = prices[priceKey] !== undefined ? parseFloat(prices[priceKey]) : priceDefault;
        const total = finalQty * price;
        subTotal += total;
        items.push({ name, qty: finalQty, unit, priceKey, price, total });
    };

    // Concrete
    addItem("Portland Cement (40kg)", Math.ceil(totalCementBags), "bags", "cement", 240);
    addItem("Wash Sand (S1)", totalSandCum, "cu.m", "sand", 1200);
    addItem("Crushed Gravel (3/4)", totalGravelCum, "cu.m", "gravel", 1400);

    // Formworks hidden from results as per user request

    // Rebar Yield Processing
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

    return { volume: totalVolConcrete.toFixed(2), areaFormwork: totalAreaFormwork.toFixed(2), items, grandTotal: subTotal };
};
