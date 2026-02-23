/**
 * Unified Design System for the Estimator Web App
 * Centralizes all UI styles, colors, and component definitions.
 */

// --- COLOR PALETTE ---
export const COLORS = {
    primary: 'indigo',
    secondary: 'slate',
    success: 'emerald',
    danger: 'red',
    warning: 'amber',
    info: 'blue',
    white: 'white',
    bgLight: 'gray-50',
};

// --- TYPOGRAPHY ---
export const FONTS = {
    header: 'font-bold text-gray-800',
    subheader: 'font-semibold text-gray-700',
    label: 'text-xs font-bold uppercase tracking-wide text-gray-500',
    body: 'text-sm text-gray-800',
    small: 'text-xs text-gray-500',
};

// --- TABLE UI STYLES ---
export const TABLE_UI = {
    CONTAINER: 'overflow-hidden rounded-lg border border-gray-200 mb-2 shadow-sm',
    TABLE: 'w-full text-sm text-left border-collapse',
    HEADER_ROW: 'bg-gray-100 border-b border-gray-200',
    HEADER_CELL: 'px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center',
    HEADER_CELL_LEFT: 'px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left',
    HEADER_CELL_RIGHT: 'px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right',
    BODY_ROW: 'border-b border-gray-50 hover:bg-gray-50/50 transition-colors',
    BODY_ROW_HOVER: 'hover:bg-indigo-50/30 transition-colors',
    CELL: 'px-4 py-3 text-gray-700 border-r border-gray-100 last:border-r-0',
    CELL_CENTER: 'px-4 py-3 text-gray-700 text-center border-r border-gray-100 last:border-r-0',
    CELL_RIGHT: 'px-4 py-3 text-gray-700 text-right border-r border-gray-100 last:border-r-0',
    // Specific for input tables (like Wall Config)
    INPUT_TABLE: 'w-full text-sm text-left border-collapse border border-slate-200 rounded-lg',
    INPUT_HEADER: 'px-2 py-2 font-bold border border-slate-300 text-center bg-slate-100 text-slate-700 text-xs uppercase',
    INPUT_CELL: 'p-2 border border-slate-300 align-middle',
    INPUT_ROW: 'bg-white hover:bg-slate-50 transition-colors',
};

// --- CARD UI STYLES ---
export const CARD_UI = {
    CONTAINER: 'bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden',
    HEADER: 'px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white',
    TITLE: 'text-lg font-bold text-slate-800 flex items-center gap-2',
    BODY: 'p-6',
    FOOTER: 'px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3',
};

// --- INPUT FIELD STYLES ---
export const INPUT_UI = {
    STANDARD: 'w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all',
    TABLE_INPUT: 'w-full p-1.5 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium bg-white text-slate-900',
    Select: 'w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer',
};

// --- BUTTON STYLES ---
export const BUTTON_UI = {
    PRIMARY: 'px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
    SECONDARY: 'px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-sm active:scale-95 disabled:opacity-50',
    DANGER: 'px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-semibold hover:bg-red-100 transition-colors active:scale-95',
    ICON: 'p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors',
};

// --- LEGACY THEME SUPPORT ---
export const THEME_COLORS = {
    masonry: 'orange',
    slab: 'green',
    suspended_slab: 'blue',
    footing: 'emerald',
    roofing: 'amber',
    column: 'indigo',
    beam: 'violet',
    lintel: 'violet',
    stairs: 'teal',
    tanks: 'blue',
    concrete_wall: 'blue',
    steel_truss: 'blue',
    tiles: 'fuchsia',
    painting: 'rose',
    ceiling: 'sky',
    electrical: 'yellow',
    plumbing: 'cyan',
    doors: 'orange',
    formworks: 'stone'
};

/**
 * Generates Tailwind classes for a given color theme.
 * Moved from theme.js to maintain a single source of styling truth.
 */
export const getThemeClasses = (color) => {
    return {
        bgLight: `bg-${color}-100`,
        bgMedium: `bg-${color}-200`,
        bgDark: `bg-${color}-700`,
        textLight: `text-${color}-50`,
        textDark: `text-${color}-800`,
        borderLight: `border-${color}-200`,
        borderMedium: `border-${color}-300`,
        borderDark: `border-${color}-600`,
        ring: `ring-${color}-500`,
    };
};
