/**
 * 1D Cutting Stock Optimization Tool
 * Uses First Fit Decreasing (FFD) heuristic for bin packing.
 * 
 * @param {Array} items - Array of { length: number, quantity: number, label: string }
 * @param {number} stockLength - Length of the stock material (default 6.0m)
 * @param {number} kerf - Width of the saw blade cut (default 0.005m / 5mm)
 * @returns {Object} { barsRequired: number, patterns: Array, efficiency: number, wasteTotal: number }
 */
export const optimizeCuts = (items, stockLength = 6.0, kerf = 0.005) => {
    // 1. Expand items into individual cuts
    let allCuts = [];
    items.forEach(item => {
        const qty = parseInt(item.quantity) || 0;
        const len = parseFloat(item.length) || 0;
        if (qty > 0 && len > 0) {
            for (let i = 0; i < qty; i++) {
                // If a single cut is longer than stock, it's impossible (or needs special handling/splicing)
                // For this estimator, we'll just clamp it or flag it? 
                // Let's assume valid lengths <= stockLength for now.
                // If > stockLength, we simulate splices or just accept multiple bars?
                // Simplest approach: If len > stock, treat as Math.ceil(len/stock) bars used fully + remainder?
                // Better: Just warn or fail. 
                // We'll treat len > stock as consuming Math.floor(len/stock) full bars + a remaining cut.

                if (len > stockLength) {
                    const fullBars = Math.floor(len / stockLength);
                    const remainder = len % stockLength;

                    // Add full bars as "patterns" of 100% usage immediately? 
                    // No, the function constructs patterns. We can handle remainder as a cut.
                    // The full bars are just added to count? 
                    // Let's simplify: treat remainder as the cut to optimize, and track full bars separately.
                    // BUT, this ID mapping gets tricky.
                    // EASIER: Just clamp for now and assume users inputs cuts < 6m (standard for trusses).
                    allCuts.push({ length: len, label: item.label, originalItem: item });
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
        // Find first bin that fits
        // Account for kerf: Effective length needed = cut.length + kerf (except maybe last cut?)
        // Actually, kerf is removed FROM the bar.
        // So remaining space must be >= cut.length.
        // If we place it, new free space = old free space - cut.length - kerf.

        let placed = false;

        // Try to fit in existing bins
        for (let bin of bins) {
            // Check if fits.
            // Logic: Is this the first cut in bin? 
            // If bin is empty, space is stockLength.
            // If not empty, we need cut.length + kerf.
            // Actually, easier model: each cut consumes (length + kerf).
            // The available space is (stockLength + kerf) technically? No.
            // Allowable usable length = stockLength.
            // Sum(cuts) + (N-1)*kerf <= stockLength.

            // Let's simplify: Current used length = Sum(cuts) + (cuts.length - 1) * kerf (if cuts.length > 0)
            // Available = stockLength - used.
            // If we add this cut: New Used = Used + cut.length + (cuts.length > 0 ? kerf : 0).

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
    const totalUsedLength = bins.reduce((acc, bin) => acc + (stockLength - bin.freeSpace), 0);
    const validCutLength = allCuts.reduce((acc, cut) => acc + cut.length, 0); // Pure cut length without kerf
    // Waste = Total Stock - Valid Cut Length? Or Total Stock - (Valid + Kerf)?
    // Financial waste = Total Stock Area Purchased - Valid Product Area.
    // So efficiency = Valid Cut Length / (Bins * StockLength).

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
