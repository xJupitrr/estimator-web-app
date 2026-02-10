
import { processSingleRun } from '../rebarUtils';

export const calculateMasonry = (walls, wallPrices) => {
    if (!walls || walls.length === 0) return null;

    let totalArea = 0;
    let totalChbCount = 0;

    // Separating volumes based on material type
    let totalVolumeMortarPlaster = 0; // Uses Cement and Sand only
    let totalVolumeGroutFiller = 0;   // Uses Cement, Sand, and Gravel
    let totalTiePoints = 0;

    const rebarStock = new Map();

    // Validation Check handled by caller or generic check
    const validWalls = walls.filter(wall => {
        if (wall.isExcluded) return false;
        const L = parseFloat(wall.length);
        const H = parseFloat(wall.height);
        return L > 0 && H > 0;
    });

    if (validWalls.length === 0) return null;

    validWalls.forEach(wall => {
        const length = parseFloat(wall.length) || 0;
        const height = parseFloat(wall.height) || 0;
        const quantity = parseInt(wall.quantity) || 1;

        const singleWallArea = length * height;
        const area = singleWallArea * quantity;

        totalArea += area;

        // --- 1. CHB Count ---
        const blockLengthTiled = 0.41;
        const blockHeightTiled = 0.21;

        const numBlocksLength = Math.ceil(length / blockLengthTiled);
        const numBlocksHeight = Math.ceil(height / blockHeightTiled);

        const chbCount = (numBlocksLength * numBlocksHeight) * quantity;
        totalChbCount += chbCount;

        // --- 2. Volume Calculation (Wet Volume) ---
        const sides = parseInt(wall.plasterSides) || 0;

        // Laying Mortar (Standard factor ~0.015 m³/m²)
        const volumeMortarLaying = area * 0.015;
        // Plaster (Standard 10mm thickness: 0.01 m³/m² per side)
        const volumePlaster = area * sides * 0.01;
        // Accumulate Mortar & Plaster (Cement + Sand only)
        totalVolumeMortarPlaster += volumeMortarLaying + volumePlaster;

        // Grout Filler (for cores) - (4" CHB: ~0.005 m³/m² | 6" CHB: ~0.01 m³/m²)
        const groutFactor = wall.chbSize === "4" ? 0.005 : 0.01;
        const currentGroutVolume = area * groutFactor;
        // Accumulate Grout (Cement + Sand + Gravel)
        totalVolumeGroutFiller += currentGroutVolume;

        // --- 3. Rebar Inventory ---
        const parsedVertSpacing = parseFloat(wall.vertSpacing) || 0.60;
        const parsedHorizSpacing = parseFloat(wall.horizSpacing) || 0.60;

        const numHorizRuns = Math.floor(height / parsedVertSpacing) + 1;
        for (let q = 0; q < quantity; q++) {
            for (let i = 0; i < numHorizRuns; i++) {
                if (wall.horizRebarSpec) processSingleRun(length, wall.horizRebarSpec, rebarStock);
            }
        }

        const numVertRuns = Math.floor(length / parsedHorizSpacing) + 1;
        for (let q = 0; q < quantity; q++) {
            for (let i = 0; i < numVertRuns; i++) {
                if (wall.vertRebarSpec) processSingleRun(height, wall.vertRebarSpec, rebarStock);
            }
        }

        // --- 4. Tie Wire ---
        const safeVertSpacing = parsedVertSpacing > 0 ? parsedVertSpacing : 0.60;
        const safeHorizSpacing = parsedHorizSpacing > 0 ? parsedHorizSpacing : 0.60;
        const currentTiePoints = area * (1 / (safeVertSpacing * safeHorizSpacing));
        totalTiePoints += currentTiePoints;
    });

    if (totalArea <= 0) return null;

    // --- FINAL AGGREGATE CALCULATIONS (Separated by Mix) ---

    // Constants for volumetric conversion
    const CEMENT_BAG_VOLUME = 0.035; // Volume of 1 bag (40kg) of cement in m³
    const MORTAR_YIELD_FACTOR = 1.25; // Dry volume yield factor for mortar
    const GROUT_YIELD_FACTOR = 1.5;   // Dry volume yield factor for grout

    // 1. Mortar/Plaster Mix (C:S = 1:3) -> Uses Cement and Sand
    const V_dry_mortar = totalVolumeMortarPlaster * MORTAR_YIELD_FACTOR;
    const V_cement_mortar = V_dry_mortar * (1 / 4);
    const V_sand_mortar = V_dry_mortar * (3 / 4);

    // 2. Grout Mix (C:S:G = 1:2:4) -> Uses Cement, Sand, and Gravel
    const V_dry_grout = totalVolumeGroutFiller * GROUT_YIELD_FACTOR;
    const V_cement_grout = V_dry_grout * (1 / 7);
    const V_sand_grout = V_dry_grout * (2 / 7);
    const V_gravel_grout = V_dry_grout * (4 / 7);

    // 3. Totals
    const totalCementVolume = V_cement_mortar + V_cement_grout;
    const totalSandVolume = V_sand_mortar + V_sand_grout;
    const totalGravelVolume = V_gravel_grout; // Only from grout

    // Final Material Quantities (5% allowance added implicitly via Math.ceil/rounding)
    const finalCement = Math.ceil(totalCementVolume / CEMENT_BAG_VOLUME * 1.05); // bags + 5% allowance
    const finalSand = (totalSandVolume * 1.05).toFixed(2); // m³ + 5% allowance
    const finalGravel = (totalGravelVolume * 1.05).toFixed(2); // m³ + 5% allowance

    // --- Cost Calculation ---
    const costCHB = totalChbCount * wallPrices.chb;
    const costCement = finalCement * wallPrices.cement;
    const costSand = parseFloat(finalSand) * wallPrices.sand;
    const costGravel = parseFloat(finalGravel) * wallPrices.gravel;
    const totalCementitiousCost = costCement + costSand + costGravel;

    let finalRebarItems = [];
    let totalRebarCost = 0;

    rebarStock.forEach((stock, spec) => {
        const [size, lengthStr] = spec.split(' x ');
        const finalQtyPurchase = Math.ceil(stock.purchased * 1.05); // Added 5% waste buffer
        const is10mm = parseFloat(size.replace('mm', '')) === 10;

        const price = is10mm ? wallPrices.rebar10mmPrice : wallPrices.rebar12mmPrice;
        const priceKey = is10mm ? 'rebar10mmPrice' : 'rebar12mmPrice';

        const total = finalQtyPurchase * price;
        totalRebarCost += total;

        finalRebarItems.push({
            name: `Corrugated Rebar (${size} x ${lengthStr})`,
            qty: finalQtyPurchase,
            unit: 'pcs',
            price: price,
            priceKey: priceKey, // Key for editable logic
            total: total,
        });
    });

    const TIE_WIRE_PER_INTERSECTION = 0.4;
    const METERS_PER_KG = 53; // Standard #16 GI Wire
    const KG_PER_LM = 1 / METERS_PER_KG;
    const totalLMTieWire = totalTiePoints * TIE_WIRE_PER_INTERSECTION;
    const totalKGRequired = totalLMTieWire * KG_PER_LM;
    const finalKGPurchase = Math.ceil(totalKGRequired * 1.05); // 5% allowance
    const costTieWire = finalKGPurchase * wallPrices.tieWire;

    const totalOverallCost = costCHB + totalCementitiousCost + totalRebarCost + costTieWire;

    const firstWallSize = walls[0]?.chbSize;
    const chbName = firstWallSize === "4" ? 'Concrete Hollow Blocks (4")' : 'Concrete Hollow Blocks (6")';

    finalRebarItems.sort((a, b) => a.name.localeCompare(b.name));

    const items = [
        { name: chbName, qty: totalChbCount, unit: 'pcs', price: wallPrices.chb, priceKey: 'chb', total: costCHB },
        { name: 'Portland Cement (40kg)', qty: finalCement, unit: 'bags', price: wallPrices.cement, priceKey: 'cement', total: costCement },
        { name: 'Wash Sand (S1)', qty: finalSand, unit: 'cu.m', price: wallPrices.sand, priceKey: 'sand', total: costSand },
        { name: 'Crushed Gravel (3/4)', qty: finalGravel, unit: 'cu.m', price: wallPrices.gravel, priceKey: 'gravel', total: costGravel },

        ...finalRebarItems,

        { name: 'G.I. Tie Wire (#16)', qty: finalKGPurchase, unit: 'kg', price: wallPrices.tieWire, priceKey: 'tieWire', total: costTieWire },
    ];

    return {
        area: totalArea.toFixed(2),
        quantity: walls.length,
        items,
        total: totalOverallCost
    };
};
