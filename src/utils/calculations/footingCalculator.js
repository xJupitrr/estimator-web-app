import { CONCRETE_MIXES, DEFAULT_MIX } from '../../constants/concrete';
import { getHookLength, getBendAllowance } from '../rebarUtils';

export const DEFAULT_PRICES = {
    cement: 240,
    sand: 1200,
    gravel: 1400,
    rebar10: 180,
    rebar12: 240,
    rebar16: 450,
    rebar20: 720,
    rebar25: 1100,
    tieWire: 110,
};

/**
 * Calculates materials and costs for Footings.
 *
 * 1-Layer: Standard mat — straight bars with 90° hooks each end.
 *   X-bar length = X + 2*hookLen
 *   Y-bar length = Y + 2*hookLen
 *   Total bars   = countX + countY
 *
 * 2-Layer (continuous elevation loop / hairpin bar):
 *   Each bar forms a closed rectangle in ELEVATION (side view):
 *     bottom leg → 90°bend up → vertical leg → 90°bend → top leg → 90°bend down → vertical leg → close
 *   Loop length  = 2*span + 2*(Z − 2*cover) + 4*bend_allowance(90°)
 *   Total bars   = countX + countY  (one loop replaces the bottom+top bar pair)
 *   Cover assumed = 75mm each face (standard footing clear cover)
 */
export const calculateFooting = (footings, prices) => {
    let totalConcreteVol = 0;
    let totalCementBags = 0;
    let totalSandCum = 0;
    let totalGravelCum = 0;
    let totalRebarPcs = {};
    let rebarGroups = {}; // Track individual cuts per specification

    if (!footings || footings.length === 0) return null;

    footings.forEach(f => {
        if (f.isExcluded) return;
        const Q = parseFloat(f.quantity) || 0;
        const X = parseFloat(f.x_len) || 0;
        const Y = parseFloat(f.y_len) || 0;
        const Z = parseFloat(f.z_depth) || 0;

        if (X <= 0 || Y <= 0 || Z <= 0) return;

        const vol = X * Y * Z * Q;
        totalConcreteVol += vol;

        // Fetch Mix Proportions
        const mixId = f.mix || DEFAULT_MIX;
        const mixSpec = CONCRETE_MIXES.find(m => m.id === mixId) || CONCRETE_MIXES[1]; // Fallback to Class A

        const wasteMult = 1.05;
        totalCementBags += vol * mixSpec.cement * wasteMult;
        totalSandCum += vol * mixSpec.sand * wasteMult;
        totalGravelCum += vol * mixSpec.gravel * wasteMult;

        // Rebar
        const spec = f.rebarSpec || "12mm x 6.0m";
        const [sizeStr, lenStr] = spec.split(' x ');
        const diameter = parseInt(sizeStr);
        const commLen = parseFloat(lenStr);

        const countX = parseInt(f.rebar_x_count) || 0;
        const countY = parseInt(f.rebar_y_count) || 0;
        const layers = parseInt(f.rebar_layers) || 1;

        const priceKey = `rebar_${diameter}mm`;
        if (!totalRebarPcs[priceKey]) {
            totalRebarPcs[priceKey] = {
                qty: 0,
                name: `Corrugated Rebar(${sizeStr})`,
                size: diameter
            };
        }

        // Tracking cuts for optimization
        if (!rebarGroups[spec]) {
            rebarGroups[spec] = {
                type: 'rebar',
                size: sizeStr,
                thickness: '', // Not applicable but matching steel truss structure
                specKey: priceKey,
                stockLength: commLen,
                cuts: []
            };
        }

        const label = f.description || `Footing ${f.id.toString().slice(-4)}`;
        const hookLen = getHookLength(diameter, 'main_90');
        const bendAllow = getBendAllowance(diameter, 90, false);

        if (layers === 2) {
            // ---- 2-LAYER: CONTINUOUS ELEVATION LOOPS (HAIRPIN BARS) ----
            // Each bar is a closed rectangular loop when viewed from the side:
            //   [bottom mat leg] → 90°up → [vertical leg] → 90°horiz → [top mat leg] → 90°down → [vertical leg] → close (with hooks)
            //
            // Bar length = 2*span + 2*matSep + 4*bendAllow(90°) + 2*hookLen(90°)
            //              ↑ straight legs  ↑ vert legs  ↑ 4 corner bends  ↑ hooks at closure/lap ends
            //   where matSep = Z − 2*cover (75mm standard clear cover each face)
            //
            // Bar COUNT = countX + countY (one loop replaces the bottom+top bar pair per direction)
            const COVER = 0.075; // 75mm clear cover for footings cast against earth
            const matSep = Math.max(0.05, Z - 2 * COVER);

            const cutX_loop = 2 * X + 2 * matSep + 4 * bendAllow + 2 * hookLen;
            const cutY_loop = 2 * Y + 2 * matSep + 4 * bendAllow + 2 * hookLen;

            if (countX > 0) {
                rebarGroups[spec].cuts.push({
                    length: cutX_loop,
                    quantity: countX * Q,
                    label: `${label} (X-loop)`
                });
            }
            if (countY > 0) {
                rebarGroups[spec].cuts.push({
                    length: cutY_loop,
                    quantity: countY * Q,
                    label: `${label} (Y-loop)`
                });
            }

            const totalLenX_loop = cutX_loop * countX * Q;
            const totalLenY_loop = cutY_loop * countY * Q;
            const totalPcs = Math.ceil((totalLenX_loop + totalLenY_loop) / commLen);
            totalRebarPcs[priceKey].qty += totalPcs;

        } else {
            // ---- 1-LAYER: STRAIGHT BARS WITH 90° HOOKS ----
            const cutX = X + (2 * hookLen);
            const cutY = Y + (2 * hookLen);

            if (countX > 0) {
                rebarGroups[spec].cuts.push({
                    length: cutX,
                    quantity: countX * Q,
                    label: `${label} (X)`
                });
            }
            if (countY > 0) {
                rebarGroups[spec].cuts.push({
                    length: cutY,
                    quantity: countY * Q,
                    label: `${label} (Y)`
                });
            }

            const totalLenX = cutX * countX * Q;
            const totalLenY = cutY * countY * Q;
            const totalPcs = Math.ceil((totalLenX + totalLenY) / commLen);
            totalRebarPcs[priceKey].qty += totalPcs;
        }
    });

    if (totalConcreteVol <= 0) return null;

    const items = [];
    let totalCost = 0;

    const addItem = (name, qty, unit, priceKey, defaultPrice) => {
        const price = parseFloat(prices[priceKey]) || defaultPrice;
        const total = qty * price;
        totalCost += total;
        items.push({ name, qty, unit, priceKey, price, total });
    };

    addItem("Portland Cement (40kg)", Math.ceil(totalCementBags), "bags", "cement_40kg", 240);
    addItem("Wash Sand (S1)", Math.ceil(totalSandCum * 100) / 100, "cu.m", "sand_wash", 1200);
    addItem("Crushed Gravel (3/4)", Math.ceil(totalGravelCum * 100) / 100, "cu.m", "gravel_3_4", 1400);

    Object.keys(totalRebarPcs).forEach(key => {
        const data = totalRebarPcs[key];
        addItem(data.name, data.qty, "pcs", key, DEFAULT_PRICES[key] || 200);
    });

    // Tie Wire Calculation
    // 1 layer: nX * nY intersections per footing
    // 2 layers: intersections * 2 (each intersection is doubled in a 2-layer mat)
    let totalIntersections = 0;
    footings.forEach(f => {
        if (f.isExcluded) return;
        const Q = parseFloat(f.quantity) || 0;
        const nX = parseInt(f.rebar_x_count) || 0;
        const nY = parseInt(f.rebar_y_count) || 0;
        const layers = parseInt(f.rebar_layers) || 1;
        if (Q > 0 && nX > 0 && nY > 0) {
            if (layers === 2) {
                // Intersections within each layer + inter-layer ties
                totalIntersections += (nX * nY * 2 * Q);
            } else {
                totalIntersections += (nX * nY * Q);
            }
        }
    });

    const tieWireWeight = (totalIntersections * 0.35) / 53 * 1.05;
    addItem("G.I. Tie Wire (#16)", Math.ceil(tieWireWeight), "kg", "tie_wire_kg", 85);

    return {
        volume: totalConcreteVol.toFixed(2),
        items: items,
        total: totalCost,
        rebarGroups: rebarGroups
    };
};
