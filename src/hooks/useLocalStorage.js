import { useState, useEffect, useCallback } from 'react';
import { useHistory } from '../contexts/HistoryContext';

/**
 * Hook to persist state in localStorage with Undo/Redo support.
 * 
 * @param {string} key - The localStorage key.
 * @param {*} initialValue - The initial value to use if no value is stored.
 * @returns {[*, Function]} - The state and the setState function.
 */
import { getSessionData, setSessionData } from '../utils/sessionCache';
export { getSessionData, setSessionData };

export default function useLocalStorage(key, initialValue) {
    const { captureChange, broadcastChange, subscribe } = useHistory();

    // Initialize from sessionCache (for tab switching) or initialValue (for fresh load)
    const [storedValue, setStoredValue] = useState(() => {
        const cached = getSessionData(key);
        if (cached !== undefined) return cached;
        return initialValue;
    });

    const loadFromCache = useCallback(() => {
        const cached = getSessionData(key);
        if (cached !== undefined) setStoredValue(cached);
    }, [key]);

    // Return a wrapped version of useState's setter function
    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Capture change for Undo/Redo
            captureChange(key, storedValue, valueToStore);

            setStoredValue(valueToStore);
            setSessionData(key, valueToStore);

            if (broadcastChange) broadcastChange(key, valueToStore);

            // Trigger update for listeners (like totals)
            window.dispatchEvent(new CustomEvent('storage-update', { detail: { key, value: valueToStore } }));

        } catch (error) {
            console.error(`Error setting session key "${key}":`, error);
        }
    }, [key, storedValue, captureChange, broadcastChange]);
    // 1. Subscribe to external updates (Undo/Redo)
    useEffect(() => {
        const unsubscribe = subscribe(key, (newValue) => {
            setStoredValue(newValue);
            setSessionData(key, newValue);
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
