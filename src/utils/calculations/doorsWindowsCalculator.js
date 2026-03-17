
export const itemTypes = [
    {
        group: "Windows",
        options: [
            "Sliding Window",
            "Casement Window",
            "Awning Window",
            "Fixed Window",
            "Jalousie Window",
        ]
    },
    {
        group: "Doors",
        options: [
            "Swing Door",
            "Flush Door",
            "Sliding Door",
            "Bi-Fold Door",
            "French Door",
            "Screen Door",
        ]
    }
];

export const frameMaterials = [
    { id: 'dw_frame_alu_pc', name: "Aluminum (Powder Coated)", pricePerLM: 1250, category: "Aluminum" },
    { id: 'dw_frame_alu_anod', name: "Aluminum (Anodized)", pricePerLM: 1100, category: "Aluminum" },
    { id: 'dw_frame_alu_wood', name: "Aluminum (Bronze)", pricePerLM: 1150, category: "Aluminum" },
    { id: 'dw_frame_alu_pc', name: "Thermal Break Aluminum", pricePerLM: 2500, category: "Aluminum" },
    { id: 'dw_frame_upvc_white', name: "PVC/UPVC (White)", pricePerLM: 950, category: "UPVC & Vinyl" },
    { id: 'dw_frame_upvc_white', name: "PVC/UPVC (Woodgrain)", pricePerLM: 1250, category: "UPVC & Vinyl" },
    { id: 'dw_frame_upvc_white', name: "Vinyl Frame (Standard)", pricePerLM: 850, category: "UPVC & Vinyl" },
    { id: 'dw_frame_wood_mah', name: "Wood (Mahogany)", pricePerLM: 480, category: "Wood" },
    { id: 'dw_frame_wood_tang', name: "Wood (Narra)", pricePerLM: 550, category: "Wood" },
    { id: 'dw_frame_wood_tang', name: "Wood (Tanguile)", pricePerLM: 420, category: "Wood" },
    { id: 'dw_frame_wood_tang', name: "Wood (Yakal / Hardwood)", pricePerLM: 850, category: "Wood" },
    { id: 'dw_frame_steel_galv', name: "Steel (Galvanized)", pricePerLM: 850, category: "Steel" },
    { id: 'dw_frame_steel_galv', name: "Steel (Powder Coated)", pricePerLM: 1100, category: "Steel" },
    { id: 'dw_frame_steel_galv', name: "Stainless Steel (304)", pricePerLM: 1850, category: "Steel" },
    { id: 'dw_frame_alu_pc', name: "Frameless (U-Channel/Patch Fittings)", pricePerLM: 1800, category: "Specialty" },
    { id: 'dw_frame_upvc_white', name: "WPC (Wood Plastic Composite)", pricePerLM: 1350, category: "Specialty" },
    { id: 'dw_frame_alu_pc', name: "Composite / Fiberglass Frame", pricePerLM: 2200, category: "Specialty" },
];

export const groupedFrameOptions = [
    "Aluminum", "UPVC & Vinyl", "Wood", "Steel", "Specialty"
].map(cat => ({
    group: `${cat} Frames`,
    options: frameMaterials.filter(m => m.category === cat).map(m => ({
        id: m.name,
        display: `${m.name} (₱${m.pricePerLM.toLocaleString()}/LM)`
    }))
}));

export const leafMaterials = [
    // Glass Defaults
    { id: 'dw_glass_clear_6mm', name: "Clear Glass (6mm)", pricePerSqm: 1800, category: "Standard Glass" },
    { id: 'dw_glass_clear_8mm', name: "Clear Glass (8mm)", pricePerSqm: 2200, category: "Standard Glass" },
    { id: 'dw_glass_tinted_6mm', name: "Tinted Glass (6mm)", pricePerSqm: 2000, category: "Standard Glass" },
    { id: 'dw_glass_clear_6mm', name: "Frosted/Obscure Glass", pricePerSqm: 2100, category: "Standard Glass" },

    // Premium Glass
    { id: 'dw_glass_temp_6mm', name: "Tempered Glass (6mm)", pricePerSqm: 2800, category: "Safety & Specialty Glass" },
    { id: 'dw_glass_temp_6mm', name: "Tempered Glass (10mm)", pricePerSqm: 3500, category: "Safety & Specialty Glass" },
    { id: 'dw_glass_temp_6mm', name: "Laminated Glass (6mm)", pricePerSqm: 3200, category: "Safety & Specialty Glass" },
    { id: 'dw_glass_temp_6mm', name: "Double Glazed (IGU)", pricePerSqm: 5500, category: "Safety & Specialty Glass" },
    { id: 'dw_glass_temp_6mm', name: "Smart/Privacy Glass (Switchable)", pricePerSqm: 15000, category: "Safety & Specialty Glass" },
    { id: 'dw_glass_temp_6mm', name: "Glass Block (Per Sqm)", pricePerSqm: 6500, category: "Safety & Specialty Glass" },

    // Louvers
    { id: 'dw_glass_clear_6mm', name: "Jalousie (Glass Blades Only)", pricePerSqm: 720, category: "Louver/Jalousie" },
    { id: 'dw_glass_clear_6mm', name: "Louver Glass Blades", pricePerSqm: 720, category: "Louver/Jalousie" },
    { id: 'dw_leaf_mah_door', name: "Wood Louver Panel", pricePerSqm: 2800, category: "Louver/Jalousie" },
    { id: 'dw_leaf_alu_casement', name: "Aluminum Louver Panel", pricePerSqm: 4200, category: "Louver/Jalousie" },

    // Wood Doors
    { id: 'dw_leaf_mah_door', name: "Mahogany Door Leaf", pricePerSqm: 2600, category: "Wood Doors" },
    { id: 'dw_leaf_mah_door', name: "Narra Door Leaf", pricePerSqm: 5650, category: "Wood Doors" },
    { id: 'dw_leaf_mah_door', name: "Tanguile Door Leaf", pricePerSqm: 4900, category: "Wood Doors" },
    { id: 'dw_leaf_flush_door', name: "Flush Door (Hollow Core)", pricePerSqm: 935, category: "Wood Doors" },
    { id: 'dw_leaf_flush_door', name: "MDF Door (Interior)", pricePerSqm: 1200, category: "Wood Doors" },
    { id: 'dw_leaf_flush_door', name: "HDF Door (Interior, High Density)", pricePerSqm: 1500, category: "Wood Doors" },

    // Steel & Industrial
    { id: 'dw_leaf_flush_door', name: "Steel Door Leaf (Standard)", pricePerSqm: 1900, category: "Steel Doors" },
    { id: 'dw_leaf_flush_door', name: "Fire-Rated Steel Door", pricePerSqm: 8500, category: "Steel Doors" },
    { id: 'dw_leaf_flush_door', name: "Insulated Metal Panel (IMP)", pricePerSqm: 3800, category: "Steel Doors" },

    // Other Doors
    { id: 'dw_leaf_flush_door', name: "PVC Door (Full Panel)", pricePerSqm: 900, category: "Other Doors" },
    { id: 'dw_leaf_flush_door', name: "Fiberglass Door Leaf", pricePerSqm: 4500, category: "Other Doors" },
    { id: 'dw_leaf_flush_door', name: "Screen Mesh (Aluminum/Vinyl)", pricePerSqm: 650, category: "Other Doors" },
    { id: 'dw_leaf_flush_door', name: "None / Open (Frame Only)", pricePerSqm: 0, category: "Other" },
];



export const groupedLeafOptions = [
    "Standard Glass", "Safety & Specialty Glass", "Wood Doors", "Other Doors", "Louver/Jalousie", "Steel Doors", "Other"
].map(cat => ({
    group: cat,
    options: leafMaterials.filter(m => m.category === cat).map(m => ({
        id: m.name, // Keep name as ID
        display: `${m.name} (₱${m.pricePerSqm.toLocaleString()}/sqm)`
    }))
}));

export const defaultMaterialMap = {
    "Sliding Window": { frame: "Aluminum (Powder Coated)", leaf: "Clear Glass (6mm)" },
    "Casement Window": { frame: "Aluminum (Powder Coated)", leaf: "Clear Glass (6mm)" },
    "Awning Window": { frame: "Aluminum (Powder Coated)", leaf: "Clear Glass (6mm)" },
    "Fixed Window": { frame: "Aluminum (Powder Coated)", leaf: "Clear Glass (6mm)" },
    "Jalousie Window": { frame: "Aluminum (Powder Coated)", leaf: "Jalousie (Glass Blades Only)" },
    "Swing Door": { frame: "Wood (Mahogany)", leaf: "Mahogany Door Leaf" },
    "Flush Door": { frame: "Wood (Tanguile)", leaf: "Flush Door (Hollow Core)" },
    "Sliding Door": { frame: "Aluminum (Powder Coated)", leaf: "Clear Glass (6mm)" },
    "Bi-Fold Door": { frame: "Aluminum (Powder Coated)", leaf: "Clear Glass (6mm)" },
    "French Door": { frame: "Wood (Mahogany)", leaf: "Tempered Glass (6mm)" },
    "Screen Door": { frame: "Aluminum (Anodized)", leaf: "Screen Mesh (Aluminum/Vinyl)" },
};

const getFramePrice = (materialName, prices = {}) => {
    const material = frameMaterials.find(m => m.name === materialName);
    if (!material) return 0;
    return (prices && prices[material.id]) || material.pricePerLM;
};

const getLeafPrice = (materialName, prices = {}) => {
    const material = leafMaterials.find(m => m.name === materialName);
    if (!material) return 0;
    return (prices && prices[material.id]) || material.pricePerSqm;
};

const getHardwareCost = (itemType, width, height, quantity) => {
    const typeLower = itemType.toLowerCase();
    const area = width * height;

    // Base hardware costs per opening (Philippine market 2024-2025)
    const hingeSet = 120; // Per hinge (typically 2-4 per door/window)
    const lockset = 800; // Standard lockset
    const doorKnob = 600; // Basic doorknob
    const lever = 900; // Door lever
    const slidingRail = 350; // Per linear meter of rail
    const roller = 250; // Per roller set (2 per panel)
    const casementOperator = 400; // Casement window crank/operator
    const awningOperator = 380; // Awning window operator
    const bifoldfoldTrack = 300; // Per linear meter
    const jalousieOperator = 350; // Jalousie crank mechanism

    let hardwareCost = 0;

    // Sliding Windows/Doors
    if (typeLower.includes('sliding')) {
        const railLength = width * 2; // Top and bottom rails
        const rollerSets = 1; // Standard 1 set per panel
        hardwareCost = (slidingRail * railLength) + (roller * rollerSets) + 300; // +300 for handles/locks

        if (typeLower.includes('door')) {
            hardwareCost += 500; // Better lockset for doors
        }
    }
    // Casement Windows
    else if (typeLower.includes('casement')) {
        const numHinges = height > 1.5 ? 3 : 2; // More hinges for taller windows
        hardwareCost = (hingeSet * numHinges) + casementOperator + 200; // +200 for handles
    }
    // Awning Windows
    else if (typeLower.includes('awning')) {
        const numHinges = 2; // Typically 2 hinges
        hardwareCost = (hingeSet * numHinges) + awningOperator + 150; // +150 for handles
    }
    // Jalousie Windows
    else if (typeLower.includes('jalousie')) {
        hardwareCost = jalousieOperator + 200; // Operator mechanism + handle
    }
    // Bi-fold Doors
    else if (typeLower.includes('bi-fold') || typeLower.includes('bifold')) {
        const trackLength = width;
        const numHinges = 4; // Hinges between panels
        hardwareCost = (bifoldfoldTrack * trackLength) + (hingeSet * numHinges) + 400; // +400 for handles
    }
    // French Doors
    else if (typeLower.includes('french')) {
        const numHinges = height > 2.0 ? 4 : 3; // More hinges for taller doors
        hardwareCost = (hingeSet * numHinges) + lockset + lever;
    }
    // Swing/Flush Doors (includes legacy mapping for existing items)
    else if (typeLower.includes('swing door') || typeLower.includes('flush door') || typeLower.includes('main door') || typeLower.includes('panel door') || typeLower.includes('pvc door')) {
        const numHinges = height > 2.0 ? 4 : 3; // More hinges for taller doors
        const isHeavy = area > 2.0; // Large doors need better hardware
        hardwareCost = (hingeSet * numHinges) + lockset + (isHeavy ? lever : doorKnob) + (typeLower.includes('flush') ? 0 : 300); // exterior/panel swing doors get extra 300 for deadbolt hardware
    }
    // Screen Doors
    else if (typeLower.includes('screen')) {
        hardwareCost = (hingeSet * 2) + 250; // Simple hinges + handle
    }
    // Fixed Windows (minimal hardware)
    else if (typeLower.includes('fixed')) {
        hardwareCost = 150; // Just clips/fasteners
    }
    // Default fallback
    else {
        hardwareCost = 800; // Basic hardware set
    }

    return hardwareCost * quantity;
};

/**
 * Calculates materials and costs for Doors and Windows.
 * @param {Array} items - Array of item objects { itemType, width_m, height_m, frameMaterial, leafMaterial, quantity, ... }
 * @returns {Object} Result object { totalArea, items, grandTotal } or null
 */
export const calculateDoorsWindows = (items, prices = {}) => {
    let totalAreaSqm = 0;
    let grandTotal = 0;
    const materializedItems = [];

    const hasEmptyFields = items.some(item => {
        if (item.isExcluded) return false;
        
        // Windows have "Window" added as implicit itemType. Use 'door' inclusion to separate them reliably.
        const isDoorObj = item.itemType && item.itemType.toLowerCase().includes('door');
        const isWindowObj = !isDoorObj;
        
        const missingBasic = item.width_m === "" || item.height_m === "" || item.frameMaterial === "";
        
        // For doors, we expect a leafMaterial. For windows, we expect panel configs to exist and have a type and material.
        const missingDoorLeaf = isDoorObj && !item.leafMaterial;
        const missingPanels = isWindowObj && (!item.panel_configs || item.panel_configs.length === 0 || item.panel_configs.some(p => !p.type || !p.material));

        return missingBasic || missingDoorLeaf || missingPanels;
    });

    if (hasEmptyFields) {
        return null;
    }

    items.forEach((item) => {
        if (item.isExcluded) return;
        const width = parseFloat(item.width_m) || 0;
        const height = parseFloat(item.height_m) || 0;
        const quantity = parseInt(item.quantity) || 1;

        if (width <= 0 || height <= 0) return;

        const singleAreaSqm = width * height;
        const totalItemAreaSqm = singleAreaSqm * quantity;

        const isDoor = item.itemType && item.itemType.toLowerCase().includes('door');
        const isWindow = !isDoor; // If not a door, it is implicitly a window since we removed the type column.

        let totalPanelsSum = 1;
        if (isWindow && item.panel_configs) {
            totalPanelsSum = item.panel_configs.reduce((sum, c) => sum + (parseInt(c.count) || 1), 0) || 1;
        }

        // --- Realistic Frame Computation (LM) ---
        // Basic Perimeter
        // Door Jamb: 2 heights + 1 width (standard exterior/internal door)
        // Window Frame: 2 heights + 2 widths
        let perimeterLM = isDoor ? (2 * height + width) : (2 * height + 2 * width);

        // Mullions and Transoms (Architectural practice for estimation)
        // If the user specified specific panel counts, we add exact vertical mullions dividing them.
        if (isWindow && totalPanelsSum > 1) {
            const numMullions = totalPanelsSum - 1;
            perimeterLM += (numMullions * height);
        } else if (isWindow && width > 1.2) {
            // Fallback for simple windows
            const numMullions = Math.floor(width / 1.2);
            perimeterLM += (numMullions * height);
        }
        
        // For windows > 1.5m high, add horizontal transoms
        if (isWindow && height > 1.5) {
            const numTransoms = Math.floor(height / 1.5);
            perimeterLM += (numTransoms * width);
        }
        // For double doors (Width > 1.2m), add a meeting stile (1 height)
        if (isDoor && width > 1.2) {
            perimeterLM += height;
        }

        const totalPerimeterLM = perimeterLM * quantity;
        const wasteMultiplier = 1.10; // 10% Waste Factor for profiles (standard)

        totalAreaSqm += totalItemAreaSqm;

        // Component Prices - Robustly handle potential undefined/empty strings from legacy state
        const frameSpec = frameMaterials.find(m => m.name === item.frameMaterial);
        const leafSpec = leafMaterials.find(m => m.name === item.leafMaterial);

        const framePrice = (item.customFramePrice && item.customFramePrice !== "")
            ? parseFloat(item.customFramePrice)
            : getFramePrice(item.frameMaterial, prices);

        // Itemize
        const frameCost = totalPerimeterLM * framePrice * wasteMultiplier;
        
        let hardwareCostTotal = 0;
        let totalLeafCost = 0;

        if (isWindow && item.panel_configs) {
            const configs = item.panel_configs;
            const totalPanelsSum = configs.reduce((sum, c) => sum + (parseInt(c.count) || 1), 0) || 1;
            configs.forEach(config => {
                const type = config.type || 'Fixed Window';
                const material = config.material || 'Clear Glass (6mm)';
                const count = parseInt(config.count) || 1;
                
                const panelWidth = width / totalPanelsSum;
                const panelGroupWidth = panelWidth * count;
                
                // Deduct 0.10m (100mm) from dimension to account for the frame profile thickness
                // This gives a highly accurate measurement of the actual cut glass size
                const exactGlassAreaPerPanel = Math.max(0, (panelWidth - 0.10) * (height - 0.10));
                const exactGlassAreaGroup = exactGlassAreaPerPanel * count * quantity;
                
                // Hardware Cost
                hardwareCostTotal += getHardwareCost(type, panelWidth, height, quantity * count);

                // Material Cost
                if (material !== "None / Open (Frame Only)") {
                    const materialPrice = getLeafPrice(material, prices);
                    const cost = exactGlassAreaGroup * materialPrice * wasteMultiplier;
                    const spec = leafMaterials.find(m => m.name === material);
                    
                    if (materialPrice > 0) {
                        totalLeafCost += cost;
                        materializedItems.push({
                            name: `Window Glass: ${material}`,
                            qty: exactGlassAreaGroup.toFixed(2),
                            unit: 'sq.m',
                            price: materialPrice,
                            total: cost,
                            isComponent: true,
                            itemId: item.id,
                            priceKey: spec?.id,
                            priceType: 'leaf'
                        });
                    }
                }
            });
        } else {
            hardwareCostTotal = getHardwareCost(item.itemType || 'Swing Door', width, height, quantity);
            
            const leafPrice = (item.customLeafPrice && item.customLeafPrice !== "")
                ? parseFloat(item.customLeafPrice)
                : getLeafPrice(item.leafMaterial, prices);

            if (isDoor || leafPrice > 0 || item.leafMaterial !== "None / Open (Frame Only)") {
                const leafSpec = leafMaterials.find(m => m.name === item.leafMaterial);
                const cost = totalItemAreaSqm * leafPrice * wasteMultiplier;
                totalLeafCost += cost;
                
                materializedItems.push({
                    name: `Door Leaf: ${item.leafMaterial}`,
                    qty: totalItemAreaSqm.toFixed(2),
                    unit: 'sq.m',
                    price: leafPrice,
                    total: cost,
                    isComponent: true,
                    itemId: item.id,
                    priceKey: leafSpec?.id,
                    priceType: 'leaf'
                });
            }
        }

        // Add Frame/Jamb item (Linear Meters)
        materializedItems.push({
            name: `${item.itemType} ${item.frameMaterial}`,
            qty: totalPerimeterLM.toFixed(2),
            unit: 'LM',
            price: framePrice,
            total: frameCost,
            isComponent: true,
            itemId: item.id,
            priceKey: frameSpec?.id,
            priceType: 'frame'
        });

        const hardwarePrice = (item.customHardwarePrice && item.customHardwarePrice !== "")
            ? parseFloat(item.customHardwarePrice) * quantity
            : hardwareCostTotal;

        materializedItems.push({
            name: `${item.itemType} - Hardware Set`,
            qty: quantity,
            unit: 'sets',
            price: hardwarePrice / quantity,
            total: hardwarePrice,
            isComponent: true,
            priceType: 'hardware',
            itemId: item.id
        });

        // Add Silicone Sealant (1 cartridge per ~10m of perimeter)
        const sealantQty = totalPerimeterLM / 10;
        const sealantPrice = prices['dw_sealant_tube'] || 350; // Standard silicone price
        materializedItems.push({
            name: `Silicone Sealant (300ml Cartridge)`,
            qty: Math.max(1, Math.ceil(sealantQty)),
            unit: 'tubes',
            price: sealantPrice,
            total: Math.max(1, Math.ceil(sealantQty)) * sealantPrice,
            isComponent: true,
            priceKey: 'dw_sealant_tube',
            itemId: item.id
        });

        grandTotal += frameCost + totalLeafCost + hardwarePrice + (Math.max(1, Math.ceil(sealantQty)) * sealantPrice);
    });

    // Consolidate duplicate items
    const consolidatedItems = [];
    const itemMap = new Map();

    materializedItems.forEach(item => {
        const key = `${item.name}|${item.unit}|${item.price}|${item.priceType || ''}|${item.priceKey || ''}`;

        if (itemMap.has(key)) {
            const existing = itemMap.get(key);
            existing.qty = (parseFloat(existing.qty) + parseFloat(item.qty)).toFixed(2);
            existing.total += item.total;
        } else {
            itemMap.set(key, { ...item });
        }
    });

    itemMap.forEach(item => consolidatedItems.push(item));

    if (totalAreaSqm <= 0) {
        return null;
    }

    return {
        totalArea: totalAreaSqm.toFixed(2),
        items: consolidatedItems,
        grandTotal: grandTotal,
        total: grandTotal
    };
};
