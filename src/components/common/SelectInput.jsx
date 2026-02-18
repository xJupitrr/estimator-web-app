import React from 'react';

/**
 * A standard select input with placeholder support and dynamic color contrast.
 */
const SelectInput = ({ value, onChange, options, placeholder = "Select Option...", className = "", focusColor = "blue" }) => {

    // Theme-based focus rings
    const focusColors = {
        blue: "focus:ring-2 focus:ring-blue-400 focus:border-blue-400",
        orange: "focus:ring-2 focus:ring-orange-400 focus:border-orange-400",
        amber: "focus:ring-2 focus:ring-amber-400 focus:border-amber-400",
        indigo: "focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400",
        purple: "focus:ring-2 focus:ring-purple-400 focus:border-purple-400",
        cyan: "focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400",
        emerald: "focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400",
        teal: "focus:ring-2 focus:ring-teal-400 focus:border-teal-400",
        zinc: "focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400",
    };

    const isPlaceholder = !value || value === "";

    return (
        <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`
                w-full p-2 border border-gray-300 rounded text-sm outline-none transition-all cursor-pointer font-medium bg-white
                ${isPlaceholder ? 'text-zinc-400 font-normal italic' : 'text-zinc-900'}
                ${focusColors[focusColor] || focusColors.blue}
                ${className}
            `}
        >
            <option value="" disabled hidden>{placeholder}</option>
            {options.map((opt, idx) => {
                // Support for OptGroups
                if (opt && typeof opt === 'object' && opt.group && opt.options) {
                    return (
                        <optgroup
                            key={`group-${idx}`}
                            label={opt.group}
                            className="bg-zinc-100 text-zinc-800 font-bold uppercase text-[11px] tracking-wider py-2"
                        >
                            {opt.options.map((subOpt, subIdx) => {
                                const val = typeof subOpt === 'object' ? (subOpt.id || subOpt.value || subOpt.name) : subOpt;
                                const label = typeof subOpt === 'object' ? (subOpt.display || subOpt.label || subOpt.name) : subOpt;
                                return (
                                    <option key={val || subIdx} value={val} className="text-zinc-900 font-medium not-italic">
                                        {label}
                                    </option>
                                );
                            })}
                        </optgroup>
                    );
                }

                // Handle standard option formats
                const val = typeof opt === 'object' ? (opt.id || opt.value || opt.name) : opt;
                const label = typeof opt === 'object' ? (opt.display || opt.label || opt.name) : opt;

                return (
                    <option key={val || idx} value={val} className="text-zinc-900 font-medium not-italic">
                        {label}
                    </option>
                );
            })}
        </select>
    );
};

export default SelectInput;
