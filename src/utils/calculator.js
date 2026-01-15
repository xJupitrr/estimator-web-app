
export function calculateMaterial(item) {
    const { length = 0, width = 0, height = 0, quantity = 0, unit } = item;
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const qty = parseFloat(quantity) || 0;

    let calculatedQuantity = 0;

    switch (unit) {
        case 'cum': // Volume
            // If user inputs all 3 dims, use them. If only L, assumes others are 1? No, usually 0 means ignore?
            // For volume, we need 3 dimensions usually, OR specific logic.
            // Let's assume input is in meters.
            const vol = (l || 1) * (w || 1) * (h || 1);
            // Wait, if I have 10 items of 2x2x2, total volume is 10 * 8 = 80.
            // If height is 0, volume is 0.
            calculatedQuantity = vol * qty;
            break;
        case 'sqm': // Area
            const area = (l || 1) * (w || 1);
            calculatedQuantity = area * qty;
            break;
        case 'm': // Linear length
            // Usually just length * quantity.
            calculatedQuantity = (l || 1) * qty;
            break;
        case 'pcs':
        case 'kg': // Weight usually explicit
        case 'l':
        default:
            calculatedQuantity = qty;
            break;
    }

    // Round to 3 decimals
    calculatedQuantity = Math.round(calculatedQuantity * 1000) / 1000;

    const totalCost = calculatedQuantity * (parseFloat(item.unitPrice) || 0);

    return {
        calculatedQuantity,
        totalCost
    };
}
