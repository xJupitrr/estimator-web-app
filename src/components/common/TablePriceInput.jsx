import React from 'react';

const TablePriceInput = ({ value, onChange, colorTheme = 'indigo' }) => (
    <div className="flex items-center justify-end">
        <div className="bg-gray-100/50 px-2 py-1.5 text-gray-600 text-sm font-bold flex items-center border border-gray-300 rounded-l-lg border-r-0 h-full">
            ₱
        </div>
        <input
            type="number"
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
            className={`w-24 pl-2 pr-2 py-1.5 text-right text-sm border border-slate-300 rounded-r-lg bg-white outline-none text-gray-800 font-medium transition-colors border-l-0 focus:ring-2 focus:ring-${colorTheme}-400 focus:border-${colorTheme}-400`}
        />
    </div>
);

export default React.memo(TablePriceInput);
