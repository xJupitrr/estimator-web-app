import React from 'react';
import { getThemeClasses } from '../../constants/theme';

const SectionHeader = ({ title, icon: Icon, colorTheme = 'indigo', actions, children }) => {
    const theme = getThemeClasses(colorTheme);

    return (
        <div className={`p-4 ${theme.bgLight} border-b ${theme.borderMedium} flex flex-col sm:flex-row justify-between sm:items-center gap-4`}>
            <h2 className={`font-bold ${theme.textDark} flex items-center gap-2`}>
                {Icon && <Icon size={18} />} {title}
            </h2>
            <div className="flex gap-2">
                {actions}
                {children}
            </div>
        </div>
    );
};

export default React.memo(SectionHeader);
