import { processSingleRun, getHookLength, extractDiameterMeters } from '../rebarUtils';
import { CONCRETE_MIXES, DEFAULT_MIX } from '../../constants/concrete';

export const calculateMasonry = (walls, wallPrices) => {
    if (!walls || walls.length === 0) return null;

    let totalArea = 0;
    let totalChbCount = 0;

    // Separating volumes based on material type
    let totalVolumeMortarPlaster = 0; // Uses Cement and Sand only
    let totalVolumeGroutFiller = 0;   // Uses Cement, Sand, and Gravel
    let totalTiePoints = 0;

    let totalCementBagsGrout = 0;
    let totalSandCumGrout = 0;
    let totalGravelCumGrout = 0;

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

        // TRUE GEOMETRIC MORTAR VOLUME
        // Standard joint thickness = 10mm. Block tiling pitch = 0.41m (L) × 0.21m (H).
        // Block net height (excluding bed joint above) = 0.19m.
        // Block depth varies by CHB size (nominal in meters):
        const CHB_DEPTHS = { "4": 0.100, "5": 0.125, "6": 0.150, "8": 0.200 };
        const JOINT_T = 0.010;       // 10mm joint thickness
        const TILE_L = 0.41;        // block length + joint (m)
        const TILE_H = 0.21;        // block height + joint (m)
        const BLK_H_NET = 0.19;      // block net height (no joint, m)
        const depth = CHB_DEPTHS[wall.chbSize] || 0.100;

        // Bed joints  : t × depth × (courses/m) × Area
        const V_bed = JOINT_T * depth * (1 / TILE_H) * area;
        // Head joints : t × BLK_H_NET × depth × (joints/m²) × Area
        //   joints/m² = (1/TILE_L) per course × (1/TILE_H) courses/m
        const V_head = JOINT_T * BLK_H_NET * depth * (1 / (TILE_L * TILE_H)) * area;
        const volumeMortarLaying = V_bed + V_head;

        // Plaster: user-defined thickness (mm) per exposed side
        const plasterSidesCount = parseInt(wall.plasterSides) || 0;

        // Helper: compute plaster wet->dry->cement/sand for one side config
        const addPlasterSide = (thicknessMm, mixStr) => {
            const thickM = (parseFloat(thicknessMm) || 10) / 1000;
            const vol = area * thickM;
            const [pC, pS] = (mixStr || '1:3').split(':').map(Number);
            const pTotal = (!isNaN(pC) && !isNaN(pS)) ? pC + pS : 4;
            const dry = vol * 1.25;
            totalCementBagsGrout += dry * (pC / pTotal) / 0.035;
            totalSandCumGrout += dry * (pS / pTotal);
        };

        if (plasterSidesCount === 1) {
            addPlasterSide(wall.plasterThickness, wall.plasterMix);
        } else if (plasterSidesCount === 2) {
            addPlasterSide(wall.plasterThickness, wall.plasterMix);   // Side A
            addPlasterSide(wall.plasterThicknessB, wall.plasterMixB);  // Side B
        }

        // Grout Filler (for cores) — scales with core volume per m²
        // 4" = 0.005, 5" = 0.0065, 6" = 0.010, 8" = 0.015
        const groutFactors = { "4": 0.005, "5": 0.0065, "6": 0.010, "8": 0.015 };
        const groutFactor = groutFactors[wall.chbSize] || 0.005;
        const currentGroutVolume = area * groutFactor;
        // Accumulate Grout (Cement + Sand + Gravel)
        totalVolumeGroutFiller += currentGroutVolume;

        const mixId = wall.mix || DEFAULT_MIX;
        const mixSpec = CONCRETE_MIXES.find(m => m.id === mixId) || CONCRETE_MIXES[1];

        // 1.05 is the waste factor (standardized)
        totalCementBagsGrout += currentGroutVolume * mixSpec.cement;
        totalSandCumGrout += currentGroutVolume * mixSpec.sand;
        totalGravelCumGrout += currentGroutVolume * mixSpec.gravel;

        // --- 3. Rebar Inventory ---
        const parsedVertSpacing = parseFloat(wall.vertSpacing) || 0.60;
        const parsedHorizSpacing = parseFloat(wall.horizSpacing) || 0.60;

        const numHorizRuns = Math.floor(height / parsedVertSpacing) + 1;
        const horizDia = extractDiameterMeters(wall.horizRebarSpec) * 1000;
        const horizHook = getHookLength(horizDia, 'main_90');
        const horizCut = length + (2 * horizHook);

        for (let q = 0; q < quantity; q++) {
            for (let i = 0; i < numHorizRuns; i++) {
                if (wall.horizRebarSpec) processSingleRun(horizCut, wall.horizRebarSpec, rebarStock);
            }
        }

        const numVertRuns = Math.floor(length / parsedHorizSpacing) + 1;
        const vertDia = extractDiameterMeters(wall.vertRebarSpec) * 1000;
        const vertHook = getHookLength(vertDia, 'main_180');
        const vertCut = height + vertHook;

        for (let q = 0; q < quantity; q++) {
            for (let i = 0; i < numVertRuns; i++) {
                if (wall.vertRebarSpec) processSingleRun(vertCut, wall.vertRebarSpec, rebarStock);
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

    // 2. Grout Mix (Dynamic based on each wall selection)
    // totalCementBagsGrout, totalSandCumGrout, totalGravelCumGrout are already calculated in bags/m3

    // 3. Totals
    const totalCementBags = (V_cement_mortar / CEMENT_BAG_VOLUME) + totalCementBagsGrout;
    const totalSandVolume = V_sand_mortar + totalSandCumGrout;
    const totalGravelVolume = totalGravelCumGrout; // Only from grout

    // Final Material Quantities (5% allowance added implicitly via Math.ceil/rounding)
    const finalCement = Math.ceil(totalCementBags * 1.05); // bags + 5% allowance
    const finalSand = (totalSandVolume * 1.05).toFixed(2); // m³ + 5% allowance
    const finalGravel = (totalGravelVolume * 1.05).toFixed(2); // m³ + 5% allowance

    // --- Cost Calculation ---
    const chbKeyMap = { "4": "chb_4", "5": "chb_5", "6": "chb_6", "8": "chb_8" };
    const chbKey = chbKeyMap[walls[0]?.chbSize] || "chb_4";
    const costCHB = totalChbCount * (wallPrices[chbKey] || 0);
    const costCement = finalCement * wallPrices.cement_40kg;
    const costSand = parseFloat(finalSand) * wallPrices.sand_wash;
    const costGravel = parseFloat(finalGravel) * wallPrices.gravel_3_4;
    const totalCementitiousCost = costCement + costSand + costGravel;

    let finalRebarItems = [];
    let totalRebarCost = 0;

    rebarStock.forEach((stock, spec) => {
        const [size, lengthStr] = spec.split(' x ');
        const finalQtyPurchase = Math.ceil(stock.purchased * 1.05); // Added 5% waste buffer
        const is10mm = parseFloat(size.replace('mm', '')) === 10;

        let priceKey, price, name;

        if (is10mm) {
            priceKey = 'rebar_10mm';
            price = wallPrices[priceKey] || 180;
            name = `Corrugated Rebar (10mm x ${lengthStr})`;
        } else {
            priceKey = 'rebar_12mm';
            price = wallPrices[priceKey] || 260;
            name = `Corrugated Rebar (12mm x ${lengthStr})`;
        }

        const total = finalQtyPurchase * price;
        totalRebarCost += total;

        finalRebarItems.push({
            name: name,
            qty: finalQtyPurchase,
            unit: 'pcs',
            price: price,
            priceKey: priceKey, // Key for editable logic
            total: total,
        });
    });

    const TIE_WIRE_PER_INTERSECTION = 0.35;
    const METERS_PER_KG = 53; // Standard #16 GI Wire
    const KG_PER_LM = 1 / METERS_PER_KG;
    const totalLMTieWire = totalTiePoints * TIE_WIRE_PER_INTERSECTION;
    const totalKGRequired = totalLMTieWire * KG_PER_LM;
    const finalKGPurchase = Math.ceil(totalKGRequired * 1.05); // 5% allowance
    const costTieWire = finalKGPurchase * wallPrices.tie_wire_kg;

    const totalOverallCost = costCHB + totalCementitiousCost + totalRebarCost + costTieWire;

    const firstWallSize = walls[0]?.chbSize;
    const chbName = firstWallSize === "4" ? 'Concrete Hollow Blocks (4")' : 'Concrete Hollow Blocks (6")';

    finalRebarItems.sort((a, b) => a.name.localeCompare(b.name));

    const items = [
        { name: chbName, qty: totalChbCount, unit: 'pcs', price: wallPrices[chbKey], priceKey: chbKey, total: costCHB },
        { name: 'Portland Cement (40kg)', qty: finalCement, unit: 'bags', price: wallPrices.cement_40kg, priceKey: 'cement_40kg', total: costCement },
        { name: 'Wash Sand (S1)', qty: finalSand, unit: 'cu.m', price: wallPrices.sand_wash, priceKey: 'sand_wash', total: costSand },
        { name: 'Crushed Gravel (3/4)', qty: finalGravel, unit: 'cu.m', price: wallPrices.gravel_3_4, priceKey: 'gravel_3_4', total: costGravel },

        ...finalRebarItems,

        { name: 'G.I. Tie Wire (#16)', qty: finalKGPurchase, unit: 'kg', price: wallPrices.tie_wire_kg, priceKey: 'tie_wire_kg', total: costTieWire },
    ];

    return {
        area: totalArea.toFixed(2),
        quantity: walls.length,
        items,
        total: totalOverallCost
    };
};
