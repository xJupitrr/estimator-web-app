
export const rebarDiameters = ["10mm", "12mm", "16mm", "20mm"];
export const commonLengths = [6.0, 7.5, 9.0, 10.5, 12.0];
export const rebarOptions = rebarDiameters.flatMap(size =>
    commonLengths.map(length => `${size} x ${length.toFixed(1)}m`)
);

export const DECKING_OPTIONS = [
    { id: 'none', label: 'Conventional Formwork' },
    { id: 'deck_08', label: 'Steel Deck 0.80mm', width_eff: 0.9, priceKey: 'deck_08' },
    { id: 'deck_10', label: 'Steel Deck 1.00mm', width_eff: 0.9, priceKey: 'deck_10' },
    { id: 'deck_12', label: 'Steel Deck 1.20mm', width_eff: 0.9, priceKey: 'deck_12' },
];

export const FORMWORK_OPTIONS = [
    { id: 'phenolic_1_2', label: '1/2" Phenolic Board', priceKey: 'phenolic_1_2' },
    { id: 'phenolic_3_4', label: '3/4" Phenolic Board', priceKey: 'phenolic_3_4' },
    { id: 'plywood_1_2', label: '1/2" Marine Plywood', priceKey: 'plywood_1_2' },
];

export const SUPPORT_TYPES = [
    { id: 'coco_lumber', label: 'Coco Lumber Frame' },
    { id: 'gi_pipe', label: 'H-Frame Scaffolding' },
];

export const DEFAULT_PRICES = {
    cement: 245,
    sand: 1300,
    gravel: 1100,
    rebar10mm: 185,
    rebar12mm: 245,
    rebar16mm: 460,
    rebar20mm: 750,
    tieWire: 85,
    phenolic_1_2: 1400,
    phenolic_3_4: 1800,
    plywood_1_2: 950,
    cocoLumber: 45,
    deck_08: 450,
    deck_10: 550,
    deck_12: 650,
    h_frame: 1200,
    cross_brace: 450,
    u_head: 350,
    gi_pipe_1_1_2: 850,
    shackle: 65,
};

const extractLength = (spec) => parseFloat(spec.split(' x ')[1].replace('m', ''));
const extractDiameterMeters = (spec) => parseFloat(spec.split('mm')[0]) / 1000;

// NEW: Constants for precise crank calculation
const CONCRETE_COVER = 0.02; // 20mm
const CRANK_FACTOR = 0.42;   // Extra length for 45 deg bend (assuming 2 bends per crank)
const HOOK_MULTIPLIER = 12;  // 12db hook allowance

export const getSlabType = (L, W) => {
    if (!L || !W || L === 0 || W === 0) return "Unknown";
    const long = Math.max(L, W);
    const short = Math.min(L, W);
    const ratio = long / short;
    return ratio >= 2.0 ? "One-Way" : "Two-Way";
};

const processRebarRun = (requiredLength, spec, qty, rebarStock) => {
    if (requiredLength <= 0 || qty <= 0) return;

    if (!rebarStock.has(spec)) {
        rebarStock.set(spec, { purchased: 0, offcuts: [] });
    }
    const stock = rebarStock.get(spec);
    const barLength = extractLength(spec);
    const diameter = extractDiameterMeters(spec);
    const spliceLength = 40 * diameter;
    const MIN_OFFCUT = 0.1;

    for (let i = 0; i < qty; i++) {
        let currentNeeded = requiredLength + (2 * 12 * diameter); // Hook allowance approx 12db per end if needed, simplifying to 0 for slab straight bars usually, but let's add minimal cover adjustment. Actually standard cuts usually dont have hooks in middle.
        // Actually, just pure length for simplicity as per previous calculators.
        currentNeeded = requiredLength;

        // Optimization: Try offcuts first
        let bestOffcutIdx = -1;
        let minWaste = Infinity;
        stock.offcuts.forEach((off, idx) => {
            if (off >= currentNeeded && (off - currentNeeded) < minWaste) {
                minWaste = off - currentNeeded;
                bestOffcutIdx = idx;
            }
        });

        if (bestOffcutIdx !== -1) {
            const waste = stock.offcuts[bestOffcutIdx] - currentNeeded;
            stock.offcuts.splice(bestOffcutIdx, 1);
            if (waste > MIN_OFFCUT) stock.offcuts.push(waste);
        } else {
            // Need new bars
            if (currentNeeded <= barLength) {
                stock.purchased += 1;
                const waste = barLength - currentNeeded;
                if (waste > MIN_OFFCUT) stock.offcuts.push(waste);
            } else {
                // Long run with splices
                const effectiveLength = barLength - spliceLength;
                if (effectiveLength > 0) {
                    const extraPieces = Math.ceil((currentNeeded - barLength) / effectiveLength);
                    const totalPieces = 1 + extraPieces;
                    stock.purchased += totalPieces;
                    const totalReqWithSplices = currentNeeded + (extraPieces * spliceLength);
                    const totalSupplied = totalPieces * barLength;
                    const waste = totalSupplied - totalReqWithSplices;
                    if (waste > MIN_OFFCUT) stock.offcuts.push(waste);
                } else if (barLength > 0) {
                    const totalPieces = Math.ceil(currentNeeded / barLength);
                    stock.purchased += totalPieces;
                }
            }
        }
    }
};

/**
 * Calculates materials and costs for Suspended Slab.
 * @param {Array} slabs - Array of slab objects { length, width, thickness, mainBarSpec, ... }
 * @param {Object} prices - Price mapping
 * @returns {Object} Result object { volume, items, total } or null
 */
export const calculateSuspendedSlab = (slabs, prices) => {
    let totalConcreteVol = 0;
    let totalTiePoints = 0;
    const rebarStock = new Map();
    const materialCounts = {}; // Generic counter for variable price keys

    const addToMat = (key, qty, unit, name, price) => {
        if (!materialCounts[key]) materialCounts[key] = { qty: 0, unit, name, price, priceKey: key };
        materialCounts[key].qty += qty;
    };

    const invalid = slabs.some(s => !s.length || !s.width || !s.thickness);
    if (invalid) {
        return null; // Handle error in component
    }

    slabs.forEach(s => {
        if (s.isExcluded) return;
        const Q = parseFloat(s.quantity) || 0;
        const L = parseFloat(s.length) || 0;
        const W = parseFloat(s.width) || 0;
        const T = parseFloat(s.thickness) || 0;

        const type = getSlabType(L, W);
        const longSpan = Math.max(L, W);
        const shortSpan = Math.min(L, W);

        // 1. Concrete Volume
        const vol = L * W * T * Q;
        totalConcreteVol += vol;

        // 2. Decking / Formwork
        if (s.deckingType !== 'none') {
            const deckOpt = DECKING_OPTIONS.find(d => d.id === s.deckingType);
            if (deckOpt) {
                const area = L * W * Q;
                // Usually sold per linear meter, width is fixed (e.g. 0.9m)
                const effWidth = deckOpt.width_eff || 0.9;
                const linearMeters = (area / effWidth);
                addToMat(deckOpt.priceKey, linearMeters, "ln.m", `Steel Deck (${deckOpt.label})`, prices[deckOpt.priceKey]);
            }
        } else {
            // Conventional
            const formOpt = FORMWORK_OPTIONS.find(f => f.id === s.formworkType) || FORMWORK_OPTIONS[0];
            const areaSoffit = L * W * Q;
            const areaSides = 2 * (L + W) * T * Q; // Perimeter sides
            const totalFormArea = areaSoffit + areaSides;
            const sheetArea = 2.88; // 4x8 ft approx 2.97 sqm, standard 1.22x2.44 = 2.97
            const sheets = totalFormArea / 2.9768;
            addToMat(formOpt.priceKey, sheets, "sheets", formOpt.label, prices[formOpt.priceKey]);
        }

        // Lumber & Scaffolding Calculation
        const floorH = parseFloat(s.floorHeight) || 3.0;

        if (s.supportType === 'gi_pipe') {
            // GI Pipe H-Frame Scaffolding (Independent Towers Estimation)
            // Frame Size avg: 1.2m wide x 1.7m high
            // Grid: 1.2m x 1.2m
            const towersX = Math.ceil(L / 1.2);
            const towersY = Math.ceil(W / 1.2);
            const numTowers = towersX * towersY * Q;
            const layers = Math.ceil(floorH / 1.7);

            // Per Tower: 2 Frames, 2 Cross Braces (pairs) -> 4 pcs, 4 U-Heads (Top), 4 Base Jacks (Bottom - Optional/Same Price as U-Head usually)
            // Let's assume standard set: 2 Frames + 2 Braces (pair) per layer
            // U-Heads on top layer only.

            const totalFrames = numTowers * 2 * layers; // 2 frames per tower per layer
            const totalBraces = numTowers * 4 * layers; // 2 pairs (4 pcs) per tower per layer (conservative)
            const totalUHeads = numTowers * 4; // 4 legs per tower

            // Horizontal Bracing (GI Pipes) - Every 3m height or top/bottom?
            // Let's assume 1 layer of pipe bracing for stability per grid line
            const bracingLen = (towersX * 1.2 * (towersY + 1)) + (towersY * 1.2 * (towersX + 1)); // Grid lines
            const totalPipeBracing = bracingLen * Q;
            const pipes = Math.ceil(totalPipeBracing / 6.0); // 6m pipes
            const clamps = pipes * 2; // Approx 2 clamps per pipe connection

            addToMat('h_frame', totalFrames, "pcs", "H-Frame (1.7m x 1.2m)", prices.h_frame);
            addToMat('cross_brace', totalBraces, "pcs", "Cross Brace", prices.cross_brace);
            addToMat('u_head', totalUHeads, "pcs", "U-Head Jack", prices.u_head);
            addToMat('gi_pipe_1_1_2', pipes, "pcs", "G.I. Pipe 1.5\" x 6m (Horizontal Ties)", prices.gi_pipe_1_1_2);
            addToMat('shackle', clamps, "pcs", "Swivel Clamp / Shackle", prices.shackle);

        } else {
            // Default: Coco Lumber Shoring
            // 1. Vertical Posts (2"x3" used as 2x2 functionally or 2x3 structural)
            // Grid Spacing: 0.60m x 0.60m for safe load bearing of wet concrete
            const postsX = Math.ceil(L / 0.60) + 1;
            const postsY = Math.ceil(W / 0.60) + 1;
            const numPosts = postsX * postsY * Q;
            // Floor Height in feet for BF calc
            const floorH_ft = floorH * 3.28084;
            const totalBF_Posts = numPosts * ((2 * 3 * floorH_ft) / 12);

            // 2. Horizontal Stringers (Primary Supports) - 2"x3"
            // Spacing: Approx 1.2m
            const numStringers = Math.ceil(W / 1.2) + 1;
            const lenStringers_ft = (L * 3.28084);
            const totalBF_Stringers = (numStringers * Q) * ((2 * 3 * lenStringers_ft) / 12);

            // 3. Horizontal Joists (Secondary Supports) - 2"x2"
            // Spacing: 0.40m center-to-center (Typical for Plywood, maybe wider for Deck but safe estimate)
            const numJoists = Math.ceil(L / 0.40) + 1;
            const lenJoists_ft = (W * 3.28084);
            const totalBF_Joists = (numJoists * Q) * ((2 * 2 * lenJoists_ft) / 12);

            // 4. Bracing (Diagonal & Horizontal ties) - 2"x2"
            // Factor: 30% of Vertical Posts volume
            const totalBF_Bracing = totalBF_Posts * 0.30;

            const totalBF = totalBF_Posts + totalBF_Stringers + totalBF_Joists + totalBF_Bracing;

            addToMat('cocoLumber', totalBF, "BF", "Coco Lumber (Posts, Stringers, Joists)", prices.cocoLumber);
        }

        // 3. Rebar
        const mainSpacing = parseFloat(s.mainSpacing) || 0.15;
        const tempSpacing = parseFloat(s.tempSpacing) || 0.20;

        // Prepare Crank Variables
        const mainBarDia = extractDiameterMeters(s.mainBarSpec);
        const tempBarDia = extractDiameterMeters(s.tempBarSpec);
        const effectiveDepth = T - (2 * CONCRETE_COVER);

        // Formula: L + (2 * 0.42 * d) + (2 * 12db Hooks)
        const crankAddOn = effectiveDepth > 0
            ? (2 * CRANK_FACTOR * effectiveDepth) + (2 * HOOK_MULTIPLIER * mainBarDia)
            : 0;

        // Hook Allowances (Ends only)
        const mainHookAllowance = 2 * HOOK_MULTIPLIER * mainBarDia;
        const tempHookAllowance = 2 * HOOK_MULTIPLIER * tempBarDia;

        if (type === "Two-Way") {
            // Two-Way: Main bars in BOTH directions
            // 1. Direction A (Parallel to Length L, distributed along W)
            const numBarsParaL = Math.ceil(W / mainSpacing) + 1;

            // Bottom Layer (Straight + Hooks)
            processRebarRun(L + mainHookAllowance, s.mainBarSpec, numBarsParaL * Q, rebarStock);

            // Top Layer (Cranked)
            processRebarRun(L + crankAddOn, s.mainBarSpec, numBarsParaL * Q, rebarStock);

            // 2. Direction B (Parallel to Width W, distributed along L)
            const numBarsParaW = Math.ceil(L / mainSpacing) + 1;

            // Bottom Layer (Straight + Hooks)
            processRebarRun(W + mainHookAllowance, s.mainBarSpec, numBarsParaW * Q, rebarStock);

            // Top Layer (Cranked + Hooks)
            processRebarRun(W + crankAddOn, s.mainBarSpec, numBarsParaW * Q, rebarStock);

            // Tie Points
            totalTiePoints += (2 * numBarsParaL * numBarsParaW * Q);

        } else {
            // One-Way
            // Main Reinforcement is parallel to Short Span
            // Temp Reinforcement is parallel to Long Span

            // 1. Main Bars (Length = Short Span)
            // Distributed along Long Span
            const numMain = Math.ceil(longSpan / mainSpacing) + 1;

            // Bottom Layer (Straight + Hooks)
            processRebarRun(shortSpan + mainHookAllowance, s.mainBarSpec, numMain * Q, rebarStock);

            // Top Layer (Cranked + Hooks)
            processRebarRun(shortSpan + crankAddOn, s.mainBarSpec, numMain * Q, rebarStock);

            // 2. Temp Bars (Length = Long Span)
            // Distributed along Short Span
            const numTemp = Math.ceil(shortSpan / tempSpacing) + 1;
            // Add Hooks to Temp Bars
            processRebarRun(longSpan + tempHookAllowance, s.tempBarSpec, numTemp * Q, rebarStock);

            // Tie Points
            totalTiePoints += (2 * numMain * numTemp * Q);
        }
    });

    // Final Totals
    const waste = 1.05;
    const dryVol = totalConcreteVol * 1.54;
    const cementBags = Math.ceil((dryVol * (1 / 7)) / 0.035 * waste);
    const sandCuM = (dryVol * (2 / 7) * waste).toFixed(2);
    const gravelCuM = (dryVol * (4 / 7) * waste).toFixed(2);

    const items = [
        { name: "Portland Cement (40kg)", qty: cementBags, unit: "bags", price: prices.cement, priceKey: "cement" },
        { name: "Wash Sand", qty: sandCuM, unit: "cu.m", price: prices.sand, priceKey: "sand" },
        { name: "Crushed Gravel (3/4)", qty: gravelCuM, unit: "cu.m", price: prices.gravel, priceKey: "gravel" },
    ];

    // Add calculated materials (Deck, Form, Lumber)
    Object.values(materialCounts).forEach(m => {
        items.push({
            name: m.name,
            qty: Math.ceil(m.qty * waste), // Apply waste to all
            unit: m.unit,
            price: m.price,
            priceKey: m.priceKey
        });
    });

    // Add Rebar
    rebarStock.forEach((val, spec) => {
        const size = spec.split('mm')[0];
        const pKey = `rebar${size}mm`;
        items.push({
            name: `Corrugated Rebar (${spec})`,
            qty: Math.ceil(val.purchased * 1.05), // Added 5% waste buffer
            unit: "pcs",
            price: prices[pKey] || 0,
            priceKey: pKey
        });
    });

    const METERS_PER_KG = 53; // Standard #16 GI Wire
    const tieWireKg = Math.ceil((totalTiePoints * 0.3 * (1 / METERS_PER_KG)) * waste);
    items.push({ name: "G.I. Tie Wire (#16)", qty: tieWireKg, unit: "kg", price: prices.tieWire, priceKey: "tieWire" });

    const itemsWithTotal = items.map(it => ({ ...it, total: it.qty * it.price }));
    const grandTotal = itemsWithTotal.reduce((acc, it) => acc + it.total, 0);

    return {
        volume: totalConcreteVol.toFixed(2),
        items: itemsWithTotal,
        total: grandTotal
    };
};
