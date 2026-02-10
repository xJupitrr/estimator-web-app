
export const itemTypes = [
    "Sliding Window",
    "Casement Window",
    "Awning Window",
    "Fixed Window",
    "Jalousie Window",
    "Main Door (Swing)",
    "Main Door (Flush)",
    "Panel Door",
    "Sliding Door",
    "Bi-Fold Door",
    "French Door",
    "Screen Door",
    "PVC Door",
];

export const frameMaterials = [
    { name: "Aluminum (Powder Coated)", pricePerLM: 1250 },
    { name: "Aluminum (Anodized)", pricePerLM: 1100 },
    { name: "Aluminum (Bronze)", pricePerLM: 1150 },
    { name: "PVC/UPVC (White)", pricePerLM: 950 },
    { name: "PVC/UPVC (Woodgrain)", pricePerLM: 1250 },
    { name: "Wood (Mahogany)", pricePerLM: 480 },
    { name: "Wood (Narra)", pricePerLM: 550 },
    { name: "Wood (Tanguile)", pricePerLM: 420 },
    { name: "Steel (Galvanized)", pricePerLM: 850 },
    { name: "Steel (Powder Coated)", pricePerLM: 1100 },
];

export const leafMaterials = [
    { name: "Clear Glass (6mm)", pricePerSqm: 1800 },
    { name: "Clear Glass (8mm)", pricePerSqm: 2200 },
    { name: "Tinted Glass (6mm)", pricePerSqm: 2000 },
    { name: "Tempered Glass (6mm)", pricePerSqm: 2800 },
    { name: "Tempered Glass (10mm)", pricePerSqm: 3500 },
    { name: "Laminated Glass (6mm)", pricePerSqm: 3200 },
    { name: "Double Glazed (IGU)", pricePerSqm: 5500 },
    { name: "Frosted/Obscure Glass", pricePerSqm: 2100 },
    { name: "Jalousie (Glass Blades Only)", pricePerSqm: 720 },
    { name: "Louver Glass Blades", pricePerSqm: 720 },
    { name: "Sliding Panel (Aluminum/Glass)", pricePerSqm: 5800 },
    { name: "Casement Panel (Aluminum/Glass)", pricePerSqm: 5000 },
    { name: "Steel Casement (Awning/Swing)", pricePerSqm: 1950 },
    { name: "uPVC Sliding Panel (White)", pricePerSqm: 3500 },
    { name: "uPVC Casement Panel (White)", pricePerSqm: 4100 },
    { name: "uPVC Awning Panel (White)", pricePerSqm: 3600 },
    { name: "Mahogany Door Leaf", pricePerSqm: 2600 },
    { name: "Narra Door Leaf", pricePerSqm: 5650 },
    { name: "Tanguile Door Leaf", pricePerSqm: 4900 },
    { name: "Flush Door (Hollow Core)", pricePerSqm: 935 },
    { name: "PVC Door (Full Panel)", pricePerSqm: 900 },
    { name: "Steel Door Leaf", pricePerSqm: 1900 },
    { name: "Solid Panel (No Glass)", pricePerSqm: 0 },
];

export const defaultMaterialMap = {
    "Sliding Window": { frame: "Aluminum (Powder Coated)", leaf: "Sliding Panel (Aluminum/Glass)" },
    "Casement Window": { frame: "Aluminum (Powder Coated)", leaf: "Casement Panel (Aluminum/Glass)" },
    "Awning Window": { frame: "Aluminum (Powder Coated)", leaf: "Casement Panel (Aluminum/Glass)" },
    "Fixed Window": { frame: "Aluminum (Powder Coated)", leaf: "Clear Glass (6mm)" },
    "Jalousie Window": { frame: "Aluminum (Powder Coated)", leaf: "Jalousie (Glass Blades Only)" },
    "Main Door (Swing)": { frame: "Wood (Mahogany)", leaf: "Mahogany Door Leaf" },
    "Main Door (Flush)": { frame: "Wood (Tanguile)", leaf: "Flush Door (Hollow Core)" },
    "Panel Door": { frame: "Wood (Tanguile)", leaf: "Tanguile Door Leaf" },
    "Sliding Door": { frame: "Aluminum (Powder Coated)", leaf: "Sliding Panel (Aluminum/Glass)" },
    "Bi-Fold Door": { frame: "Aluminum (Powder Coated)", leaf: "Casement Panel (Aluminum/Glass)" },
    "French Door": { frame: "Wood (Mahogany)", leaf: "Tempered Glass (6mm)" },
    "Screen Door": { frame: "Aluminum (Anodized)", leaf: "Clear Glass (6mm)" },
    "PVC Door": { frame: "PVC/UPVC (White)", leaf: "PVC Door (Full Panel)" },
};

const getFramePrice = (materialName) => {
    const material = frameMaterials.find(m => m.name === materialName);
    return material ? material.pricePerLM : 0;
};

const getLeafPrice = (materialName) => {
    const material = leafMaterials.find(m => m.name === materialName);
    return material ? material.pricePerSqm : 0;
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
    // Main Doors (Swing/Flush/Panel)
    else if (typeLower.includes('main door') || typeLower.includes('panel door')) {
        const numHinges = height > 2.0 ? 4 : 3; // More hinges for taller doors
        const isHeavy = area > 2.0; // Large doors need better hardware
        hardwareCost = (hingeSet * numHinges) + lockset + (isHeavy ? lever : doorKnob) + 300; // +300 for deadbolt/additional security
    }
    // Screen Doors
    else if (typeLower.includes('screen')) {
        hardwareCost = (hingeSet * 2) + 250; // Simple hinges + handle
    }
    // PVC Doors
    else if (typeLower.includes('pvc door')) {
        const numHinges = 3;
        hardwareCost = (hingeSet * numHinges) + lockset + 200;
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
export const calculateDoorsWindows = (items) => {
    let totalAreaSqm = 0;
    let grandTotal = 0;
    const materializedItems = [];

    const hasEmptyFields = items.some(item =>
        item.width_m === "" || item.height_m === "" ||
        item.itemType === "" || item.frameMaterial === "" || item.leafMaterial === ""
    );

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

        const isDoor = item.itemType.toLowerCase().includes('door');
        // Door Jamb: 2 heights + 1 width (no bottom jamb usually)
        // Window Frame: 2 heights + 2 widths
        const perimeterLM = isDoor ? (2 * height + width) : (2 * height + 2 * width);
        const totalPerimeterLM = perimeterLM * quantity;

        const wasteMultiplier = 1; // No waste factor applied

        totalAreaSqm += totalItemAreaSqm;

        // Component Prices - Robustly handle potential undefined/empty strings from legacy state
        const framePrice = (item.customFramePrice && item.customFramePrice !== "")
            ? parseFloat(item.customFramePrice)
            : getFramePrice(item.frameMaterial);

        const leafPrice = (item.customLeafPrice && item.customLeafPrice !== "")
            ? parseFloat(item.customLeafPrice)
            : getLeafPrice(item.leafMaterial);

        // Itemize
        const frameCost = totalPerimeterLM * framePrice * wasteMultiplier;
        const leafCost = totalItemAreaSqm * leafPrice * wasteMultiplier;
        const hardwareCostTotal = getHardwareCost(item.itemType, width, height, quantity);

        // Add Leaf/Panel item
        if (isDoor) {
            materializedItems.push({
                name: `${item.itemType} ${item.leafMaterial}`,
                qty: totalItemAreaSqm.toFixed(2),
                unit: 'sq.m',
                price: leafPrice,
                total: leafCost,
                isComponent: true,
                itemId: item.id,
                priceType: 'leaf'
            });
        } else if (leafPrice > 0 || item.leafMaterial !== "Solid Panel (No Glass)") {
            materializedItems.push({
                name: `${item.itemType} ${item.leafMaterial}`,
                qty: totalItemAreaSqm.toFixed(2),
                unit: 'sq.m',
                price: leafPrice,
                total: leafCost,
                isComponent: true,
                itemId: item.id,
                priceType: 'leaf'
            });
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
            priceType: 'frame'
        });

        // Add Hardware item
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

        grandTotal += frameCost + leafCost + hardwarePrice;
    });

    // Consolidate duplicate items
    const consolidatedItems = [];
    const itemMap = new Map();

    materializedItems.forEach(item => {
        const key = `${item.name}|${item.unit}|${item.price}|${item.priceType || ''}`;

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
        grandTotal: grandTotal
    };
};
