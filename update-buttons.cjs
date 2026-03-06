const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'calculators');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if it already has ExportButtons
    if (content.includes('ExportButtons')) return;

    // 1. Add import
    content = content.replace("import MathInput", "import ExportButtons from '../common/ExportButtons';\nimport MathInput");

    // 2. Replace the old buttons block with the new component
    // The old block looks like:
    // <div className="flex gap-2">
    //     <button onClick={async () => { ... }} ...>
    //         <ClipboardCopy size={14} /> Copy to Clipboard
    //     </button>
    //     <button onClick={() => downloadCSV(...)} ...>
    //         <Download size={14} /> Download CSV
    //     </button>
    // </div>
    // We'll use a regex to find the button block (from <div className="flex gap-2"> down to </div> right before </div></div>)

    const regex = /<div className="flex gap-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;

    // A safer way is to match by the common download string
    const filenameMatch = content.match(/downloadCSV\(result\.items, ['"]([^'"]+)['"]\)/);
    if (filenameMatch) {
        const filename = filenameMatch[1];
        const replacement = `<ExportButtons items={result.items} filename="${filename}" />\n                            </div>\n                        </div>`;
        content = content.replace(/<div className="flex gap-2">[\s\S]*?<Download[^>]+> Download CSV\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/div>/, replacement);

        fs.writeFileSync(filePath, content);
        console.log('Updated ' + file);
    }
});
