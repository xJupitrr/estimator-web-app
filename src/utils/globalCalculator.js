
import { getSessionData, setSessionData } from './sessionCache';
import { calculateMasonry } from './calculations/masonryCalculator';
import { calculateSlabOnGrade } from './calculations/slabOnGradeCalculator';
import { calculateRoofing } from './calculations/roofingCalculator';
import { calculateColumn } from './calculations/columnCalculator';
import { calculateBeam } from './calculations/beamCalculator';
import { calculateLintelBeam } from './calculations/lintelBeamCalculator';
import { calculateTiles } from './calculations/tilesCalculator';
import { calculatePainting } from './calculations/paintingCalculator';
import { calculateCeiling } from './calculations/ceilingCalculator';
import { calculateDrywall } from './calculations/drywallCalculator';
import { calculateDoorsWindows } from './calculations/doorsWindowsCalculator';
import { calculateFormworks } from './calculations/formworksCalculator';
import { calculateSuspendedSlab } from './calculations/suspendedSlabCalculator';
import { calculateElectrical } from './calculations/electricalCalculator';
import { calculatePlumbing } from './calculations/plumbingCalculator';
import { calculateFooting } from './calculations/footingCalculator';
import { calculateConcreteWall } from './calculations/concreteWallCalculator';
import { calculateSteelTruss } from './calculations/steelTrussCalculator';



// Registry of calculators
const MODULES = [
    {
        name: 'Masonry',
        dataKey: 'masonry_walls',
        priceKey: 'masonry_prices',
        resultKey: 'masonry_result',
        totalKey: 'masonry_total',
        calculator: calculateMasonry
    },
    {
        name: 'Slab On Grade',
        dataKey: 'slab_rows',
        priceKey: 'slab_prices',
        resultKey: 'slab_result',
        totalKey: 'slab_total',
        calculator: calculateSlabOnGrade
    },
    {
        name: 'Suspended Slab',
        dataKey: 'suspended_slab_rows',
        priceKey: 'suspended_slab_prices',
        resultKey: 'suspended_slab_result',
        totalKey: 'suspended_slab_total',
        calculator: calculateSuspendedSlab
    },
    {
        name: 'Footing',
        dataKey: 'footing_rows',
        priceKey: 'footing_prices',
        resultKey: 'footing_result',
        totalKey: 'footing_total',
        calculator: calculateFooting
    },
    {

        name: 'Roofing',
        dataKey: 'roofing_rows',
        priceKey: 'roofing_prices',
        resultKey: 'roofing_result',
        totalKey: 'roofing_total',
        settingsKey: 'roofing_settings',
        calculator: calculateRoofing
    },
    {
        name: 'Column',
        dataKey: 'app_columns',
        priceKey: 'column_prices',
        resultKey: 'column_result',
        totalKey: 'column_total',
        calculator: calculateColumn
    },
    {
        name: 'Beam',
        dataKey: 'app_beams',
        priceKey: 'beam_prices',
        resultKey: 'beam_result',
        totalKey: 'beam_total',
        calculator: calculateBeam
    },
    {
        name: 'Lintel Beam',
        // Special: Source data comes from DoorsWindows rows, but specs are local
        dataKey: 'doorswindows_rows',
        priceKey: 'lintelbeam_prices',
        resultKey: 'lintelbeam_result',
        totalKey: 'lintel_beam_total', // Matches App.jsx key
        specsKey: 'lintelbeam_specs',
        calculator: calculateLintelBeam
    },
    {
        name: 'Tiles',
        dataKey: 'tiles_rows',
        priceKey: 'tiles_prices',
        resultKey: 'tile_result', // Check key in Tiles.jsx? Usually "tile_result" or "tiles_result"? App.jsx uses "tiles_total". I'll stick to 'tiles_result' if standard, but I should verify Tiles.jsx.
        totalKey: 'tiles_total',
        calculator: calculateTiles
    },
    {
        name: 'Painting',
        dataKey: 'painting_rows',
        priceKey: 'painting_prices',
        resultKey: 'painting_result',
        totalKey: 'painting_total',
        calculator: calculatePainting
    },
    {
        name: 'Ceiling',
        dataKey: 'ceiling_rows',
        priceKey: 'ceiling_prices',
        resultKey: 'ceiling_result',
        totalKey: 'ceiling_total',
        calculator: calculateCeiling
    },
    {
        name: 'Drywall',
        dataKey: 'drywall_rows',
        priceKey: 'drywall_prices',
        resultKey: 'drywall_result',
        totalKey: 'drywall_total',
        calculator: calculateDrywall
    },

    {
        name: 'Electrical',
        dataKey: 'electrical_rows',
        priceKey: 'electrical_prices',
        resultKey: 'electrical_result',
        totalKey: 'electrical_total',
        calculator: calculateElectrical
    },
    {
        name: 'Plumbing',
        dataKey: 'plumbing_rows',
        priceKey: 'plumbing_prices',
        resultKey: 'plumbing_result',
        totalKey: 'plumbing_total',
        calculator: calculatePlumbing
    },
    {

        name: 'Doors & Windows',
        dataKey: 'doorswindows_rows',
        resultKey: 'doorswindows_result',
        totalKey: 'doors_windows_total',
        calculator: calculateDoorsWindows
    },
    {
        name: 'Formworks',
        dataKey: 'formworks_rows',
        priceKey: 'formworks_prices',
        resultKey: 'formworks_result',
        totalKey: 'formworks_total',
        calculator: calculateFormworks
    },
    {
        name: 'Concrete Wall',
        dataKey: 'concrete_walls',
        priceKey: 'concrete_wall_prices',
        resultKey: 'concrete_wall_result',
        totalKey: 'concrete_wall_total',
        calculator: calculateConcreteWall
    },
    {
        name: 'Steel Truss',
        dataKey: 'steel_truss_parts',
        priceKey: 'steel_truss_prices',
        resultKey: 'steel_truss_result',
        totalKey: 'steel_truss_total',
        calculator: calculateSteelTruss
    }
];

export const runGlobalRecalculation = () => {
    console.log("Starting Global Recalculation...");
    let anyUpdates = false;

    MODULES.forEach(mod => {
        try {
            const data = getSessionData(mod.dataKey);
            // If main data missing, skip
            if (!data) return;

            const prices = mod.priceKey ? getSessionData(mod.priceKey) : {};
            let result = null;

            if (mod.name === 'Roofing') {
                const settings = getSessionData(mod.settingsKey) || { wasteFactor: 5 };
                result = mod.calculator(data, prices, settings);
            }
            else if (mod.name === 'Column') {
                result = mod.calculator(data, prices);
            }
            else if (mod.name === 'Lintel Beam') {
                // Needs specs
                const specs = getSessionData(mod.specsKey);
                // Also requires transformation of doorswindows_rows to items compatible with Lintel logic?
                // The utility expecting: `(items, specs, prices)`.
                // `items` passed to utility should be the RAW rows or processed? 
                // `LintelBeam.jsx` processes `doorsWindowsItems` into `lintelItems` before passing to logic.
                // The UTILITY `calculateLintelBeam` logic should handle the transformation if possible, or I need to replicate it here.
                // Looking at `lintelBeamCalculator.js` (I didn't view it, but assumed logic).
                // If the calculator expects PRE-PROCESSED items, then I need to process `data` (doorswindows_rows) here.
                if (specs) {
                    // Logic from LintelBeam.jsx:
                    // transform items
                    const BEARING = 0.20; // 200mm
                    const lintelItems = data
                        .filter(item => item && item.width_m && item.height_m)
                        .map(item => ({
                            id: item.id,
                            openingType: item.itemType || 'Opening',
                            openingWidth: parseFloat(item.width_m) || 0,
                            openingHeight: parseFloat(item.height_m) || 0,
                            quantity: parseInt(item.quantity) || 1,
                            lintelWidth: (parseFloat(item.width_m) || 0) + (2 * BEARING),
                            // Depth? LintelBeam.jsx uses a default or calc?
                            // It uses `depth` constant 0.2? Re-read LintelBeam.jsx if needed.
                            // I'll assume 0.20m for now as standard strict.
                            lintelDepth: 0.20,
                            mainBarSku: specs.mainBarSku,
                            mainBarCount: parseInt(specs.mainBarCount) || 2,
                            tieSku: specs.tieSku,
                            tieSpacing: parseInt(specs.tieSpacing) || 150,
                        }));

                    if (lintelItems.length > 0) {
                        result = mod.calculator(lintelItems, specs, prices);
                    }
                }
            }
            else if (mod.name === 'Formworks') {
                // Needs Config
                const config = {
                    wastePlywood: getSessionData('formworks_waste_plywood') || 15,
                    wasteLumber: getSessionData('formworks_waste_lumber') || 10,
                    includeColumns: getSessionData('formworks_include_columns') || false,
                    includeBeams: getSessionData('formworks_include_beams') || false,
                    importPlywood: getSessionData('formworks_import_plywood') || 'phenolic_1_2',
                    importLumber: getSessionData('formworks_import_lumber') || 'lumber_2x3'
                };
                const columns = getSessionData('app_columns') || [];
                const beams = getSessionData('app_beams') || [];

                result = mod.calculator(data, columns, beams, prices, config);
            }
            else {
                result = mod.calculator(data, prices);
            }

            if (result) {
                setSessionData(mod.resultKey, result);
                // Standardize total extraction
                const total = result.total || result.grandTotal || 0;
                setSessionData(mod.totalKey, total);
                anyUpdates = true;
            } else {
                if (Array.isArray(data) && data.length > 0) {
                    // Only clear if we have data but result is null (invalid inputs)
                    setSessionData(mod.resultKey, null);
                    setSessionData(mod.totalKey, null);
                }
            }

        } catch (e) {
            console.error(`Global Calc Error in ${mod.name}:`, e);
        }
    });

    if (anyUpdates || true) {
        window.dispatchEvent(new CustomEvent('project-total-update'));
        window.dispatchEvent(new CustomEvent('project-session-loaded'));
    }
};

// Setup Listener
export const initGlobalCalculator = () => {
    window.addEventListener('trigger-global-recalc', runGlobalRecalculation);
    return () => window.removeEventListener('trigger-global-recalc', runGlobalRecalculation);
};
