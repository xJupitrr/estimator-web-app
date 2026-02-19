
import { optimizeCuts } from '../optimization/cuttingStock';

export const calculateSteelTruss = (trussParts, unitPrices) => {
    if (!trussParts || trussParts.length === 0) return null;

    const groupedItems = {}; // Key: specKey, Value: array of cuts
    let grandTotal = 0;
    let totalPieces = 0;

    // 1. Group all cuts by material specification
    trussParts.forEach(part => {
        if (part.isExcluded) return;
        const specKey = `${part.type}_${part.size}_${part.thickness}`;
        if (!groupedItems[specKey]) {
            groupedItems[specKey] = {
                specKey,
                type: part.type,
                size: part.size,
                thickness: part.thickness,
                cuts: []
            };
        }

        part.cuts.forEach(cut => {
            const len = parseFloat(cut.length);
            const qty = parseInt(cut.quantity);
            if (len > 0 && qty > 0) {
                groupedItems[specKey].cuts.push({
                    length: len,
                    quantity: qty,
                    label: part.name
                });
            }
        });
    });

    const items = [];

    // 2. Optimize each group
    Object.values(groupedItems).forEach(group => {
        if (group.cuts.length === 0) return;

        // Run Optimization
        const optimization = optimizeCuts(group.cuts, 6.0, 0.005); // 6m stock, 5mm kerf

        const piecesRequired = optimization.barsRequired;
        const unitPrice = parseFloat(unitPrices[group.specKey]) || 0;
        const cost = piecesRequired * unitPrice;

        grandTotal += cost;
        totalPieces += piecesRequired;

        items.push({
            name: `${group.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - ${group.size}`,
            specs: `${group.thickness} THK`,
            qty: piecesRequired,
            unit: 'pcs (6m)',
            price: unitPrice,
            priceKey: group.specKey,
            total: cost,
            optimization: optimization, // Store full optimization result for modal
            rawGroup: group
        });
    });

    if (items.length === 0) return null;

    return {
        items,
        total: grandTotal,
        totalPieces: totalPieces
    };
};
