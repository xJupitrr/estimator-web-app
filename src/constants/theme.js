export const THEME_COLORS = {
    masonry: 'indigo',
    column: 'violet',
    beam: 'blue',
    slab: 'orange',
    formworks: 'amber',
    painting: 'teal',
    truss: 'cyan'
};

export const CARD_STYLE = "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden";
export const INPUT_STYLE = "border border-slate-300 rounded text-sm outline-none focus:ring-2 transition-all";
export const BUTTON_PRIMARY_STYLE = "text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2";

export const getThemeClasses = (color) => ({
    bgLight: `bg-${color}-50`,
    bgMedium: `bg-${color}-100`,
    bgDark: `bg-${color}-600`,
    bgDarker: `bg-${color}-700`,
    textLight: `text-${color}-500`,
    textMedium: `text-${color}-700`,
    textDark: `text-${color}-900`,
    borderLight: `border-${color}-100`,
    borderMedium: `border-${color}-200`,
    ring: `focus:ring-${color}-400`,
    borderFocus: `focus:border-${color}-400`,
});
