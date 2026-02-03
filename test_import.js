
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
    'DOORS & WINDOWS DATA': 'doorswindows_rows'
};

const parseCSVLine = (str) => {
    const arr = [];
    let quote = false;
    let col = "";
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const next = str[i + 1];

        if (char === '"') {
            if (quote && next === '"') {
                col += '"';
                i++;
            } else {
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

const csvToArray = (csvText) => {
    const lines = csvText.trim().split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const currentline = parseCSVLine(lines[i]);
        if (currentline.length !== headers.length) continue;

        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            let val = currentline[j];
            obj[headers[j]] = val;
        }
        result.push(obj);
    }
    return result;
};

const mockLocalStorage = {
    store: {},
    setItem(key, val) { this.store[key] = val; },
    getItem(key) { return this.store[key] || null; }
};

const importProjectFromCSV = async (text, localStorage) => {
    const lines = text.split('\n');

    let currentSection = null;
    let sectionBuffer = [];

    const processSection = (name, lines) => {
        if (!name || lines.length === 0) return;

        if (name === 'SETTINGS') {
            lines.shift(); // Remove header (Key,ValueType,Value)
            lines.forEach(line => {
                if (!line.trim()) return;
                const parts = parseCSVLine(line);
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
    return true;
};

// Test Case with complex JSON (commas in quotes)
const testCSV = `### ESTIMATOR PROJECT EXPORT ###
Exported At,2026-02-03T01:00:00.000Z

### SECTION: DOORS & WINDOWS DATA ###
"id","quantity","itemType"
"dw-1","2","Sliding Window"

### SECTION: SETTINGS ###
Key,ValueType,Value
roofing_prices,JSON,"{""cement"":240,""sand"":1200,""gravel"":1400}"
lintel_prices,JSON,"{""10"":180,""12"":260}"
`;

async function runTest() {
    console.log("Starting test...");
    await importProjectFromCSV(testCSV, mockLocalStorage);
    console.log("LocalStorage after import:", JSON.stringify(mockLocalStorage.store, null, 2));

    const dwImported = mockLocalStorage.store['doorswindows_rows'];
    const roofingPrices = mockLocalStorage.store['roofing_prices'];
    const lintelPrices = mockLocalStorage.store['lintel_prices'];

    let passed = true;

    if (dwImported !== '[{"id":"dw-1","quantity":"2","itemType":"Sliding Window"}]') {
        console.error("FAILED: doorswindows_rows mismatch");
        passed = false;
    }

    if (roofingPrices !== '{"cement":240,"sand":1200,"gravel":1400}') {
        console.error("FAILED: roofing_prices mismatch (likely comma splitting issue)");
        passed = false;
    }

    if (lintelPrices !== '{"10":180,"12":260}') {
        console.error("FAILED: lintel_prices mismatch");
        passed = false;
    }

    if (passed) {
        console.log("✅ ALL TESTS PASSED");
    } else {
        console.log("❌ SOME TESTS FAILED");
        process.exit(1);
    }
}

runTest();
