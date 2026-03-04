const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'calculators');
const filesToPatch = [
    'DoorsWindows.jsx',
    'Footing.jsx',
    'Masonry.jsx',
    'SteelTruss.jsx',
    'RebarSchedule.jsx',
    'RebarCuttingSchedule.jsx'
];

filesToPatch.forEach(file => {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Add import
    if (!content.includes('import ExportButtons from')) {
        content = content.replace("import MathInput", "import ExportButtons from '../common/ExportButtons';\nimport MathInput");
        // Also cover Rebar files that might not have MathInput
        if (!content.includes('import ExportButtons from')) {
            content = content.replace("import { Download", "import ExportButtons from '../common/ExportButtons';\nimport { Download");
        }
    }

    // Generic replace for the two buttons
    const resultItemsRegex = /downloadCSV\(([^,]+), ['"]([^'"]+)['"]\)/;
    const match = content.match(resultItemsRegex);

    if (match) {
        const itemsVar = match[1];
        const filename = match[2];
        const replacement = `<ExportButtons items={${itemsVar}} filename="${filename}" />`;

        // Match the button block: <button ... copyToClipboard ... </button> ... <button ... downloadCSV ... </button>
        const buttonRegex = /<button[\s\S]*?copyToClipboard[\s\S]*?<\/button>\s*<button[\s\S]*?downloadCSV[\s\S]*?<\/button>/g;

        content = content.replace(buttonRegex, replacement);
        fs.writeFileSync(filePath, content);
        console.log('Updated ' + file);
    }
});
