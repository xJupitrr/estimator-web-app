// This file is now a compatibility layer over designSystem.js
// Ideally, import directly from designSystem.js in future refactors.

import { CARD_UI, getThemeClasses as getThemeClassesFromDS, THEME_COLORS as THEME_COLORS_DS } from './designSystem';

export const THEME_COLORS = THEME_COLORS_DS;
export const CARD_STYLE = CARD_UI.CONTAINER;
export const BUTTON_PRIMARY_STYLE = 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-white font-bold text-xs transition-all shadow-sm active:scale-95';
export const getThemeClasses = getThemeClassesFromDS;
