
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
        return L > 0 && W > 0 && T > 0;
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

        const numBarsAlongWidth = Math.ceil(width / spacing) + 1;
        const numBarsAlongLength = Math.ceil(length / spacing) + 1;

        const spec = slab.barSize; // Use the selected full spec string

        if (spec) {
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

    if (totalConcreteVolume <= 0) return null;

    const V_dry_concrete = totalConcreteVolume * 1.54;
    const V_cement = V_dry_concrete * (1 / 7);
    const V_sand = V_dry_concrete * (2 / 7);
    const V_gravel = V_dry_concrete * (4 / 7);

    const CEMENT_BAG_VOLUME = 0.035;

    const finalCement = Math.ceil(V_cement / CEMENT_BAG_VOLUME * 1.05);
    const finalSand = (V_sand * 1.05).toFixed(2);
    const finalGravel = (V_gravel * 1.05).toFixed(2);

    const costCement = finalCement * prices.cement;
    const costSand = parseFloat(finalSand) * prices.sand;
    const costGravel = parseFloat(finalGravel) * prices.gravel;

    const finalGravelBedding = (totalGravelBeddingVolume * 1.05).toFixed(2);
    const costGravelBedding = parseFloat(finalGravelBedding) * prices.gravelBeddingPrice;

    let finalRebarItems = [];
    let totalRebarCost = 0;

    rebarStock.forEach((stock, spec) => {
        const [size, lengthStr] = spec.split(' x ');
        const finalQtyPurchase = stock.purchased;
        const sizeNum = parseFloat(size.replace('mm', ''));

        let price = 0;
        let priceKey = '';
        if (sizeNum === 10) { price = prices.rebar10mmPrice; priceKey = 'rebar10mmPrice'; }
        else if (sizeNum === 12) { price = prices.rebar12mmPrice; priceKey = 'rebar12mmPrice'; }
        else if (sizeNum === 16) { price = prices.rebar16mmPrice; priceKey = 'rebar16mmPrice'; }

        const total = finalQtyPurchase * price;
        totalRebarCost += total;

        finalRebarItems.push({
            name: `Corrugated Rebar (${size} x ${lengthStr})`,
            qty: Math.ceil(finalQtyPurchase * 1.05), // Added 5% waste buffer
            unit: 'pcs',
            price: price,
            priceKey: priceKey,
            total: total,
        });
    });

    const TIE_WIRE_PER_INTERSECTION = 0.3;
    const METERS_PER_KG = 53; // Standard #16 GI Wire
    const KG_PER_LM = 1 / METERS_PER_KG;

    const totalLMTieWire = totalTiePoints * TIE_WIRE_PER_INTERSECTION;
    const totalKGRequired = totalLMTieWire * KG_PER_LM;
    const finalKGPurchase = Math.ceil(totalKGRequired * 1.05);
    const costTieWire = finalKGPurchase * prices.tieWire;

    const totalOverallCost = costCement + costSand + costGravel + costGravelBedding + totalRebarCost + costTieWire;

    const items = [
        { name: MATERIAL_DEFAULTS.cement_40kg.name, qty: finalCement, unit: 'bags', price: prices.cement, priceKey: 'cement', total: costCement },
        { name: MATERIAL_DEFAULTS.sand_wash.name, qty: finalSand, unit: 'cu.m', price: prices.sand, priceKey: 'sand', total: costSand },
        { name: MATERIAL_DEFAULTS.gravel_3_4.name, qty: finalGravel, unit: 'cu.m', price: prices.gravel, priceKey: 'gravel', total: costGravel },
        { name: MATERIAL_DEFAULTS.gravel_bedding.name, qty: finalGravelBedding, unit: 'cu.m', price: prices.gravelBeddingPrice, priceKey: 'gravelBeddingPrice', total: costGravelBedding },
        ...finalRebarItems,
        { name: MATERIAL_DEFAULTS.tie_wire_kg.name, qty: finalKGPurchase, unit: 'kg', price: prices.tieWire, priceKey: 'tieWire', total: costTieWire },
    ];

    return {
        volume: totalConcreteVolume.toFixed(2),
        quantity: slabs.length,
        items,
        total: totalOverallCost
    };
};
