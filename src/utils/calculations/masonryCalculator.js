import { processSingleRun, getHookLength, extractDiameterMeters } from '../rebarUtils';
import { CONCRETE_MIXES, DEFAULT_MIX } from '../../constants/concrete';

export const calculateMasonry = (walls, wallPrices) => {
    if (!walls || walls.length === 0) return null;

    let totalArea = 0;
    let totalChbCount = 0;

    let totalCementBagsGrout = 0;
    let totalSandS2CumTotal = 0;     // S2 — mortar laying + plaster coats
    let totalSandS1CumGrout = 0;     // S1 — core grout fill (concrete mix)
    let totalGravelCumGrout = 0;
    let totalTiePoints = 0;

    const rebarStock = new Map();

    // Validation Check
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
        const CHB_DEPTHS = { "4": 0.100, "5": 0.125, "6": 0.150, "8": 0.200 };
        const JOINT_T = 0.010;       // 10mm joint thickness
        const TILE_L = 0.41;        // block length + joint (m)
        const TILE_H = 0.21;        // block height + joint (m)
        const BLK_H_NET = 0.19;      // block net height (no joint, m)
        const depth = CHB_DEPTHS[wall.chbSize] || 0.100;

        // Bed joints
        const V_bed = JOINT_T * depth * (1 / TILE_H) * area;
        // Head joints
        const V_head = JOINT_T * BLK_H_NET * depth * (1 / (TILE_L * TILE_H)) * area;
        const volumeMortarLaying = V_bed + V_head;

        // Mortar for joint laying — 1:3 mix
        const MORTAR_MIX_RATIO = 1 / 4;
        const SAND_MIX_RATIO = 3 / 4;
        const V_dry_joint = volumeMortarLaying * 1.25; // wet → dry
        totalCementBagsGrout += V_dry_joint * MORTAR_MIX_RATIO / 0.035;
        totalSandS2CumTotal += V_dry_joint * SAND_MIX_RATIO;

        // Plastering
        const plasterSidesCount = parseInt(wall.plasterSides) || 0;

        const addPlasterSide = (thicknessMm, mixStr) => {
            const thickM = (parseFloat(thicknessMm) || 10) / 1000;
            const vol = area * thickM;
            const [pC, pS] = (mixStr || '1:3').split(':').map(Number);
            const pTotal = (!isNaN(pC) && !isNaN(pS)) ? pC + pS : 4;
            const dry = vol * 1.25;
            totalCementBagsGrout += dry * (pC / pTotal) / 0.035;
            totalSandS2CumTotal += dry * (pS / pTotal);
        };

        if (plasterSidesCount === 1) {
            addPlasterSide(wall.plasterThickness, wall.plasterMix);
        } else if (plasterSidesCount === 2) {
            addPlasterSide(wall.plasterThickness, wall.plasterMix);
            addPlasterSide(wall.plasterThicknessB, wall.plasterMixB);
        }

        // Grout Filler
        const groutFactors = { "4": 0.005, "5": 0.0065, "6": 0.010, "8": 0.015 };
        const groutFactor = groutFactors[wall.chbSize] || 0.005;
        const currentGroutVolume = area * groutFactor;

        const mixId = wall.mix || DEFAULT_MIX;
        const mixSpec = CONCRETE_MIXES.find(m => m.id === mixId) || CONCRETE_MIXES[1];

        totalCementBagsGrout += currentGroutVolume * mixSpec.cement;
        totalSandS1CumGrout += currentGroutVolume * mixSpec.sand;
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

        const currentTiePoints = area * (1 / (parsedVertSpacing || 0.6) * (1 / (parsedHorizSpacing || 0.6)));
        totalTiePoints += currentTiePoints;
    });

    // Totals
    const finalCement = Math.ceil(totalCementBagsGrout * 1.05);
    const finalSandS2 = (totalSandS2CumTotal * 1.05).toFixed(2);
    const finalSandS1 = (totalSandS1CumGrout * 1.05).toFixed(2);
    const finalGravel = (totalGravelCumGrout * 1.05).toFixed(2);

    // Cost Calculation
    const chbKeyMap = { "4": "chb_4", "5": "chb_5", "6": "chb_6", "8": "chb_8" };
    const chbKey = chbKeyMap[validWalls[0].chbSize] || "chb_4";
    const costCHB = totalChbCount * (wallPrices[chbKey] || 0);
    const costCement = finalCement * (wallPrices.cement_40kg || 240);
    const costSandS2 = parseFloat(finalSandS2) * (wallPrices.sand_plastering || 1100);
    const costSandS1 = parseFloat(finalSandS1) * (wallPrices.sand_wash || 1200);
    const costGravel = parseFloat(finalGravel) * (wallPrices.gravel_3_4 || 1400);

    let finalRebarItems = [];
    let totalRebarCost = 0;

    rebarStock.forEach((stock, spec) => {
        const [size, lengthStr] = spec.split(' x ');
        const finalQtyPurchase = Math.ceil(stock.purchased * 1.05);
        const is10mm = parseFloat(size.replace('mm', '')) === 10;

        let priceKey = is10mm ? 'rebar_10mm' : 'rebar_12mm';
        let price = wallPrices[priceKey] || (is10mm ? 180 : 260);
        let name = `Corrugated Rebar (${is10mm ? '10mm' : '12mm'} x ${lengthStr})`;

        const total = finalQtyPurchase * price;
        totalRebarCost += total;

        finalRebarItems.push({
            name: name,
            qty: finalQtyPurchase,
            unit: 'pcs',
            price: price,
            priceKey: priceKey,
            total: total
        });
    });

    const TIE_WIRE_PER_INTERSECTION = 0.35;
    const METERS_PER_KG = 53;
    const finalKGPurchase = Math.ceil((totalTiePoints * TIE_WIRE_PER_INTERSECTION / METERS_PER_KG) * 1.05);
    const costTieWire = finalKGPurchase * (wallPrices.tie_wire_kg || 120);

    const totalOverallCost = costCHB + costCement + costSandS2 + costSandS1 + costGravel + totalRebarCost + costTieWire;

    const firstWallSize = validWalls[0].chbSize;
    const chbName = `Concrete Hollow Blocks (${firstWallSize}")`;

    finalRebarItems.sort((a, b) => a.name.localeCompare(b.name));

    const items = [
        { name: chbName, qty: totalChbCount, unit: 'pcs', price: wallPrices[chbKey], priceKey: chbKey, total: costCHB },
        { name: 'Portland Cement (40kg)', qty: finalCement, unit: 'bags', price: wallPrices.cement_40kg, priceKey: 'cement_40kg', total: costCement },
        ...(parseFloat(finalSandS2) > 0 ? [{ name: 'Plastering Sand (S2)', qty: finalSandS2, unit: 'cu.m', price: wallPrices.sand_plastering || 1100, priceKey: 'sand_plastering', total: costSandS2 }] : []),
        ...(parseFloat(finalSandS1) > 0 ? [{ name: 'Wash Sand (S1)', qty: finalSandS1, unit: 'cu.m', price: wallPrices.sand_wash, priceKey: 'sand_wash', total: costSandS1 }] : []),
        { name: 'Crushed Gravel (3/4)', qty: finalGravel, unit: 'cu.m', price: wallPrices.gravel_3_4, priceKey: 'gravel_3_4', total: costGravel },
        ...finalRebarItems,
        { name: 'G.I. Tie Wire (#16)', qty: finalKGPurchase, unit: 'kg', price: wallPrices.tie_wire_kg, priceKey: 'tie_wire_kg', total: costTieWire },
    ];

    return {
        area: totalArea.toFixed(2),
        quantity: validWalls.length,
        items,
        total: totalOverallCost
    };
};
