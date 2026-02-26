
export const MATERIAL_DEFAULTS = {
    // Aggregates
    cement_40kg: { name: "Portland Cement (40kg)", price: 240, unit: "bags" },
    sand_wash: { name: "Wash Sand (S1)", price: 1200, unit: "cu.m" },
    gravel_3_4: { name: "Crushed Gravel (3/4)", price: 1400, unit: "cu.m" },
    gravel_bedding: { name: "Gravel Bedding / Sub-base", price: 1000, unit: "cu.m" },

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
    lumber_2x2: { name: 'Lumber (2"x2") - 12ft', price: 35, unit: "BF" },
    lumber_2x3: { name: 'Lumber (2"x3") - 12ft', price: 45, unit: "BF" },
    lumber_2x4: { name: 'Lumber (2"x4") - 12ft', price: 65, unit: "BF" },
    common_nails_kg: { name: "Common Nails (Assorted)", price: 85, unit: "kg" },

    // Tiles & Finishes
    tile_adhesive_25kg: { name: "Tile Adhesive (25kg)", price: 320, unit: "bags" },
    tile_grout_2kg: { name: "Tile Grout (2kg)", price: 120, unit: "bags" },
    tile_30x30: { name: "Ceramic Tile (30x30)", price: 35, unit: "pcs" },
    tile_60x60: { name: "Granite Tile (60x60)", price: 185, unit: "pcs" },

    // Painting
    paint_primer: { name: "Concrete Primer (4L)", price: 650, unit: "tins" },
    paint_topcoat: { name: "Latex Paint (4L)", price: 750, unit: "tins" },
    paint_thinner: { name: "Paint Thinner (1L)", price: 110, unit: "bottles" },

    // Ceiling & Drywall
    gypsum_board_12mm: { name: "Gypsum Board (1/2\" x 4'x8')", price: 480, unit: "sheets" },
    metal_furring: { name: "Metal Furring (0.4mm x 5m)", price: 135, unit: "pcs" },
    carrying_channel: { name: "Carrying Channel (0.5mm x 5m)", price: 165, unit: "pcs" },
    blind_rivets: { name: "Blind Rivets (5/32 x 1/2)", price: 450, unit: "box" },

    // Roofing
    roof_rib_type: { name: "Rib-Type Roofing (0.4mm)", price: 480, unit: "ln.m" },
    roof_corrugated: { name: "Corrugated Roofing (0.4mm)", price: 380, unit: "ln.m" },
    roof_tile_span: { name: "Tile-Span Roofing (Premium)", price: 550, unit: "ln.m" },
    roof_tekscrew: { name: "Tekscrew (pcs)", price: 1.50, unit: "pcs" },
    roof_sealant: { name: "Roof Sealant (90ml)", price: 95, unit: "tubes" },

    // Concrete Slab & Scaffolding
    coco_lumber: { name: "Coco Lumber (Assorted)", price: 45, unit: "BF" },
    deck_08: { name: "Steel Deck (0.80mm)", price: 450, unit: "ln.m" },
    deck_10: { name: "Steel Deck (1.00mm)", price: 550, unit: "ln.m" },
    deck_12: { name: "Steel Deck (1.20mm)", price: 650, unit: "ln.m" },
    h_frame: { name: "H-Frame (1.7m Set)", price: 1200, unit: "pcs" },
    cross_brace: { name: "Cross Brace", price: 450, unit: "pcs" },
    u_head: { name: "U-Head Jack", price: 350, unit: "pcs" },
    shackle: { name: "Swivel Clamp", price: 65, unit: "pcs" },

    // Auxiliary
    pvc_pipe_blue_1_2: { name: "PVC Pipe (1/2\" Blue)", price: 145, unit: "pcs" },
    pvc_pipe_orange_2: { name: "PVC Pipe (2\" Orange)", price: 320, unit: "pcs" },
    thhn_wire_2_0: { name: "THHN Wire (2.0mm²)", price: 3800, unit: "rolls" },
    tile_adhesive: { name: "Tile Adhesive (25kg)", price: 850, unit: "bags" },
    tile_grout: { name: "Tile Grout (kg)", price: 120, unit: "kg" },

    // Ceiling
    ceiling_gypsum_9mm: { name: "Gypsum Board (9mm x 4'x8')", price: 450, unit: "pcs" },
    ceiling_hardiflex_1_4: { name: "Fiber Cement Board (1/4\")", price: 420, unit: "pcs" },
    ceiling_marine_plywood_1_4: { name: "Marine Plywood (1/4\")", price: 380, unit: "pcs" },
    ceiling_wall_angle: { name: "Wall Angle (3m)", price: 65, unit: "pcs" },
    ceiling_carrying_channel: { name: "Carrying Channel (5m)", price: 180, unit: "pcs" },
    ceiling_metal_furring: { name: "Metal Furring (5m)", price: 165, unit: "pcs" },
    ceiling_w_clip: { name: "W-Clip", price: 8, unit: "pcs" },
    ceiling_mesh_tape: { name: "Fiberglass Mesh Tape (75m)", price: 250, unit: "rolls" },
    ceiling_joint_compound: { name: "Jointing Compound (20kg)", price: 850, unit: "pails" },

    // Painting
    paint_primer_4l: { name: "Flat Latex (Primer - 4L)", price: 650, unit: "gal" },
    paint_skimcoat_20kg: { name: "Skimcoat (20kg)", price: 450, unit: "bags" },
    paint_topcoat_4l: { name: "Semi-Gloss Latex (Topcoat - 4L)", price: 750, unit: "gal" },

    // Plumbing
    pvc_pipe_100mm: { name: "uPVC Pipe (4\" / 100mm)", price: 820, unit: "pcs" },
    pvc_pipe_75mm: { name: "uPVC Pipe (3\" / 75mm)", price: 550, unit: "pcs" },
    pvc_pipe_50mm: { name: "uPVC Pipe (2\" / 50mm)", price: 280, unit: "pcs" },
    ppr_pipe_20mm: { name: "PPR Pipe (1/2\" / 20mm)", price: 480, unit: "pcs" },
    ppr_pipe_25mm: { name: "PPR Pipe (3/4\" / 25mm)", price: 650, unit: "pcs" },
    wc_set: { name: "Water Closet Set (Complete)", price: 5200, unit: "sets" },
    lav_set: { name: "Lavatory Set (Complete)", price: 2600, unit: "sets" },
    sink_set: { name: "Kitchen Sink Set (Complete)", price: 2100, unit: "sets" },

    // Electrical
    thhn_wire_3_5: { name: "THHN Wire (3.5mm²)", price: 5400, unit: "rolls" },
    thhn_wire_5_5: { name: "THHN Wire (5.5mm²)", price: 8200, unit: "rolls" },
    elec_pvc_pipe_20mm: { name: "PVC Electric Pipe (20mm)", price: 110, unit: "pcs" },
    elec_utility_box: { name: "Utility Box (PVC)", price: 25, unit: "pcs" },
    elec_junction_box: { name: "Junction Box (PVC)", price: 35, unit: "pcs" },
    elec_switch_1g: { name: "1-Gang Switch (Set)", price: 150, unit: "sets" },
    elec_outlet_duplex: { name: "Duplex Convenience Outlet", price: 210, unit: "sets" },

    // Drywall
    drywall_metal_stud: { name: "Metal Stud (3m)", price: 165, unit: "pcs" },
    drywall_metal_track: { name: "Metal Track (3m)", price: 180, unit: "pcs" },
    drywall_gypsum_12mm: { name: "Gypsum Board (12mm x 4'x8')", price: 550, unit: "pcs" },
    drywall_fcb_6mm: { name: "Fiber Cement Board (6mm)", price: 650, unit: "pcs" },

    // Doors & Windows - Frames (Price per LM)
    dw_frame_alu_pc: { name: "Aluminum Frame (Powder Coated)", price: 1250, unit: "LM" },
    dw_frame_alu_anod: { name: "Aluminum Frame (Anodized)", price: 1100, unit: "LM" },
    dw_frame_alu_wood: { name: "Aluminum Frame (Woodgrain)", price: 1150, unit: "LM" },
    dw_frame_upvc_white: { name: "uPVC Frame (White)", price: 950, unit: "LM" },
    dw_frame_wood_mah: { name: "Wood Frame (Mahogany)", price: 480, unit: "LM" },
    dw_frame_wood_tang: { name: "Wood Frame (Tanguile)", price: 420, unit: "LM" },
    dw_frame_steel_galv: { name: "Steel Frame (Galvanized)", price: 850, unit: "LM" },

    // Doors & Windows - Glass/Leaf (Price per Sqm)
    dw_glass_clear_6mm: { name: "Clear Glass (6mm)", price: 1800, unit: "sq.m" },
    dw_glass_clear_8mm: { name: "Clear Glass (8mm)", price: 2200, unit: "sq.m" },
    dw_glass_tinted_6mm: { name: "Tinted Glass (6mm)", price: 2000, unit: "sq.m" },
    dw_glass_temp_6mm: { name: "Tempered Glass (6mm)", price: 2800, unit: "sq.m" },
    dw_leaf_mah_door: { name: "Mahogany Door Leaf", price: 2600, unit: "sq.m" },
    dw_leaf_flush_door: { name: "Flush Door Leaf", price: 935, unit: "sq.m" },
    dw_leaf_alu_sliding: { name: "Sliding Panel (Alu/Glass)", price: 5800, unit: "sq.m" },
    dw_leaf_alu_casement: { name: "Casement Panel (Alu/Glass)", price: 5000, unit: "sq.m" },

    // Doors & Windows - Accessories
    dw_sealant_tube: { name: "Silicone Sealant (300ml)", price: 350, unit: "tubes" },

    // Steel Truss (Example standard sizes)
    "angle_bar_25mm x 25mm (1\" x 1\")_1.2mm": { name: "Angle Bar 25x25 (1\" x 1\") - 1.2mm", price: 380, unit: "pcs (6m)" },
    "angle_bar_38mm x 38mm (1 1/2\" x 1 1/2\")_3.0mm": { name: "Angle Bar 38x38 (1.5\") - 3.0mm", price: 850, unit: "pcs (6m)" },
    "c_purlin_75mm x 50mm (3\" x 2\")_1.2mm": { name: "C-Purlin 75x50 (3\" x 2\") - 1.2mm", price: 420, unit: "pcs (6m)" },
    "c_purlin_100mm x 50mm (4\" x 2\")_1.5mm": { name: "C-Purlin 100x50 (4\" x 2\") - 1.5mm", price: 580, unit: "pcs (6m)" },
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
