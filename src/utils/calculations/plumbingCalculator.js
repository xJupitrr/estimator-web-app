
export const DEFAULT_PRICES = {
    // PPR Waterline (20mm)
    ppr_pipe_20mm: 480,
    ppr_elbow_90_20mm: 25,
    ppr_elbow_45_20mm: 35,
    ppr_tee_20mm: 35,
    ppr_coupling_20mm: 15,
    ppr_female_adapter_20mm: 120, // w/ brass thread
    ppr_male_adapter_20mm: 110,
    ppr_end_cap_20mm: 15,
    ppr_union_patente_20mm: 280,
    ppr_gate_valve_20mm: 850,
    ppr_ball_valve_20mm: 450,
    ppr_check_valve_20mm: 650,

    // uPVC Sanitary/Storm (100mm, 75mm, 50mm)
    pvc_pipe_100mm: 820,
    pvc_pipe_75mm: 550,
    pvc_pipe_50mm: 280,
    pvc_elbow_90_100mm: 110,
    pvc_elbow_45_100mm: 105,
    pvc_elbow_90_75mm: 85,
    pvc_elbow_45_75mm: 80,
    pvc_elbow_90_50mm: 40,
    pvc_elbow_45_50mm: 38,
    pvc_sanitary_tee_100mm: 165,
    pvc_sanitary_tee_75mm: 125,
    pvc_sanitary_tee_50mm: 75,
    pvc_wye_100mm: 210,
    pvc_wye_75mm: 160,
    pvc_wye_50mm: 95,
    pvc_cleanout_100mm: 145,
    pvc_cleanout_75mm: 110,
    pvc_cleanout_50mm: 70,
    pvc_p_trap_50mm: 120,
    pvc_vent_cap_50mm: 45,
    pvc_reducer_100x50: 135,
    pvc_reducer_100x75: 150,

    // Accessories & Consumables
    solvent_cement: 180,
    teflon_tape: 25,
    pipe_clamp_100mm: 45,
    pipe_clamp_50mm: 25,

    // Fixtures
    wc_set: 5200,
    lav_set: 2600,
    sink_set: 2100,
    shower_set: 1700,
    hose_bibb: 320,
    floor_drain: 140,
    roof_drain: 380,
    catch_basin: 1200,
};

/**
 * Calculates Plumbing Materials based on fixture counts.
 */
export const calculatePlumbing = (data, prices) => {
    if (!data || data.length === 0) return null;

    let totalCost = 0;
    const items = [];

    // Accumulators for rough-ins (meters)
    let total_ppr_20mm_m = 0;
    let total_pvc_100mm_m = 0;
    let total_pvc_75mm_m = 0;
    let total_pvc_50mm_m = 0;

    // Direct material counts
    const materialCounts = {};

    // Fixture counts (for auto rough-in and fixture items)
    const fixtureCounts = {
        wc_set: 0,
        lav_set: 0,
        sink_set: 0,
        shower_set: 0,
        hose_bibb: 0,
        floor_drain: 0,
        roof_drain: 0,
        catch_basin: 0,
    };

    data.forEach(row => {
        const qty = parseFloat(row.quantity) || 0;
        if (qty <= 0) return;

        const cat = row.category;
        const item = row.type || row.item;

        if (cat === 'fixtures') {
            // AUTOMATED ROUGH-IN LOGIC
            if (item === 'wc') {
                fixtureCounts.wc_set += qty;
                total_ppr_20mm_m += (3 * qty);
                total_pvc_100mm_m += (4 * qty);
                total_pvc_50mm_m += (2 * qty); // vent
            }
            else if (item === 'lavatory') {
                fixtureCounts.lav_set += qty;
                total_ppr_20mm_m += (3 * qty);
                total_pvc_50mm_m += (3 * qty);
            }
            else if (item === 'sink') {
                fixtureCounts.sink_set += qty;
                total_ppr_20mm_m += (4 * qty);
                total_pvc_50mm_m += (4 * qty);
            }
            else if (item === 'shower') {
                fixtureCounts.shower_set += qty;
                total_ppr_20mm_m += (5 * qty);
                total_pvc_50mm_m += (3 * qty);
            }
            else if (item === 'hose_bibb') {
                fixtureCounts.hose_bibb += qty;
                total_ppr_20mm_m += (6 * qty);
            }
            else if (item === 'floor_drain') {
                fixtureCounts.floor_drain += qty;
                total_pvc_50mm_m += (2 * qty);
            }
            else if (item === 'roof_drain') {
                fixtureCounts.roof_drain += qty;
                total_pvc_100mm_m += (4 * qty);
            }
            else if (item === 'catch_basin') {
                fixtureCounts.catch_basin += qty;
                total_pvc_100mm_m += (5 * qty);
            }
        } else {
            // MANUAL MATERIAL ENTRY
            materialCounts[item] = (materialCounts[item] || 0) + qty;
        }
    });

    const addItem = (key, qty, unit, name) => {
        if (qty <= 0) return;
        const price = parseFloat(prices[key]) || DEFAULT_PRICES[key] || 0;
        const total = qty * price;
        totalCost += total;
        items.push({ name, qty, unit, priceKey: key, price, total });
    };

    // Fixtures
    addItem('wc_set', fixtureCounts.wc_set, 'sets', "Water Closet Set (Complete)");
    addItem('lav_set', fixtureCounts.lav_set, 'sets', "Lavatory Set w/ Faucet");
    addItem('sink_set', fixtureCounts.sink_set, 'sets', "Kitchen Sink w/ Faucet");
    addItem('shower_set', fixtureCounts.shower_set, 'sets', "Shower Head & Valve Set");
    addItem('hose_bibb', fixtureCounts.hose_bibb, 'pcs', "Hose Bibb / Faucet");
    addItem('floor_drain', fixtureCounts.floor_drain, 'pcs', "Floor Drain (4x4)");
    addItem('roof_drain', fixtureCounts.roof_drain, 'pcs', "Roof Drain (Dome Type)");
    addItem('catch_basin', fixtureCounts.catch_basin, 'pcs', "Pre-cast / Built-in Catch Basin");

    // Merge manual material counts with auto-calc'd piping
    // Convert accumulated meters to pieces
    const ppr_pcs = Math.ceil(total_ppr_20mm_m / 4);
    const pvc_100_pcs = Math.ceil(total_pvc_100mm_m / 3);
    const pvc_75_pcs = Math.ceil(total_pvc_75mm_m / 3);
    const pvc_50_pcs = Math.ceil(total_pvc_50mm_m / 3);

    // Sum up
    const finalMaterialCounts = { ...materialCounts };
    if (ppr_pcs > 0) finalMaterialCounts.ppr_pipe_20mm = (finalMaterialCounts.ppr_pipe_20mm || 0) + ppr_pcs;
    if (pvc_100_pcs > 0) finalMaterialCounts.pvc_pipe_100mm = (finalMaterialCounts.pvc_pipe_100mm || 0) + pvc_100_pcs;
    if (pvc_75_pcs > 0) finalMaterialCounts.pvc_pipe_75mm = (finalMaterialCounts.pvc_pipe_75mm || 0) + pvc_75_pcs;
    if (pvc_50_pcs > 0) finalMaterialCounts.pvc_pipe_50mm = (finalMaterialCounts.pvc_pipe_50mm || 0) + pvc_50_pcs;

    // Rough Estimated Fittings for Auto-Calc'd fixtures
    if (total_ppr_20mm_m > 0) finalMaterialCounts.ppr_elbow_90_20mm = (finalMaterialCounts.ppr_elbow_90_20mm || 0) + Math.ceil(total_ppr_20mm_m * 1.5);
    if (fixtureCounts.wc_set > 0) finalMaterialCounts.pvc_elbow_90_100mm = (finalMaterialCounts.pvc_elbow_90_100mm || 0) + (fixtureCounts.wc_set * 2);
    if (total_pvc_50mm_m > 0) finalMaterialCounts.pvc_elbow_90_50mm = (finalMaterialCounts.pvc_elbow_90_50mm || 0) + Math.ceil(total_pvc_50mm_m);

    // Dynamic Material List Output
    Object.entries(finalMaterialCounts).forEach(([key, qty]) => {
        // Skip fixtures already handled
        if (fixtureCounts[key] !== undefined) return;
        if (key.endsWith('_set')) return; // Also skip set keys if they leaked here

        let name = key.replace(/_/g, ' ')
            .replace(/\bppr\b/gi, 'PPR')
            .replace(/\bpvc\b/gi, 'PVC')
            .replace(/\bwc\b/gi, 'WC')
            .replace(/\b90\b/g, '90°')
            .replace(/\b45\b/g, '45°')
            .replace(/\b\w/g, c => c.toUpperCase());

        let unit = 'pcs';

        if (key.includes('pipe')) {
            const length = key.startsWith('ppr') ? '4m' : '3m';
            name += ` (${length})`;
        } else if (key === 'solvent_cement') {
            unit = 'cans';
        } else if (key === 'teflon_tape') {
            unit = 'rolls';
        }

        addItem(key, qty, unit, name);
    });

    if (items.length === 0) return null;

    return {
        items,
        total: totalCost
    };
};
