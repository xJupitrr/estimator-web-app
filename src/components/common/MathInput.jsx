import React, { useState, useEffect } from 'react';
import { evaluateExpression } from '../../utils/mathUtils';

/**
 * A standard input component that supports math expressions.
 * It displays the expression while typing and evaluates it on blur or Enter.
 */
const MathInput = ({
    value,
    onChange,
    placeholder,
    className = "",
    id,
    title
}) => {
    // Local state to hold the string representation (including operators)
    const [displayValue, setDisplayValue] = useState(value === null || value === undefined ? '' : String(value));

    // Update local state when prop value changes (e.g., from outside resets)
    useEffect(() => {
        setDisplayValue(value === null || value === undefined ? '' : String(value));
    }, [value]);

    const handleBlur = () => {
        const result = evaluateExpression(displayValue);
        if (result !== null) {
            // If valid, pass the numeric result to parent
            onChange(result);
            // Also update local display to the result string
            setDisplayValue(String(result));
        } else {
            // If invalid or empty, revert to the last valid prop value
            setDisplayValue(value === null || value === undefined ? '' : String(value));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleBlur();
            e.target.blur(); // Trigger blur to finish
        }
    };

    return (
        <input
            type="text"
            id={id}
            title={title}
            placeholder={placeholder}
            value={displayValue}
            onChange={(e) => setDisplayValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`${className} placeholder:text-zinc-400 placeholder:font-normal placeholder:italic`}
        />
    );
};

export default MathInput;
