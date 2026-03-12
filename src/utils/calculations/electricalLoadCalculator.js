export const calculateElectricalLoad = (rows) => {
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
            wireDesignAmps = amps * 1.25; 
            breakerDesignAmps = amps * 1.25; 

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
        // Modern standards also highly recommend 20AT for Microwave, Induction, Dishwasher
        // Motors/Pumps are also bumped to 20AT minimum to prevent nuisance tripping from startup inrush current
        const min20AmpCats = ['receptacle', 'washing_machine', 'refrigerator', 'microwave', 'induction', 'dishwasher', 'water_pump', 'motor'];
        if (min20AmpCats.includes(r.category) && breakerAT < 20) {
            breakerAT = 20;
        }

        // Wire Size based on design ampacity or breaker rating
        // Wiring ampacity must be greater than or equal to the breaker rating
        let wireSize = getWireSize(Math.max(wireDesignAmps, breakerAT));
        
        // Simple PVC Pipe Sizing based on wire size
        let pipeSize = "20mm (1/2\") PVC";
        if (["14.0mm²", "22.0mm²"].includes(wireSize)) pipeSize = "25mm (3/4\") PVC";
        else if (["30.0mm²", "38.0mm²"].includes(wireSize)) pipeSize = "32mm (1\") PVC";
        else if (!["2.0mm²", "3.5mm²", "5.5mm²", "8.0mm²"].includes(wireSize)) pipeSize = "50mm (2\") PVC";

        return {
            circuitNo: i + 1,
            description: r.description || r.category,
            category: r.category,
            qty: qty,
            unitVA: va,
            totalVA: totalLoadVA,
            amps: amps,
            breaker: `${breakerAT}AT, 2P`,
            wire: `2 - ${wireSize} + 1 - ${getGroundWireSize(breakerAT)} (G) THHN`,
            pipe: pipeSize
        };
    });

    // Main Feeder Computation (PEC Table 2.20.3.3)
    let lightingRecepVA = circuits.filter(c => ['lighting', 'receptacle'].includes(c.category)).reduce((sum, c) => sum + c.totalVA, 0);
    
    // Distinguish continuous loads from other specific loads
    const feederContinuousCats = ['acu', 'water_heater', 'motor', 'water_pump', 'ev_charger'];
    let specificContinuousVA = circuits.filter(c => feederContinuousCats.includes(c.category)).reduce((sum, c) => sum + c.totalVA, 0);
    let specificNonContinuousVA = circuits.filter(c => !['lighting', 'receptacle'].includes(c.category) && !feederContinuousCats.includes(c.category)).reduce((sum, c) => sum + c.totalVA, 0);

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

    return {
        circuits,
        totalVA,
        netTotalVA,
        mainAmps,
        mainBreaker: `${mainBreakerAT}AT, 2P`,
        mainWire: `2 - ${wireMain} + 1 - ${getGroundWireSize(mainBreakerAT)} (G) THHN`,
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
            groundWire: getGroundWireSize(mainBreakerAT),
            mainBreakerAT: mainBreakerAT
        }
    };
};
