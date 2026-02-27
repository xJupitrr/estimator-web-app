import { CONCRETE_MIXES, DEFAULT_MIX } from '../../constants/concrete';
import { getHookLength } from '../rebarUtils';

// Constants
const CONCRETE_WASTE_PCT = 5;
const L_ANCHOR_DEV_FACTOR = 40;
const BEARING_LENGTH = 0.20; // 200mm bearing each side (Total 400mm added to opening width)

const getSkuDetails = (skuId) => {
    if (!skuId) return { diameter: 0, length: 0, priceKey: '' };
    const [diameter, length] = skuId.split('_').map(Number);
    // priceKey includes commercial length so different bar sizes have distinct prices
    return { diameter, length, priceKey: `rebar_${diameter}mm_${length}m` };
};

export const calculateLintelBeam = (inputs, prices, specs = null) => {
    // Determine if inputs is raw doorsWindowsItems or pre-processed lintelBeams
    // For Global Recalculation, we might pass doorsWindowsItems + specs.
    // For Component usage, we might pass lintelBeams (already transformed).

    // We will normalize to lintelBeams list.
    let lintelBeams = [];

    // Check if the input looks like the raw raw doorsWindows items
    // (Optimization: we can check if it has 'openingType' vs 'itemType' or check args)

    if (specs) {
        // Assume inputs is doorsWindowsItems and we need to transform
        const depth = parseFloat(specs.lintelDepth) || 0.15;
        lintelBeams = inputs
            .filter(item => item && item.width_m && item.height_m)
            .map(item => ({
                id: item.id,
                openingType: item.itemType || 'Opening',
                openingWidth: parseFloat(item.width_m) || 0,
                openingHeight: parseFloat(item.height_m) || 0,
                quantity: parseInt(item.quantity) || 1,
                lintelWidth: (parseFloat(item.width_m) || 0) + (2 * BEARING_LENGTH),
                lintelDepth: depth,
                mainBarSku: specs.mainBarSku,
                mainBarCount: parseInt(specs.mainBarCount) || 2,
                tieSku: specs.tieSku,
                tieSpacing: parseInt(specs.tieSpacing) || 150, // mm
                mix: specs.mix || DEFAULT_MIX,
            }));
    } else {
        // Assume inputs is already lintelBeams (Component usage might prefer this if it does useMemo locally)
        // OR we can just standardise on ALWAYS passing raw + specs.
        // Let's support pre-processed for now if the component keeps its useMemo.
        lintelBeams = inputs;
    }

    if (!lintelBeams || lintelBeams.length === 0) return null;

    let totalVolConcrete = 0;
    let totalCementBags = 0;
    let totalSandCum = 0;
    let totalGravelCum = 0;
    let totalTieWireKg = 0;

    const rebarRequirements = {};
    const concreteCover = 0.025; // 25mm for lintels
    const wireMetersPerKg = 53;

    const addRebarReq = (skuId, cutLength, count) => {
        if (cutLength <= 0 || count <= 0) return;
        const { length: commercialLength } = getSkuDetails(skuId);
        if (!rebarRequirements[skuId]) rebarRequirements[skuId] = { cuts: [], commercialLength };
        rebarRequirements[skuId].cuts.push({ cutLength, count });
    };

    lintelBeams.forEach(lintel => {
        const qty = lintel.quantity;
        const W = lintel.lintelWidth;
        const D = lintel.lintelDepth;
        // Accessing lintelHeight ?? The component uses specs.lintelHeight derived globally for all rows?
        // Wait, looking at LintelBeam.jsx, `height` comes from `parseFloat(specs.lintelHeight)`.
        // The `lintel` object constructed in component DOES NOT have `lintelHeight`.
        // So we need to pass `lintelHeight` somehow if we use the pre-processed list,
        // OR we just use the `specs` object if available.

        let H = 0.20; // Default
        if (specs && specs.lintelHeight) {
            H = parseFloat(specs.lintelHeight);
        } else if (lintel.lintelHeight) {
            H = lintel.lintelHeight;
        }

        const L = lintel.openingWidth + (2 * BEARING_LENGTH);

        if (W <= 0 || D <= 0 || L <= 0) return;

        // 1. Concrete
        const vol = W * D * H * qty;
        totalVolConcrete += vol;

        const wasteMult = 1.05;
        const mixId = lintel.mix || DEFAULT_MIX;
        const mixSpec = CONCRETE_MIXES.find(m => m.id === mixId) || CONCRETE_MIXES[1];

        totalCementBags += vol * mixSpec.cement * wasteMult;
        totalSandCum += vol * mixSpec.sand * wasteMult;
        totalGravelCum += vol * mixSpec.gravel * wasteMult;

        // 2. Main Rebar
        const mainSkuDetails = getSkuDetails(lintel.mainBarSku);
        const mainDiaM = mainSkuDetails.diameter / 1000;
        const L_dev = L_ANCHOR_DEV_FACTOR * mainDiaM;
        const mainCutLength = L + (2 * L_dev);
        const totalMainBars = lintel.mainBarCount * qty;
        addRebarReq(lintel.mainBarSku, mainCutLength, totalMainBars);

        // 3. Ties/Stirrups
        const tieSkuDetails = getSkuDetails(lintel.tieSku);
        const H_tie = H - (2 * concreteCover);
        const D_tie = D - (2 * concreteCover);
        const hookLength = getHookLength(tieSkuDetails.diameter, 'stirrup_135');
        const tieCutLength = (2 * (H_tie + D_tie)) + (2 * hookLength);

        if (H_tie > 0 && D_tie > 0) {
            const spacingM = lintel.tieSpacing / 1000;
            const tiesPerBeam = Math.ceil(L / spacingM) + 1;
            addRebarReq(lintel.tieSku, tieCutLength, tiesPerBeam * qty);

            // Tie Wire
            const intersections = lintel.mainBarCount * tiesPerBeam * qty;
            // 1.05 is the 5% waste factor
            totalTieWireKg += (intersections * 0.35) / wireMetersPerKg * 1.05;
        }
    });

    // --- Finalize Quantities ---
    const items = [];
    let subTotal = 0;

    const addItem = (name, qty, unit, priceKey, priceDefault) => {
        if (qty <= 0) return;
        const finalQty = Number.isInteger(qty) ? qty : Math.ceil(qty * 100) / 100;
        const price = prices[priceKey] !== undefined ? parseFloat(prices[priceKey]) : priceDefault;
        const total = finalQty * price;
        subTotal += total;
        items.push({ name, qty: finalQty, unit, priceKey, price, total });
    };

    // Concrete
    addItem("Portland Cement (40kg)", Math.ceil(totalCementBags), "bags", "cement_40kg", 240);
    addItem("Wash Sand (S1)", totalSandCum, "cu.m", "sand_wash", 1200);
    addItem("Crushed Gravel (3/4)", totalGravelCum, "cu.m", "gravel_3_4", 1400);

    // Rebar
    Object.keys(rebarRequirements).forEach(skuId => {
        const { cuts, commercialLength } = rebarRequirements[skuId];
        const { diameter, priceKey } = getSkuDetails(skuId);

        let totalBars = 0;
        cuts.forEach(({ cutLength, count }) => {
            const yieldPerBar = Math.floor(commercialLength / cutLength);
            if (yieldPerBar > 0) {
                totalBars += Math.ceil(count / yieldPerBar);
            } else {
                const spliceLength = 40 * (diameter / 1000); // 40d splice length in meters
                const effectiveLengthPerAdditionalBar = commercialLength - spliceLength;
                if (effectiveLengthPerAdditionalBar > 0) {
                    const piecesPerRun = Math.ceil((cutLength - commercialLength) / effectiveLengthPerAdditionalBar) + 1;
                    totalBars += (piecesPerRun * count);
                } else {
                    totalBars += Math.ceil(cutLength / commercialLength) * count;
                }
            }
        });

        if (totalBars > 0) addItem(`Corrugated Rebar (${diameter}mm x ${commercialLength}m)`, totalBars, "pcs", priceKey, 200);
    });

    addItem("G.I. Tie Wire (#16)", Math.ceil(totalTieWireKg), "kg", "tie_wire_kg", 85);

    return { volume: totalVolConcrete.toFixed(3), items, grandTotal: subTotal };
};
