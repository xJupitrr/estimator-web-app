/**
 * Session Manager Utilities
 * Handles exporting and importing full project state via CSV.
 */

// Mapping of Section Headers to LocalStorage Keys (Lists of Objects)
const LIST_SECTIONS = {
    'ROOFING DATA': 'roofing_rows',
    'FORMWORKS DATA': 'formworks_rows',
    'COLUMNS DATA': 'app_columns',
    'BEAMS DATA': 'app_beams',
    'MASONRY DATA': 'masonry_walls',
    'SLAB DATA': 'slab_rows',
    'FOOTING DATA': 'footing_rows',
    'SUSPENDED SLAB DATA': 'suspended_slab_rows',
    'TILES DATA': 'tiles_rows',
    'PAINTING DATA': 'painting_rows',
    'CEILING DATA': 'ceiling_rooms',
    'DOORS & WINDOWS DATA': 'doorswindows_rows',
    'RETAINING/SHEAR WALL DATA': 'concrete_walls'
};

// Mapping of Single Value/Object Keys to a generic Settings Section
const SETTINGS_KEYS = [
    'roofing_settings',
    'roofing_prices',
    'formworks_waste_plywood',
    'formworks_waste_lumber',
    'formworks_include_columns',
    'formworks_include_beams',
    'formworks_import_plywood',
    'formworks_import_lumber',
    'formworks_prices',
    'masonry_prices',
    'slab_prices',
    'footing_prices',
    'suspended_slab_prices',
    'tiles_prices',
    'painting_prices',
    'ceiling_prices',
    'ceiling_config',
    'beam_prices',
    'column_prices',
    'lintel_prices',
    'lintel_specs',
    'project_name',
    'last_save_info',

    // --- Estimation Result Tables (Objects) ---
    'masonry_result',
    'slab_result',
    'suspended_slab_result',
    'footing_result',
    'column_result',
    'roofing_result',
    'formworks_result',
    'tiles_result',
    'painting_result',
    'ceiling_result',
    'doorswindows_result',
    // On-the-fly calculators (persist display state)
    'beam_show_result',
    'lintel_show_result',

    // --- Totals (for Dashboard) ---
    'masonry_total',
    'slab_total',
    'suspended_slab_total',
    'footing_total',
    'column_total',
    'beam_total',
    'roofing_total',
    'formworks_total',
    'tiles_total',
    'painting_total',
    'ceiling_total',
    'doors_windows_total',
    'lintel_beam_total',
    'concrete_wall_total',
    'concrete_wall_prices',
    'concrete_wall_result'
];

/**
 * Robustly parses a single CSV line, handling quoted fields and escaped quotes.
 */
const parseCSVLine = (str) => {
    const arr = [];
    let quote = false;
    let col = "";
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const next = str[i + 1];

        if (char === '"') {
            if (quote && next === '"') {
                // Escaped quote: ""
                col += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                quote = !quote;
            }
            continue;
        }

        if (char === ',' && !quote) {
            arr.push(col);
            col = "";
            continue;
        }
        col += char;
    }
    arr.push(col);
    return arr;
};

/**
 * Converts an array of flat objects to CSV string part.
 */
const arrayToCSV = (arr) => {
    if (!arr || arr.length === 0) return "";
    const headers = Object.keys(arr[0]);
    const headerRow = headers.map(h => `"${h}"`).join(',');
    const rows = arr.map(obj => {
        return headers.map(h => {
            const val = obj[h];
            const str = (val === null || val === undefined) ? "" : String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',');
    });
    return [headerRow, ...rows].join('\n');
};

/**
 * Parses CSV text into an array of objects.
 */
const csvToArray = (csvText) => {
    const lines = csvText.trim().split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const currentline = parseCSVLine(lines[i]);
        if (currentline.length !== headers.length) continue; // Skip malformed

        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            let val = currentline[j];
            obj[headers[j]] = val;
        }
        result.push(obj);
    }
    return result;
};



import { getSessionData, setSessionData } from './sessionCache';

// ... (KEEP CONSTANTS SAME) ...

export const exportProjectToCSV = () => {
    let csvParts = [];
    csvParts.push("### ESTIMATOR PROJECT EXPORT ###");
    csvParts.push(`Exported At,${new Date().toISOString()}`);
    csvParts.push(""); // Spacer

    // 1. Export Lists
    Object.entries(LIST_SECTIONS).forEach(([sectionName, key]) => {
        const data = getSessionData(key);
        if (data) {
            try {
                // If it's already an object (from session cache), use it directly.
                // If it's a string (legacy/edge case), parse it (though cache should store objects).
                const arrayData = (typeof data === 'string') ? JSON.parse(data) : data;

                if (Array.isArray(arrayData) && arrayData.length > 0) {
                    csvParts.push(`### SECTION: ${sectionName} ###`);
                    csvParts.push(arrayToCSV(arrayData));
                    csvParts.push(""); // Spacer
                }
            } catch (e) { console.warn(`Failed to export ${key}`, e); }
        }
    });

    // 2. Export Settings (Key-Value)
    csvParts.push("### SECTION: SETTINGS ###");
    csvParts.push("Key,ValueType,Value");
    SETTINGS_KEYS.forEach(key => {
        const val = getSessionData(key);
        if (val !== null && val !== undefined) {
            // Session cache stores actual values (objects/numbers/strings)
            // We need to stringify objects/arrays for the CSV "Value" column if they are complex, 
            // but SETTINGS_KEYS are mostly simple or single objects.
            // Based on previous logic: "We store raw string from LS. If it's JSON object string..."
            // New logic: Convert value to string representation.

            let stringVal = val;
            if (typeof val === 'object') {
                stringVal = JSON.stringify(val);
            } else {
                stringVal = String(val);
            }

            // Escape quotes for CSV
            const escVal = stringVal.replace(/"/g, '""');
            csvParts.push(`${key},JSON,"${escVal}"`);
        }
    });

    return csvParts.join('\n');
};

/**
 * Parses a CSV file and returns a structured object of the session data.
 * Does NOT apply changes to the session.
 * @returns {Promise<{ settings: Object, sections: Object }>}
 */
export const parseProjectCSV = async (file) => {
    const text = await file.text();
    const lines = text.split('\n');

    let currentSection = null;
    let sectionBuffer = [];

    // Structure to hold parsed data
    const parsedData = {
        settings: {}, // Key-value pairs for settings/prices/results
        sections: {}  // Array data for LIST_SECTIONS
    };

    const processSection = (name, lines) => {
        if (!name || lines.length === 0) return;

        if (name === 'SETTINGS') {
            lines.shift(); // Remove header
            lines.forEach(line => {
                if (!line.trim()) return;
                const parts = parseCSVLine(line);
                if (parts.length >= 3) {
                    const key = parts[0];
                    const value = parts[2];
                    if (key && value) {
                        try {
                            parsedData.settings[key] = JSON.parse(value);
                        } catch (e) {
                            parsedData.settings[key] = value;
                        }
                    }
                }
            });
        } else if (LIST_SECTIONS[name]) {
            const key = LIST_SECTIONS[name];
            const csvString = lines.join('\n');
            const data = csvToArray(csvString);
            if (data.length > 0) {
                parsedData.sections[name] = data; // Store by Section Name (e.g., 'MASONRY DATA')
            }
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('### SECTION:')) {
            processSection(currentSection, sectionBuffer);
            currentSection = line.replace('### SECTION:', '').replace('###', '').trim();
            sectionBuffer = [];
        } else if (line.startsWith('###')) {
            processSection(currentSection, sectionBuffer);
            currentSection = null;
            sectionBuffer = [];
        } else {
            if (currentSection && line) {
                sectionBuffer.push(lines[i]);
            }
        }
    }
    processSection(currentSection, sectionBuffer);

    return parsedData;
};

/**
 * Applies selected parts of the parsed session data to the current session.
 * @param {Object} parsedData - The object returned by parseProjectCSV
 * @param {Array<string>} selectedSectionNames - List of Section Names to import (e.g. ['MASONRY DATA']). 
 *                                               Includes 'SETTINGS' for the settings block.
 */
export const applySessionData = (parsedData, selectedSectionNames) => {
    if (!parsedData) return;

    // 1. Apply Settings if selected
    if (selectedSectionNames.includes('SETTINGS') && parsedData.settings) {
        Object.entries(parsedData.settings).forEach(([key, value]) => {
            setSessionData(key, value);
        });
    }

    // 2. Apply List Sections
    Object.entries(parsedData.sections).forEach(([sectionName, data]) => {
        if (selectedSectionNames.includes(sectionName)) {
            const key = LIST_SECTIONS[sectionName];
            if (key) {
                setSessionData(key, data);
            }
        }
    });

    return true;
};

/**
 * Legacy wrapper for backward compatibility if needed, though we will update App.jsx
 */
export const importProjectFromCSV = async (file) => {
    const data = await parseProjectCSV(file);
    // Import everything by default
    const allSections = ['SETTINGS', ...Object.keys(data.sections)];
    applySessionData(data, allSections);
    return true;
};
