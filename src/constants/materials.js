
export const MATERIAL_DEFAULTS = {
    // Aggregates
    cement_40kg: { name: "Portland Cement (40kg)", price: 240, unit: "bags" },
    cement_white_40kg: { name: "White Cement (40kg)", price: 900, unit: "bags" },
    sand_wash: { name: "Wash Sand (S1)", price: 1200, unit: "cu.m" },
    sand_plastering: { name: "Mortar Plastering Sand (S2)", price: 1000, unit: "cu.m" },
    gravel_3_4: { name: "Crushed Gravel (3/4)", price: 1400, unit: "cu.m" },
    gravel_bedding: { name: "Gravel Bedding / Sub-base", price: 1000, unit: "cu.m" },
    ready_mix_3000psi: { name: "Ready-Mix Concrete (3000 PSI / 20.7 MPa)", price: 4500, unit: "cu.m" },
    ready_mix_3500psi: { name: "Ready-Mix Concrete (3500 PSI / 24.1 MPa)", price: 4750, unit: "cu.m" },
    ready_mix_4000psi: { name: "Ready-Mix Concrete (4000 PSI / 27.6 MPa)", price: 4910, unit: "cu.m" },
    curing_compound_20l: { name: "Concrete Curing Compound (20L Pail)", price: 1232, unit: "pails" },
    waterproofing_admix_1kg: { name: "Waterproofing Admixture / Integral (1kg)", price: 1350, unit: "bags" },
    expansion_joint_filler: { name: "Expansion Joint Filler Strip (10mm x 100mm x 1.2m)", price: 45, unit: "pcs" },

    // Masonry
    chb_4: { name: 'Concrete Hollow Blocks (4")', price: 15, unit: "pcs" },
    chb_5: { name: 'Concrete Hollow Blocks (5")', price: 18, unit: "pcs" },
    chb_6: { name: 'Concrete Hollow Blocks (6")', price: 22, unit: "pcs" },
    chb_8: { name: 'Concrete Hollow Blocks (8")', price: 30, unit: "pcs" },

    // ─── Rebar (Corrugated / Deformed) ────────────────────────────────────────
    rebar_10mm: { name: "Corrugated Rebar (10mm x 6.0m)", price: 180, unit: "pcs" },
    rebar_12mm: { name: "Corrugated Rebar (12mm x 6.0m)", price: 260, unit: "pcs" },
    rebar_16mm: { name: "Corrugated Rebar (16mm x 6.0m)", price: 480, unit: "pcs" },
    rebar_20mm: { name: "Corrugated Rebar (20mm x 6.0m)", price: 750, unit: "pcs" },
    rebar_25mm: { name: "Corrugated Rebar (25mm x 6.0m)", price: 1150, unit: "pcs" },
    wwm_4x4_10ga: { name: "Welded Wire Mesh 4x4 Gauge 10 (2.4m x 6.0m)", price: 2200, unit: "sheets" },
    wwm_6x6_10ga: { name: "Welded Wire Mesh 6x6 Gauge 10 (2.4m x 6.0m)", price: 1850, unit: "sheets" },

    "rebar_10mm_6.0m": { name: "Corrugated Rebar (10mm × 6.0m)", price: 180, unit: "pcs" },
    "rebar_10mm_7.5m": { name: "Corrugated Rebar (10mm × 7.5m)", price: 225, unit: "pcs" },
    "rebar_10mm_9.0m": { name: "Corrugated Rebar (10mm × 9.0m)", price: 270, unit: "pcs" },
    "rebar_10mm_10.5m": { name: "Corrugated Rebar (10mm × 10.5m)", price: 315, unit: "pcs" },
    "rebar_10mm_12.0m": { name: "Corrugated Rebar (10mm × 12.0m)", price: 360, unit: "pcs" },
    "rebar_12mm_6.0m": { name: "Corrugated Rebar (12mm × 6.0m)", price: 260, unit: "pcs" },
    "rebar_12mm_7.5m": { name: "Corrugated Rebar (12mm × 7.5m)", price: 325, unit: "pcs" },
    "rebar_12mm_9.0m": { name: "Corrugated Rebar (12mm × 9.0m)", price: 390, unit: "pcs" },
    "rebar_12mm_10.5m": { name: "Corrugated Rebar (12mm × 10.5m)", price: 455, unit: "pcs" },
    "rebar_12mm_12.0m": { name: "Corrugated Rebar (12mm × 12.0m)", price: 520, unit: "pcs" },
    "rebar_16mm_6.0m": { name: "Corrugated Rebar (16mm × 6.0m)", price: 480, unit: "pcs" },
    "rebar_16mm_7.5m": { name: "Corrugated Rebar (16mm × 7.5m)", price: 600, unit: "pcs" },
    "rebar_16mm_9.0m": { name: "Corrugated Rebar (16mm × 9.0m)", price: 720, unit: "pcs" },
    "rebar_16mm_10.5m": { name: "Corrugated Rebar (16mm × 10.5m)", price: 840, unit: "pcs" },
    "rebar_16mm_12.0m": { name: "Corrugated Rebar (16mm × 12.0m)", price: 960, unit: "pcs" },
    "rebar_20mm_6.0m": { name: "Corrugated Rebar (20mm × 6.0m)", price: 750, unit: "pcs" },
    "rebar_20mm_7.5m": { name: "Corrugated Rebar (20mm × 7.5m)", price: 940, unit: "pcs" },
    "rebar_20mm_9.0m": { name: "Corrugated Rebar (20mm × 9.0m)", price: 1125, unit: "pcs" },
    "rebar_20mm_10.5m": { name: "Corrugated Rebar (20mm × 10.5m)", price: 1310, unit: "pcs" },
    "rebar_20mm_12.0m": { name: "Corrugated Rebar (20mm × 12.0m)", price: 1500, unit: "pcs" },
    "rebar_25mm_6.0m": { name: "Corrugated Rebar (25mm × 6.0m)", price: 1150, unit: "pcs" },
    "rebar_25mm_7.5m": { name: "Corrugated Rebar (25mm × 7.5m)", price: 1440, unit: "pcs" },
    "rebar_25mm_9.0m": { name: "Corrugated Rebar (25mm × 9.0m)", price: 1725, unit: "pcs" },
    "rebar_25mm_10.5m": { name: "Corrugated Rebar (25mm × 10.5m)", price: 2015, unit: "pcs" },
    "rebar_25mm_12.0m": { name: "Corrugated Rebar (25mm × 12.0m)", price: 2300, unit: "pcs" },

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
    shoring_prop: { name: "Adjustable Shoring Prop (Floor Jack)", price: 1200, unit: "pcs" },

    // ─── Tiles & Finishes — Consumables ───────────────────────────────────────
    tile_adhesive: { name: "Tile Adhesive (25kg)", price: 320, unit: "bags" },
    tile_adhesive_25kg: { name: "Tile Adhesive (25kg)", price: 320, unit: "bags" },
    tile_grout: { name: "Tile Grout (kg)", price: 75, unit: "kg" },
    tile_grout_2kg: { name: "Tile Grout (2kg)", price: 150, unit: "bags" },
    epoxy_grout_1kg: { name: "Epoxy Grout (1kg)", price: 385, unit: "bags" },
    tile_spacer_2mm: { name: "Tile Spacers 2mm (500pcs/bag)", price: 58, unit: "bags" },
    tile_edge_trim: { name: "Tile Edge Trim / Nosing (2.4m)", price: 180, unit: "pcs" },
    tile_underlay_roll: { name: "PE Foam Underlay (15m² Roll)", price: 380, unit: "rolls" },
    tile_leveling_clips: { name: "Tile Leveling Clip System (50-pc Pack)", price: 250, unit: "packs" },
    vinyl_adhesive_sqm: { name: "Vinyl / Sheet Adhesive (per sq.m)", price: 80, unit: "sq.m" },

    // ─── Porcelain Tiles (per pc) ─────────────────────────────────────────────
    tile_porcelain_30x30: { name: "Porcelain Tile 30×30cm", price: 38, unit: "pcs" },
    tile_porcelain_40x40: { name: "Porcelain Tile 40×40cm", price: 68, unit: "pcs" },
    tile_porcelain_45x45: { name: "Porcelain Tile 45×45cm", price: 95, unit: "pcs" },
    tile_porcelain_60x60: { name: "Porcelain Tile 60×60cm", price: 165, unit: "pcs" },
    tile_porcelain_60x120: { name: "Porcelain Tile 60×120cm", price: 320, unit: "pcs" },
    tile_porcelain_80x80: { name: "Porcelain Tile 80×80cm", price: 385, unit: "pcs" },
    tile_porcelain_100x100: { name: "Porcelain Tile 100×100cm", price: 650, unit: "pcs" },

    // ─── Ceramic Tiles (per pc) ───────────────────────────────────────────────
    tile_ceramic_20x20: { name: "Ceramic Tile 20×20cm", price: 18, unit: "pcs" },
    tile_ceramic_25x25: { name: "Ceramic Tile 25×25cm", price: 22, unit: "pcs" },
    tile_ceramic_30x30: { name: "Ceramic Tile 30×30cm", price: 40, unit: "pcs" },
    tile_ceramic_40x40: { name: "Ceramic Tile 40×40cm", price: 65, unit: "pcs" },
    tile_ceramic_60x60: { name: "Ceramic Tile 60×60cm", price: 150, unit: "pcs" },
    // legacy fallback keys
    tile_30x30: { name: "Ceramic Tile 30×30cm", price: 40, unit: "pcs" },
    tile_60x60: { name: "Ceramic / General Tile 60×60cm", price: 165, unit: "pcs" },

    // ─── Homogeneous Tiles (per pc) ───────────────────────────────────────────
    tile_homogeneous_60x60: { name: "Homogeneous Tile 60×60cm", price: 195, unit: "pcs" },
    tile_homogeneous_60x120: { name: "Homogeneous Tile 60×120cm", price: 380, unit: "pcs" },
    tile_homogeneous_80x80: { name: "Homogeneous Tile 80×80cm", price: 450, unit: "pcs" },
    tile_homogeneous_100x100: { name: "Homogeneous Tile 100×100cm", price: 720, unit: "pcs" },

    // ─── Granite / Natural Stone (per pc) ────────────────────────────────────
    tile_granite_30x30: { name: "Granite Tile 30×30cm", price: 130, unit: "pcs" },
    tile_granite_40x40: { name: "Granite Tile 40×40cm", price: 220, unit: "pcs" },
    tile_granite_60x60: { name: "Granite Tile 60×60cm", price: 420, unit: "pcs" },
    tile_granite_60x120: { name: "Granite Tile 60×120cm", price: 780, unit: "pcs" },

    // ─── Mosaic Tiles (per sheet 30×30cm) ────────────────────────────────────
    tile_mosaic_30x30: { name: "Mosaic Tile Sheet (30×30cm)", price: 250, unit: "sheets" },

    // ─── Wall Ceramic Tiles (per pc) ─────────────────────────────────────────
    tile_wall_ceramic_20x25: { name: "Wall Ceramic Tile 20×25cm", price: 22, unit: "pcs" },
    tile_wall_ceramic_20x30: { name: "Wall Ceramic Tile 20×30cm", price: 26, unit: "pcs" },
    tile_wall_ceramic_25x40: { name: "Wall Ceramic Tile 25×40cm", price: 45, unit: "pcs" },
    tile_wall_ceramic_30x60: { name: "Wall Ceramic Tile 30×60cm", price: 75, unit: "pcs" },

    // ─── SPC / Vinyl / Laminate Flooring (per box or pc) ──────────────────────
    flooring_spc: { name: "SPC Vinyl Plank (per box ~1.86 sq.m)", price: 1900, unit: "boxes" },
    flooring_vinyl_plank: { name: "LVT Vinyl Plank (per box ~2.0 sq.m)", price: 1600, unit: "boxes" },
    flooring_laminate: { name: "Laminate Wood Flooring (per box ~2.13 sq.m)", price: 1450, unit: "boxes" },
    tile_spc_plank_18x120: { name: "SPC Plank 18×120cm", price: 95, unit: "pcs" },
    tile_spc_plank_22x152: { name: "SPC Plank 22×152cm", price: 135, unit: "pcs" },
    tile_spc_plank_23x183: { name: "SPC Plank 23×183cm", price: 160, unit: "pcs" },
    tile_vinyl_30x30: { name: "Vinyl Tile (LVT) 30×30cm", price: 38, unit: "pcs" },
    tile_vinyl_45x45: { name: "Vinyl Tile (LVT) 45×45cm", price: 72, unit: "pcs" },
    tile_vinyl_30x60: { name: "Vinyl Tile (LVT) 30×60cm", price: 85, unit: "pcs" },
    tile_vinyl_18x122: { name: "Vinyl Plank (LVT) 18×122cm", price: 110, unit: "pcs" },

    // ─── Sheet / Sq.m Flooring ────────────────────────────────────────────────
    flooring_vinyl_sheet: { name: "Vinyl Sheet Flooring (per sq.m)", price: 450, unit: "sq.m" },
    flooring_hardwood: { name: "Engineered / Solid Hardwood (per sq.m)", price: 2800, unit: "sq.m" },

    // ─── Waterproofing ────────────────────────────────────────────────────────
    waterproofing_elasto_4l: { name: "Elastomeric Waterproofing Paint (4L)", price: 920, unit: "tins" },
    waterproofing_membrane: { name: "Waterproofing Membrane (HDPE, 1m x 20m roll)", price: 2800, unit: "rolls" },

    // ─── Structural Steel ─────────────────────────────────────────────────────
    steel_wide_flange_kg: { name: "Structural Steel Wide Flange A36 (per kg)", price: 55, unit: "kg" },
    steel_i_beam_kg: { name: "Structural Steel I-Beam A36 (per kg)", price: 55, unit: "kg" },
    flat_bar_25x3: { name: "Flat Bar 25mm x 3mm x 6m", price: 280, unit: "pcs" },
    flat_bar_50x6: { name: "Flat Bar 50mm x 6mm x 6m", price: 950, unit: "pcs" },
    round_bar_10mm: { name: "Round Bar 10mm x 6m (Plain)", price: 150, unit: "pcs" },
    round_bar_12mm: { name: "Round Bar 12mm x 6m (Plain)", price: 220, unit: "pcs" },
    checkered_plate_4x8: { name: "Checkered Plate 3mm (4'x8')", price: 4200, unit: "sheets" },
    welding_rod_e6013_5kg: { name: "Welding Rod E6013 3.2mm (5kg box)", price: 390, unit: "boxes" },
    cutting_disc_4in: { name: "Cutting Disc 4\" (Metal, 25pcs/pack)", price: 120, unit: "packs" },

    // Auxiliary
    pvc_pipe_blue_1_2: { name: "PVC Pipe (1/2\" Blue)", price: 145, unit: "pcs" },
    pvc_pipe_orange_2: { name: "PVC Pipe (2\" Orange)", price: 320, unit: "pcs" },
    thhn_wire_2_0: { name: "THHN Wire (2.0mm²)", price: 3800, unit: "rolls" },

    // ─── Door Hardware — Hinges ────────────────────────────────────────────────
    door_hinge_3: { name: "Door Hinge Stainless 3\" (pair)", price: 85, unit: "pairs" },
    door_hinge_3_5: { name: "Door Hinge Stainless 3.5\" (pair)", price: 120, unit: "pairs" },
    door_hinge_4: { name: "Door Hinge Stainless 4\" (pair)", price: 165, unit: "pairs" },
    door_hinge_spring: { name: "Spring Hinge (Self-Closing) 3.5\"", price: 250, unit: "pcs" },
    door_hinge_butterfly: { name: "Butterfly / T-Hinge (Heavy Duty, 6\")", price: 95, unit: "pairs" },
    floor_spring: { name: "Floor Spring / Floor Closer (80kg cap.)", price: 2999, unit: "sets" },

    // ─── Door Hardware — Locksets & Handles ───────────────────────────────────
    lockset_mortise: { name: "Mortise Lockset (Mid-Range)", price: 1650, unit: "sets" },
    lockset_mortise_premium: { name: "Mortise Lockset (Premium / Hafele)", price: 2800, unit: "sets" },
    lockset_lever: { name: "Lever Handle Lockset (Mid-Range)", price: 750, unit: "sets" },
    lockset_knob: { name: "Knob Lockset (Budget)", price: 450, unit: "sets" },
    deadbolt_single: { name: "Deadbolt Lock - Single Cylinder", price: 499, unit: "sets" },
    deadbolt_double: { name: "Deadbolt Lock - Double Cylinder", price: 650, unit: "sets" },
    door_handle_lever: { name: "Door Lever Handle (Passage, No Lock)", price: 380, unit: "pcs" },
    door_handle_pull: { name: "Door Pull Handle (Stainless, 300mm)", price: 450, unit: "pairs" },

    // ─── Door Hardware — Door Closers ─────────────────────────────────────────
    door_closer_light: { name: "Hydraulic Door Closer (Light Duty, up to 45kg)", price: 950, unit: "pcs" },
    door_closer_heavy: { name: "Hydraulic Door Closer (Heavy Duty, up to 80kg)", price: 2500, unit: "pcs" },

    // ─── Door Hardware — Bolts & Latches ──────────────────────────────────────
    barrel_bolt_4: { name: "Barrel Bolt / Slide Bolt Stainless 4\"", price: 75, unit: "pcs" },
    barrel_bolt_6: { name: "Barrel Bolt / Slide Bolt Stainless 6\"", price: 95, unit: "pcs" },
    tower_bolt_8: { name: "Tower Bolt Stainless 8\" (Heavy Duty)", price: 120, unit: "pcs" },
    flush_bolt: { name: "Flush Bolt Stainless (for Double Doors)", price: 185, unit: "pcs" },
    door_latch: { name: "Door Latch / Night Latch (Spring Bolt)", price: 120, unit: "pcs" },

    // ─── Door Hardware — Security & Accessories ───────────────────────────────
    padlock_40mm: { name: "Padlock Brass 40mm (Standard)", price: 120, unit: "pcs" },
    padlock_60mm: { name: "Padlock Brass 60mm (Heavy Duty)", price: 280, unit: "pcs" },
    door_chain: { name: "Door Chain / Security Chain (Stainless)", price: 140, unit: "pcs" },
    door_peephole: { name: "Door Peephole / Viewer (180-degree)", price: 150, unit: "pcs" },
    door_kick_plate: { name: "Door Kick Plate (Stainless, 200x900mm)", price: 680, unit: "pcs" },
    door_stop_floor: { name: "Door Stop - Floor Mount (Stainless)", price: 85, unit: "pcs" },
    door_stop_wall: { name: "Door Stop - Wall Mount (Rubber Tip)", price: 55, unit: "pcs" },
    weatherstrip_foam: { name: "Door Weatherstrip - Foam Seal (5m roll)", price: 65, unit: "rolls" },
    weatherstrip_rubber: { name: "Door Bottom Seal / Draft Stopper (1m)", price: 180, unit: "pcs" },

    // ─── General Fasteners ────────────────────────────────────────────────────
    anchor_bolt_1_2: { name: "Anchor Bolt 1/2\" x 4\" (J-Bolt)", price: 35, unit: "pcs" },
    concrete_nail_kg: { name: "Concrete Nails (kg)", price: 95, unit: "kg" },
    finish_nail_kg: { name: "Finish Nails (kg)", price: 90, unit: "kg" },
    window_screen: { name: "Window Screen / Insect Mesh (1.2m x 30m roll)", price: 1200, unit: "rolls" },

    // ─── Site Works ───────────────────────────────────────────────────────────
    soil_fill_cum: { name: "Soil Fill / Earth Fill (per cu.m)", price: 650, unit: "cu.m" },
    topsoil_cum: { name: "Topsoil (per cu.m)", price: 900, unit: "cu.m" },
    gravel_fill_compacted: { name: "Compacted Gravel Fill (per cu.m)", price: 1100, unit: "cu.m" },
    geotextile_fabric: { name: "Geotextile Fabric (Non-Woven, 4m x 100m roll)", price: 8500, unit: "rolls" },
    culvert_pipe_12in: { name: "Concrete Culvert Pipe 12\" (0.9m length)", price: 850, unit: "pcs" },
    culvert_pipe_24in: { name: "Concrete Culvert Pipe 24\" (0.9m length)", price: 2200, unit: "pcs" },
    riprap_boulders: { name: "Riprap / Boulders (per cu.m)", price: 1800, unit: "cu.m" },
    bamboo_pole: { name: "Bamboo Pole (3m length)", price: 85, unit: "pcs" },
    gabion_basket: { name: "Gabion Basket / Rockfill Box (2m x 1m x 1m)", price: 2800, unit: "pcs" },


    gi_pipe_1_2: { name: "GI Pipe 1/2\" Sch 40 (6.0m)", price: 1000, unit: "pcs" },
    gi_pipe_3_4: { name: "GI Pipe 3/4\" Sch 40 (6.0m)", price: 1300, unit: "pcs" },
    gi_pipe_1: { name: "GI Pipe 1\" Sch 40 (6.0m)", price: 1800, unit: "pcs" },
    // GI Fittings — 1/2\"
    gi_elbow_90_1_2: { name: "GI Elbow 90° 1/2\"", price: 28, unit: "pcs" },
    gi_tee_1_2: { name: "GI Tee 1/2\"", price: 35, unit: "pcs" },
    gi_coupling_1_2: { name: "GI Coupling 1/2\"", price: 20, unit: "pcs" },
    gi_nipple_1_2: { name: "GI Nipple 1/2\"", price: 18, unit: "pcs" },
    gi_union_1_2: { name: "GI Union 1/2\"", price: 65, unit: "pcs" },
    gi_gate_valve_1_2: { name: "GI Gate Valve 1/2\"", price: 180, unit: "pcs" },
    gi_ball_valve_1_2: { name: "GI Ball Valve 1/2\"", price: 120, unit: "pcs" },
    gi_end_cap_1_2: { name: "GI End Cap 1/2\"", price: 20, unit: "pcs" },
    // GI Fittings — 3/4\"
    gi_elbow_90_3_4: { name: "GI Elbow 90° 3/4\"", price: 35, unit: "pcs" },
    gi_tee_3_4: { name: "GI Tee 3/4\"", price: 45, unit: "pcs" },
    gi_coupling_3_4: { name: "GI Coupling 3/4\"", price: 28, unit: "pcs" },
    gi_nipple_3_4: { name: "GI Nipple 3/4\"", price: 22, unit: "pcs" },
    gi_union_3_4: { name: "GI Union 3/4\"", price: 85, unit: "pcs" },
    gi_gate_valve_3_4: { name: "GI Gate Valve 3/4\"", price: 220, unit: "pcs" },
    gi_ball_valve_3_4: { name: "GI Ball Valve 3/4\"", price: 150, unit: "pcs" },
    gi_reducer_3_4x1_2: { name: "GI Reducer 3/4\"x1/2\"", price: 35, unit: "pcs" },
    gi_end_cap_3_4: { name: "GI End Cap 3/4\"", price: 25, unit: "pcs" },
    // GI Fittings — 1\"
    gi_elbow_90_1: { name: "GI Elbow 90° 1\"", price: 55, unit: "pcs" },
    gi_tee_1: { name: "GI Tee 1\"", price: 70, unit: "pcs" },
    gi_coupling_1: { name: "GI Coupling 1\"", price: 40, unit: "pcs" },
    gi_nipple_1: { name: "GI Nipple 1\"", price: 35, unit: "pcs" },
    gi_union_1: { name: "GI Union 1\"", price: 120, unit: "pcs" },
    gi_gate_valve_1: { name: "GI Gate Valve 1\"", price: 320, unit: "pcs" },
    gi_ball_valve_1: { name: "GI Ball Valve 1\"", price: 220, unit: "pcs" },
    gi_reducer_1x3_4: { name: "GI Reducer 1\"x3/4\"", price: 48, unit: "pcs" },
    gi_end_cap_1: { name: "GI End Cap 1\"", price: 35, unit: "pcs" },
    // GI Pipe Clamps
    pipe_clamp_1_2: { name: "Pipe Clamp 1/2\"", price: 12, unit: "pcs" },
    pipe_clamp_3_4: { name: "Pipe Clamp 3/4\"", price: 14, unit: "pcs" },
    pipe_clamp_1: { name: "Pipe Clamp 1\"", price: 18, unit: "pcs" },
    water_tank_300l: { name: "Overhead Water Tank Poly (300L)", price: 3200, unit: "units" },
    water_tank_500l: { name: "Overhead Water Tank Poly (500L)", price: 4200, unit: "units" },
    water_tank_1000l: { name: "Overhead Water Tank Poly (1000L)", price: 7500, unit: "units" },
    water_tank_1500l: { name: "Overhead Water Tank Poly (1500L)", price: 10500, unit: "units" },
    water_tank_2000l: { name: "Overhead Water Tank Poly (2000L)", price: 13500, unit: "units" },
    water_tank_2500l: { name: "Overhead Water Tank Poly (2500L)", price: 16500, unit: "units" },
    water_tank_3000l: { name: "Overhead Water Tank Poly (3000L)", price: 19500, unit: "units" },
    water_tank_4000l: { name: "Overhead Water Tank Poly (4000L)", price: 26000, unit: "units" },
    water_tank_5000l: { name: "Overhead Water Tank Poly (5000L)", price: 32000, unit: "units" },
    water_tank_ss_500l: { name: "Stainless Steel Water Tank (500L)", price: 8500, unit: "units" },
    water_tank_ss_1000l: { name: "Stainless Steel Water Tank (1000L)", price: 14500, unit: "units" },
    water_tank_ss_1500l: { name: "Stainless Steel Water Tank (1500L)", price: 21000, unit: "units" },
    water_tank_ss_2000l: { name: "Stainless Steel Water Tank (2000L)", price: 28000, unit: "units" },
    water_tank_ss_2500l: { name: "Stainless Steel Water Tank (2500L)", price: 35000, unit: "units" },
    submersible_pump_05hp: { name: "Submersible Pump 0.5HP (Clean Water)", price: 5500, unit: "units" },
    submersible_pump_075hp: { name: "Submersible Pump 0.75HP (Clean Water)", price: 7200, unit: "units" },
    submersible_pump_10hp: { name: "Submersible Pump 1.0HP (Clean Water)", price: 8500, unit: "units" },
    submersible_pump_15hp: { name: "Submersible Pump 1.5HP (Clean Water)", price: 11500, unit: "units" },
    submersible_pump_20hp: { name: "Submersible Pump 2.0HP (Clean Water)", price: 14500, unit: "units" },
    jet_pump_05hp: { name: "Jet Pump 0.5HP (Self-Priming)", price: 5200, unit: "units" },
    jet_pump_075hp: { name: "Jet Pump 0.75HP (Self-Priming)", price: 6200, unit: "units" },
    jet_pump_10hp: { name: "Jet Pump 1.0HP (Self-Priming)", price: 7200, unit: "units" },
    jet_pump_15hp: { name: "Jet Pump 1.5HP (Self-Priming)", price: 9800, unit: "units" },
    jet_pump_20hp: { name: "Jet Pump 2.0HP (Self-Priming)", price: 12500, unit: "units" },
    booster_pump_05hp: { name: "Booster Pump 0.5HP w/ Pressure Tank", price: 6800, unit: "units" },
    booster_pump_075hp: { name: "Booster Pump 0.75HP w/ Pressure Tank", price: 8200, unit: "units" },
    booster_pump_10hp: { name: "Booster Pump 1.0HP w/ Pressure Tank", price: 9500, unit: "units" },
    booster_pump_15hp: { name: "Booster Pump 1.5HP w/ Pressure Tank", price: 12500, unit: "units" },
    booster_pump_20hp: { name: "Booster Pump 2.0HP w/ Pressure Tank", price: 16500, unit: "units" },
    centrifugal_pump_05hp: { name: "Centrifugal Pump 0.5HP", price: 3800, unit: "units" },
    centrifugal_pump_075hp: { name: "Centrifugal Pump 0.75HP", price: 4600, unit: "units" },
    centrifugal_pump_10hp: { name: "Centrifugal Pump 1.0HP", price: 5500, unit: "units" },
    centrifugal_pump_15hp: { name: "Centrifugal Pump 1.5HP", price: 7800, unit: "units" },
    centrifugal_pump_20hp: { name: "Centrifugal Pump 2.0HP", price: 10500, unit: "units" },
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
    ceiling_fan_48: { name: "Ceiling Fan 48\" (Standard)", price: 3500, unit: "units" },
    exhaust_fan_8: { name: "Exhaust Fan 8\" Wall-Mounted", price: 1500, unit: "units" },

    // Drywall
    drywall_metal_stud: { name: "Metal Stud (3m)", price: 165, unit: "pcs" },
    drywall_metal_track: { name: "Metal Track (3m)", price: 180, unit: "pcs" },
    drywall_gypsum_12mm: { name: "Gypsum Board (12mm x 4'x8')", price: 550, unit: "pcs" },
    drywall_fcb_6mm: { name: "Fiber Cement Board (6mm)", price: 650, unit: "pcs" },
    ceiling_mesh_tape: { name: "Fiberglass Mesh Tape (75m)", price: 250, unit: "rolls" },
    ceiling_joint_compound: { name: "Jointing Compound (20kg)", price: 850, unit: "pails" },

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
    phenolic_1_2: { name: '1/2" Phenolic Board (4\'x8\')', price: 1400, unit: "sheets" },
    phenolic_3_4: { name: '3/4" Phenolic Board (4\'x8\')', price: 1800, unit: "sheets" },
    plywood_1_2: { name: '1/2" Ordinary Plywood (4\'x8\')', price: 680, unit: "sheets" },
    plywood_3_4: { name: '3/4" Ordinary Plywood (4\'x8\')', price: 920, unit: "sheets" },
    marine_plywood_1_2: { name: '1/2" Marine Plywood (4\'x8\')', price: 1250, unit: "sheets" },
    marine_plywood_3_4: { name: '3/4" Marine Plywood (4\'x8\')', price: 1650, unit: "sheets" },
    cocoLumber: { name: "Coco Lumber (Shoring/Posts/Joists)", price: 45, unit: "BF" },
    gi_pipe_1_1_2: { name: "G.I. Pipe 1.5\" x 6m (Horizontal Tie)", price: 850, unit: "pcs" },

    // ─── Steel Deck (Suspended Slab Decking) ──────────────────────────────────
    deck_08: { name: "Steel Deck 0.80mm (per linear meter, ~0.9m wide)", price: 450, unit: "ln.m" },
    deck_10: { name: "Steel Deck 1.00mm (per linear meter, ~0.9m wide)", price: 550, unit: "ln.m" },
    deck_12: { name: "Steel Deck 1.20mm (per linear meter, ~0.9m wide)", price: 650, unit: "ln.m" },

    // ─── H-Frame Scaffolding components (legacy calculation keys) ─────────────
    h_frame: { name: "H-Frame (1.7m x 1.2m)", price: 1200, unit: "pcs" },
    cross_brace: { name: "Cross Brace (Scaffolding)", price: 450, unit: "pcs" },
    u_head: { name: "U-Head Jack (Scaffolding)", price: 350, unit: "pcs" },
    shackle: { name: "Swivel Clamp / Shackle (Scaffolding)", price: 65, unit: "pcs" },

    // ─── Lumber Shoring — by species & size (price per Board-Foot / BF) ───────
    lumber_coco_2x2: { name: 'Coco Lumber 2×2 (Shoring)', price: 35, unit: "BF" },
    lumber_coco_2x3: { name: 'Coco Lumber 2×3 (Shoring)', price: 40, unit: "BF" },
    lumber_coco_2x4: { name: 'Coco Lumber 2×4 (Shoring)', price: 48, unit: "BF" },
    lumber_mahogany_2x2: { name: 'Mahogany Lumber 2×2 (Shoring)', price: 75, unit: "BF" },
    lumber_mahogany_2x3: { name: 'Mahogany Lumber 2×3 (Shoring)', price: 85, unit: "BF" },
    lumber_mahogany_2x4: { name: 'Mahogany Lumber 2×4 (Shoring)', price: 95, unit: "BF" },
    lumber_apitong_2x3: { name: 'Apitong Lumber 2×3 (Shoring)', price: 65, unit: "BF" },
    lumber_apitong_2x4: { name: 'Apitong Lumber 2×4 (Shoring)', price: 72, unit: "BF" },

    // ─── Steel Shoring / Scaffolding Systems ──────────────────────────────────
    scaffold_h_frame: { name: "H-Frame Scaffolding Set (Frame + Braces + U-Head / module)", price: 2500, unit: "sets" },
    scaffold_acrow: { name: "Adjustable Steel Prop / Acrow Prop (Screw Jack)", price: 1100, unit: "pcs" },
    scaffold_kwikstage: { name: "Kwikstage / Cuplock Scaffolding Frame (per module)", price: 2800, unit: "sets" },

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
    water_heater_single_instant: { name: "Water Heater - Single Point (Instant 3.5kW)", price: 4500, unit: "sets" },
    water_heater_single_premium: { name: "Water Heater - Single Point (Instant 4.5kW Premium)", price: 6500, unit: "sets" },
    water_heater_multi_instant: { name: "Water Heater - Multi Point (Instant 6.5kW)", price: 8500, unit: "sets" },
    water_heater_storage_30l: { name: "Water Heater - Storage Type (30L)", price: 9500, unit: "sets" },
    water_heater_storage_50l: { name: "Water Heater - Storage Type (50L)", price: 12500, unit: "sets" },
    water_heater_storage_80l: { name: "Water Heater - Storage Type (80L)", price: 16500, unit: "sets" },
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
