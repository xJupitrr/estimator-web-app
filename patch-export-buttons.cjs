/**
 * patch-export-buttons.js
 * Adds/replaces export buttons in all calculator files to use <ExportButtons>.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/calculators');
const importLine = `import ExportButtons from '../common/ExportButtons';`;

// ─── Helper ─────────────────────────────────────────────────────────────────
function ensureImport(src, file) {
    if (src.includes("from '../common/ExportButtons'")) return src;
    // Insert after the lucide-react import line
    return src.replace(
        /(import \{[^}]+\} from 'lucide-react';)/,
        `$1\n${importLine}`
    );
}

// ─── Group 1: Replace inline button block (has both Copy + Download inline) ──
// These files have the exact two-button pattern we want to collapse
const group1 = [
    { file: 'Beam.jsx', csv: 'beam_estimate.csv', items: 'result.items' },
    { file: 'Column.jsx', csv: 'column_estimate.csv', items: 'result.items' },
    { file: 'Footing.jsx', csv: 'footing_estimate.csv', items: 'result.items' },
    { file: 'Masonry.jsx', csv: 'masonry_estimate.csv', items: 'wallResult.items' },
];

// Regex: matches the two-button div block (Copy to Clipboard + Download CSV)
// We replace this entire block with a single <ExportButtons> call
// Strategy: remove the two inline buttons from inside the flex gap-2 div
const COPY_BTN = /<button\s+onClick=\{async[^}]+copyToClipboard[\s\S]*?<\/button>/g;
const DL_BTN = /<button\s+onClick=\{[^}]*downloadCSV[\s\S]*?<\/button>/g;

for (const { file, csv, items } of group1) {
    const fp = path.join(dir, file);
    if (!fs.existsSync(fp)) { console.log('SKIP:', file); continue; }
    let src = fs.readFileSync(fp, 'utf8');
    src = ensureImport(src, file);

    // Remove the inline copy + download buttons
    const before = src;
    src = src.replace(COPY_BTN, '');
    src = src.replace(DL_BTN, '');

    // Insert ExportButtons at the start of the flex gap-2 container
    src = src.replace(
        /(<div className="flex gap-2">)/,
        `$1\n                                    <ExportButtons items={${items}} filename="${csv}" />`
    );

    if (src !== before) {
        fs.writeFileSync(fp, src, 'utf8');
        console.log('PATCHED (inline→component):', file);
    } else {
        console.log('NO CHANGE (inline):', file);
    }
}

// ─── Group 2: Files missing export buttons entirely ──────────────────────────
// We find the total cost display end </p> and the enclosing </div>, then append <ExportButtons>
// Anchor: end of the total-cost section containing the ₱ sign

// Each: find the total-cost card then insert ExportButtons after it
const group2 = [
    { file: 'Ceiling.jsx', csv: 'ceiling_estimate.csv', items: 'result.items' },
    { file: 'ConcreteWall.jsx', csv: 'concrete_wall_estimate.csv', items: 'result.items' },
    { file: 'Drywall.jsx', csv: 'drywall_estimate.csv', items: 'result.items' },
    { file: 'DoorsWindows.jsx', csv: 'doors_windows_estimate.csv', items: 'result.items' },
    { file: 'Electrical.jsx', csv: 'electrical_estimate.csv', items: 'result.items' },
    { file: 'LintelBeam.jsx', csv: 'lintel_beam_estimate.csv', items: 'result.items' },
    { file: 'Painting.jsx', csv: 'painting_estimate.csv', items: 'result.items' },
    { file: 'Plumbing.jsx', csv: 'plumbing_estimate.csv', items: 'result.items' },
    { file: 'Roofing.jsx', csv: 'roofing_estimate.csv', items: 'result.items' },
    { file: 'SteelTruss.jsx', csv: 'steel_truss_estimate.csv', items: 'result.items' },
    { file: 'SuspendedSlab.jsx', csv: 'suspended_slab_estimate.csv', items: 'result.items' },
    { file: 'Tiles.jsx', csv: 'tiles_estimate.csv', items: 'result.items' },
    { file: 'Formworks.jsx', csv: 'formworks_estimate.csv', items: 'result.items' },
];

// Pattern: look for the total-price ₱ paragraph closing tag, then find the next </div>
// and insert ExportButtons after that </div>
// This is safe because all these files have the pattern:
//   <p className="font-bold text-4xl ...">₱{result.total...}</p>
//          </div>    ← end of total-cost badge div
// We insert <ExportButtons> right after that closing </div>

const TOTAL_BADGE_END = /(<p[^>]+font-bold[^>]+>[\s\S]{0,40}?result\.total[\s\S]*?<\/p>\s*<\/div>)/;

for (const { file, csv, items } of group2) {
    const fp = path.join(dir, file);
    if (!fs.existsSync(fp)) { console.log('SKIP:', file); continue; }
    let src = fs.readFileSync(fp, 'utf8');

    if (src.includes('ExportButtons')) { console.log('ALREADY HAS ExportButtons:', file); continue; }

    src = ensureImport(src, file);

    const match = src.match(TOTAL_BADGE_END);
    if (!match) { console.log('ANCHOR NOT FOUND:', file); continue; }

    const insertAfter = match[0];
    const exportTag = `\n                                <div className="flex gap-2 mt-2">\n                                    <ExportButtons items={${items}} filename="${csv}" />\n                                </div>`;

    src = src.replace(insertAfter, insertAfter + exportTag);
    fs.writeFileSync(fp, src, 'utf8');
    console.log('PATCHED (added buttons):', file);
}

console.log('\nDone!');
