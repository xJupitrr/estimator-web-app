/**
 * Shared Rebar Utilities
 */

export const rebarDiameters = ["10mm", "12mm", "16mm", "20mm", "25mm"];
export const commonLengths = [6.0, 7.5, 9.0, 10.5, 12.0];

export const extractLength = (spec) => {
    if (!spec) return 6.0;
    try {
        return parseFloat(spec.split(' x ')[1].replace('m', ''));
    } catch (e) {
        return 6.0;
    }
};

export const extractDiameterMeters = (spec) => {
    if (!spec) return 0.01;
    try {
        return parseFloat(spec.split('mm')[0]) / 1000;
    } catch (e) {
        return 0.01;
    }
};

/**
 * Processes a single continuous rebar run against inventory stock.
 * Handles splicing for long runs and offcut reuse for short runs.
 */
export const processSingleRun = (requiredLength, spec, rebarStock) => {
    if (requiredLength <= 0) return;

    if (!rebarStock.has(spec)) {
        rebarStock.set(spec, { purchased: 0, offcuts: [] });
    }
    const stock = rebarStock.get(spec);

    const barLength = extractLength(spec);
    const diameter = extractDiameterMeters(spec);
    const spliceLength = 40 * diameter;
    const MIN_OFFCUT_LENGTH = 0.05;

    // --- Case 1: Long Run (Requires splicing) ---
    if (requiredLength > barLength) {
        const effectiveLengthPerAdditionalBar = barLength - spliceLength;
        const remainingLength = requiredLength - barLength;
        let totalPieces = 1;

        if (effectiveLengthPerAdditionalBar > 0) {
            const additionalPieces = Math.ceil(remainingLength / effectiveLengthPerAdditionalBar);
            totalPieces = 1 + additionalPieces;
        } else {
            totalPieces = Math.ceil(requiredLength / barLength);
        }

        const totalPurchasedLength = totalPieces * barLength;
        const numSplices = totalPieces - 1;
        const totalRequiredEffectiveLength = requiredLength + (numSplices * spliceLength);
        const wasteLength = totalPurchasedLength - totalRequiredEffectiveLength;

        stock.purchased += totalPieces;
        if (wasteLength > MIN_OFFCUT_LENGTH) {
            stock.offcuts.push(wasteLength);
        }
    }
    // --- Case 2: Short Run (Offcut Reuse Heuristic) ---
    else {
        let bestFitIndex = -1;
        let smallestWaste = Infinity;

        stock.offcuts.forEach((offcutLength, index) => {
            if (offcutLength >= requiredLength) {
                const waste = offcutLength - requiredLength;
                if (waste < smallestWaste) {
                    smallestWaste = waste;
                    bestFitIndex = index;
                }
            }
        });

        if (bestFitIndex !== -1) {
            const originalOffcutLength = stock.offcuts[bestFitIndex];
            stock.offcuts.splice(bestFitIndex, 1);
            const newRemainder = originalOffcutLength - requiredLength;
            if (newRemainder > MIN_OFFCUT_LENGTH) {
                stock.offcuts.push(newRemainder);
            }
        } else {
            stock.purchased += 1;
            const remainder = barLength - requiredLength;
            if (remainder > MIN_OFFCUT_LENGTH) {
                stock.offcuts.push(remainder);
            }
        }
    }
};
