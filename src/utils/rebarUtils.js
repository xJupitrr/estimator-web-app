/**
 * Shared Rebar Utilities
 */

export const rebarDiameters = ["10mm", "12mm", "16mm", "20mm", "25mm", "28mm", "32mm", "36mm"];
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
 * Calculates the standard hook length allowance based on ACI/NSCP standards.
 * Includes both the bend arc and the required straight extension.
 * @param {number} diameterMm - Bar diameter in mm (e.g., 10, 12, 16, 28)
 * @param {string} type - Use case ('main_90', 'main_180', 'stirrup_135', 'stirrup_90')
 * @returns {number} Hook length in meters
 */
export const getHookLength = (diameterMm, type = 'main_90') => {
    const db = diameterMm / 1000;
    const isStirrup = type.startsWith('stirrup');
    
    // Determine the radius to the center of the bar (R_center)
    // ACI minimum inside bend diameters:
    // Stirrups/Ties: <= 16mm uses 4db (R_center = 2.5db), > 16mm uses 6db (R_center = 3.5db)
    // Main Bars: <= 25mm uses 6db (R_center = 3.5db), > 25mm uses 8db (R_center = 4.5db)
    const radiusFactor = isStirrup 
        ? (diameterMm <= 16 ? 2.5 : 3.5)
        : (diameterMm <= 25 ? 3.5 : 4.5);

    switch (type) {
        case 'main_90': {
            const arcLength = (Math.PI / 2) * radiusFactor * db;
            const extension = 12 * db;
            return arcLength + extension;
        }
        case 'main_180': {
            const arcLength = Math.PI * radiusFactor * db;
            const extension = Math.max(4 * db, 0.065);
            return arcLength + extension;
        }
        case 'stirrup_135': {
            const arcLength = (3 * Math.PI / 4) * radiusFactor * db;
            const extension = Math.max(6 * db, 0.075);
            return arcLength + extension;
        }
        case 'stirrup_90': {
            const arcLength = (Math.PI / 2) * radiusFactor * db;
            // Extension for 90-degree stirrup hook: 6db for <= 16mm, 12db for > 16mm
            const extension = diameterMm <= 16 ? (6 * db) : (12 * db);
            return arcLength + extension;
        }
        default:
            return 12 * db; // Safe fallback
    }
};

/**
 * Calculates Bend Deduction (Length reduction due to stretching during bending)
 * though in manual estimation, we usually ADD hook length to the out-to-out dimension.
 * This helper returns the extra length needed for a specific bend angle.
 */
export const getBendAllowance = (diameterMm, angleDeg, isStirrup = false) => {
    const db = diameterMm / 1000;
    const radiusFactor = isStirrup 
        ? (diameterMm <= 16 ? 2.5 : 3.5)
        : (diameterMm <= 25 ? 3.5 : 4.5);
    const arcLength = (angleDeg * Math.PI / 180) * (radiusFactor * db);
    return arcLength;
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
