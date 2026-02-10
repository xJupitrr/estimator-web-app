
export const DEFAULT_PRICES = {
    thhn_2_0: 3200, // per 150m roll (Royu/PD average)
    thhn_3_5: 5400, // per 150m roll
    thhn_5_5: 8200, // per 150m roll
    pvc_pipe_20mm: 110, // 3m length
    utility_box: 25,
    junction_box: 35,
    switch_1g: 150,
    switch_2g: 220,
    switch_3g: 310,
    outlet_duplex: 210,
    outlet_ac: 450,
    outlet_range: 550,
    panel_board_4b: 1600,
    panel_board_6b: 2100,
    panel_board_8b: 2500,
    panel_board_10b: 3200,
    panel_board_12b: 3800,
    panel_board_16b: 4800,
    panel_board_20b: 5900,
    breaker_15a: 420,
    breaker_20a: 420,
    breaker_30a: 520,
    breaker_40a: 620,
    breaker_50a: 720,
    breaker_60a: 820,
    breaker_100a: 1450,
    electrical_tape: 45,
};

/**
 * Calculates Electrical Materials based on point counts.
 */
export const calculateElectrical = (data, prices) => {
    if (!data || data.length === 0) return null;

    let totalCost = 0;
    const items = [];

    // Accumulators
    let total_thhn_2_0_m = 0;
    let total_thhn_3_5_m = 0;
    let total_thhn_5_5_m = 0;
    let total_pvc_20mm_m = 0;
    let total_utility_boxes = 0;
    let total_junction_boxes = 0;

    const deviceCounts = {
        switch_1g: 0,
        switch_2g: 0,
        switch_3g: 0,
        outlet_duplex: 0,
        outlet_ac: 0,
        outlet_range: 0,
    };

    const directItems = {};

    data.forEach(row => {
        if (row.isExcluded) return;
        const qty = parseInt(row.quantity) || 0;
        if (qty <= 0) return;

        const type = row.type; // lighting, outlet_conv, outlet_ac, outlet_range, switch_1g, etc.

        if (type === 'lighting') {
            total_thhn_2_0_m += (12 * qty); // ~6m hot + 6m neutral per point
            total_pvc_20mm_m += (4 * qty);
            total_junction_boxes += qty;
        }
        else if (type === 'outlet_conv') {
            total_thhn_3_5_m += (15 * qty); // ~7.5m pair
            total_pvc_20mm_m += (5 * qty);
            total_utility_boxes += qty;
            deviceCounts.outlet_duplex += qty;
        }
        else if (type === 'outlet_ac') {
            total_thhn_5_5_m += (20 * qty); // Longer runs for AC usually
            total_pvc_20mm_m += (6 * qty);
            total_utility_boxes += qty;
            deviceCounts.outlet_ac += qty;
        }
        else if (type === 'outlet_range') {
            total_thhn_5_5_m += (25 * qty);
            total_pvc_20mm_m += (8 * qty);
            total_utility_boxes += qty;
            deviceCounts.outlet_range += qty;
        }
        else if (type.startsWith('switch_')) {
            total_thhn_2_0_m += (8 * qty);
            total_pvc_20mm_m += (3 * qty);
            total_utility_boxes += qty;
            deviceCounts[type] += qty;
        }
        else if (type.startsWith('panel_board_') || type.startsWith('breaker_')) {
            directItems[type] = (directItems[type] || 0) + qty;
        }
    });

    const addItem = (key, qty, unit, name) => {
        if (qty <= 0) return;
        const price = parseFloat(prices[key]) || DEFAULT_PRICES[key] || 0;
        const total = qty * price;
        totalCost += total;
        items.push({ name, qty, unit, priceKey: key, price, total });
    };

    // Direct Items (Panel Boards & Breakers)
    Object.entries(directItems).forEach(([key, qty]) => {
        let name = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        if (key.startsWith('panel_board_')) {
            const branches = key.split('_').pop().replace('b', '');
            name = `Main Panel Board (${branches} Branches)`;
        } else if (key.startsWith('breaker_')) {
            const amp = key.split('_').pop().toUpperCase();
            name = `Circuit Breaker (${amp})`;
        }
        addItem(key, qty, 'pcs', name);
    });

    // Wires (Rolls of 150m)
    addItem('thhn_2_0', Math.ceil(total_thhn_2_0_m / 150), 'rolls', "THHN Wire 2.0mm² (150m)");
    addItem('thhn_3_5', Math.ceil(total_thhn_3_5_m / 150), 'rolls', "THHN Wire 3.5mm² (150m)");
    addItem('thhn_5_5', Math.ceil(total_thhn_5_5_m / 150), 'rolls', "THHN Wire 5.5mm² (150m)");

    // Conduits (3m length)
    addItem('pvc_pipe_20mm', Math.ceil(total_pvc_20mm_m / 3), 'pcs', "PVC Electric Pipe 20mm (3m)");

    // Boxes
    addItem('utility_box', total_utility_boxes, 'pcs', "PVC Utility Box 2x4");
    addItem('junction_box', total_junction_boxes, 'pcs', "PVC Junction Box 4x4");

    // Devices
    addItem('switch_1g', deviceCounts.switch_1g, 'sets', "1-Gang Switch");
    addItem('switch_2g', deviceCounts.switch_2g, 'sets', "2-Gang Switch");
    addItem('switch_3g', deviceCounts.switch_3g, 'sets', "3-Gang Switch");
    addItem('outlet_duplex', deviceCounts.outlet_duplex, 'sets', "Duplex Convenience Outlet");
    addItem('outlet_ac', deviceCounts.outlet_ac, 'sets', "Aircon Outlet (Universal)");
    addItem('outlet_range', deviceCounts.outlet_range, 'sets', "Range/Stove Outlet");

    // Consumables
    addItem('electrical_tape', Math.ceil(items.length / 2), 'rolls', "Electrical Tape (Big)");

    if (items.length === 0) return null;

    return {
        items,
        total: totalCost
    };
};
