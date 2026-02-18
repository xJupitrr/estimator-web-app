import React from 'react';
import { CARD_STYLE } from '../../constants/theme';

const Card = ({ children, className = "" }) => (
    <div className={`${CARD_STYLE} ${className}`}>
        {children}
    </div>
);

export default React.memo(Card);
