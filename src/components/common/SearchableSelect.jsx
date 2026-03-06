import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X } from 'lucide-react';

/**
 * A searchable dropdown component that supports grouped and flat options.
 * Uses React Portals to render outside the parent container to avoid clipping.
 */
const SearchableSelect = ({
    value,
    onChange,
    options,
    placeholder = "Select Option...",
    className = "",
    focusColor = "blue",
    disabled = false,
    searchable = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Theme-based focus rings and colors
    const themes = {
        blue: "ring-blue-400 border-blue-400 text-blue-600 bg-blue-50 circle-bg-blue-500",
        orange: "ring-orange-400 border-orange-400 text-orange-600 bg-orange-50 circle-bg-orange-500",
        amber: "ring-amber-400 border-amber-400 text-amber-600 bg-amber-50 circle-bg-amber-500",
        indigo: "ring-indigo-400 border-indigo-400 text-indigo-600 bg-indigo-50 circle-bg-indigo-500",
        purple: "ring-purple-400 border-purple-400 text-purple-600 bg-purple-50 circle-bg-purple-500",
        emerald: "ring-emerald-400 border-emerald-400 text-emerald-600 bg-emerald-50 circle-bg-emerald-500",
    };

    const currentTheme = themes[focusColor] || themes.blue;
    const selectedCircleColor = currentTheme.split(' ').find(c => c.startsWith('circle-bg-')).replace('circle-bg-', 'bg-');

    // Flatten and filter options based on search term
    const filteredOptions = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();

        return options.map(opt => {
            if (opt.group && opt.options) {
                const subOptions = opt.options.filter(sub => {
                    const label = (sub.label || sub.display || sub.name || "").toString().toLowerCase();
                    return label.includes(lowerSearch);
                });
                return subOptions.length > 0 ? { ...opt, options: subOptions } : null;
            }
            const label = (opt.label || opt.display || opt.name || "").toString().toLowerCase();
            return label.includes(lowerSearch) ? opt : null;
        }).filter(Boolean);
    }, [options, searchTerm]);

    // Find current selected label
    const selectedLabel = useMemo(() => {
        if (!value) return "";
        for (const opt of options) {
            if (opt.group && opt.options) {
                const found = opt.options.find(sub => (sub.id || sub.value || sub.name) === value);
                if (found) return found.label || found.display || found.name;
            } else if ((opt.id || opt.value || opt.name) === value) {
                return opt.label || opt.display || opt.name;
            }
        }
        return value;
    }, [value, options]);

    // Update position and visibility
    const toggleDropdown = () => {
        if (disabled) return;

        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 350; // Max expected height

            // Determine if it should open upwards
            const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

            setDropdownStyle({
                position: 'fixed',
                top: openUp ? 'auto' : `${rect.bottom + 4}px`,
                bottom: openUp ? `${window.innerHeight - rect.top + 4}px` : 'auto',
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                zIndex: 9999,
            });
        }
        setIsOpen(!isOpen);
    };

    // Handle clicks outside, scroll and resize to close dropdown
    useEffect(() => {
        const handleInteractionOutside = (event) => {
            if (isOpen && containerRef.current && !containerRef.current.contains(event.target)) {
                // Check if the click is inside the portal-rendered list
                const portalList = document.querySelector('.searchable-portal-list');
                if (portalList && !portalList.contains(event.target)) {
                    setIsOpen(false);
                }
            }
        };

        const handleScrollOrResize = (event) => {
            if (isOpen) {
                // If scrolling within the results list, do nothing
                const portalList = document.querySelector('.searchable-portal-list');
                if (portalList && portalList.contains(event.target)) {
                    return;
                }
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleInteractionOutside);
            window.addEventListener('scroll', handleScrollOrResize, true);
            window.addEventListener('resize', handleScrollOrResize);
        }

        return () => {
            document.removeEventListener('mousedown', handleInteractionOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen]);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm("");
    };

    const renderDropdown = () => {
        if (!isOpen) return null;

        return createPortal(
            <div
                className="searchable-portal-list bg-white border border-gray-200 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                style={dropdownStyle}
            >
                {searchable && (
                    <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search items..."
                            className="w-full bg-transparent border-none outline-none text-sm p-1 placeholder:italic"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="text-gray-400 hover:text-gray-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                )}

                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {filteredOptions.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-400 italic">No matches found</div>
                    ) : (
                        filteredOptions.map((opt, idx) => {
                            if (opt.group) {
                                return (
                                    <div key={`group-${idx}`}>
                                        <div className="px-3 py-1.5 bg-gray-50 text-[10px] uppercase font-bold tracking-wider text-gray-500 border-y border-gray-100/50">
                                            {opt.group}
                                        </div>
                                        {opt.options.map((sub, sIdx) => {
                                            const val = sub.id || sub.value || sub.name;
                                            const isSelected = val === value;
                                            return (
                                                <div
                                                    key={`${val}-${sIdx}`}
                                                    onClick={() => handleSelect(val)}
                                                    className={`
                                                        px-4 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between
                                                        ${isSelected
                                                            ? currentTheme.split(' ').slice(0, 3).join(' ')
                                                            : 'text-gray-700 hover:bg-gray-50'}
                                                    `}
                                                >
                                                    <span>{sub.label || sub.display || sub.name}</span>
                                                    {isSelected && <div className={`w-1.5 h-1.5 rounded-full ${selectedCircleColor}`} />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            }
                            const val = opt.id || opt.value || opt.name;
                            const isSelected = val === value;
                            return (
                                <div
                                    key={`${val}-${idx}`}
                                    onClick={() => handleSelect(val)}
                                    className={`
                                        px-4 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between
                                        ${isSelected
                                            ? currentTheme.split(' ').slice(0, 3).join(' ')
                                            : 'text-gray-700 hover:bg-gray-50'}
                                    `}
                                >
                                    <span>{opt.label || opt.display || opt.name}</span>
                                    {isSelected && <div className={`w-1.5 h-1.5 rounded-full ${selectedCircleColor}`} />}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            <div
                onClick={toggleDropdown}
                className={`
                    w-full p-2 border rounded text-sm transition-all flex items-center justify-between cursor-pointer font-medium
                    ${disabled
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed italic'
                        : 'bg-white border-gray-300 hover:border-gray-400'}
                    ${isOpen ? `ring-2 ${currentTheme.split(' ').slice(0, 2).join(' ')}` : ''}
                    ${!value ? 'text-zinc-400 font-normal italic' : 'text-zinc-900'}
                `}
            >
                <span className="truncate">{selectedLabel || placeholder}</span>
                <ChevronDown size={16} className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {renderDropdown()}
        </div>
    );
};

export default SearchableSelect;
