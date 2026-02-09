import { useState, useEffect, useCallback } from 'react';
import { useHistory } from '../contexts/HistoryContext';

/**
 * Hook to persist state in localStorage with Undo/Redo support.
 * 
 * @param {string} key - The localStorage key.
 * @param {*} initialValue - The initial value to use if no value is stored.
 * @returns {[*, Function]} - The state and the setState function.
 */
// Session cache to maintain state during tab switching (internal navigation)
// This cache is reset automatically on browser refresh.
const sessionCache = {};

export default function useLocalStorage(key, initialValue) {
    const { captureChange, subscribe } = useHistory();

    // Initialize from sessionCache (for tab switching) or initialValue (for fresh load)
    // Initialize from sessionCache (for tab switching) or initialValue (for fresh load)
    const [storedValue, setStoredValue] = useState(() => {
        // 1. Check session cache first (for tab switching persistence)
        if (sessionCache[key] !== undefined) {
            return sessionCache[key];
        }

        // 2. Fallback to initial value
        // We strictly rely on sessionCache or initialValue (LocalStorage disabled).
        return initialValue;
    });

    const loadFromCache = useCallback(() => {
        if (sessionCache[key] !== undefined) {
            setStoredValue(sessionCache[key]);
        }
    }, [key]);

    // Return a wrapped version of useState's setter function
    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Capture change for Undo/Redo
            captureChange(key, storedValue, valueToStore);

            setStoredValue(valueToStore);
            sessionCache[key] = valueToStore;

            // Trigger update for listeners (like totals)
            window.dispatchEvent(new CustomEvent('storage-update', { detail: { key, value: valueToStore } }));

        } catch (error) {
            console.error(`Error setting session key "${key}":`, error);
        }
    }, [key, storedValue, captureChange]);

    // 1. Subscribe to external updates (Undo/Redo)
    useEffect(() => {
        const unsubscribe = subscribe(key, (newValue) => {
            setStoredValue(newValue);
            sessionCache[key] = newValue;
        });
        return unsubscribe;
    }, [key, subscribe]);

    // 2. Listen for "project-session-loaded" event to force-load from sessionCache
    useEffect(() => {
        const handleSessionLoad = () => {
            loadFromCache();
        };

        window.addEventListener('project-session-loaded', handleSessionLoad);
        return () => window.removeEventListener('project-session-loaded', handleSessionLoad);
    }, [loadFromCache]);

    return [storedValue, setValue];
}

/**
 * Helper to direct access session data for Export/Import
 */
export const getSessionData = (key) => {
    return sessionCache[key];
};

export const setSessionData = (key, value) => {
    sessionCache[key] = value;
    // We don't trigger React updates here directly, the events do that if needed, 
    // or the components read on mount/event.
};
