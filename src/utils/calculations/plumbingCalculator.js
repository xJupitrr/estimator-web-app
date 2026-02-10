
export const DEFAULT_PRICES = {
    // PPR Waterline (20mm & 25mm)
    ppr_pipe_20mm: 480,       // 1/2"
    ppr_pipe_25mm: 650,       // 3/4"
    ppr_elbow_90_20mm: 25,
    ppr_elbow_90_25mm: 45,
    ppr_elbow_45_20mm: 35,
    ppr_elbow_45_25mm: 55,
    ppr_tee_20mm: 35,
    ppr_tee_25mm: 65,
    ppr_coupling_20mm: 15,
    ppr_coupling_25mm: 25,
    ppr_female_adapter_20mm: 120, // w/ brass thread
    ppr_female_adapter_25mm: 180,
    ppr_male_adapter_20mm: 110,
    ppr_male_adapter_25mm: 165,
    ppr_female_elbow_20mm: 145,
    ppr_female_elbow_25mm: 210,
    ppr_male_elbow_20mm: 135,
    ppr_male_elbow_25mm: 195,
    ppr_end_cap_20mm: 15,
    ppr_end_cap_25mm: 25,
    ppr_union_patente_20mm: 280,
    ppr_union_patente_25mm: 380,
    ppr_gate_valve_20mm: 850,
    ppr_gate_valve_25mm: 1150,
    ppr_ball_valve_20mm: 450,
    ppr_ball_valve_25mm: 650,
    ppr_check_valve_20mm: 650,
    ppr_check_valve_25mm: 850,

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
    pvc_sanitary_tee_100x50: 185,
    pvc_sanitary_tee_100x75: 195,
    pvc_wye_100mm: 210,
    pvc_wye_75mm: 160,
    pvc_wye_50mm: 95,
    pvc_wye_100x50: 245, // 4"x2" Wye
    pvc_wye_100x75: 265, // 4"x3" Wye
    pvc_cleanout_100mm: 145,
    pvc_cleanout_75mm: 110,
    pvc_cleanout_50mm: 70,
    pvc_p_trap_100mm: 350,
    pvc_p_trap_50mm: 120,
    pvc_vent_cap_100mm: 110,
    pvc_vent_cap_50mm: 45,
    pvc_reducer_100x50: 135,
    pvc_reducer_100x75: 150,

    // Accessories & Consumables
    solvent_cement: 180,
    teflon_tape: 25,
    pipe_clamp_100mm: 45,
    pipe_clamp_75mm: 35,
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
    urinal_set: 4500,
    bidet_set: 850,
    bathtub_set: 18000,
    grease_trap: 3200,
    water_heater_single: 6500,
    water_heater_multi: 11500,
    kitchen_faucet: 1200,
    lavatory_faucet: 950,
    angle_valve: 280,
    flex_hose: 220,
    laundry_tray: 2500,
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
        urinal_set: 0,
        bidet_set: 0,
        bathtub_set: 0,
        grease_trap: 0,
        water_heater_single: 0,
        water_heater_multi: 0,
        kitchen_faucet: 0,
        lavatory_faucet: 0,
        angle_valve: 0,
        flex_hose: 0,
        laundry_tray: 0,
    };

    data.forEach(row => {
        if (row.isExcluded) return;
        const qty = parseFloat(row.quantity) || 0;
        if (qty <= 0) return;

        const cat = row.category;
        const item = row.type || row.item;

        if (cat === 'fixtures') {
            // Updated: Removed automated rough-in pipe logic. Only count the fixture itself.
            if (item === 'wc') fixtureCounts.wc_set += qty;
            else if (item === 'lavatory') fixtureCounts.lav_set += qty;
            else if (item === 'sink') fixtureCounts.sink_set += qty;
            else if (item === 'shower') fixtureCounts.shower_set += qty;
            else if (item === 'hose_bibb') fixtureCounts.hose_bibb += qty;
            else if (item === 'floor_drain') fixtureCounts.floor_drain += qty;
            else if (item === 'roof_drain') fixtureCounts.roof_drain += qty;
            else if (item === 'catch_basin') fixtureCounts.catch_basin += qty;
            else if (item === 'urinal') fixtureCounts.urinal_set += qty;
            else if (item === 'bidet') fixtureCounts.bidet_set += qty;
            else if (item === 'bathtub') fixtureCounts.bathtub_set += qty;
            else if (item === 'grease_trap') fixtureCounts.grease_trap += qty;
            else if (item === 'water_heater_single') fixtureCounts.water_heater_single += qty;
            else if (item === 'water_heater_multi') fixtureCounts.water_heater_multi += qty;
            else if (item === 'kitchen_faucet') fixtureCounts.kitchen_faucet += qty;
            else if (item === 'lavatory_faucet') fixtureCounts.lavatory_faucet += qty;
            else if (item === 'angle_valve') fixtureCounts.angle_valve += qty;
            else if (item === 'flex_hose') fixtureCounts.flex_hose += qty;
            else if (item === 'laundry_tray') fixtureCounts.laundry_tray += qty;
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
    addItem('wc_set', fixtureCounts.wc_set, 'sets', "Water Closet (WC)");
    addItem('lav_set', fixtureCounts.lav_set, 'sets', "Lavatory");
    addItem('sink_set', fixtureCounts.sink_set, 'sets', "Kitchen Sink");
    addItem('shower_set', fixtureCounts.shower_set, 'sets', "Shower");
    addItem('hose_bibb', fixtureCounts.hose_bibb, 'pcs', "Hose Bibb / Faucet");
    addItem('floor_drain', fixtureCounts.floor_drain, 'pcs', "Floor Drain (4x4)");
    addItem('roof_drain', fixtureCounts.roof_drain, 'pcs', "Roof Drain");
    addItem('catch_basin', fixtureCounts.catch_basin, 'pcs', "Catch Basin");
    addItem('urinal_set', fixtureCounts.urinal_set, 'sets', "Urinal (Wall-hung)");
    addItem('bidet_set', fixtureCounts.bidet_set, 'sets', "Bidet Spray");
    addItem('bathtub_set', fixtureCounts.bathtub_set, 'sets', "Bathtub (Standard)");
    addItem('grease_trap', fixtureCounts.grease_trap, 'pcs', "Grease Trap");
    addItem('water_heater_single', fixtureCounts.water_heater_single, 'sets', "Water Heater (Single Point)");
    addItem('water_heater_multi', fixtureCounts.water_heater_multi, 'sets', "Water Heater (Multi Point)");
    addItem('kitchen_faucet', fixtureCounts.kitchen_faucet, 'pcs', "Kitchen Faucet (Gooseneck)");
    addItem('lavatory_faucet', fixtureCounts.lavatory_faucet, 'pcs', "Lavatory Faucet");
    addItem('angle_valve', fixtureCounts.angle_valve, 'pcs', "Angle Valve (1/2\"x1/2\")");
    addItem('flex_hose', fixtureCounts.flex_hose, 'pcs', "Flexible Hose (Stainless)");
    addItem('laundry_tray', fixtureCounts.laundry_tray, 'pcs', "Laundry Tray");

    // Merge manual material counts
    const finalMaterialCounts = { ...materialCounts };

    // Set pieces for manual entries (using default piece logic if they were added via manual selection)
    // Note: Since we removed auto-calc, finalMaterialCounts only contains what the user manually added in the table.

    // Dynamic Material List Output
    Object.entries(finalMaterialCounts).forEach(([key, qty]) => {
        // Skip fixtures already handled
        if (fixtureCounts[key] !== undefined) return;
        if (key.endsWith('_set')) return; // Also skip set keys if they leaked here

        let sizeInfo = "";
        if (key.includes('100x50')) sizeInfo = '4"x2"';
        else if (key.includes('100x75')) sizeInfo = '4"x3"';
        else if (key.includes('100mm')) sizeInfo = '4"';
        else if (key.includes('75mm')) sizeInfo = '3"';
        else if (key.includes('50mm')) sizeInfo = '2"';
        else if (key.includes('20mm')) sizeInfo = '20mm';
        else if (key.includes('25mm')) sizeInfo = '25mm';

        let name = key.replace(/_/g, ' ')
            .replace(/\bppr\b/gi, 'PPR')
            .replace(/\bpvc\b/gi, 'uPVC')
            .replace(/\bwc\b/gi, 'WC')
            .replace(/\b90\b/g, '90°')
            .replace(/\b45\b/g, '45°')
            .replace(/\b100mm\b|\b75mm\b|\b50mm\b|\b100x50\b|\b100x75\b|\b20mm\b|\b25mm\b/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, c => c.toUpperCase());

        if (sizeInfo) {
            name = `${sizeInfo} ${name}`;
        }

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
