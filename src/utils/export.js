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
 * 
 * @param {Array} items - The list of items to export.
 * @param {string} filename - The name of the file to save.
 */
export const downloadCSV = (items, filename = 'estimation.csv') => {
    const data = formatDataForExport(items);
    const csvContent = data.map(row => {
        // Escape quotes and wrap fields in quotes if they contain commas
        return row.map(field => {
            const stringField = String(field);
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        }).join(',');
    }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
