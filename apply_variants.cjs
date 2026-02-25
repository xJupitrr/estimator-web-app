const fs = require('fs');
const path = require('path');
const dir = './src/components/calculators';

fs.readdirSync(dir).forEach(file => {
    if (!file.endsWith('.jsx')) return;
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');
    let original = content;

    // 1. ADD ROW variant propagation
    // It should change <ActionButton ... label="Add Row" ... className="something" ... />
    // To <ActionButton ... label="Add Row" variant="addRow" ... />

    // First, let's strip completely any existing className on "Add Row" 
    content = content.replace(/<ActionButton([^>]*?)label="Add Row"([^>]*?)className="[^"]*"([^>]*?)>/g, '<ActionButton$1label="Add Row"$2$3>');
    content = content.replace(/<ActionButton([^>]*?)className="[^"]*"([^>]*?)label="Add Row"([^>]*?)>/g, '<ActionButton$1label="Add Row"$2$3>');

    // Now just inject variant="addRow" if it doesn't already have it
    content = content.replace(/<ActionButton([^>]*?)label="Add Row"(?![^>]*?variant="addRow")([^>]*?)>/g, '<ActionButton$1label="Add Row" variant="addRow"$2>');

    // 2. CALCULATE variant propagation
    // Strip className
    content = content.replace(/<ActionButton([^>]*?)label="CALCULATE"([^>]*?)className="[^"]*"([^>]*?)>/g, '<ActionButton$1label="CALCULATE"$2$3>');
    content = content.replace(/<ActionButton([^>]*?)className="[^"]*"([^>]*?)label="CALCULATE"([^>]*?)>/g, '<ActionButton$1label="CALCULATE"$2$3>');

    // Inject variant="calculate"
    content = content.replace(/<ActionButton([^>]*?)label="CALCULATE"(?![^>]*?variant="calculate")([^>]*?)>/g, '<ActionButton$1label="CALCULATE" variant="calculate"$2>');

    if (content !== original) {
        console.log('Fixed:', file);
        fs.writeFileSync(fp, content, 'utf8');
    }
});
