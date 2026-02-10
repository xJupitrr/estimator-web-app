/**
 * 1D Cutting Stock Optimization Tool
 * Uses First Fit Decreasing (FFD) heuristic for bin packing.
 * 
 * @param {Array} items - Array of { length: number, quantity: number, label: string }
 * @param {number} stockLength - Length of the stock material (default 6.0m)
 * @param {number} kerf - Width of the saw blade cut (default 0.005m / 5mm)
 * @param {number} spliceLength - Overlap length required for segments (e.g., 40d for rebar)
 * @returns {Object} { barsRequired: number, patterns: Array, efficiency: number, wasteTotal: number }
 */
export const optimizeCuts = (items, stockLength = 6.0, kerf = 0.005, spliceLength = 0) => {
    // 1. Expand items into individual cuts
    let allCuts = [];
    items.forEach(item => {
        const qty = parseInt(item.quantity) || 0;
        const len = parseFloat(item.length) || 0;
        if (qty > 0 && len > 0) {
            for (let i = 0; i < qty; i++) {
                if (len > stockLength) {
                    // Splicing logic with Overlap
                    // Formula: totalPieces = 1 + ceil((TotalLength - StockLength) / (StockLength - Overlap))
                    const effectiveLengthPerBar = stockLength - spliceLength;
                    let totalPieces = 1;

                    if (effectiveLengthPerBar > 0) {
                        const additionalPieces = Math.ceil((len - stockLength) / effectiveLengthPerBar);
                        totalPieces = 1 + additionalPieces;
                    } else {
                        // Fallback if splice >= stock (physically impossible but prevents infinity)
                        totalPieces = Math.ceil(len / stockLength);
                    }

                    let remainingLengthToCover = len;
                    for (let p = 1; p <= totalPieces; p++) {
                        let pieceLength;
                        if (p === 1) {
                            pieceLength = stockLength;
                            remainingLengthToCover -= stockLength;
                        } else if (p === totalPieces) {
                            // Last piece covers remaining PLUS its own overlap with previous
                            pieceLength = remainingLengthToCover + spliceLength;
                        } else {
                            // Intermediate pieces extend reach by effective length
                            pieceLength = stockLength;
                            remainingLengthToCover -= (stockLength - spliceLength);
                        }

                        // Sanity check: piece cannot exceed stock due to overlap
                        if (pieceLength > stockLength) pieceLength = stockLength;

                        allCuts.push({
                            length: pieceLength,
                            label: `${item.label} (P${p}/${totalPieces})`,
                            originalItem: item
                        });
                    }
                } else {
                    allCuts.push({ length: len, label: item.label, originalItem: item });
                }
            }
        }
    });

    // 2. Sort cuts descending (Best for FFD)
    allCuts.sort((a, b) => b.length - a.length);

    // 3. Initialize Bins
    const bins = []; // Each bin: { cuts: [], freeSpace: stockLength }

    // 4. Place cuts
    allCuts.forEach(cut => {
        let placed = false;

        // Try to fit in existing bins
        for (let bin of bins) {
            const cutsCount = bin.cuts.length;
            const needed = cut.length + (cutsCount > 0 ? kerf : 0);

            if (bin.freeSpace >= needed) {
                bin.cuts.push(cut);
                bin.freeSpace -= needed;
                placed = true;
                break;
            }
        }

        // If not placed, create new bin
        if (!placed) {
            const newBin = {
                cuts: [cut],
                freeSpace: stockLength - cut.length // No kerf for first cut
            };
            bins.push(newBin);
        }
    });

    // 5. Statistics
    const validCutLength = allCuts.reduce((acc, cut) => acc + cut.length, 0);
    const totalStockLength = bins.length * stockLength;
    const efficiency = totalStockLength > 0 ? (validCutLength / totalStockLength) : 0;
    const wasteTotal = totalStockLength - validCutLength;

    return {
        barsRequired: bins.length,
        patterns: bins.map((bin, idx) => ({
            id: idx + 1,
            cuts: bin.cuts,
            freeSpace: bin.freeSpace,
            usedLength: stockLength - bin.freeSpace,
            stockLength: stockLength
        })),
        efficiency: efficiency,
        wasteTotal: wasteTotal,
        totalCuts: allCuts.length
    };
};
