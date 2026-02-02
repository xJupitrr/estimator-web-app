import { useState, useEffect, useCallback } from 'react';
import { useHistory } from '../contexts/HistoryContext';

/**
 * Hook to persist state in localStorage with Undo/Redo support.
 * 
 * @param {string} key - The localStorage key.
 * @param {*} initialValue - The initial value to use if no value is stored.
 * @returns {[*, Function]} - The state and the setState function.
 */
export default function useLocalStorage(key, initialValue) {
    const { captureChange, subscribe } = useHistory();

    // Get from local storage then parse stored json or return initialValue
    const [storedValue, setStoredValue] = useState(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = useCallback((value) => {
        try {
            // Need the latest state to capture history correctly.
            // Since this callback depends on storedValue, it will update when storedValue updates.
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Capture change for Undo/Redo
            captureChange(key, storedValue, valueToStore);

            setStoredValue(valueToStore);

            // Save to local storage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue, captureChange]);

    // Subscribe to external updates (Undo/Redo)
    useEffect(() => {
        // subscribe returns an unsubscribe function
        const unsubscribe = subscribe(key, (newValue) => {
            // When undo/redo happens, we get the new value to display.
            // We update internal state, but do NOT capture this change or write to localStorage
            // (HistoryContext handles the localStorage write for atomic consistency)
            setStoredValue(newValue);
        });
        return unsubscribe;
    }, [key, subscribe]);

    return [storedValue, setValue];
}
