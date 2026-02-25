import React from 'react';
import { BUTTON_PRIMARY_STYLE } from '../../constants/theme';

const ActionButton = ({ onClick, icon: Icon, label, colorTheme = 'indigo', className = "", disabled = false, title = "", variant = "default" }) => {

    let variantStyles = "";
    if (variant === "calculate") {
        variantStyles = "w-full sm:w-auto px-10 py-4 text-lg uppercase tracking-wider font-bold rounded-lg shadow-md hover:shadow-lg";
    } else if (variant === "addRow") {
        variantStyles = "px-4 py-2 text-sm uppercase tracking-wide font-bold rounded-lg shadow-sm";
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`${BUTTON_PRIMARY_STYLE} bg-${colorTheme}-600 hover:bg-${colorTheme}-700 ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 transition-all'} ${variantStyles} text-white ${className}`}
        >
            {Icon && <Icon size={variant === 'calculate' ? 18 : 16} className="mr-1 inline-block" />}
            {label}
        </button>
    );
};

export default React.memo(ActionButton);
