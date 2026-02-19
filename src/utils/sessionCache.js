/**
 * Session cache to maintain state during tab switching (internal navigation)
 * This cache is reset automatically on browser refresh.
 */
const sessionCache = {};

export const getSessionData = (key) => {
    return sessionCache[key];
};

export const setSessionData = (key, value) => {
    sessionCache[key] = value;
};
