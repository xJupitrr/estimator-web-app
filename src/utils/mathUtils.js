/**
 * Safely evaluates a math expression string.
 * Supports +, -, *, /, and parentheses.
 * Replaces 'x' with '*' for user convenience.
 * @param {string} expr - The expression string to evaluate.
 * @returns {number|null} - The resulting number or null if invalid.
 */
export function evaluateExpression(expr) {
    if (!expr || typeof expr !== 'string') return null;

    // Replace 'x' or 'X' with '*'
    let sanitized = expr.replace(/[xX]/g, '*');

    // Remove anything that isn't a number, operator, decimal, or parentheses
    sanitized = sanitized.replace(/[^0-9+\-*/().\s]/g, '');

    // Basic check: if empty after sanitization, or contains only whitespace
    if (!sanitized.trim()) return null;

    try {
        // Use Function constructor for evaluation (safer than eval if sanitized)
        // We wrap it to ensure it returns a number
        const result = new Function(`return (${sanitized})`)();

        const numResult = parseFloat(result);
        return isFinite(numResult) ? numResult : null;
    } catch (error) {
        console.error('Math evaluation error:', error);
        return null;
    }
}
