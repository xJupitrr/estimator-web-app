import React from 'react';
import { CARD_STYLE } from '../../constants/theme';

const Card = ({ children, className = "", style = {} }) => (
    <div className={`${CARD_STYLE} ${className}`} style={style}>
        {children}
    </div>
);

export default React.memo(Card);
