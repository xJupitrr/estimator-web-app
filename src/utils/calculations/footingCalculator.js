import { CONCRETE_MIXES, DEFAULT_MIX } from '../../constants/concrete';
import { getHookLength } from '../rebarUtils';

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
 */
export const calculateFooting = (footings, prices) => {
    let totalConcreteVol = 0;
    let totalCementBags = 0;
    let totalSandCum = 0;
    let totalGravelCum = 0;
    let totalRebarPcs = {};
    let rebarGroups = {}; // New: Track individual cuts per specification

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

        // Individual cut lengths with hooks (Standard 90-degree hook per side)
        const hookLen = getHookLength(diameter, 'main_90');
        const cutX = X + (2 * hookLen);
        const cutY = Y + (2 * hookLen);

        const priceKey = `rebar_${diameter}mm`;
        if (!totalRebarPcs[priceKey]) {
            totalRebarPcs[priceKey] = {
                qty: 0,
                name: `Corrugated Rebar (${sizeStr})`,
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

        if (countX > 0) {
            rebarGroups[spec].cuts.push({
                length: cutX,
                quantity: countX * Q,
                label: f.description || `Footing ${f.id.toString().slice(-4)} (X)`
            });
        }
        if (countY > 0) {
            rebarGroups[spec].cuts.push({
                length: cutY,
                quantity: countY * Q,
                label: f.description || `Footing ${f.id.toString().slice(-4)} (Y)`
            });
        }

        // Existing simplified piece calculation for summary
        const totalLenX = cutX * countX * Q;
        const totalLenY = cutY * countY * Q;
        const totalPcs = Math.ceil((totalLenX + totalLenY) / commLen);
        totalRebarPcs[priceKey].qty += totalPcs;
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

    // Precision Tie Wire Calculation: (Intersections X * Y) * 0.35m per tie / 53m/kg + 5% waste
    let totalIntersections = 0;
    footings.forEach(f => {
        if (f.isExcluded) return;
        const Q = parseFloat(f.quantity) || 0;
        const nX = parseInt(f.rebar_x_count) || 0;
        const nY = parseInt(f.rebar_y_count) || 0;
        if (Q > 0 && nX > 0 && nY > 0) {
            totalIntersections += (nX * nY * Q);
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
