
export const DEFAULT_PRICES = {
    thhn_2_0: 3200, // per 150m roll (Royu/PD average)
    thhn_3_5: 5400, // per 150m roll
    thhn_5_5: 8200, // per 150m roll
    thhn_8_0: 12500,
    thhn_14_0: 22000,
    thhn_22_0: 34000,
    thhn_30_0: 48000,
    pvc_pipe_20mm: 110, // 3m length
    pvc_pipe_25mm: 155,
    pvc_pipe_32mm: 240,
    pvc_adapter_20mm: 12,
    pvc_adapter_25mm: 18,
    pvc_adapter_32mm: 28,
    pvc_locknut_20mm: 10,
    pvc_locknut_25mm: 15,
    pvc_locknut_32mm: 22,
    // RSC
    rsc_pipe_1_2: 380,
    rsc_pipe_3_4: 480,
    rsc_pipe_1: 680,
    rsc_elbow_1_2: 45,
    rsc_elbow_3_4: 65,
    rsc_elbow_1: 95,
    rsc_coupling_1_2: 25,
    rsc_coupling_3_4: 35,
    rsc_coupling_1: 55,
    rsc_locknut_bushing_1_2: 20,
    rsc_locknut_bushing_3_4: 30,
    rsc_locknut_bushing_1: 45,
    entrance_cap_1_2: 120,
    entrance_cap_3_4: 180,
    entrance_cap_1: 250,
    pipe_strap_1_2: 8,
    pipe_strap_3_4: 12,
    pipe_strap_1: 15,
    molding_3_4: 65,
    molding_1: 85,
    tox_screw: 150, // box
    expansion_bolt: 25,
    pvc_solvent: 85,
    pv_cable_4: 85, // per meter
    mc4_connector: 45, // pair
    weatherproof_enclosure: 180,
    // Flex (Plastic/Orange)
    flex_hose_1_2: 650, // 50m roll
    flex_hose_3_4: 950, // 50m roll
    flex_connector_1_2: 8,
    flex_connector_3_4: 12,

    utility_box_pvc: 25,
    utility_box_metal: 35,
    junction_box_pvc: 35,
    junction_box_metal: 45,
    square_box_metal: 55,
    octagonal_box_pvc: 30,
    octagonal_box_metal: 40,
    box_cover_utility: 15,
    box_cover_square: 20,

    // Lighting
    led_bulb_3w: 65,
    led_bulb_5w: 85,
    led_bulb_7w: 105,
    led_bulb_9w: 120,
    led_bulb_12w: 160,
    led_bulb_15w: 210,
    led_bulb_18w: 260,
    led_bulb_gu10_3w: 125,
    led_bulb_gu10_5w: 155,
    led_bulb_gu10_7w: 185,
    gu10_socket: 35,
    led_tube_t8: 350,
    downlight_fixture_4: 180,
    downlight_fixture_6: 250,
    integrated_led_3w: 135,
    integrated_led_6w: 195,
    integrated_led_9w: 245,
    integrated_led_12w: 345,
    integrated_led_15w: 465,
    integrated_led_18w: 585,
    integrated_led_24w: 795,
    ceiling_receptacle: 35,
    emergency_light: 1200,
    exit_sign: 850,
    flood_light_10w: 350,
    flood_light_20w: 550,
    flood_light_30w: 850,
    flood_light_50w: 1100,
    flood_light_100w: 2200,
    flood_light_200w: 4500,
    track_rail_1m: 350,
    track_head_12w: 450,
    led_strip_5m: 650,
    led_driver_12v: 450,
    panel_light_300: 550,
    panel_light_600: 1850,
    pendant_light: 1250,
    wall_sconce: 750,
    step_light: 350,
    post_lamp: 1650,
    garden_spike_light: 450,
    solar_street_light: 2800,
    high_bay_light: 3500,
    t5_led_batten: 280,
    surface_downlight_6w: 210,
    surface_downlight_12w: 380,
    surface_downlight_18w: 560,
    surface_downlight_24w: 850,
    rope_light: 120,

    switch_1g: 150,

    // Safety & Aux
    smoke_detector: 650,
    doorbell: 850,
    ground_rod: 450,
    ground_clamp: 85,
    bare_copper: 120, // per meter
    cat6_cable: 6500, // per box 305m
    coax_cable: 1200, // RG6 roll
    meter_base: 850,
    sub_meter: 750,
    mts_switch: 1450,
    switch_2g: 220,
    switch_3g: 310,
    switch_3way: 185,
    dimmer_switch: 480,
    fan_control: 560,
    outlet_duplex: 210,
    outlet_universal: 280,
    outlet_single: 160,
    outlet_gfci: 1250,
    outlet_weatherproof: 650,
    outlet_ac: 450,
    outlet_range: 550,
    water_heater_switch_20a: 650,
    water_heater_switch_30a: 850,
    data_outlet: 350,
    tel_outlet: 280,
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
        outlet_universal: 0,
        outlet_single: 0,
        outlet_gfci: 0,
        outlet_weatherproof: 0,
        outlet_ac: 0,
        outlet_range: 0,
        data_outlet: 0,
        tel_outlet: 0,
    };

    const directItems = {};

    data.forEach(row => {
        if (row.isExcluded) return;
        const qty = parseInt(row.quantity) || 0;
        if (qty <= 0) return;

        const type = row.type;

        // Points selection logic removed per request. Now strictly manual selection.
        if (deviceCounts.hasOwnProperty(type)) {
            deviceCounts[type] += qty;
        } else {
            // All other items (rough-in, protection, etc) are treated as direct items
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

    // Names mapping for direct items
    const nameMap = {
        thhn_2_0: "THHN Wire 2.0mm² (150m Roll)",
        thhn_3_5: "THHN Wire 3.5mm² (150m Roll)",
        thhn_5_5: "THHN Wire 5.5mm² (150m Roll)",
        thhn_8_0: "THHN Wire 8.0mm² (150m Roll)",
        thhn_14_0: "THHN Wire 14.0mm² (150m Roll)",
        thhn_22_0: "THHN Wire 22.0mm² (150m Roll)",
        thhn_30_0: "THHN Wire 30.0mm² (150m Roll)",
        pvc_pipe_20mm: "PVC Electric Pipe 20mm (3m)",
        pvc_pipe_25mm: "PVC Electric Pipe 25mm (3m)",
        pvc_pipe_32mm: "PVC Electric Pipe 32mm (3m)",
        pvc_adapter_20mm: "PVC Male Adapter 20mm (w/ Locknut)",
        pvc_adapter_25mm: "PVC Male Adapter 25mm (w/ Locknut)",
        pvc_adapter_32mm: "PVC Male Adapter 32mm (w/ Locknut)",
        pvc_locknut_20mm: "PVC Locknut & Bushing 20mm (Pair)",
        pvc_locknut_25mm: "PVC Locknut & Bushing 25mm (Pair)",
        pvc_locknut_32mm: "PVC Locknut & Bushing 32mm (Pair)",

        rsc_pipe_1_2: 'RSC Pipe 1/2" (3m)',
        rsc_pipe_3_4: 'RSC Pipe 3/4" (3m)',
        rsc_pipe_1: 'RSC Pipe 1" (3m)',
        rsc_elbow_1_2: 'RSC Elbow 1/2"',
        rsc_elbow_3_4: 'RSC Elbow 3/4"',
        rsc_elbow_1: 'RSC Elbow 1"',
        rsc_coupling_1_2: 'RSC Coupling 1/2"',
        rsc_coupling_3_4: 'RSC Coupling 3/4"',
        rsc_coupling_1: 'RSC Coupling 1"',
        rsc_locknut_bushing_1_2: 'RSC Locknut & Bushing 1/2"',
        rsc_locknut_bushing_3_4: 'RSC Locknut & Bushing 3/4"',
        rsc_locknut_bushing_1: 'RSC Locknut & Bushing 1"',
        entrance_cap_1_2: 'Service Entrance Cap 1/2"',
        entrance_cap_3_4: 'Service Entrance Cap 3/4"',
        entrance_cap_1: 'Service Entrance Cap 1"',
        pipe_strap_1_2: 'Pipe Strap/Clamp 1/2"',
        pipe_strap_3_4: 'Pipe Strap/Clamp 3/4"',
        pipe_strap_1: 'Pipe Strap/Clamp 1"',

        flex_hose_1_2: 'Flex. Plastic Conduit 1/2" (50m Roll)',
        flex_hose_3_4: 'Flex. Plastic Conduit 3/4" (50m Roll)',
        flex_connector_1_2: 'Flex. Plastic Connector 1/2"',
        flex_connector_3_4: 'Flex. Plastic Connector 3/4"',

        utility_box_pvc: "Utility Box 2x4 (PVC/Orange)",
        utility_box_metal: "Utility Box 2x4 (Metal/GI)",
        junction_box_pvc: "Junction Box 4x4 (PVC/Orange)",
        junction_box_metal: "Junction Box 4x4 (Metal/GI)",
        square_box_metal: "Square Box 4x4 (Metal/GI)",
        octagonal_box_pvc: "Octagonal Box (PVC)",
        octagonal_box_metal: "Octagonal Box (Metal)",
        box_cover_utility: "Utility Box Cover (Plate)",
        box_cover_square: "Square Box Cover 4x4",
        pvc_solvent: 'PVC Solvent Cement (100cc)',

        // Solar PV
        pv_cable_4: 'Solar PV Cable 4.0mm²',
        mc4_connector: 'MC4 Connector (Pair)',

        mts_switch: 'Manual Transfer Switch (MTS)',
        weatherproof_enclosure: 'Weatherproof Enclosure/Cover',

        // Lighting
        led_bulb_3w: 'LED Bulb 3W (E27 daylight/warm)',
        led_bulb_5w: 'LED Bulb 5W (E27 daylight/warm)',
        led_bulb_7w: 'LED Bulb 7W (E27 daylight/warm)',
        led_bulb_9w: 'LED Bulb 9W (E27 daylight/warm)',
        led_bulb_12w: 'LED Bulb 12W (E27 daylight/warm)',
        led_bulb_15w: 'LED Bulb 15W (E27 daylight/warm)',
        led_bulb_18w: 'LED Bulb 18W (E27 daylight/warm)',
        led_bulb_gu10_3w: 'LED Bulb GU10 3W (Daylight/Warm)',
        led_bulb_gu10_5w: 'LED Bulb GU10 5W (Daylight/Warm)',
        led_bulb_gu10_7w: 'LED Bulb GU10 7W (Daylight/Warm)',
        gu10_socket: 'GU10 Lampholder / Socket',
        led_tube_t8: 'LED Tube T8 18W (1.2m) Set',
        downlight_fixture_4: 'Recessed Vertical Downlight Fixture 4" (Fixture Only)',
        downlight_fixture_6: 'Recessed Vertical Downlight Fixture 6" (Fixture Only)',
        integrated_led_3w: 'Integrated LED Downlight 3W',
        integrated_led_6w: 'Integrated LED Downlight 6W',
        integrated_led_9w: 'Integrated LED Downlight 9W',
        integrated_led_12w: 'Integrated LED Downlight 12W',
        integrated_led_15w: 'Integrated LED Downlight 15W',
        integrated_led_18w: 'Integrated LED Downlight 18W',
        integrated_led_24w: 'Integrated LED Downlight 24W',
        ceiling_receptacle: 'Ceiling Receptacle 4" (PVC)',
        emergency_light: 'Emergency Light (Twinhead)',
        exit_sign: 'Exit Sign (Illuminated)',
        flood_light_10w: 'LED Flood Light 10W (Outdoor)',
        flood_light_20w: 'LED Flood Light 20W (Outdoor)',
        flood_light_30w: 'LED Flood Light 30W (Outdoor)',
        flood_light_50w: 'LED Flood Light 50W (Outdoor)',
        flood_light_100w: 'LED Flood Light 100W (Outdoor)',
        flood_light_200w: 'LED Flood Light 200W (Outdoor)',
        track_rail_1m: 'Track Light Rail (1 Meter)',
        track_head_12w: 'Track Light Head (12W LED)',
        led_strip_5m: 'LED Strip Light (5m Roll)',
        led_driver_12v: 'LED Driver/Transformer (12V/60W)',
        panel_light_300: 'LED Panel Light (300mm x 300mm)',
        panel_light_600: 'LED Panel Light (600mm x 600mm)',
        pendant_light: 'Pendant / Hanging Light (Modern)',
        wall_sconce: 'Wall Lamp / Sconce Fixture',
        step_light: 'LED Step Light (Recessed)',
        post_lamp: 'Garden Post Lamp (Outdoor)',
        garden_spike_light: 'Garden Spike Light (LED Outdoor)',
        solar_street_light: 'Solar Street Light 100W (All-in-One)',
        high_bay_light: 'Industrial High Bay LED 100W',
        t5_led_batten: 'T5 LED Batten (Slim) 1.2m',
        surface_downlight_6w: 'Surface Type LED Downlight 6W',
        surface_downlight_12w: 'Surface Type LED Downlight 12W',
        surface_downlight_18w: 'Surface Type LED Downlight 18W',
        surface_downlight_24w: 'Surface Type LED Downlight 24W',
        rope_light: 'LED Rope Light (Flexible)',

        // Aux & Safety
        smoke_detector: 'Smoke Detector (Battery Operated)',
        doorbell: 'Doorbell Kit (Switch+Chime)',
        ground_rod: 'Grounding Rod 5/8" x 8\'',
        ground_clamp: 'Ground Rod Clamp',
        bare_copper: 'Bare Copper Wire (Grounding)',
        water_heater_switch_20a: 'Water Heater Safety Switch (20A DPST)',
        water_heater_switch_30a: 'Water Heater Safety Switch (30A DPST)',
        cat6_cable: 'UTP Cable CAT6 (305m Box)',
        coax_cable: 'Coaxial Cable RG6 (Roll)',
        meter_base: 'Electric Meter Base (Round)',
        sub_meter: 'Electric Sub-meter (Analog/Digital)',

        switch_3way: '3-Way Switch',
        dimmer_switch: 'Dimmer Switch',
        fan_control: 'Fan Control Switch',

        molding_3_4: 'Plastic Molding 3/4" (8ft)',
        molding_1: 'Plastic Molding 1" (8ft)',
        tox_screw: 'Tox & Screws (100pcs/box)',
        expansion_bolt: 'Expansion Bolt 1/4" x 2"',

        electrical_tape: "Electrical Tape (Big)",
    };

    // Direct Items (Rough-in, Panel Boards & Breakers)
    Object.entries(directItems).forEach(([key, qty]) => {
        let name = nameMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        if (key.startsWith('panel_board_')) {
            const branches = key.split('_').pop().replace('b', '');
            name = `Main Panel Board (${branches} Branches)`;
        } else if (key.startsWith('breaker_')) {
            const amp = key.split('_').pop().toUpperCase();
            name = `Circuit Breaker (${amp})`;
        }

        // Determine unit
        let unit = 'pcs';
        if (key.startsWith('thhn_') || key === 'electrical_tape' || key.startsWith('flex_hose_') || key === 'coax_cable' || key === 'led_strip_5m') unit = 'rolls';
        if (key === 'cat6_cable' || key === 'tox_screw') unit = 'box';
        if (key.includes('locknut_') || key === 'mc4_connector') unit = 'pairs';
        if (key.startsWith('switch_') || key.startsWith('outlet_') || key.startsWith('led_tube_') || key === 'doorbell' || key === 'dimmer_switch' || key === 'fan_control') unit = 'sets';
        if (key === 'bare_copper' || key === 'pv_cable_4' || key === 'rope_light') unit = 'm';

        addItem(key, qty, unit, name);
    });

    // Devices & Outlets
    addItem('switch_1g', deviceCounts.switch_1g, 'sets', "1-Gang Switch");
    addItem('switch_2g', deviceCounts.switch_2g, 'sets', "2-Gang Switch");
    addItem('switch_3g', deviceCounts.switch_3g, 'sets', "3-Gang Switch");
    addItem('outlet_duplex', deviceCounts.outlet_duplex, 'sets', "Duplex Conv. Outlet");
    addItem('outlet_universal', deviceCounts.outlet_universal, 'sets', "Universal Duplex Outlet");
    addItem('outlet_single', deviceCounts.outlet_single, 'sets', "Single Conv. Outlet");
    addItem('outlet_gfci', deviceCounts.outlet_gfci, 'sets', "GFCI Duplex Outlet");
    addItem('outlet_weatherproof', deviceCounts.outlet_weatherproof, 'sets', "Weatherproof Outlet");
    addItem('outlet_ac', deviceCounts.outlet_ac, 'sets', "Aircon Outlet");
    addItem('outlet_range', deviceCounts.outlet_range, 'sets', "Range/Stove Outlet");
    addItem('data_outlet', deviceCounts.data_outlet, 'sets', "LAN/Data Outlet");
    addItem('tel_outlet', deviceCounts.tel_outlet, 'sets', "Telephone Outlet");

    if (items.length === 0) return null;

    return {
        items,
        total: totalCost
    };
};
