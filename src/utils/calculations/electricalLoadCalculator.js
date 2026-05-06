export const calculateElectricalLoad = (rows, options = { premiumSizing: false }) => {
    let totalVA = 0;

    // Standard single phase voltage in PH (PEC)
    const VOLTAGE = 230;

    // Standard Circuit Breaker AT ratings
    const standardBreakers = [15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200, 225, 250, 300, 400];

    // PEC THHN Copper Ampacity Table (75°C column is standard for breaker terminals)
    const getWireSize = (ampacity) => {
        if (ampacity <= 15) return "2.0mm²";  // 15A
        if (ampacity <= 20) return "3.5mm²";  // 20A
        if (ampacity <= 30) return "5.5mm²";  // 30A
        if (ampacity <= 50) return "8.0mm²";  // 50A
        if (ampacity <= 65) return "14.0mm²"; // 65A
        if (ampacity <= 85) return "22.0mm²"; // 85A
        if (ampacity <= 115) return "30.0mm²";// 115A
        if (ampacity <= 130) return "38.0mm²";// 130A
        if (ampacity <= 150) return "50.0mm²";// 150A
        if (ampacity <= 175) return "60.0mm²";// 175A
        if (ampacity <= 200) return "80.0mm²";// 200A
        if (ampacity <= 230) return "100.0mm²";// 230A
        if (ampacity <= 255) return "125.0mm²";// 255A
        return "150.0mm²";
    };

    const getWireMaxAmpacity = (wireSize) => {
        const sizes = {
            "2.0mm²": 20, // 20A rated, 15A typical breaker OCPD
            "3.5mm²": 25, // 25A rated, 20A typical breaker
            "5.5mm²": 35, // 35A rated, 30A typical breaker
            "8.0mm²": 50,
            "14.0mm²": 65,
            "22.0mm²": 85,
            "30.0mm²": 115,
            "38.0mm²": 130,
            "50.0mm²": 150,
            "60.0mm²": 175,
            "80.0mm²": 200,
            "100.0mm²": 230,
            "125.0mm²": 255,
            "150.0mm²": 285
        };
        return sizes[wireSize] || 300;
    };

    // PEC Table 2.50.6.13 - Minimum Size Equipment Grounding Conductors (Copper)
    const getGroundWireSize = (breakerAT) => {
        if (breakerAT <= 20) return "2.0mm²";
        if (breakerAT <= 30) return "3.5mm²";
        if (breakerAT <= 60) return "5.5mm²";
        if (breakerAT <= 100) return "8.0mm²";
        if (breakerAT <= 200) return "14.0mm²";
        if (breakerAT <= 300) return "22.0mm²";
        if (breakerAT <= 400) return "30.0mm²";
        return "38.0mm²";
    };

    // Calculate Conduit Size based on PEC 40% fill rule for PVC Schedule 40
    // THHN Wire Approximate Cross-Sectional Areas (mm²) based on PEC / NEC Chapter 9 Table 5
    const getWireArea = (size) => {
        const areas = {
            "2.0mm²": 6.26,   // 14 AWG
            "3.5mm²": 8.58,   // 12 AWG
            "5.5mm²": 13.61,  // 10 AWG
            "8.0mm²": 23.61,  // 8 AWG
            "14.0mm²": 32.71, // 6 AWG
            "22.0mm²": 62.77, // 4 AWG
            "30.0mm²": 84.71, // 2 AWG
            "38.0mm²": 100.65,// 1 AWG
            "50.0mm²": 119.7, // 1/0 AWG
            "60.0mm²": 142.3, // 2/0 AWG
            "80.0mm²": 172.5, // 3/0 AWG
            "100.0mm²": 208.8,// 4/0 AWG
            "125.0mm²": 256.1,// 250 kcmil
            "150.0mm²": 296.8 // 300 kcmil
        };
        return areas[size] || 0;
    };

    // Computes required PVC Trade Size based on 40% fill
    const getConduitSize = (lineWireSize, groundWireSize) => {
        // 2 line conductors + 1 ground conductor
        const totalArea = (2 * getWireArea(lineWireSize)) + getWireArea(groundWireSize);

        // PVC Schedule 40 40% Fill Areas (mm²)
        const pvc40Fill = {
            "20mm (1/2\") PVC": 78,
            "25mm (3/4\") PVC": 137,
            "32mm (1\") PVC": 222,
            "40mm (1 1/4\") PVC": 384,
            "50mm (1 1/2\") PVC": 523,
            "63mm (2\") PVC": 862,
            "75mm (2 1/2\") PVC": 1225,
            "90mm (3\") PVC": 1890,
            "110mm (4\") PVC": 3232
        };

        for (const [pipe, maxArea] of Object.entries(pvc40Fill)) {
            if (totalArea <= maxArea) {
                return pipe;
            }
        }
        return "110mm (4\") PVC"; // fallback
    };

    let largestMotorVA = 0;

    let circuits = rows.filter(r => r.quantity > 0 && !r.isExcluded).map((r, i) => {
        const qty = parseFloat(r.quantity) || 0;
        const va = parseFloat(r.unitVA) || 0;
        const totalLoadVA = qty * va;
        const amps = totalLoadVA / VOLTAGE;

        totalVA += totalLoadVA;

        // PEC Breaker and Wire Sizing 
        let breakerDesignAmps = amps;
        let wireDesignAmps = amps;

        // PEC continuous load & motor sizing: +25%
        const continuousCats = ['acu', 'motor', 'water_heater', 'water_pump', 'ev_charger'];
        if (continuousCats.includes(r.category)) {
            // PEC 430.22 / 440.32: Conductor min ampacity = 125% of FLC
            wireDesignAmps = amps * 1.25;
            
            // PEC 430.52 / 440.22: Breaker short-circuit sizing for inrush current
            if (r.category === 'acu') {
                breakerDesignAmps = amps * 1.75; // Max 175% for ACU compressors
            } else if (['motor', 'water_pump'].includes(r.category)) {
                breakerDesignAmps = amps * 2.0; // Inverse-time breaker up to 250%, using 200% for standard sizing
            } else {
                breakerDesignAmps = amps * 1.25; // Standard continuous load
            }

            if (['acu', 'motor', 'water_pump'].includes(r.category) && totalLoadVA > largestMotorVA) {
                largestMotorVA = totalLoadVA;
            }
        }

        // Find Breaker AT
        let breakerAT = 15;
        for (const b of standardBreakers) {
            if (b >= breakerDesignAmps) {
                breakerAT = b;
                break;
            }
        }

        // PEC constraint: Receptacle, Laundry, Refrigerator typically min 20AT
        // Modern standards also highly recommend 20AT for Microwave, Induction, Dishwasher, ACU
        // Motors/Pumps are also bumped to 20AT minimum to prevent nuisance tripping from startup inrush current
        const min20AmpCats = ['acu', 'receptacle', 'washing_machine', 'refrigerator', 'microwave', 'induction', 'dishwasher', 'water_pump', 'motor'];
        if (min20AmpCats.includes(r.category) && breakerAT < 20) {
            breakerAT = 20;
        }

        // Wire Size based on design ampacity or breaker rating
        // Wiring ampacity must be greater than or equal to the breaker rating
        let wireSizeAmpBase = Math.max(wireDesignAmps, breakerAT);

        // Premium PEE Over-sizing (optional)
        if (options.premiumSizing) {
            if (r.category === 'lighting') {
                wireSizeAmpBase = Math.max(wireSizeAmpBase, 20); // Forces min 3.5mm² for lighting (20A ampacity)
            } else if (min20AmpCats.includes(r.category)) {
                wireSizeAmpBase = Math.max(wireSizeAmpBase, 30); // Forces min 5.5mm² for CO/appliances (30A ampacity)
            }
        }

        let wireSize = getWireSize(wireSizeAmpBase);
        let groundWireSize = getGroundWireSize(breakerAT);

        // Calculate PVC Pipe Sizing based on PEC 40% Fill Rule
        let pipeSize = getConduitSize(wireSize, groundWireSize);

        return {
            circuitNo: i + 1,
            description: r.description || r.category,
            category: r.category,
            qty: qty,
            unitVA: va,
            totalVA: totalLoadVA,
            amps: amps,
            breaker: `${breakerAT}AT, 2P`,
            wire: `2 - ${wireSize} THHN`,
            groundWire: `1 - ${groundWireSize} THHN`,
            pipe: pipeSize,
            volts: VOLTAGE
        };
    });

    // Main Feeder Computation (PEC Table 2.20.3.3)
    // PEC 2.20.3.3 allows Small Appliance and Laundry Branch Circuits to be lumped into the General Lighting computation to take advantage of the 35% Demand Factor.
    const generalDemandCats = ['lighting', 'receptacle', 'washing_machine', 'refrigerator', 'microwave', 'induction', 'dishwasher'];
    let lightingRecepVA = circuits.filter(c => generalDemandCats.includes(c.category)).reduce((sum, c) => sum + c.totalVA, 0);

    // Distinguish continuous loads from other specific loads
    const feederContinuousCats = ['acu', 'water_heater', 'motor', 'water_pump', 'ev_charger'];
    let specificContinuousVA = circuits.filter(c => feederContinuousCats.includes(c.category)).reduce((sum, c) => sum + c.totalVA, 0);
    let specificNonContinuousVA = circuits.filter(c => !generalDemandCats.includes(c.category) && !feederContinuousCats.includes(c.category)).reduce((sum, c) => sum + c.totalVA, 0);

    // Apply Demand Factor (PEC Table 2.20.3.3)
    // - First 3,000 VA @ 100%
    // - 3,001 to 120,000 VA @ 35%
    // - Remainder over 120,000 VA @ 25%
    let netLightingVA = lightingRecepVA;
    if (lightingRecepVA > 120000) {
        netLightingVA = 3000 + (117000 * 0.35) + ((lightingRecepVA - 120000) * 0.25);
    } else if (lightingRecepVA > 3000) {
        netLightingVA = 3000 + ((lightingRecepVA - 3000) * 0.35);
    }

    // PEC: Continuous loads must be factored at 125% for feeder sizing
    let factoredContinuousVA = specificContinuousVA * 1.25;

    // PEC: Add 25% of largest motor load (if not already fully covered by the 125% continuous rule, but to be safe and strict, we ensure the largest motor gets its +25%)
    // Since we multiplied ALL motor/acu by 1.25 above, we don't strictly need to add another 25% for the largest motor. 
    // The rule is "125% of largest + 100% of others". Since we did 125% for all continuous, the largest motor is covered.

    let netTotalVA = netLightingVA + factoredContinuousVA + specificNonContinuousVA;

    let mainAmps = netTotalVA / VOLTAGE;

    // Main Breaker
    // PEC Service Disconnect Minimums [PEC 2.30.7.10(A)]:
    // 1 branch circuit -> 15A minimum
    // 2 branch circuits -> 30A minimum
    // >2 branch circuits (typical dwelling) -> 60A minimum
    let minMainAT = 60;
    if (circuits.length === 1) {
        minMainAT = 15;
    } else if (circuits.length === 2) {
        minMainAT = 30;
    }

    let mainBreakerAT = minMainAT;
    for (const b of standardBreakers) {
        if (b >= mainAmps) {
            mainBreakerAT = Math.max(minMainAT, b);
            break;
        }
    }

    // Main Wire sizing based on Main Breaker / Computed Amps
    // The feeder conductors shall have an ampacity not less than required to supply the load.
    // Also must be protected by the breaker.
    let wireMainDesignAmps = Math.max(mainAmps, mainBreakerAT);
    let wireMain = getWireSize(wireMainDesignAmps);
    let mainGroundWire = getGroundWireSize(mainBreakerAT);
    let mainPipe = getConduitSize(wireMain, mainGroundWire);

    return {
        circuits,
        totalVA,
        netTotalVA,
        mainAmps,
        mainBreaker: `${mainBreakerAT}AT, 2P`,
        mainWire: `2 - ${wireMain} + 1 - ${mainGroundWire} (G) THHN`,
        mainPipe: mainPipe,
        designAnalysis: {
            lightingRecepTotal: lightingRecepVA,
            lightingRecepNet: netLightingVA,
            continuousTotal: specificContinuousVA,
            continuousNet: factoredContinuousVA,
            nonContinuousTotal: specificNonContinuousVA,
            largestMotor: largestMotorVA,
            wireMainDesignAmps: wireMainDesignAmps,
            wireMain: wireMain,
            wireMainMaxAmpacity: getWireMaxAmpacity(wireMain),
            groundWire: mainGroundWire,
            mainBreakerAT: mainBreakerAT,
            mainPipe: mainPipe
        }
    };
};