
export const MATERIAL_TYPES = {
    gypsum: { label: "Gypsum Board (9mm/12mm)", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_gypsum', fastenerName: "Gypsum Screws" },
    hardiflex: { label: "Fiber Cement / Hardiflex", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_hardiflex', fastenerName: "Hardiflex Screws" },
    plywood: { label: "Marine Plywood (1/4\")", type: 'sheet', w: 1.22, l: 2.44, fastener: 'screw_metal', fastenerName: "Metal Screws" },
    spandrel: { label: "Spandrel Panel (PVC/Metal)", type: 'panel', defW: 0.15, defL: 6.0, fastener: 'rivets', fastenerName: "Blind Rivets" },
    pvc: { label: "PVC Ceiling Panel", type: 'panel', defW: 0.20, defL: 5.80, fastener: 'clips', fastenerName: "PVC Clips" }
};

export const CEILING_TYPES = Object.keys(MATERIAL_TYPES).map(key => ({
    id: key,
    label: MATERIAL_TYPES[key].label
}));

export const DEFAULT_PRICES = {
    ceiling_gypsum_9mm: 450,
    ceiling_hardiflex_1_4: 420,
    ceiling_marine_plywood_1_4: 380,
    spandrel: 550,
    pvc: 480,
    ceiling_wall_angle: 65,
    ceiling_carrying_channel: 180,
    ceiling_metal_furring: 165,
    ceiling_w_clip: 8,
    screw_gypsum: 0.75,
    screw_hardiflex: 0.85,
    screw_metal: 0.65,
    rivets: 1.20,
    clips: 2.50,
    ceiling_mesh_tape: 250,
    ceiling_joint_compound: 850,
    spandrel_molding: 180,
    pvc_u_molding: 120,
    pvc_h_clip: 150
};

/**
 * Calculates materials and costs for Ceiling works.
 */
export const calculateCeiling = (rooms, prices, config = {}) => {
    let totalPerimeter = 0;
    let totalFurringLM = 0;
    let totalCarryingLM = 0;
    let totalIntersections = 0;
    let totalAreaM2 = 0;

    const materials = {
        gypsum: 0, hardiflex: 0, plywood: 0, spandrel: 0, pvc: 0,
        screw_gypsum: 0, screw_hardiflex: 0, screw_metal: 0, rivets: 0, clips: 0,
        mesh_tape_m: 0, compound_bag: 0, spandrel_molding_lm: 0,
        pvc_u_molding_lm: 0, pvc_h_clip_lm: 0
    };

    if (!rooms || rooms.length === 0) return null;

    const FURRING_SPACING = 0.40;
    const CARRYING_SPACING = 1.20;

    rooms.forEach(room => {
        if (room.isExcluded) return;
        const L = parseFloat(room.length_m) || 0;
        const W = parseFloat(room.width_m) || 0;
        const qty = parseInt(room.quantity) || 1;
        const typeKey = room.ceiling_type || 'gypsum_board'; // Match component field name

        // Map component key to utility key if different
        let actualTypeKey = typeKey;
        if (typeKey === 'gypsum_board') actualTypeKey = 'gypsum';

        const typeData = MATERIAL_TYPES[actualTypeKey];

        if (L <= 0 || W <= 0 || !typeData) return;

        totalAreaM2 += L * W * qty;

        const perimeter = 2 * (L + W);
        const carryingRuns = Math.ceil(W / CARRYING_SPACING);
        const roomCarryingLM = carryingRuns * L;
        const furringRuns = Math.ceil(L / FURRING_SPACING);
        const roomFurringLM = furringRuns * W;
        const intersections = carryingRuns * furringRuns;

        totalPerimeter += (perimeter * qty);
        totalCarryingLM += (roomCarryingLM * qty);
        totalFurringLM += (roomFurringLM * qty);
        totalIntersections += (intersections * qty);

        let pieces = 0;
        let fasteners = 0;

        if (typeData.type === 'sheet') {
            const cols = Math.ceil(W / typeData.w);
            const rows = Math.ceil(L / typeData.l);
            pieces = cols * rows;
            fasteners = Math.ceil(roomFurringLM / 0.25);
        } else if (typeData.type === 'panel') {
            const panelW = typeData.defW;
            const panelL = typeData.defL;
            const numStrips = Math.ceil(W / panelW);
            const piecesPerStrip = Math.ceil(L / panelL);
            pieces = numStrips * piecesPerStrip;
            fasteners = numStrips * (typeKey === 'spandrel' ? furringRuns * 2 : furringRuns);
        }

        materials[actualTypeKey] += (pieces * qty);
        materials[typeData.fastener] += (fasteners * qty);

        if (actualTypeKey === 'gypsum' || actualTypeKey === 'hardiflex') {
            materials.mesh_tape_m += (L * W * 1.5 * qty);
            materials.compound_bag += ((L * W / 40) * qty);
        } else if (actualTypeKey === 'spandrel') {
            materials.spandrel_molding_lm += (perimeter * qty);
        } else if (actualTypeKey === 'pvc') {
            materials.pvc_u_molding_lm += (perimeter * qty);
        }
    });

    if (totalAreaM2 <= 0) return null;

    const qtyWallAngle = Math.ceil(totalPerimeter / 3.0);
    const qtyCarrying = Math.ceil(totalCarryingLM / 5.0);
    const qtyFurring = Math.ceil(totalFurringLM / 5.0);
    const qtyWClips = totalIntersections;
    materials['rivets'] += qtyWClips * 4;

    const itemList = [];
    const addItem = (key, qty, unit, name) => {
        if (qty <= 0) return;
        const price = parseFloat(prices[key]) || DEFAULT_PRICES[key] || 0;
        itemList.push({ name, qty: Math.ceil(qty), unit, priceKey: key, price, total: Math.ceil(qty) * price });
    };

    addItem('ceiling_gypsum_9mm', materials.gypsum, 'pcs', MATERIAL_TYPES.gypsum.label);
    addItem('ceiling_hardiflex_1_4', materials.hardiflex, 'pcs', MATERIAL_TYPES.hardiflex.label);
    addItem('ceiling_marine_plywood_1_4', materials.plywood, 'pcs', MATERIAL_TYPES.plywood.label);
    addItem('spandrel', materials.spandrel, 'pcs', MATERIAL_TYPES.spandrel.label);
    addItem('pvc', materials.pvc, 'pcs', MATERIAL_TYPES.pvc.label);

    addItem('ceiling_wall_angle', qtyWallAngle, 'pcs', "Wall Angle (3m)");
    addItem('ceiling_carrying_channel', qtyCarrying, 'pcs', "Carrying Channel (5m)");
    addItem('ceiling_metal_furring', qtyFurring, 'pcs', "Metal Furring (5m)");
    addItem('ceiling_w_clip', qtyWClips, 'pcs', "W-Clips");

    addItem('screw_gypsum', materials.screw_gypsum, 'pcs', "Gypsum Screws");
    addItem('screw_hardiflex', materials.screw_hardiflex, 'pcs', "Hardiflex Screws");
    addItem('screw_metal', materials.screw_metal, 'pcs', "Metal Screws");
    addItem('rivets', materials.rivets, 'pcs', "Blind Rivets");
    addItem('clips', materials.clips, 'sets', "PVC Clips");

    addItem('ceiling_mesh_tape', materials.mesh_tape_m / 75, 'rolls', "Mesh Tape (75m Roll)");
    addItem('ceiling_joint_compound', materials.compound_bag, 'pails', "Jointing Compound (20kg)");
    addItem('spandrel_molding', materials.spandrel_molding_lm / 3.0, 'pcs', "Spandrel Molding (3m)");
    addItem('pvc_u_molding', materials.pvc_u_molding_lm / 3.0, 'pcs', "PVC U-Molding (3m)");

    const total = itemList.reduce((acc, it) => acc + it.total, 0);

    return {
        totalArea: totalAreaM2,
        items: itemList,
        total: total
    };
};
