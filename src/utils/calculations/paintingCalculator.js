
export const DEFAULT_PRICES = {
    paint_primer_4l: 650,
    paint_skimcoat_20kg: 450,
    paint_topcoat_4l: 750,
};

/**
 * Calculates materials and costs for Painting works.
 * @param {Array} walls - Array of wall objects { length_m, height_m, sides, area_sqm ... }
 * @param {Object} prices - Price mapping for consumables
 * @returns {Object} Result object { area, items, total } or null
 */
export const calculatePainting = (walls, prices) => {
    let totalAreaM2 = 0;

    if (!walls || walls.length === 0) return null;

    walls.forEach(wall => {
        if (wall.isExcluded) return;
        const quantity = parseInt(wall.quantity) || 1;
        let rowArea = 0;

        const manualArea = parseFloat(wall.area_sqm);
        if (!isNaN(manualArea) && manualArea > 0) {
            rowArea = manualArea;
        } else {
            const length = parseFloat(wall.length_m) || 0;
            const height = parseFloat(wall.height_m) || 0;
            const sides = parseFloat(wall.sides) || 1;
            rowArea = length * height * sides;
        }

        totalAreaM2 += rowArea * quantity;
    });

    if (totalAreaM2 <= 0) return null;

    const COVERAGE_PRIMER_GAL = 25;
    const COVERAGE_SKIMCOAT_BAG = 20;
    const COVERAGE_TOPCOAT_GAL = 25;
    const TOPCOAT_COATS = 2;

    const primersNeeded = Math.ceil(totalAreaM2 / COVERAGE_PRIMER_GAL);
    const skimcoatsNeeded = Math.ceil(totalAreaM2 / COVERAGE_SKIMCOAT_BAG);
    const totalTopcoatArea = totalAreaM2 * TOPCOAT_COATS;
    const topcoatsNeeded = Math.ceil(totalTopcoatArea / COVERAGE_TOPCOAT_GAL);

    const costPrimer = primersNeeded * (parseFloat(prices.paint_primer_4l) || DEFAULT_PRICES.paint_primer_4l);
    const costSkimcoat = skimcoatsNeeded * (parseFloat(prices.paint_skimcoat_20kg) || DEFAULT_PRICES.paint_skimcoat_20kg);
    const costTopcoat = topcoatsNeeded * (parseFloat(prices.paint_topcoat_4l) || DEFAULT_PRICES.paint_topcoat_4l);

    const totalCost = costPrimer + costSkimcoat + costTopcoat;

    const items = [
        {
            name: "Concrete Primer (4L Gal)",
            qty: primersNeeded,
            unit: 'gals',
            priceKey: 'paint_primer_4l',
            price: parseFloat(prices.paint_primer_4l) || DEFAULT_PRICES.paint_primer_4l,
            total: costPrimer
        },
        {
            name: "Skim Coat / Putty (20kg Bag)",
            qty: skimcoatsNeeded,
            unit: 'bags',
            priceKey: 'paint_skimcoat_20kg',
            price: parseFloat(prices.paint_skimcoat_20kg) || DEFAULT_PRICES.paint_skimcoat_20kg,
            total: costSkimcoat
        },
        {
            name: `Topcoat Paint (4L Gal) - ${TOPCOAT_COATS} Coats`,
            qty: topcoatsNeeded,
            unit: 'gals',
            priceKey: 'paint_topcoat_4l',
            price: parseFloat(prices.paint_topcoat_4l) || DEFAULT_PRICES.paint_topcoat_4l,
            total: costTopcoat
        }
    ];

    return {
        totalArea: totalAreaM2,
        items: items,
        total: totalCost
    };
};
