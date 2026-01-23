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
    'CEILING DATA': 'ceiling_rooms'
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
    'column_prices'
];

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

    // Parse header
    // This simple parser assumes standard CSV (comma separated, quote escaped)
    // For robustness with user-edited files, we need better parsing, but basic split is okay for this scope
    // if no commas in values. The export handles escaping, import should too.
    // Let's use a regex for splitting CSV line correctly.
    const parseLine = (line) => {
        const pattern = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
        // Simple fallback: split by comma if no quotes involved usually
        // But let's stick to simple split for MVP unless we add a standard library
        return line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || line.split(',');
        // Actually, let's just use string split if we trust the format or write a micro-parser.
    };

    // Micro-parser for CSV line - Correctly handles escaped quotes ("") and delimiters
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

// Internal utility for parsing settings line specifically
const parseSettingsLine = (line) => {
    const arr = [];
    let quote = false;
    let col = "";
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const next = line[i + 1];
        if (char === '"') {
            if (quote && next === '"') { col += '"'; i++; }
            else { quote = !quote; }
            continue;
        }
        if (char === ',' && !quote) { arr.push(col); col = ""; continue; }
        col += char;
    }
    arr.push(col);
    return arr;
};


export const exportProjectToCSV = () => {
    let csvParts = [];
    csvParts.push("### ESTIMATOR PROJECT EXPORT ###");
    csvParts.push(`Exported At,${new Date().toISOString()}`);
    csvParts.push(""); // Spacer

    // 1. Export Lists
    Object.entries(LIST_SECTIONS).forEach(([sectionName, key]) => {
        const raw = localStorage.getItem(key);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                if (Array.isArray(data) && data.length > 0) {
                    csvParts.push(`### SECTION: ${sectionName} ###`);
                    csvParts.push(arrayToCSV(data));
                    csvParts.push(""); // Spacer
                }
            } catch (e) { console.warn(`Failed to export ${key}`, e); }
        }
    });

    // 2. Export Settings (Key-Value)
    csvParts.push("### SECTION: SETTINGS ###");
    csvParts.push("Key,ValueType,Value");
    SETTINGS_KEYS.forEach(key => {
        const val = localStorage.getItem(key);
        if (val !== null) {
            // We store the raw string from LS. If it's a JSON object string, it stays a string.
            // Escape it for CSV.
            const escVal = val.replace(/"/g, '""');
            csvParts.push(`${key},JSON,"${escVal}"`);
        }
    });

    return csvParts.join('\n');
};

export const importProjectFromCSV = async (file) => {
    const text = await file.text();
    const lines = text.split('\n');

    let currentSection = null;
    let sectionBuffer = [];
    const updates = {};

    const processSection = (name, lines) => {
        if (!name || lines.length === 0) return;

        if (name === 'SETTINGS') {
            lines.shift(); // Remove header (Key,ValueType,Value)
            lines.forEach(line => {
                if (!line.trim()) return;
                const parts = parseSettingsLine(line);
                if (parts.length >= 3) {
                    const key = parts[0];
                    const value = parts[2];
                    if (key && value) {
                        localStorage.setItem(key, value);
                    }
                }
            });
        } else if (LIST_SECTIONS[name]) {
            const key = LIST_SECTIONS[name];
            const csvString = lines.join('\n');
            const data = csvToArray(csvString);
            if (data.length > 0) {
                localStorage.setItem(key, JSON.stringify(data));
            }
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('### SECTION:')) {
            // Process previous
            processSection(currentSection, sectionBuffer);

            // Start new
            currentSection = line.replace('### SECTION:', '').replace('###', '').trim();
            sectionBuffer = [];
        } else if (line.startsWith('###')) {
            // Meta headers, ignore or process if needed
            processSection(currentSection, sectionBuffer);
            currentSection = null;
            sectionBuffer = [];
        } else {
            if (currentSection && line) {
                sectionBuffer.push(lines[i]); // Keep original formatting for CSV parser
            }
        }
    }
    // Process last
    processSection(currentSection, sectionBuffer);

    return true;
};
