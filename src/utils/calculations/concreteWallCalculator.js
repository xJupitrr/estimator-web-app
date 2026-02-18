
import { processSingleRun } from '../rebarUtils';

export const calculateConcreteWall = (walls, prices) => {
    if (!walls || walls.length === 0) return null;

    let totalVolume = 0;
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
        const thickness = (parseFloat(wall.thickness) || 0) / 1000; // convert mm to m
        const quantity = parseInt(wall.quantity) || 1;
        const layers = parseInt(wall.layers) || 2; // Default to double mat

        const singleWallArea = length * height;
        const area = singleWallArea * quantity;
        const volume = area * thickness;

        totalArea += area;
        totalVolume += volume;

        // --- Rebar Inventory ---
        const vertSpacing = parseFloat(wall.vertSpacing) || 0.20;
        const horizSpacing = parseFloat(wall.horizSpacing) || 0.20;

        // Vertical Bars (Spaced horizontally along the length)
        const numVertRunsPerLayer = Math.floor(length / vertSpacing) + 1;
        const totalVertRuns = numVertRunsPerLayer * layers * quantity;

        for (let i = 0; i < totalVertRuns; i++) {
            if (wall.vertRebarSpec) processSingleRun(height, wall.vertRebarSpec, rebarStock);
        }

        // Horizontal Bars (Spaced vertically along the height)
        const numHorizRunsPerLayer = Math.floor(height / horizSpacing) + 1;
        const totalHorizRuns = numHorizRunsPerLayer * layers * quantity;

        for (let i = 0; i < totalHorizRuns; i++) {
            if (wall.horizRebarSpec) processSingleRun(length, wall.horizRebarSpec, rebarStock);
        }

        // --- Tie Wire ---
        // Intersection points
        const pointsPerLayer = (numVertRunsPerLayer * numHorizRunsPerLayer);
        totalTiePoints += pointsPerLayer * layers * quantity;
    });

    if (totalVolume <= 0) return null;

    // --- Concrete Mix Calculations (Class A 1:2:4) ---
    const CEMENT_BAG_VOLUME = 0.035;
    const DRY_VOLUME_FACTOR = 1.54; // Standard for concrete

    const V_dry = totalVolume * DRY_VOLUME_FACTOR;
    const V_cement = V_dry * (1 / 7);
    const V_sand = V_dry * (2 / 7);
    const V_gravel = V_dry * (4 / 7);

    const finalCement = Math.ceil(V_cement / CEMENT_BAG_VOLUME * 1.05); // 5% buffer
    const finalSand = (V_sand * 1.05).toFixed(2);
    const finalGravel = (V_gravel * 1.05).toFixed(2);

    // Costs
    const costCement = finalCement * (prices.cement || 0);
    const costSand = parseFloat(finalSand) * (prices.sand || 0);
    const costGravel = parseFloat(finalGravel) * (prices.gravel || 0);

    let finalRebarItems = [];
    let totalRebarCost = 0;

    rebarStock.forEach((stock, spec) => {
        const [size, lengthStr] = spec.split(' x ');
        const finalQtyPurchase = Math.ceil(stock.purchased * 1.05);
        const sizeNum = parseFloat(size.replace('mm', ''));

        let price = 0;
        let priceKey = '';

        if (sizeNum === 10) { price = prices.rebar10mmPrice; priceKey = 'rebar10mmPrice'; }
        else if (sizeNum === 12) { price = prices.rebar12mmPrice; priceKey = 'rebar12mmPrice'; }
        else if (sizeNum === 16) { price = prices.rebar16mmPrice; priceKey = 'rebar16mmPrice'; }
        else if (sizeNum === 20) { price = prices.rebar20mmPrice; priceKey = 'rebar20mmPrice'; }
        else { price = prices.rebar12mmPrice; priceKey = 'rebar12mmPrice'; } // Default

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
    const TIE_WIRE_PER_INTERSECTION = 0.4; // meters
    const METERS_PER_KG = 53;
    const totalLMTieWire = totalTiePoints * TIE_WIRE_PER_INTERSECTION;
    const finalKGPurchase = Math.ceil((totalLMTieWire / METERS_PER_KG) * 1.05);
    const costTieWire = finalKGPurchase * (prices.tieWire || 0);

    const totalOverallCost = costCement + costSand + costGravel + totalRebarCost + costTieWire;

    finalRebarItems.sort((a, b) => a.name.localeCompare(b.name));

    const items = [
        { name: 'Portland Cement (40kg)', qty: finalCement, unit: 'bags', price: prices.cement, priceKey: 'cement', total: costCement },
        { name: 'Wash Sand', qty: finalSand, unit: 'cu.m', price: prices.sand, priceKey: 'sand', total: costSand },
        { name: 'Crushed Gravel (3/4")', qty: finalGravel, unit: 'cu.m', price: prices.gravel, priceKey: 'gravel', total: costGravel },
        ...finalRebarItems,
        { name: 'G.I. Tie Wire (#16)', qty: finalKGPurchase, unit: 'kg', price: prices.tieWire, priceKey: 'tieWire', total: costTieWire },
    ];

    return {
        volume: totalVolume.toFixed(2),
        area: totalArea.toFixed(2),
        quantity: walls.length,
        items,
        total: totalOverallCost
    };
};
