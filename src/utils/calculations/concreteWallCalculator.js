import { processSingleRun, getHookLength, extractDiameterMeters } from '../rebarUtils';
import { CONCRETE_MIXES, DEFAULT_MIX } from '../../constants/concrete';

export const calculateConcreteWall = (walls, prices) => {
    if (!walls || walls.length === 0) return null;

    let totalVolume = 0;
    let totalCementBags = 0;
    let totalSandCum = 0;
    let totalGravelCum = 0;
    let totalArea = 0;
    let totalTiePoints = 0;
    const rebarStock = new Map();

    const validWalls = walls.filter(wall => {
        if (wall.isExcluded) return false;
        const L = parseFloat(wall.length);
        const H = parseFloat(wall.height);
        const T = parseFloat(wall.thickness);
        return L > 0 && H > 0 && T > 0;
    });

    if (validWalls.length === 0) return null;

    validWalls.forEach(wall => {
        const length = parseFloat(wall.length) || 0;
        const height = parseFloat(wall.height) || 0;
        const thickness = parseFloat(wall.thickness) || 0;
        const quantity = parseInt(wall.quantity) || 1;
        const layers = parseInt(wall.layers) || 2; // Default to double mat

        const singleWallArea = length * height;
        const area = singleWallArea * quantity;
        const volume = area * thickness;

        totalArea += area;
        totalVolume += volume;

        const wasteMult = 1.05;
        const mixId = wall.mix || DEFAULT_MIX;
        const mixSpec = CONCRETE_MIXES.find(m => m.id === mixId) || CONCRETE_MIXES[1];

        totalCementBags += volume * mixSpec.cement * wasteMult;
        totalSandCum += volume * mixSpec.sand * wasteMult;
        totalGravelCum += volume * mixSpec.gravel * wasteMult;

        // --- Rebar Inventory ---
        const vertSpacing = parseFloat(wall.vertSpacing) || 0.20;
        const horizSpacing = parseFloat(wall.horizSpacing) || 0.20;

        // Vertical Bars (Spaced horizontally along the length)
        const numVertRunsPerLayer = Math.floor(length / vertSpacing) + 1;
        const totalVertRuns = numVertRunsPerLayer * layers * quantity;
        const vertDia = extractDiameterMeters(wall.vertRebarSpec) * 1000;
        const vertHook = getHookLength(vertDia, 'main_90');
        const vertCutLen = height + vertHook;

        for (let i = 0; i < totalVertRuns; i++) {
            if (wall.vertRebarSpec) processSingleRun(vertCutLen, wall.vertRebarSpec, rebarStock);
        }

        // Horizontal Bars (Spaced vertically along the height)
        const numHorizRunsPerLayer = Math.floor(height / horizSpacing) + 1;
        const totalHorizRuns = numHorizRunsPerLayer * layers * quantity;
        const horizDia = extractDiameterMeters(wall.horizRebarSpec) * 1000;
        const horizHook = getHookLength(horizDia, 'main_90');
        const horizCutLen = length + (2 * horizHook);

        for (let i = 0; i < totalHorizRuns; i++) {
            if (wall.horizRebarSpec) processSingleRun(horizCutLen, wall.horizRebarSpec, rebarStock);
        }

        // --- Tie Wire ---
        // Intersection points
        const pointsPerLayer = (numVertRunsPerLayer * numHorizRunsPerLayer);
        totalTiePoints += pointsPerLayer * layers * quantity;
    });

    if (totalVolume <= 0) return null;

    const finalCement = Math.ceil(totalCementBags);
    const finalSand = totalSandCum.toFixed(2);
    const finalGravel = totalGravelCum.toFixed(2);

    // Costs
    const costCement = finalCement * (prices.cement_40kg || 0);
    const costSand = parseFloat(finalSand) * (prices.sand_wash || 0);
    const costGravel = parseFloat(finalGravel) * (prices.gravel_3_4 || 0);

    let finalRebarItems = [];
    let totalRebarCost = 0;

    rebarStock.forEach((stock, spec) => {
        const [size, lengthStr] = spec.split(' x ');
        const finalQtyPurchase = Math.ceil(stock.purchased * 1.05);
        const sizeNum = parseFloat(size.replace('mm', ''));

        let price = 0;
        let priceKey = '';

        if (sizeNum === 10) { price = prices.rebar_10mm; priceKey = 'rebar_10mm'; }
        else if (sizeNum === 12) { price = prices.rebar_12mm; priceKey = 'rebar_12mm'; }
        else if (sizeNum === 16) { price = prices.rebar_16mm; priceKey = 'rebar_16mm'; }
        else if (sizeNum === 20) { price = prices.rebar_20mm; priceKey = 'rebar_20mm'; }
        else { price = prices.rebar_12mm; priceKey = 'rebar_12mm'; } // Default

        const total = finalQtyPurchase * price;
        totalRebarCost += total;

        finalRebarItems.push({
            name: `Deformed Rebar (${size} x ${lengthStr})`,
            qty: finalQtyPurchase,
            unit: 'pcs',
            price: price,
            priceKey: priceKey,
            total: total,
        });
    });

    // Tie Wire
    const TIE_WIRE_PER_INTERSECTION = 0.35; // meters
    const METERS_PER_KG = 53;
    const totalLMTieWire = totalTiePoints * TIE_WIRE_PER_INTERSECTION;
    const finalKGPurchase = Math.ceil((totalLMTieWire / METERS_PER_KG) * 1.05);
    const costTieWire = finalKGPurchase * (prices.tie_wire_kg || 0);

    const totalOverallCost = costCement + costSand + costGravel + totalRebarCost + costTieWire;

    finalRebarItems.sort((a, b) => a.name.localeCompare(b.name));

    const items = [
        { name: 'Portland Cement (40kg)', qty: finalCement, unit: 'bags', price: prices.cement_40kg, priceKey: 'cement_40kg', total: costCement },
        { name: 'Wash Sand', qty: finalSand, unit: 'cu.m', price: prices.sand_wash, priceKey: 'sand_wash', total: costSand },
        { name: 'Crushed Gravel (3/4")', qty: finalGravel, unit: 'cu.m', price: prices.gravel_3_4, priceKey: 'gravel_3_4', total: costGravel },
        ...finalRebarItems,
        { name: 'G.I. Tie Wire (#16)', qty: finalKGPurchase, unit: 'kg', price: prices.tie_wire_kg, priceKey: 'tie_wire_kg', total: costTieWire },
    ];

    return {
        volume: totalVolume.toFixed(2),
        area: totalArea.toFixed(2),
        quantity: walls.length,
        items,
        total: totalOverallCost
    };
};
