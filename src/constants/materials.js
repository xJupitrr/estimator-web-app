
export const MATERIAL_DEFAULTS = {
    // Aggregates
    cement_40kg: { name: "Portland Cement (40kg)", price: 240, unit: "bags" },
    sand_wash: { name: "Wash Sand (S1)", price: 1200, unit: "cu.m" },
    gravel_3_4: { name: "Crushed Gravel (3/4)", price: 1400, unit: "cu.m" },
    gravel_bedding: { name: "Gravel Bedding / Sub-base", price: 1000, unit: "cu.m" },

    // Masonry
    chb_4: { name: 'Concrete Hollow Blocks (4")', price: 15, unit: "pcs" },
    chb_5: { name: 'Concrete Hollow Blocks (5")', price: 18, unit: "pcs" },
    chb_6: { name: 'Concrete Hollow Blocks (6")', price: 22, unit: "pcs" },
    chb_8: { name: 'Concrete Hollow Blocks (8")', price: 30, unit: "pcs" },

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
    snap_tie: { name: "Snap Tie / Form Tie (w/ washers)", price: 25, unit: "pcs" },
    form_kicker_set: { name: "Form Kicker Brace (lumber set)", price: 55, unit: "set" },

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

    // ─── Steel Truss - Angle Bar (keys match steelTrussCalculator specKey format) ──
    // 25mm x 25mm (1" x 1")
    "angle_bar_25mm x 25mm (1\" x 1\")_1.2mm": { name: "Angle Bar 25x25 (1\"x1\") 1.2mm THK", price: 280, unit: "pcs (6m)" },
    "angle_bar_25mm x 25mm (1\" x 1\")_1.5mm": { name: "Angle Bar 25x25 (1\"x1\") 1.5mm THK", price: 340, unit: "pcs (6m)" },
    "angle_bar_25mm x 25mm (1\" x 1\")_2.0mm": { name: "Angle Bar 25x25 (1\"x1\") 2.0mm THK", price: 420, unit: "pcs (6m)" },
    "angle_bar_25mm x 25mm (1\" x 1\")_3.0mm": { name: "Angle Bar 25x25 (1\"x1\") 3.0mm THK", price: 580, unit: "pcs (6m)" },
    // 32mm x 32mm (1-1/4" x 1-1/4")
    "angle_bar_32mm x 32mm (1-1/4\" x 1-1/4\")_1.5mm": { name: "Angle Bar 32x32 (1-1/4\"x1-1/4\") 1.5mm THK", price: 420, unit: "pcs (6m)" },
    "angle_bar_32mm x 32mm (1-1/4\" x 1-1/4\")_2.0mm": { name: "Angle Bar 32x32 (1-1/4\"x1-1/4\") 2.0mm THK", price: 540, unit: "pcs (6m)" },
    "angle_bar_32mm x 32mm (1-1/4\" x 1-1/4\")_3.0mm": { name: "Angle Bar 32x32 (1-1/4\"x1-1/4\") 3.0mm THK", price: 760, unit: "pcs (6m)" },
    // 38mm x 38mm (1-1/2" x 1-1/2")
    "angle_bar_38mm x 38mm (1-1/2\" x 1-1/2\")_1.5mm": { name: "Angle Bar 38x38 (1-1/2\"x1-1/2\") 1.5mm THK", price: 520, unit: "pcs (6m)" },
    "angle_bar_38mm x 38mm (1-1/2\" x 1-1/2\")_2.0mm": { name: "Angle Bar 38x38 (1-1/2\"x1-1/2\") 2.0mm THK", price: 680, unit: "pcs (6m)" },
    "angle_bar_38mm x 38mm (1-1/2\" x 1-1/2\")_3.0mm": { name: "Angle Bar 38x38 (1-1/2\"x1-1/2\") 3.0mm THK", price: 950, unit: "pcs (6m)" },
    "angle_bar_38mm x 38mm (1-1/2\" x 1-1/2\")_4.5mm": { name: "Angle Bar 38x38 (1-1/2\"x1-1/2\") 4.5mm THK", price: 1350, unit: "pcs (6m)" },
    // 50mm x 50mm (2" x 2")
    "angle_bar_50mm x 50mm (2\" x 2\")_2.0mm": { name: "Angle Bar 50x50 (2\"x2\") 2.0mm THK", price: 820, unit: "pcs (6m)" },
    "angle_bar_50mm x 50mm (2\" x 2\")_3.0mm": { name: "Angle Bar 50x50 (2\"x2\") 3.0mm THK", price: 1250, unit: "pcs (6m)" },
    "angle_bar_50mm x 50mm (2\" x 2\")_4.5mm": { name: "Angle Bar 50x50 (2\"x2\") 4.5mm THK", price: 1800, unit: "pcs (6m)" },
    "angle_bar_50mm x 50mm (2\" x 2\")_6.0mm": { name: "Angle Bar 50x50 (2\"x2\") 6.0mm THK", price: 2300, unit: "pcs (6m)" },
    // 65mm x 65mm (2-1/2" x 2-1/2")
    "angle_bar_65mm x 65mm (2-1/2\" x 2-1/2\")_4.5mm": { name: "Angle Bar 65x65 (2-1/2\"x2-1/2\") 4.5mm THK", price: 2400, unit: "pcs (6m)" },
    "angle_bar_65mm x 65mm (2-1/2\" x 2-1/2\")_5.0mm": { name: "Angle Bar 65x65 (2-1/2\"x2-1/2\") 5.0mm THK", price: 2700, unit: "pcs (6m)" },
    "angle_bar_65mm x 65mm (2-1/2\" x 2-1/2\")_6.0mm": { name: "Angle Bar 65x65 (2-1/2\"x2-1/2\") 6.0mm THK", price: 3100, unit: "pcs (6m)" },
    // 75mm x 75mm (3" x 3")
    "angle_bar_75mm x 75mm (3\" x 3\")_4.5mm": { name: "Angle Bar 75x75 (3\"x3\") 4.5mm THK", price: 3000, unit: "pcs (6m)" },
    "angle_bar_75mm x 75mm (3\" x 3\")_5.0mm": { name: "Angle Bar 75x75 (3\"x3\") 5.0mm THK", price: 3400, unit: "pcs (6m)" },
    "angle_bar_75mm x 75mm (3\" x 3\")_6.0mm": { name: "Angle Bar 75x75 (3\"x3\") 6.0mm THK", price: 3800, unit: "pcs (6m)" },
    // 100mm x 100mm (4" x 4")
    "angle_bar_100mm x 100mm (4\" x 4\")_5.0mm": { name: "Angle Bar 100x100 (4\"x4\") 5.0mm THK", price: 4600, unit: "pcs (6m)" },
    "angle_bar_100mm x 100mm (4\" x 4\")_6.0mm": { name: "Angle Bar 100x100 (4\"x4\") 6.0mm THK", price: 5200, unit: "pcs (6m)" },

    // ─── Steel Truss - C-Channel ───────────────────────────────────────────────
    // 75mm x 50mm (3" x 2")
    "c_channel_75mm x 50mm (3\" x 2\")_1.2mm": { name: "C-Channel 75x50 (3\"x2\") 1.2mm THK", price: 380, unit: "pcs (6m)" },
    "c_channel_75mm x 50mm (3\" x 2\")_1.5mm": { name: "C-Channel 75x50 (3\"x2\") 1.5mm THK", price: 460, unit: "pcs (6m)" },
    "c_channel_75mm x 50mm (3\" x 2\")_2.0mm": { name: "C-Channel 75x50 (3\"x2\") 2.0mm THK", price: 580, unit: "pcs (6m)" },
    "c_channel_75mm x 50mm (3\" x 2\")_2.5mm": { name: "C-Channel 75x50 (3\"x2\") 2.5mm THK", price: 710, unit: "pcs (6m)" },
    "c_channel_75mm x 50mm (3\" x 2\")_3.0mm": { name: "C-Channel 75x50 (3\"x2\") 3.0mm THK", price: 820, unit: "pcs (6m)" },
    // 100mm x 50mm (4" x 2")
    "c_channel_100mm x 50mm (4\" x 2\")_1.5mm": { name: "C-Channel 100x50 (4\"x2\") 1.5mm THK", price: 560, unit: "pcs (6m)" },
    "c_channel_100mm x 50mm (4\" x 2\")_2.0mm": { name: "C-Channel 100x50 (4\"x2\") 2.0mm THK", price: 720, unit: "pcs (6m)" },
    "c_channel_100mm x 50mm (4\" x 2\")_2.5mm": { name: "C-Channel 100x50 (4\"x2\") 2.5mm THK", price: 880, unit: "pcs (6m)" },
    "c_channel_100mm x 50mm (4\" x 2\")_3.0mm": { name: "C-Channel 100x50 (4\"x2\") 3.0mm THK", price: 1050, unit: "pcs (6m)" },
    // 125mm x 50mm (5" x 2")
    "c_channel_125mm x 50mm (5\" x 2\")_2.0mm": { name: "C-Channel 125x50 (5\"x2\") 2.0mm THK", price: 870, unit: "pcs (6m)" },
    "c_channel_125mm x 50mm (5\" x 2\")_2.5mm": { name: "C-Channel 125x50 (5\"x2\") 2.5mm THK", price: 1060, unit: "pcs (6m)" },
    "c_channel_125mm x 50mm (5\" x 2\")_3.0mm": { name: "C-Channel 125x50 (5\"x2\") 3.0mm THK", price: 1250, unit: "pcs (6m)" },
    "c_channel_125mm x 50mm (5\" x 2\")_4.0mm": { name: "C-Channel 125x50 (5\"x2\") 4.0mm THK", price: 1600, unit: "pcs (6m)" },
    // 150mm x 50mm (6" x 2")
    "c_channel_150mm x 50mm (6\" x 2\")_2.0mm": { name: "C-Channel 150x50 (6\"x2\") 2.0mm THK", price: 1050, unit: "pcs (6m)" },
    "c_channel_150mm x 50mm (6\" x 2\")_3.0mm": { name: "C-Channel 150x50 (6\"x2\") 3.0mm THK", price: 1500, unit: "pcs (6m)" },
    "c_channel_150mm x 50mm (6\" x 2\")_4.0mm": { name: "C-Channel 150x50 (6\"x2\") 4.0mm THK", price: 1950, unit: "pcs (6m)" },
    "c_channel_150mm x 50mm (6\" x 2\")_4.5mm": { name: "C-Channel 150x50 (6\"x2\") 4.5mm THK", price: 2200, unit: "pcs (6m)" },
    // 200mm x 50mm (8" x 2")
    "c_channel_200mm x 50mm (8\" x 2\")_3.0mm": { name: "C-Channel 200x50 (8\"x2\") 3.0mm THK", price: 1950, unit: "pcs (6m)" },
    "c_channel_200mm x 50mm (8\" x 2\")_4.0mm": { name: "C-Channel 200x50 (8\"x2\") 4.0mm THK", price: 2500, unit: "pcs (6m)" },
    "c_channel_200mm x 50mm (8\" x 2\")_4.5mm": { name: "C-Channel 200x50 (8\"x2\") 4.5mm THK", price: 2800, unit: "pcs (6m)" },
    "c_channel_200mm x 50mm (8\" x 2\")_6.0mm": { name: "C-Channel 200x50 (8\"x2\") 6.0mm THK", price: 3600, unit: "pcs (6m)" },

    // ─── Steel Truss - Tubular Square ─────────────────────────────────────────
    // 25mm x 25mm (1" x 1")
    "tubular_square_25mm x 25mm (1\" x 1\")_1.2mm": { name: "Tubular Square 25x25 (1\"x1\") 1.2mm THK", price: 350, unit: "pcs (6m)" },
    "tubular_square_25mm x 25mm (1\" x 1\")_1.5mm": { name: "Tubular Square 25x25 (1\"x1\") 1.5mm THK", price: 420, unit: "pcs (6m)" },
    "tubular_square_25mm x 25mm (1\" x 1\")_2.0mm": { name: "Tubular Square 25x25 (1\"x1\") 2.0mm THK", price: 540, unit: "pcs (6m)" },
    // 38mm x 38mm (1-1/2" x 1-1/2")
    "tubular_square_38mm x 38mm (1-1/2\" x 1-1/2\")_1.5mm": { name: "Tubular Square 38x38 (1-1/2\"x1-1/2\") 1.5mm THK", price: 560, unit: "pcs (6m)" },
    "tubular_square_38mm x 38mm (1-1/2\" x 1-1/2\")_2.0mm": { name: "Tubular Square 38x38 (1-1/2\"x1-1/2\") 2.0mm THK", price: 720, unit: "pcs (6m)" },
    "tubular_square_38mm x 38mm (1-1/2\" x 1-1/2\")_3.0mm": { name: "Tubular Square 38x38 (1-1/2\"x1-1/2\") 3.0mm THK", price: 1050, unit: "pcs (6m)" },
    // 50mm x 50mm (2" x 2")
    "tubular_square_50mm x 50mm (2\" x 2\")_1.5mm": { name: "Tubular Square 50x50 (2\"x2\") 1.5mm THK", price: 720, unit: "pcs (6m)" },
    "tubular_square_50mm x 50mm (2\" x 2\")_2.0mm": { name: "Tubular Square 50x50 (2\"x2\") 2.0mm THK", price: 950, unit: "pcs (6m)" },
    "tubular_square_50mm x 50mm (2\" x 2\")_2.5mm": { name: "Tubular Square 50x50 (2\"x2\") 2.5mm THK", price: 1150, unit: "pcs (6m)" },
    "tubular_square_50mm x 50mm (2\" x 2\")_3.0mm": { name: "Tubular Square 50x50 (2\"x2\") 3.0mm THK", price: 1350, unit: "pcs (6m)" },
    // 75mm x 75mm (3" x 3")
    "tubular_square_75mm x 75mm (3\" x 3\")_2.0mm": { name: "Tubular Square 75x75 (3\"x3\") 2.0mm THK", price: 1350, unit: "pcs (6m)" },
    "tubular_square_75mm x 75mm (3\" x 3\")_3.0mm": { name: "Tubular Square 75x75 (3\"x3\") 3.0mm THK", price: 1950, unit: "pcs (6m)" },
    "tubular_square_75mm x 75mm (3\" x 3\")_4.0mm": { name: "Tubular Square 75x75 (3\"x3\") 4.0mm THK", price: 2500, unit: "pcs (6m)" },
    "tubular_square_75mm x 75mm (3\" x 3\")_4.5mm": { name: "Tubular Square 75x75 (3\"x3\") 4.5mm THK", price: 2800, unit: "pcs (6m)" },
    // 100mm x 100mm (4" x 4")
    "tubular_square_100mm x 100mm (4\" x 4\")_3.0mm": { name: "Tubular Square 100x100 (4\"x4\") 3.0mm THK", price: 2600, unit: "pcs (6m)" },
    "tubular_square_100mm x 100mm (4\" x 4\")_4.0mm": { name: "Tubular Square 100x100 (4\"x4\") 4.0mm THK", price: 3300, unit: "pcs (6m)" },
    "tubular_square_100mm x 100mm (4\" x 4\")_4.5mm": { name: "Tubular Square 100x100 (4\"x4\") 4.5mm THK", price: 3700, unit: "pcs (6m)" },
    "tubular_square_100mm x 100mm (4\" x 4\")_6.0mm": { name: "Tubular Square 100x100 (4\"x4\") 6.0mm THK", price: 4800, unit: "pcs (6m)" },

    // ─── Steel Truss - Tubular Rectangular ────────────────────────────────────
    // 50mm x 25mm (2" x 1")
    "tubular_rect_50mm x 25mm (2\" x 1\")_1.2mm": { name: "Tubular Rect 50x25 (2\"x1\") 1.2mm THK", price: 320, unit: "pcs (6m)" },
    "tubular_rect_50mm x 25mm (2\" x 1\")_1.5mm": { name: "Tubular Rect 50x25 (2\"x1\") 1.5mm THK", price: 390, unit: "pcs (6m)" },
    "tubular_rect_50mm x 25mm (2\" x 1\")_2.0mm": { name: "Tubular Rect 50x25 (2\"x1\") 2.0mm THK", price: 490, unit: "pcs (6m)" },
    "tubular_rect_50mm x 25mm (2\" x 1\")_3.0mm": { name: "Tubular Rect 50x25 (2\"x1\") 3.0mm THK", price: 680, unit: "pcs (6m)" },
    // 75mm x 50mm (3" x 2")
    "tubular_rect_75mm x 50mm (3\" x 2\")_1.5mm": { name: "Tubular Rect 75x50 (3\"x2\") 1.5mm THK", price: 520, unit: "pcs (6m)" },
    "tubular_rect_75mm x 50mm (3\" x 2\")_2.0mm": { name: "Tubular Rect 75x50 (3\"x2\") 2.0mm THK", price: 680, unit: "pcs (6m)" },
    "tubular_rect_75mm x 50mm (3\" x 2\")_2.5mm": { name: "Tubular Rect 75x50 (3\"x2\") 2.5mm THK", price: 840, unit: "pcs (6m)" },
    "tubular_rect_75mm x 50mm (3\" x 2\")_3.0mm": { name: "Tubular Rect 75x50 (3\"x2\") 3.0mm THK", price: 980, unit: "pcs (6m)" },
    // 100mm x 50mm (4" x 2")
    "tubular_rect_100mm x 50mm (4\" x 2\")_1.5mm": { name: "Tubular Rect 100x50 (4\"x2\") 1.5mm THK", price: 650, unit: "pcs (6m)" },
    "tubular_rect_100mm x 50mm (4\" x 2\")_2.0mm": { name: "Tubular Rect 100x50 (4\"x2\") 2.0mm THK", price: 850, unit: "pcs (6m)" },
    "tubular_rect_100mm x 50mm (4\" x 2\")_3.0mm": { name: "Tubular Rect 100x50 (4\"x2\") 3.0mm THK", price: 1250, unit: "pcs (6m)" },
    "tubular_rect_100mm x 50mm (4\" x 2\")_4.0mm": { name: "Tubular Rect 100x50 (4\"x2\") 4.0mm THK", price: 1600, unit: "pcs (6m)" },
    // 150mm x 50mm (6" x 2")
    "tubular_rect_150mm x 50mm (6\" x 2\")_2.0mm": { name: "Tubular Rect 150x50 (6\"x2\") 2.0mm THK", price: 1200, unit: "pcs (6m)" },
    "tubular_rect_150mm x 50mm (6\" x 2\")_3.0mm": { name: "Tubular Rect 150x50 (6\"x2\") 3.0mm THK", price: 1750, unit: "pcs (6m)" },
    "tubular_rect_150mm x 50mm (6\" x 2\")_4.0mm": { name: "Tubular Rect 150x50 (6\"x2\") 4.0mm THK", price: 2250, unit: "pcs (6m)" },
    "tubular_rect_150mm x 50mm (6\" x 2\")_4.5mm": { name: "Tubular Rect 150x50 (6\"x2\") 4.5mm THK", price: 2500, unit: "pcs (6m)" },


    // ─── Ceiling - Fasteners & Specialty Panels ────────────────────────────────
    screw_gypsum: { name: "Gypsum Screws (Fine Thread)", price: 0.75, unit: "pcs" },
    screw_hardiflex: { name: "Hardiflex Screws (Self-Drilling)", price: 0.85, unit: "pcs" },
    screw_metal: { name: "Metal Screws (Self-Tapping)", price: 0.65, unit: "pcs" },
    rivets: { name: "Blind Rivets (5/32 x 1/2) - Loose", price: 1.20, unit: "pcs" },
    clips: { name: "PVC Ceiling Clips (Set)", price: 2.50, unit: "sets" },
    spandrel: { name: "Spandrel Panel (PVC/Metal) 0.15m x 6m", price: 550, unit: "pcs" },
    pvc: { name: "PVC Ceiling Panel 0.20m x 5.8m", price: 480, unit: "pcs" },
    spandrel_molding: { name: "Spandrel Molding (3m)", price: 180, unit: "pcs" },
    pvc_u_molding: { name: "PVC U-Molding (3m)", price: 120, unit: "pcs" },
    pvc_h_clip: { name: "PVC H-Clip (3m)", price: 150, unit: "pcs" },

    // ─── Drywall - Panel Boards ────────────────────────────────────────────────
    gypsum_9mm: { name: "Gypsum Board (9mm x 4'x8')", price: 420, unit: "pcs" },
    gypsum_12mm: { name: "Gypsum Board (12mm x 4'x8')", price: 550, unit: "pcs" },
    gypsum_15mm: { name: "Gypsum Board (15mm Fire-Rated x 4'x8')", price: 850, unit: "pcs" },
    fcb_3_5mm: { name: "Fiber Cement Board (3.5mm x 4'x8')", price: 380, unit: "pcs" },
    fcb_4_5mm: { name: "Fiber Cement Board (4.5mm x 4'x8')", price: 450, unit: "pcs" },
    fcb_6mm: { name: "Fiber Cement Board (6mm x 4'x8')", price: 650, unit: "pcs" },
    fcb_9mm: { name: "Fiber Cement Board (9mm x 4'x8')", price: 980, unit: "pcs" },
    fcb_12mm: { name: "Fiber Cement Board (12mm x 4'x8')", price: 1250, unit: "pcs" },
    plywood_1_4: { name: "Marine Plywood (1/4\" x 4'x8')", price: 420, unit: "pcs" },
    plywood_1_2: { name: "Marine Plywood (1/2\" x 4'x8')", price: 950, unit: "pcs" },
    plywood_3_4: { name: "Marine Plywood (3/4\" x 4'x8')", price: 1450, unit: "pcs" },
    wpc_fluted: { name: "WPC Fluted Panel (160mm x 2900mm)", price: 350, unit: "pcs" },
    acoustic_board: { name: "Acoustic Board (1220mm x 2440mm)", price: 950, unit: "pcs" },
    clips_wpc: { name: "WPC Clips / Fasteners", price: 3.50, unit: "pcs" },

    // ─── Drywall - Insulation & Fillers ───────────────────────────────────────
    glasswool: { name: "Glasswool Insulation (1.2m x 15m Roll)", price: 1850, unit: "rolls" },
    pe_foam: { name: "PE Foam Insulation (1m x 50m Roll)", price: 1200, unit: "rolls" },
    eps_foam: { name: "EPS / Styrofoam Board (1.2m x 2.4m)", price: 350, unit: "pcs" },
    rockwool: { name: "Rockwool Slab (0.6m x 1.2m)", price: 250, unit: "pcs" },
    acoustic_fiberglass: { name: "Acoustic Fiberglass Board (0.6m x 1.2m)", price: 450, unit: "pcs" },

    // ─── Formworks - Phenolic / Sheet (Suspended Slab) ────────────────────────
    phenolic_1_2: { name: "1/2\" Phenolic Board (4'x8')", price: 1400, unit: "sheets" },
    phenolic_3_4: { name: "3/4\" Phenolic Board (4'x8')", price: 1800, unit: "sheets" },
    cocoLumber: { name: "Coco Lumber (Shoring/Posts/Joists)", price: 45, unit: "BF" },
    gi_pipe_1_1_2: { name: "G.I. Pipe 1.5\" x 6m (Horizontal Tie)", price: 850, unit: "pcs" },

    // ─── Plumbing - PPR Waterline Fittings ────────────────────────────────────
    ppr_elbow_90_20mm: { name: "PPR Elbow 90° (20mm / 1/2\")", price: 25, unit: "pcs" },
    ppr_elbow_90_25mm: { name: "PPR Elbow 90° (25mm / 3/4\")", price: 45, unit: "pcs" },
    ppr_elbow_45_20mm: { name: "PPR Elbow 45° (20mm / 1/2\")", price: 35, unit: "pcs" },
    ppr_elbow_45_25mm: { name: "PPR Elbow 45° (25mm / 3/4\")", price: 55, unit: "pcs" },
    ppr_tee_20mm: { name: "PPR Tee (20mm / 1/2\")", price: 35, unit: "pcs" },
    ppr_tee_25mm: { name: "PPR Tee (25mm / 3/4\")", price: 65, unit: "pcs" },
    ppr_coupling_20mm: { name: "PPR Coupling (20mm)", price: 15, unit: "pcs" },
    ppr_coupling_25mm: { name: "PPR Coupling (25mm)", price: 25, unit: "pcs" },
    ppr_female_adapter_20mm: { name: "PPR Female Adapter w/ Brass Thread (20mm)", price: 120, unit: "pcs" },
    ppr_female_adapter_25mm: { name: "PPR Female Adapter w/ Brass Thread (25mm)", price: 180, unit: "pcs" },
    ppr_male_adapter_20mm: { name: "PPR Male Adapter (20mm)", price: 110, unit: "pcs" },
    ppr_male_adapter_25mm: { name: "PPR Male Adapter (25mm)", price: 165, unit: "pcs" },
    ppr_female_elbow_20mm: { name: "PPR Female Elbow (20mm)", price: 145, unit: "pcs" },
    ppr_female_elbow_25mm: { name: "PPR Female Elbow (25mm)", price: 210, unit: "pcs" },
    ppr_male_elbow_20mm: { name: "PPR Male Elbow (20mm)", price: 135, unit: "pcs" },
    ppr_male_elbow_25mm: { name: "PPR Male Elbow (25mm)", price: 195, unit: "pcs" },
    ppr_end_cap_20mm: { name: "PPR End Cap (20mm)", price: 15, unit: "pcs" },
    ppr_end_cap_25mm: { name: "PPR End Cap (25mm)", price: 25, unit: "pcs" },
    ppr_union_patente_20mm: { name: "PPR Union / Patente (20mm)", price: 280, unit: "pcs" },
    ppr_union_patente_25mm: { name: "PPR Union / Patente (25mm)", price: 380, unit: "pcs" },
    ppr_gate_valve_20mm: { name: "PPR Gate Valve (20mm)", price: 850, unit: "pcs" },
    ppr_gate_valve_25mm: { name: "PPR Gate Valve (25mm)", price: 1150, unit: "pcs" },
    ppr_ball_valve_20mm: { name: "PPR Ball Valve (20mm)", price: 450, unit: "pcs" },
    ppr_ball_valve_25mm: { name: "PPR Ball Valve (25mm)", price: 650, unit: "pcs" },
    ppr_check_valve_20mm: { name: "PPR Check Valve (20mm)", price: 650, unit: "pcs" },
    ppr_check_valve_25mm: { name: "PPR Check Valve (25mm)", price: 850, unit: "pcs" },

    // ─── Plumbing - uPVC Sanitary Fittings ────────────────────────────────────
    pvc_elbow_90_100mm: { name: "uPVC Elbow 90° (4\" / 100mm)", price: 110, unit: "pcs" },
    pvc_elbow_45_100mm: { name: "uPVC Elbow 45° (4\" / 100mm)", price: 105, unit: "pcs" },
    pvc_elbow_90_75mm: { name: "uPVC Elbow 90° (3\" / 75mm)", price: 85, unit: "pcs" },
    pvc_elbow_45_75mm: { name: "uPVC Elbow 45° (3\" / 75mm)", price: 80, unit: "pcs" },
    pvc_elbow_90_50mm: { name: "uPVC Elbow 90° (2\" / 50mm)", price: 40, unit: "pcs" },
    pvc_elbow_45_50mm: { name: "uPVC Elbow 45° (2\" / 50mm)", price: 38, unit: "pcs" },
    pvc_sanitary_tee_100mm: { name: "uPVC Sanitary Tee (4\" / 100mm)", price: 165, unit: "pcs" },
    pvc_sanitary_tee_75mm: { name: "uPVC Sanitary Tee (3\" / 75mm)", price: 125, unit: "pcs" },
    pvc_sanitary_tee_50mm: { name: "uPVC Sanitary Tee (2\" / 50mm)", price: 75, unit: "pcs" },
    pvc_sanitary_tee_100x50: { name: "uPVC Sanitary Tee (4\"x2\")", price: 185, unit: "pcs" },
    pvc_sanitary_tee_100x75: { name: "uPVC Sanitary Tee (4\"x3\")", price: 195, unit: "pcs" },
    pvc_wye_100mm: { name: "uPVC Wye (4\" / 100mm)", price: 210, unit: "pcs" },
    pvc_wye_75mm: { name: "uPVC Wye (3\" / 75mm)", price: 160, unit: "pcs" },
    pvc_wye_50mm: { name: "uPVC Wye (2\" / 50mm)", price: 95, unit: "pcs" },
    pvc_wye_100x50: { name: "uPVC Wye (4\"x2\")", price: 245, unit: "pcs" },
    pvc_wye_100x75: { name: "uPVC Wye (4\"x3\")", price: 265, unit: "pcs" },
    pvc_cleanout_100mm: { name: "uPVC Cleanout Plug (4\" / 100mm)", price: 145, unit: "pcs" },
    pvc_cleanout_75mm: { name: "uPVC Cleanout Plug (3\" / 75mm)", price: 110, unit: "pcs" },
    pvc_cleanout_50mm: { name: "uPVC Cleanout Plug (2\" / 50mm)", price: 70, unit: "pcs" },
    pvc_p_trap_100mm: { name: "uPVC P-Trap (4\" / 100mm)", price: 350, unit: "pcs" },
    pvc_p_trap_50mm: { name: "uPVC P-Trap (2\" / 50mm)", price: 120, unit: "pcs" },
    pvc_vent_cap_100mm: { name: "uPVC Vent Cap (4\" / 100mm)", price: 110, unit: "pcs" },
    pvc_vent_cap_50mm: { name: "uPVC Vent Cap (2\" / 50mm)", price: 45, unit: "pcs" },
    pvc_reducer_100x50: { name: "uPVC Reducer (4\"x2\")", price: 135, unit: "pcs" },
    pvc_reducer_100x75: { name: "uPVC Reducer (4\"x3\")", price: 150, unit: "pcs" },

    // ─── Plumbing - Accessories & Fixtures ────────────────────────────────────
    solvent_cement: { name: "PVC Solvent Cement (400cc Can)", price: 180, unit: "cans" },
    teflon_tape: { name: "Teflon Tape (10m Roll)", price: 25, unit: "rolls" },
    pipe_clamp_100mm: { name: "Pipe Clamp (4\" / 100mm)", price: 45, unit: "pcs" },
    pipe_clamp_75mm: { name: "Pipe Clamp (3\" / 75mm)", price: 35, unit: "pcs" },
    pipe_clamp_50mm: { name: "Pipe Clamp (2\" / 50mm)", price: 25, unit: "pcs" },
    shower_set: { name: "Shower Set (Complete)", price: 1700, unit: "sets" },
    hose_bibb: { name: "Hose Bibb / Outdoor Faucet", price: 320, unit: "pcs" },
    floor_drain: { name: "Floor Drain (4x4 Stainless)", price: 140, unit: "pcs" },
    roof_drain: { name: "Roof Drain (Cast Iron)", price: 380, unit: "pcs" },
    catch_basin: { name: "Catch Basin (Pre-cast)", price: 1200, unit: "pcs" },
    urinal_set: { name: "Urinal Set (Wall-hung)", price: 4500, unit: "sets" },
    bidet_set: { name: "Bidet Spray Set", price: 850, unit: "sets" },
    bathtub_set: { name: "Bathtub Set (Standard Acrylic)", price: 18000, unit: "sets" },
    grease_trap: { name: "Grease Trap (PVC, 2-Compartment)", price: 3200, unit: "pcs" },
    water_heater_single: { name: "Water Heater - Single Point (Instant)", price: 6500, unit: "sets" },
    water_heater_multi: { name: "Water Heater - Multi Point (Storage)", price: 11500, unit: "sets" },
    kitchen_faucet: { name: "Kitchen Faucet (Gooseneck)", price: 1200, unit: "pcs" },
    lavatory_faucet: { name: "Lavatory Faucet (Single Lever)", price: 950, unit: "pcs" },
    angle_valve: { name: "Angle Valve (1/2\"x1/2\")", price: 280, unit: "pcs" },
    flex_hose: { name: "Flexible Hose (Stainless, 400mm)", price: 220, unit: "pcs" },
    laundry_tray: { name: "Laundry Tray (PVC/Concrete)", price: 2500, unit: "pcs" },

    // ─── Electrical - THHN Wires ──────────────────────────────────────────────
    thhn_2_0: { name: "THHN Wire 2.0mm² (150m Roll)", price: 3200, unit: "rolls" },
    thhn_3_5: { name: "THHN Wire 3.5mm² (150m Roll)", price: 5400, unit: "rolls" },
    thhn_5_5: { name: "THHN Wire 5.5mm² (150m Roll)", price: 8200, unit: "rolls" },
    thhn_8_0: { name: "THHN Wire 8.0mm² (150m Roll)", price: 12500, unit: "rolls" },
    thhn_14_0: { name: "THHN Wire 14.0mm² (150m Roll)", price: 22000, unit: "rolls" },
    thhn_22_0: { name: "THHN Wire 22.0mm² (150m Roll)", price: 34000, unit: "rolls" },
    thhn_30_0: { name: "THHN Wire 30.0mm² (150m Roll)", price: 48000, unit: "rolls" },

    // ─── Electrical - PVC Conduit & Fittings ──────────────────────────────────
    pvc_pipe_20mm: { name: "PVC Electric Pipe 20mm (3m)", price: 110, unit: "pcs" },
    pvc_pipe_25mm: { name: "PVC Electric Pipe 25mm (3m)", price: 155, unit: "pcs" },
    pvc_pipe_32mm: { name: "PVC Electric Pipe 32mm (3m)", price: 240, unit: "pcs" },
    pvc_adapter_20mm: { name: "PVC Male Adapter 20mm (w/ Locknut)", price: 12, unit: "pcs" },
    pvc_adapter_25mm: { name: "PVC Male Adapter 25mm (w/ Locknut)", price: 18, unit: "pcs" },
    pvc_adapter_32mm: { name: "PVC Male Adapter 32mm (w/ Locknut)", price: 28, unit: "pcs" },
    pvc_locknut_20mm: { name: "PVC Locknut & Bushing 20mm (Pair)", price: 10, unit: "pairs" },
    pvc_locknut_25mm: { name: "PVC Locknut & Bushing 25mm (Pair)", price: 15, unit: "pairs" },
    pvc_locknut_32mm: { name: "PVC Locknut & Bushing 32mm (Pair)", price: 22, unit: "pairs" },
    pvc_solvent: { name: "PVC Solvent Cement / Primer (100cc)", price: 85, unit: "pcs" },

    // ─── Electrical - RSC (Rigid Steel Conduit) ───────────────────────────────
    rsc_pipe_1_2: { name: "RSC Pipe 1/2\" x 3m", price: 380, unit: "pcs" },
    rsc_pipe_3_4: { name: "RSC Pipe 3/4\" x 3m", price: 480, unit: "pcs" },
    rsc_pipe_1: { name: "RSC Pipe 1\" x 3m", price: 680, unit: "pcs" },
    rsc_elbow_1_2: { name: "RSC Elbow 1/2\"", price: 45, unit: "pcs" },
    rsc_elbow_3_4: { name: "RSC Elbow 3/4\"", price: 65, unit: "pcs" },
    rsc_elbow_1: { name: "RSC Elbow 1\"", price: 95, unit: "pcs" },
    rsc_coupling_1_2: { name: "RSC Coupling 1/2\"", price: 25, unit: "pcs" },
    rsc_coupling_3_4: { name: "RSC Coupling 3/4\"", price: 35, unit: "pcs" },
    rsc_coupling_1: { name: "RSC Coupling 1\"", price: 55, unit: "pcs" },
    rsc_locknut_bushing_1_2: { name: "RSC Locknut & Bushing 1/2\"", price: 20, unit: "pairs" },
    rsc_locknut_bushing_3_4: { name: "RSC Locknut & Bushing 3/4\"", price: 30, unit: "pairs" },
    rsc_locknut_bushing_1: { name: "RSC Locknut & Bushing 1\"", price: 45, unit: "pairs" },
    entrance_cap_1_2: { name: "Service Entrance Cap 1/2\"", price: 120, unit: "pcs" },
    entrance_cap_3_4: { name: "Service Entrance Cap 3/4\"", price: 180, unit: "pcs" },
    entrance_cap_1: { name: "Service Entrance Cap 1\"", price: 250, unit: "pcs" },
    pipe_strap_1_2: { name: "Pipe Strap / Clamp 1/2\"", price: 8, unit: "pcs" },
    pipe_strap_3_4: { name: "Pipe Strap / Clamp 3/4\"", price: 12, unit: "pcs" },
    pipe_strap_1: { name: "Pipe Strap / Clamp 1\"", price: 15, unit: "pcs" },

    // ─── Electrical - Flexible Conduit ────────────────────────────────────────
    flex_hose_1_2: { name: "Flexible Plastic Conduit 1/2\" (50m Roll)", price: 650, unit: "rolls" },
    flex_hose_3_4: { name: "Flexible Plastic Conduit 3/4\" (50m Roll)", price: 950, unit: "rolls" },
    flex_connector_1_2: { name: "Flexible Plastic Connector 1/2\"", price: 8, unit: "pcs" },
    flex_connector_3_4: { name: "Flexible Plastic Connector 3/4\"", price: 12, unit: "pcs" },

    // ─── Electrical - Junction & Utility Boxes ────────────────────────────────
    utility_box_pvc: { name: "Utility Box 2x4 (PVC/Orange)", price: 25, unit: "pcs" },
    utility_box_metal: { name: "Utility Box 2x4 (Metal/GI)", price: 35, unit: "pcs" },
    junction_box_pvc: { name: "Junction Box 4x4 (PVC/Orange)", price: 35, unit: "pcs" },
    junction_box_metal: { name: "Junction Box 4x4 (Metal/GI)", price: 45, unit: "pcs" },
    square_box_metal: { name: "Square Box 4x4 (Metal/GI)", price: 55, unit: "pcs" },
    octagonal_box_pvc: { name: "Octagonal Box (PVC)", price: 30, unit: "pcs" },
    octagonal_box_metal: { name: "Octagonal Box (Metal)", price: 40, unit: "pcs" },
    box_cover_utility: { name: "Utility Box Cover (Plate)", price: 15, unit: "pcs" },
    box_cover_square: { name: "Square Box Cover 4x4", price: 20, unit: "pcs" },

    // ─── Electrical - Lighting Fixtures ───────────────────────────────────────
    led_bulb_3w: { name: "LED Bulb 3W (E27)", price: 65, unit: "pcs" },
    led_bulb_5w: { name: "LED Bulb 5W (E27)", price: 85, unit: "pcs" },
    led_bulb_7w: { name: "LED Bulb 7W (E27)", price: 105, unit: "pcs" },
    led_bulb_9w: { name: "LED Bulb 9W (E27)", price: 120, unit: "pcs" },
    led_bulb_12w: { name: "LED Bulb 12W (E27)", price: 160, unit: "pcs" },
    led_bulb_15w: { name: "LED Bulb 15W (E27)", price: 210, unit: "pcs" },
    led_bulb_18w: { name: "LED Bulb 18W (E27)", price: 260, unit: "pcs" },
    led_bulb_gu10_3w: { name: "LED Bulb GU10 3W", price: 125, unit: "pcs" },
    led_bulb_gu10_5w: { name: "LED Bulb GU10 5W", price: 155, unit: "pcs" },
    led_bulb_gu10_7w: { name: "LED Bulb GU10 7W", price: 185, unit: "pcs" },
    gu10_socket: { name: "GU10 Lampholder / Socket", price: 35, unit: "pcs" },
    led_tube_t8: { name: "LED Tube T8 18W (1.2m) Set", price: 350, unit: "sets" },
    downlight_fixture_4: { name: "Recessed Downlight Fixture 4\" (Fixture Only)", price: 180, unit: "pcs" },
    downlight_fixture_6: { name: "Recessed Downlight Fixture 6\" (Fixture Only)", price: 250, unit: "pcs" },
    integrated_led_3w: { name: "Integrated LED Downlight 3W", price: 135, unit: "pcs" },
    integrated_led_6w: { name: "Integrated LED Downlight 6W", price: 195, unit: "pcs" },
    integrated_led_9w: { name: "Integrated LED Downlight 9W", price: 245, unit: "pcs" },
    integrated_led_12w: { name: "Integrated LED Downlight 12W", price: 345, unit: "pcs" },
    integrated_led_15w: { name: "Integrated LED Downlight 15W", price: 465, unit: "pcs" },
    integrated_led_18w: { name: "Integrated LED Downlight 18W", price: 585, unit: "pcs" },
    integrated_led_24w: { name: "Integrated LED Downlight 24W", price: 795, unit: "pcs" },
    ceiling_receptacle: { name: "Ceiling Receptacle 4\" (PVC)", price: 35, unit: "pcs" },
    emergency_light: { name: "Emergency Light (Twinhead)", price: 1200, unit: "pcs" },
    exit_sign: { name: "Exit Sign (Illuminated)", price: 850, unit: "pcs" },
    flood_light_10w: { name: "LED Flood Light 10W (Outdoor)", price: 350, unit: "pcs" },
    flood_light_20w: { name: "LED Flood Light 20W (Outdoor)", price: 550, unit: "pcs" },
    flood_light_30w: { name: "LED Flood Light 30W (Outdoor)", price: 850, unit: "pcs" },
    flood_light_50w: { name: "LED Flood Light 50W (Outdoor)", price: 1100, unit: "pcs" },
    flood_light_100w: { name: "LED Flood Light 100W (Outdoor)", price: 2200, unit: "pcs" },
    flood_light_200w: { name: "LED Flood Light 200W (Outdoor)", price: 4500, unit: "pcs" },
    track_rail_1m: { name: "Track Light Rail (1 Meter)", price: 350, unit: "pcs" },
    track_head_12w: { name: "Track Light Head (12W LED)", price: 450, unit: "pcs" },
    led_strip_5m: { name: "LED Strip Light (5m Roll)", price: 650, unit: "rolls" },
    led_driver_12v: { name: "LED Driver / Transformer (12V/60W)", price: 450, unit: "pcs" },
    panel_light_300: { name: "LED Panel Light 300x300mm", price: 550, unit: "pcs" },
    panel_light_600: { name: "LED Panel Light 600x600mm", price: 1850, unit: "pcs" },
    pendant_light: { name: "Pendant / Hanging Light (Modern)", price: 1250, unit: "pcs" },
    wall_sconce: { name: "Wall Lamp / Sconce Fixture", price: 750, unit: "pcs" },
    step_light: { name: "LED Step Light (Recessed)", price: 350, unit: "pcs" },
    post_lamp: { name: "Garden Post Lamp (Outdoor)", price: 1650, unit: "pcs" },
    garden_spike_light: { name: "Garden Spike Light (LED Outdoor)", price: 450, unit: "pcs" },
    solar_street_light: { name: "Solar Street Light 100W (All-in-One)", price: 2800, unit: "pcs" },
    high_bay_light: { name: "Industrial High Bay LED 100W", price: 3500, unit: "pcs" },
    t5_led_batten: { name: "T5 LED Batten (Slim) 1.2m", price: 280, unit: "pcs" },
    surface_downlight_6w: { name: "Surface Type LED Downlight 6W", price: 210, unit: "pcs" },
    surface_downlight_12w: { name: "Surface Type LED Downlight 12W", price: 380, unit: "pcs" },
    surface_downlight_18w: { name: "Surface Type LED Downlight 18W", price: 560, unit: "pcs" },
    surface_downlight_24w: { name: "Surface Type LED Downlight 24W", price: 850, unit: "pcs" },
    rope_light: { name: "LED Rope Light (Flexible, per meter)", price: 120, unit: "m" },

    // ─── Electrical - Switches & Outlets ──────────────────────────────────────
    switch_1g: { name: "1-Gang Switch (Set)", price: 150, unit: "sets" },
    switch_2g: { name: "2-Gang Switch (Set)", price: 220, unit: "sets" },
    switch_3g: { name: "3-Gang Switch (Set)", price: 310, unit: "sets" },
    switch_3way: { name: "3-Way Switch", price: 185, unit: "sets" },
    dimmer_switch: { name: "Dimmer Switch", price: 480, unit: "sets" },
    fan_control: { name: "Fan Control Switch", price: 560, unit: "sets" },
    outlet_duplex: { name: "Duplex Convenience Outlet", price: 210, unit: "sets" },
    outlet_universal: { name: "Universal Duplex Outlet", price: 280, unit: "sets" },
    outlet_single: { name: "Single Convenience Outlet", price: 160, unit: "sets" },
    outlet_gfci: { name: "GFCI Duplex Outlet", price: 1250, unit: "sets" },
    outlet_weatherproof: { name: "Weatherproof Outlet", price: 650, unit: "sets" },
    outlet_ac: { name: "Aircon Outlet", price: 450, unit: "sets" },
    outlet_range: { name: "Range / Stove Outlet", price: 550, unit: "sets" },
    water_heater_switch_20a: { name: "Water Heater Safety Switch (20A DPST)", price: 650, unit: "sets" },
    water_heater_switch_30a: { name: "Water Heater Safety Switch (30A DPST)", price: 850, unit: "sets" },
    data_outlet: { name: "LAN / Data Outlet (CAT6)", price: 350, unit: "sets" },
    tel_outlet: { name: "Telephone Outlet", price: 280, unit: "sets" },

    // ─── Electrical - Panel Boards & Breakers ─────────────────────────────────
    panel_board_4b: { name: "Main Panel Board (4 Branches)", price: 1600, unit: "sets" },
    panel_board_6b: { name: "Main Panel Board (6 Branches)", price: 2100, unit: "sets" },
    panel_board_8b: { name: "Main Panel Board (8 Branches)", price: 2500, unit: "sets" },
    panel_board_10b: { name: "Main Panel Board (10 Branches)", price: 3200, unit: "sets" },
    panel_board_12b: { name: "Main Panel Board (12 Branches)", price: 3800, unit: "sets" },
    panel_board_16b: { name: "Main Panel Board (16 Branches)", price: 4800, unit: "sets" },
    panel_board_20b: { name: "Main Panel Board (20 Branches)", price: 5900, unit: "sets" },
    breaker_15a: { name: "Circuit Breaker (15A)", price: 420, unit: "pcs" },
    breaker_20a: { name: "Circuit Breaker (20A)", price: 420, unit: "pcs" },
    breaker_30a: { name: "Circuit Breaker (30A)", price: 520, unit: "pcs" },
    breaker_40a: { name: "Circuit Breaker (40A)", price: 620, unit: "pcs" },
    breaker_50a: { name: "Circuit Breaker (50A)", price: 720, unit: "pcs" },
    breaker_60a: { name: "Circuit Breaker (60A)", price: 820, unit: "pcs" },
    breaker_100a: { name: "Circuit Breaker (100A)", price: 1450, unit: "pcs" },

    // ─── Electrical - Safety & Auxiliary ─────────────────────────────────────
    smoke_detector: { name: "Smoke Detector (Battery Operated)", price: 650, unit: "pcs" },
    doorbell: { name: "Doorbell Kit (Switch + Chime)", price: 850, unit: "sets" },
    ground_rod: { name: "Grounding Rod 5/8\" x 8ft", price: 450, unit: "pcs" },
    ground_clamp: { name: "Ground Rod Clamp", price: 85, unit: "pcs" },
    bare_copper: { name: "Bare Copper Wire (Grounding, per meter)", price: 120, unit: "m" },
    cat6_cable: { name: "UTP Cable CAT6 (305m Box)", price: 6500, unit: "box" },
    coax_cable: { name: "Coaxial Cable RG6 (Roll)", price: 1200, unit: "rolls" },
    meter_base: { name: "Electric Meter Base (Round)", price: 850, unit: "pcs" },
    sub_meter: { name: "Electric Sub-meter (Analog/Digital)", price: 750, unit: "pcs" },
    mts_switch: { name: "Manual Transfer Switch (MTS)", price: 1450, unit: "sets" },
    weatherproof_enclosure: { name: "Weatherproof Enclosure / Cover", price: 180, unit: "pcs" },
    pv_cable_4: { name: "Solar PV Cable 4.0mm² (per meter)", price: 85, unit: "m" },
    mc4_connector: { name: "MC4 Connector (Pair)", price: 45, unit: "pairs" },

    // ─── Electrical - Misc Hardware ───────────────────────────────────────────
    molding_3_4: { name: "Plastic Molding 3/4\" (8ft)", price: 65, unit: "pcs" },
    molding_1: { name: "Plastic Molding 1\" (8ft)", price: 85, unit: "pcs" },
    tox_screw: { name: "Tox & Screws (100pcs/box)", price: 150, unit: "box" },
    expansion_bolt: { name: "Expansion Bolt 1/4\" x 2\"", price: 25, unit: "pcs" },
    electrical_tape: { name: "Electrical Tape (Big)", price: 45, unit: "rolls" },
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
