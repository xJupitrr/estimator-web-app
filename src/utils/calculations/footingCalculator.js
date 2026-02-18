
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

        // Class A Concrete with 5% Waste
        const wasteMult = 1.05;
        totalCementBags += vol * 9.0 * wasteMult;
        totalSandCum += vol * 0.5 * wasteMult;
        totalGravelCum += vol * 1.0 * wasteMult;

        // Rebar
        const spec = f.rebarSpec || "12mm x 6.0m";
        const [sizeStr, lenStr] = spec.split(' x ');
        const diameter = parseInt(sizeStr);
        const commLen = parseFloat(lenStr);

        const countX = parseInt(f.rebar_x_count) || 0;
        const countY = parseInt(f.rebar_y_count) || 0;

        // Individual cut lengths with hooks (0.1m per side = 0.2m total hook)
        const cutX = X + 0.2;
        const cutY = Y + 0.2;

        const priceKey = `rebar${diameter}`;
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

    addItem("Portland Cement (40kg)", Math.ceil(totalCementBags), "bags", "cement", DEFAULT_PRICES.cement);
    addItem("Wash Sand (S1)", Math.ceil(totalSandCum * 100) / 100, "cu.m", "sand", DEFAULT_PRICES.sand);
    addItem("Crushed Gravel (3/4)", Math.ceil(totalGravelCum * 100) / 100, "cu.m", "gravel", DEFAULT_PRICES.gravel);

    Object.keys(totalRebarPcs).forEach(key => {
        const data = totalRebarPcs[key];
        addItem(data.name, data.qty, "pcs", key, DEFAULT_PRICES[key] || 200);
    });

    addItem("G.I. Tie Wire (#16)", Math.ceil(totalConcreteVol * 2), "kg", "tieWire", DEFAULT_PRICES.tieWire);

    return {
        volume: totalConcreteVol.toFixed(2),
        items: items,
        total: totalCost,
        rebarGroups: rebarGroups
    };
};
