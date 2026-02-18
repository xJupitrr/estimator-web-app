import React from 'react';
import { BUTTON_PRIMARY_STYLE } from '../../constants/theme';

const ActionButton = ({ onClick, icon: Icon, label, colorTheme = 'indigo', className = "", disabled = false, title = "" }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`${BUTTON_PRIMARY_STYLE} bg-${colorTheme}-600 hover:bg-${colorTheme}-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
        {Icon && <Icon size={14} />} {label}
    </button>
);

export default React.memo(ActionButton);
