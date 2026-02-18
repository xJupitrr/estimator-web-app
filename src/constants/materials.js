
export const MATERIAL_DEFAULTS = {
    // Aggregates
    cement_40kg: { name: "Portland Cement (40kg)", price: 240, unit: "bags" },
    sand_wash: { name: "Wash Sand (S1)", price: 1200, unit: "cu.m" },
    gravel_3_4: { name: "Crushed Gravel (3/4)", price: 1400, unit: "cu.m" },
    gravel_bedding: { name: "Gravel Bedding / Sub-base", price: 1000, unit: "cu.m" }, // Standardized name

    // Masonry
    chb_4: { name: 'Concrete Hollow Blocks (4")', price: 15, unit: "pcs" },
    chb_6: { name: 'Concrete Hollow Blocks (6")', price: 22, unit: "pcs" },

    // Rebar (Corrugated)
    rebar_10mm: { name: "Corrugated Rebar (10mm)", price: 180, unit: "pcs" },
    rebar_12mm: { name: "Corrugated Rebar (12mm)", price: 260, unit: "pcs" },
    rebar_16mm: { name: "Corrugated Rebar (16mm)", price: 480, unit: "pcs" },
    rebar_20mm: { name: "Corrugated Rebar (20mm)", price: 750, unit: "pcs" },
    rebar_25mm: { name: "Corrugated Rebar (25mm)", price: 1150, unit: "pcs" },

    // Tie Wire
    tie_wire_kg: { name: "G.I. Tie Wire (#16)", price: 85, unit: "kg" },

    // Formworks - Plywood
    plywood_phenolic_1_2: { name: '1/2" Phenolic (4x8)', price: 2400, unit: "sheets" },
    plywood_phenolic_3_4: { name: '3/4" Phenolic (4x8)', price: 2800, unit: "sheets" },
    plywood_marine_1_2: { name: '1/2" Marine Plywood (4x8)', price: 1250, unit: "sheets" },

    // Formworks - Lumber
    lumber_2x2: { name: 'Lumber (2"x2")', price: 35, unit: "BF" },
    lumber_2x3: { name: 'Lumber (2"x3")', price: 45, unit: "BF" },
    lumber_2x4: { name: 'Lumber (2"x4")', price: 65, unit: "BF" },
    common_nails_kg: { name: "Common Nails (Assorted)", price: 85, unit: "kg" },
};

/**
 * Returns a simple key-value object of { key: price } for initializing calculator states.
 */
export const getDefaultPrices = () => {
    const prices = {};
    Object.entries(MATERIAL_DEFAULTS).forEach(([key, data]) => {
        prices[key] = data.price;
    });
    return prices;
};

/**
 * Helper to get display name by key
 */
export const getMaterialName = (key, suffix = "") => {
    return (MATERIAL_DEFAULTS[key]?.name || key) + suffix;
};
