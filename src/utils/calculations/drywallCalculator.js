export const MATERIAL_TYPES = {
    // Gypsum Boards
    gypsum_9mm: { label: "Gypsum Board (9mm)", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_gypsum', fastenerName: "Gypsum Screws" },
    gypsum_12mm: { label: "Gypsum Board (12mm)", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_gypsum', fastenerName: "Gypsum Screws" },
    gypsum_15mm: { label: "Gypsum Board (15mm) Fire-rated", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_gypsum', fastenerName: "Gypsum Screws" },

    // Fiber Cement Boards
    fcb_3_5mm: { label: "Fiber Cement Board (3.5mm)", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_hardiflex', fastenerName: "Hardiflex Screws" },
    fcb_4_5mm: { label: "Fiber Cement Board (4.5mm)", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_hardiflex', fastenerName: "Hardiflex Screws" },
    fcb_6mm: { label: "Fiber Cement Board (6mm)", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_hardiflex', fastenerName: "Hardiflex Screws" },
    fcb_9mm: { label: "Fiber Cement Board (9mm)", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_hardiflex', fastenerName: "Hardiflex Screws" },
    fcb_12mm: { label: "Fiber Cement Board (12mm)", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_hardiflex', fastenerName: "Hardiflex Screws" },

    // Plywoods
    plywood_1_4: { label: "Marine Plywood (1/4\")", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_metal', fastenerName: "Metal Screws" },
    plywood_1_2: { label: "Marine Plywood (1/2\")", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_metal', fastenerName: "Metal Screws" },
    plywood_3_4: { label: "Marine Plywood (3/4\")", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_metal', fastenerName: "Metal Screws" },

    // WPC
    wpc_fluted: { label: "WPC Fluted Panel (160mm x 2900mm)", type: 'panel', w: 0.16, l: 2.9, fastener: 'clips_wpc', fastenerName: "WPC Clips" },

    // Acoustic
    acoustic_board: { label: "Acoustic Board (1220mm x 2440mm)", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_gypsum', fastenerName: "Gypsum Screws" }
};

export const FILLER_MATERIALS = {
    // Thermal Fillers — w × l = coverage face area; t = nominal thickness (m)
    glasswool: { label: "Glasswool Insulation (1.2m x 15m x 50mm Roll)", w: 1.2, l: 15, t: 0.050, unit: 'rolls', category: 'Thermal' },
    pe_foam: { label: "PE Foam Insulation (1m x 50m x 12mm Roll)", w: 1.0, l: 50, t: 0.012, unit: 'rolls', category: 'Thermal' },
    eps_foam: { label: "EPS Styrofoam Board (1.2m x 2.4m x 50mm)", w: 1.2, l: 2.4, t: 0.050, unit: 'pcs', category: 'Thermal' },

    // Acoustical Fillers
    rockwool: { label: "Rockwool Slab (0.6m x 1.2m x 50mm)", w: 0.6, l: 1.2, t: 0.050, unit: 'pcs', category: 'Acoustical' },
    acoustic_fiberglass: { label: "Acoustic Fiberglass Board (0.6m x 1.2m x 50mm)", w: 0.6, l: 1.2, t: 0.050, unit: 'pcs', category: 'Acoustical' },
};

export const DRYWALL_TYPES = [
    { id: 'none', label: "None (Open Side)" },
    ...Object.keys(MATERIAL_TYPES).map(key => ({
        id: key,
        label: MATERIAL_TYPES[key].label
    }))
];

export const FILLER_TYPES = [
    { id: 'none', label: "None" },
    {
        group: "Thermal Fillers",
        options: Object.keys(FILLER_MATERIALS)
            .filter(key => FILLER_MATERIALS[key].category === 'Thermal')
            .map(key => ({ id: key, label: FILLER_MATERIALS[key].label }))
    },
    {
        group: "Acoustical Fillers",
        options: Object.keys(FILLER_MATERIALS)
            .filter(key => FILLER_MATERIALS[key].category === 'Acoustical')
            .map(key => ({ id: key, label: FILLER_MATERIALS[key].label }))
    }
];

export const DEFAULT_PRICES = {
    gypsum_9mm: 420,
    gypsum_12mm: 550,
    gypsum_15mm: 850,
    fcb_3_5mm: 380,
    fcb_4_5mm: 450,
    fcb_6mm: 650,
    fcb_9mm: 980,
    fcb_12mm: 1250,
    plywood_1_4: 420,
    plywood_1_2: 950,
    plywood_3_4: 1450,
    wpc_fluted: 350,
    acoustic_board: 950,

    glasswool: 1850,
    pe_foam: 1200,
    eps_foam: 350,
    rockwool: 250,
    acoustic_fiberglass: 450,

    drywall_metal_stud: 165,
    drywall_metal_track: 180,

    screw_gypsum: 0.75,
    screw_hardiflex: 0.85,
    screw_metal: 0.65,
    clips_wpc: 3.50,

    ceiling_mesh_tape: 250,
    ceiling_joint_compound: 850,
    rivets: 1.20
};

/**
 * Calculates materials and costs for Drywall works.
 */
export const calculateDrywall = (walls, prices, config = {}) => {
    let totalLengthM = 0;
    let totalAreaM2 = 0;

    const materials = {
        drywall_metal_stud: 0, drywall_metal_track: 0,
        screw_gypsum: 0, screw_hardiflex: 0, screw_metal: 0, clips_wpc: 0,
        mesh_tape_m: 0, compound_bag: 0, rivets: 0
    };

    // Initialize all material type quantities to 0
    Object.keys(MATERIAL_TYPES).forEach(key => {
        materials[key] = 0;
    });
    Object.keys(FILLER_MATERIALS).forEach(key => {
        materials[key] = 0;
    });

    if (!walls || walls.length === 0) return null;

    const STUD_SPACING = 0.40;

    walls.forEach(wall => {
        if (wall.isExcluded) return;
        const L = parseFloat(wall.length_m) || 0;
        const H = parseFloat(wall.width_m) || 0;
        const qty = parseInt(wall.quantity) || 1;
        const typeA = wall.drywall_type_side_a || 'none';
        const typeB = wall.drywall_type_side_b || 'none';
        const filler = wall.filler_material || 'none';

        if (L <= 0 || H <= 0) return;

        const area = L * H * qty;
        totalAreaM2 += area;
        totalLengthM += (L * qty);

        const trackLength = L * 2;
        const qtyTrack = Math.ceil(trackLength / 3.0);

        const numStuds = Math.ceil(L / STUD_SPACING) + 1;
        const studLengthNeeded = numStuds * H;
        const qtyStud = Math.ceil(studLengthNeeded / 3.0);

        materials.drywall_metal_track += (qtyTrack * qty);
        materials.drywall_metal_stud += (qtyStud * qty);
        materials.rivets += (numStuds * 4 * qty);

        const processSide = (typeKey) => {
            if (!typeKey || typeKey === 'none') return;

            // Legacy fallback mappings
            let actualTypeKey = typeKey;
            if (typeKey === 'gypsum_board' || typeKey === 'gypsum') actualTypeKey = 'gypsum_9mm';
            if (typeKey === 'hardiflex') actualTypeKey = 'fcb_4_5mm';
            if (typeKey === 'plywood') actualTypeKey = 'plywood_1_4';

            const typeData = MATERIAL_TYPES[actualTypeKey];
            if (!typeData) return;

            let pieces = 0;
            let fasteners = 0;

            if (typeData.type === 'sheet') {
                const cols = Math.ceil(L / typeData.w);
                const rows = Math.ceil(H / typeData.l);
                pieces = cols * rows;
                fasteners = pieces * 40;
            } else if (typeData.type === 'panel') {
                const numStrips = Math.ceil(L / typeData.w);
                const piecesPerStrip = Math.ceil(H / typeData.l);
                pieces = numStrips * piecesPerStrip;
                fasteners = pieces * 6; // roughly 6 clips per WPC
            }

            materials[actualTypeKey] += (pieces * qty);
            materials[typeData.fastener] += (fasteners * qty);

            // Gypsum and FCB generic matching for taping/jointing
            if (actualTypeKey.includes('gypsum') || actualTypeKey.includes('fcb')) {
                materials.mesh_tape_m += (area * 1.5);
                materials.compound_bag += (area / 40);
            }
        };

        if (filler !== 'none' && FILLER_MATERIALS[filler]) {
            const fillerData = FILLER_MATERIALS[filler];
            // TRUE GEOMETRIC VOLUME:
            // Cavity volume to fill = wall_area × filler_thickness (t)
            // Volume per unit       = w × l × t
            // Quantity              = cavity_volume / unit_volume = area / (w × l)
            const cavityVolume = area * fillerData.t;            // m³ of cavity to fill
            const unitVolume = fillerData.w * fillerData.l * fillerData.t; // m³ per roll/board
            materials[filler] += cavityVolume / unitVolume;
        }

        processSide(typeA);
        processSide(typeB);
    });

    if (totalAreaM2 <= 0) return null;

    const itemList = [];
    const addItem = (key, qty, unit, name) => {
        if (qty <= 0) return;
        const price = parseFloat(prices[key]) || DEFAULT_PRICES[key] || 0;
        itemList.push({ name, qty: Math.ceil(qty), unit, priceKey: key, price, total: Math.ceil(qty) * price });
    };

    // Add all panel items
    Object.keys(MATERIAL_TYPES).forEach(key => {
        addItem(key, materials[key], 'pcs', MATERIAL_TYPES[key].label);
    });

    Object.keys(FILLER_MATERIALS).forEach(key => {
        addItem(key, materials[key], FILLER_MATERIALS[key].unit, FILLER_MATERIALS[key].label);
    });

    // Add framing
    addItem('drywall_metal_track', materials.drywall_metal_track, 'pcs', "Metal Track (3m)");
    addItem('drywall_metal_stud', materials.drywall_metal_stud, 'pcs', "Metal Stud (3m)");

    // Add fasteners & accessories
    addItem('screw_gypsum', materials.screw_gypsum, 'pcs', "Gypsum Screws");
    addItem('screw_hardiflex', materials.screw_hardiflex, 'pcs', "Hardiflex Screws");
    addItem('screw_metal', materials.screw_metal, 'pcs', "Metal Screws");
    addItem('clips_wpc', materials.clips_wpc, 'pcs', "WPC Clips/Fasteners");
    addItem('rivets', materials.rivets, 'pcs', "Blind Rivets");

    addItem('ceiling_mesh_tape', materials.mesh_tape_m / 75, 'rolls', "Mesh Tape (75m)");
    addItem('ceiling_joint_compound', materials.compound_bag, 'pails', "Jointing Compound (20kg)");

    const total = itemList.reduce((acc, it) => acc + it.total, 0);

    return {
        totalArea: totalAreaM2,
        items: itemList,
        total: total
    };
};
