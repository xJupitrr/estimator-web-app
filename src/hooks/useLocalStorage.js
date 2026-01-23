
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to persist state in localStorage.
 * 
 * @param {string} key - The localStorage key.
 * @param {*} initialValue - The initial value to use if no value is stored.
 * @returns {[*, Function]} - The state and the setState function.
 */
export default function useLocalStorage(key, initialValue) {
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
            setStoredValue((prev) => {
                // Allow value to be a function so we have same API as useState
                const valueToStore = value instanceof Function ? value(prev) : value;

                // Save to local storage
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
                return valueToStore;
            });
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key]);

    useEffect(() => {
        // Hydrate from storage on mount/key change in case of external changes (optional, usually not needed for single tab)
        // But mainly to ensured syncing if key changes.
        // For now, basic implementation is sufficient.
    }, [key]);

    return [storedValue, setValue];
}
