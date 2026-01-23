/**
 * utility functions for exporting data
 */

/**
 * Formats an array of objects for export.
 * Assumes a flat structure or flattens specific known structures if needed.
 * For this app, we'll generally pass the processed items directly.
 * 
 * @param {Array} items - The list of items to export.
 * @returns {Array} - Array of headers and rows.
 */
export const formatDataForExport = (items) => {
    if (!items || items.length === 0) return [];

    // Define columns based on the structure in Masonry and CostTable
    // items usually have: name, qty, unit, price, total
    const headers = ['Item Name', 'Quantity', 'Unit', 'Unit Price', 'Total Price'];

    const rows = items.map(item => [
        item.name,
        item.qty,
        item.unit,
        item.price,
        item.total
    ]);

    return [headers, ...rows];
};

/**
 * Copies data to clipboard in TSV (Tab Separated Values) format.
 * ideal for pasting into Excel/Sheets.
 * 
 * @param {Array} items - The list of items to export.
 * @returns {Promise<void>}
 */
export const copyToClipboard = async (items) => {
    const data = formatDataForExport(items);
    const tsv = data.map(row => row.join('\t')).join('\n');

    try {
        await navigator.clipboard.writeText(tsv);
        return true; // Success
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        return false; // Failure
    }
};

/**
 * Downloads data as a CSV file.
 * Enhanced to support exporting Inputs alongside Bill of Quantities.
 * 
 * @param {Array} items - The list of result items (BOQ).
 * @param {string} filename - The name of the file to save.
 * @param {Array} inputs - Optional. The list of input items (Specifications).
 * @param {Array<string>} inputHeaders - Optional. Headers for the input section.
 */
export const downloadCSV = (items, filename = 'estimation.csv', inputs = [], inputHeaders = []) => {
    let csvContent = "";

    // 1. Process Inputs (Specification) Section
    if (inputs && inputs.length > 0) {
        csvContent += "PROJECT SPECIFICATIONS (INPUTS)\n";

        // Generate headers if not provided, based on keys of first object
        let headers = inputHeaders;
        if (!headers || headers.length === 0) {
            // Exclude 'id' and internal keys if generic
            headers = Object.keys(inputs[0]).filter(k => k !== 'id');
        }

        csvContent += headers.map(h => `"${String(h).toUpperCase()}"`).join(',') + "\n";

        const inputRows = inputs.map(row => {
            return headers.map(header => {
                // Map header back to key (this is simple assumption, usually passed definitions are better)
                // For now, assuming headers ARE the keys or mapped simple keys.
                // If inputHeaders passed, we might need a mapping. 
                // Let's simplify: call with specific objects ready for values.
                // Or better: Inputs should be an array of objects where keys match headers roughly or we use raw values.

                // Fallback: if header exists in row as key
                const val = row[header] || row[header.toLowerCase()] || row[header.replace(' ', '_').toLowerCase()] || "";

                const stringField = String(val);
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            }).join(',');
        }).join('\n');

        csvContent += inputRows + "\n\n"; // Add spacing
    }

    // 2. Process BOQ Section
    if (items && items.length > 0) {
        csvContent += "BILL OF QUANTITIES (ESTIMATE)\n";
        const data = formatDataForExport(items);
        const boqRows = data.map(row => {
            return row.map(field => {
                const stringField = String(field);
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            }).join(',');
        }).join('\n');
        csvContent += boqRows;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
