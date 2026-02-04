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
    const [storedValue, setStoredValue] = useState(() => {
        if (sessionCache[key] !== undefined) {
            return sessionCache[key];
        }
        return initialValue;
    });

    const loadFromLocalStorage = useCallback(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                const parsed = JSON.parse(item);
                setStoredValue(parsed);
                sessionCache[key] = parsed;
            }
        } catch (error) {
            console.error(`Error loading from localStorage key "${key}":`, error);
        }
    }, [key]);

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to sessionCache (session-only, clears on refresh).
    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Capture change for Undo/Redo
            captureChange(key, storedValue, valueToStore);

            setStoredValue(valueToStore);
            sessionCache[key] = valueToStore;

            // NOTE: We do NOT write to localStorage here anymore.
            // This ensures data clears on browser refresh.
            // The Save/Load Session features handle localStorage directly.
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
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

    // 2. Listen for "project-session-loaded" event to force-load from localStorage
    useEffect(() => {
        const handleSessionLoad = () => {
            loadFromLocalStorage();
        };

        window.addEventListener('project-session-loaded', handleSessionLoad);
        return () => window.removeEventListener('project-session-loaded', handleSessionLoad);
    }, [loadFromLocalStorage]);

    return [storedValue, setValue];
}
