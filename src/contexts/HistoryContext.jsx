import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { setSessionData } from '../hooks/useLocalStorage';

const HistoryContext = createContext(null);

export const useHistory = () => {
    const context = useContext(HistoryContext);
    if (!context) {
        throw new Error('useHistory must be used within a HistoryProvider');
    }
    return context;
};

export const HistoryProvider = ({ children }) => {
    // History stack: Array of { key, oldValue, newValue }
    const [history, setHistory] = useState([]);

    // Pointer to the index in history. 
    // pointer = N means we have applied N actions (0 to N-1).
    // The next undo will revert action at N-1.
    // The next redo will apply action at N.
    const [pointer, setPointer] = useState(0);

    const subscribers = useRef(new Map());

    const subscribe = useCallback((key, callback) => {
        if (!subscribers.current.has(key)) {
            subscribers.current.set(key, new Set());
        }
        subscribers.current.get(key).add(callback);

        return () => {
            const subs = subscribers.current.get(key);
            if (subs) {
                subs.delete(callback);
                if (subs.size === 0) {
                    subscribers.current.delete(key);
                }
            }
        };
    }, []);

    const notify = useCallback((key, value) => {
        const subs = subscribers.current.get(key);
        if (subs) {
            subs.forEach(cb => cb(value));
        }
    }, []);

    const captureChange = useCallback((key, oldValue, newValue) => {
        try {
            // Deep clone to ensure immutability in history snapshots
            // Handle null/undefined gracefully although state should generally be defined
            const safeOld = oldValue === undefined ? null : JSON.parse(JSON.stringify(oldValue));
            const safeNew = newValue === undefined ? null : JSON.parse(JSON.stringify(newValue));

            // Avoid duplicate history entries if values are effectively same
            if (JSON.stringify(safeOld) === JSON.stringify(safeNew)) return;

            setHistory(prev => {
                const newHistory = prev.slice(0, pointer);
                newHistory.push({ key, oldValue: safeOld, newValue: safeNew });
                return newHistory;
            });
            setPointer(prev => prev + 1);
        } catch (e) {
            console.error("Failed to capture history change", e);
        }
    }, [pointer]);

    const undo = useCallback(() => {
        setPointer(currentPointer => {
            if (currentPointer <= 0) return currentPointer;

            const actionIndex = currentPointer - 1;
            const action = history[actionIndex];

            // Apply undo: revert to oldValue
            console.log(`Undoing ${action.key}`);
            notify(action.key, action.oldValue);

            // Update localStorage to persistence (now session cache)
            if (typeof window !== 'undefined') {
                setSessionData(action.key, action.oldValue);
            }

            return currentPointer - 1;
        });
    }, [history, notify]);

    const redo = useCallback(() => {
        setPointer(currentPointer => {
            if (currentPointer >= history.length) return currentPointer;

            const action = history[currentPointer];

            // Apply redo: go to newValue
            console.log(`Redoing ${action.key}`);
            notify(action.key, action.newValue);

            // Update localStorage (now session cache)
            if (typeof window !== 'undefined') {
                setSessionData(action.key, action.newValue);
            }

            return currentPointer + 1;
        });
    }, [history, notify]);

    // Clear history if needed (e.g. on massive reset)
    const clearHistory = useCallback(() => {
        setHistory([]);
        setPointer(0);
    }, []);

    const value = {
        undo,
        redo,
        captureChange,
        subscribe,
        clearHistory,
        canUndo: pointer > 0,
        canRedo: pointer < history.length
    };

    return (
        <HistoryContext.Provider value={value}>
            {children}
        </HistoryContext.Provider>
    );
};
