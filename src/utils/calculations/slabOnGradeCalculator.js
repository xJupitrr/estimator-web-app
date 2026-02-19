
import { processSingleRun } from '../rebarUtils';
import { MATERIAL_DEFAULTS } from '../../constants/materials';

export const calculateSlabOnGrade = (slabs, prices) => {
    if (!slabs || slabs.length === 0) return null;

    let totalConcreteVolume = 0;
    let totalTiePoints = 0;
    let totalGravelBeddingVolume = 0;
    const rebarStock = new Map();
    let totalArea = 0;

    // Validation
    const validSlabs = slabs.filter(slab => {
        if (slab.isExcluded) return false;
        const L = parseFloat(slab.length);
        const W = parseFloat(slab.width);
        const T = parseFloat(slab.thickness);
        return L >= 0 && W >= 0 && T >= 0;
    });

    if (validSlabs.length === 0) return null;

    validSlabs.forEach(slab => {
        const length = parseFloat(slab.length) || 0;
        const width = parseFloat(slab.width) || 0;
        const thickness = parseFloat(slab.thickness) || 0;
        const beddingThickness = parseFloat(slab.gravelBeddingThickness) || 0;
        const spacing = parseFloat(slab.spacing) || 0.40;
        const quantity = parseInt(slab.quantity) || 1;

        const singleArea = length * width;
        const singleVol = singleArea * thickness;
        const totalVol = singleVol * quantity;

        totalConcreteVolume += totalVol;
        totalArea += (singleArea * quantity);

        const singleBeddingVol = singleArea * beddingThickness;
        totalGravelBeddingVolume += (singleBeddingVol * quantity);

        const numBarsAlongWidth = spacing > 0 ? (Math.ceil(width / spacing) + 1) : 0;
        const numBarsAlongLength = spacing > 0 ? (Math.ceil(length / spacing) + 1) : 0;

        const spec = slab.barSize; // e.g., "10mm x 6.0m"

        if (spec && spec.includes('mm')) {
            for (let q = 0; q < quantity; q++) {
                for (let i = 0; i < numBarsAlongWidth; i++) {
                    processSingleRun(length, spec, rebarStock);
                }
                for (let i = 0; i < numBarsAlongLength; i++) {
                    processSingleRun(width, spec, rebarStock);
                }
            }
        }

        const intersections = numBarsAlongWidth * numBarsAlongLength;
        totalTiePoints += (intersections * quantity);
    });

    if (totalConcreteVolume < 0) return null;

    // Concrete Mix (Standard 1:2:4 Class A)
    const V_dry_concrete = totalConcreteVolume * 1.54;
    const V_cement = V_dry_concrete * (1 / 7);
    const V_sand = V_dry_concrete * (2 / 7);
    const V_gravel = V_dry_concrete * (4 / 7);

    const CEMENT_BAG_VOLUME = 0.035;

    const finalCement = Math.ceil(V_cement / CEMENT_BAG_VOLUME * 1.05);
    const finalSand = (V_sand * 1.05).toFixed(2);
    const finalGravel = (V_gravel * 1.05).toFixed(2);

    const costCement = finalCement * (prices.cement || 0);
    const costSand = parseFloat(finalSand) * (prices.sand || 0);
    const costGravel = parseFloat(finalGravel) * (prices.gravel || 0);

    const finalGravelBedding = (totalGravelBeddingVolume * 1.05).toFixed(2);
    const costGravelBedding = parseFloat(finalGravelBedding) * (prices.gravelBeddingPrice || 0);

    let finalRebarItems = [];
    let totalRebarCost = 0;

    // BBS cut data: actual physical cut lengths per bar spec, per slab
    const slabRebarCuts = [];

    rebarStock.forEach((stock, spec) => {
        const parts = spec.split(' x ');
        const size = parts[0];
        const lengthStr = parts[1] || '6.0m';
        // ─── Use the commercial bar length the user selected ───────────────
        const stockLength = parseFloat(lengthStr.replace('m', '')) || 6.0;
        const sizeNum = parseFloat(size.replace('mm', ''));
        const diameter = sizeNum;
        // 40 × diameter in metres (lap splice)
        const spliceLen = 40 * (diameter / 1000);

        const finalQtyPurchase = stock.purchased;

        let price = 0;
        let priceKey = '';

        if (sizeNum === 10) { price = prices.rebar10mmPrice || prices.rebar || 0; priceKey = 'rebar10mmPrice'; }
        else if (sizeNum === 12) { price = prices.rebar12mmPrice || prices.rebar || 0; priceKey = 'rebar12mmPrice'; }
        else if (sizeNum === 16) { price = prices.rebar16mmPrice || prices.rebar || 0; priceKey = 'rebar16mmPrice'; }
        else { price = prices.rebar || 0; priceKey = 'rebar'; }

        const total = finalQtyPurchase * price;
        totalRebarCost += total;

        finalRebarItems.push({
            name: `Corrugated Rebar (${size} x ${lengthStr})`,
            qty: Math.ceil(finalQtyPurchase * 1.05), // 5% waste buffer
            unit: 'pcs',
            price,
            priceKey,
            total,
        });

        // ── Build BBS cut entries for this spec ────────────────────────────
        validSlabs.forEach((slab) => {
            if (!slab.barSize || slab.barSize !== spec) return;

            const L = parseFloat(slab.length) || 0;
            const W = parseFloat(slab.width) || 0;
            const spacing = parseFloat(slab.spacing) || 0.40;
            const qty = parseInt(slab.quantity) || 1;
            const label = slab.description || 'SOG';

            const numAlongWidth = spacing > 0 ? Math.ceil(W / spacing) + 1 : 0;
            const numAlongLength = spacing > 0 ? Math.ceil(L / spacing) + 1 : 0;

            /**
             * Given a span, determine the actual physical bar cut lengths
             * respecting the commercial stock bar length and 40d lap splice.
             *
             * If span ≤ stockLength  →  single straight cut = span (no splice)
             * If span > stockLength  →  series of full-bar cuts (= stockLength)
             *                           + one tail cut for the remainder
             */
            const addCuts = (span, count, direction) => {
                if (span <= 0 || count <= 0) return;
                const totalCount = count * qty;

                if (span <= stockLength) {
                    // ── No splice needed ──────────────────────────────────
                    slabRebarCuts.push({
                        spec, stockLength, diameter,
                        cutLength: Math.round(span * 1000) / 1000,
                        quantity: totalCount,
                        spliced: false,
                        label: `${label} (${direction})`,
                    });
                } else {
                    // ── Splice required ───────────────────────────────────
                    // Effective coverage per additional (non-first) bar
                    const effectivePerBar = stockLength - spliceLen;
                    if (effectivePerBar <= 0) return;

                    // Number of additional full-bars beyond the first
                    const additionalFullBars = Math.floor((span - stockLength) / effectivePerBar);

                    // Tail length = what the last (partial) bar must cover
                    const coveredByFullBars = stockLength + additionalFullBars * effectivePerBar;
                    const rawTail = span - coveredByFullBars;
                    // Add splice allowance to tail (it overlaps into the previous bar)
                    const tailCutLength = rawTail + (rawTail > 0 ? spliceLen : 0);

                    const numFullBars = 1 + additionalFullBars; // includes the very first bar

                    // Full-length bars
                    slabRebarCuts.push({
                        spec, stockLength, diameter,
                        cutLength: stockLength,
                        quantity: numFullBars * totalCount,
                        spliced: true,
                        label: `${label} ${direction} — Full Bar (${stockLength}m, 40d lap)`,
                    });

                    // Tail cut (if non-trivial)
                    if (rawTail > 0.05) {
                        slabRebarCuts.push({
                            spec, stockLength, diameter,
                            cutLength: Math.round(tailCutLength * 1000) / 1000,
                            quantity: totalCount,
                            spliced: true,
                            label: `${label} ${direction} — Tail Cut`,
                        });
                    }
                }
            };

            addCuts(L, numAlongWidth, 'Along Length');
            addCuts(W, numAlongLength, 'Along Width');
        });
    });

    const TIE_WIRE_PER_INTERSECTION = 0.04; // kg per intersection
    const finalKGPurchase = Math.ceil(totalTiePoints * TIE_WIRE_PER_INTERSECTION * 1.10); // 10% waste
    const costTieWire = finalKGPurchase * (prices.tieWire || 0);

    const totalOverallCost = costCement + costSand + costGravel + costGravelBedding + totalRebarCost + costTieWire;

    const items = [
        { name: MATERIAL_DEFAULTS.cement_40kg.name, qty: finalCement, unit: 'bags', price: prices.cement || 0, priceKey: 'cement', total: costCement },
        { name: MATERIAL_DEFAULTS.sand_wash.name, qty: finalSand, unit: 'cu.m', price: prices.sand || 0, priceKey: 'sand', total: costSand },
        { name: MATERIAL_DEFAULTS.gravel_3_4.name, qty: finalGravel, unit: 'cu.m', price: prices.gravel || 0, priceKey: 'gravel', total: costGravel },
        { name: MATERIAL_DEFAULTS.gravel_bedding.name, qty: finalGravelBedding, unit: 'cu.m', price: prices.gravelBeddingPrice || 0, priceKey: 'gravelBeddingPrice', total: costGravelBedding },
        ...finalRebarItems,
        { name: MATERIAL_DEFAULTS.tie_wire_kg.name, qty: finalKGPurchase, unit: 'kg', price: prices.tieWire || 0, priceKey: 'tieWire', total: costTieWire },
    ];

    return {
        totalVolume: totalConcreteVolume,
        totalArea: totalArea,
        quantity: slabs.length,
        items,
        total: totalOverallCost,
        slabRebarCuts, // BBS: actual physical cut lengths per bar
    };
};
