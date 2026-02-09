import React, { useState, useMemo, useEffect } from 'react';
import { X, CheckSquare, Square, Download, AlertCircle, FileText, Database, ArrowRight } from 'lucide-react';

export default function SessionImportModal({ isOpen, onClose, onConfirm, parsedData, fileName }) {
    const [selectedKeys, setSelectedKeys] = useState([]);

    // Extract available sections from parsed Data
    const availableSections = useMemo(() => {
        if (!parsedData) return [];
        const sections = [];

        // Always offer Settings if available
        if (Object.keys(parsedData.settings || {}).length > 0) {
            sections.push({
                key: 'SETTINGS',
                label: 'Global Configurations',
                code: 'CONF-00',
                count: Object.keys(parsedData.settings).length + ' params',
                required: false
            });
        }

        // List Sections
        Object.entries(parsedData.sections || {}).forEach(([key, data]) => {
            // Generate a fake technical code for aesthetic
            const code = key.substring(0, 3) + '-' + (Math.floor(Math.random() * 90) + 10);
            sections.push({
                key: key,
                label: key.replace(' DATA', '').replace(/_/g, ' '),
                code: code,
                count: (Array.isArray(data) ? data.length : 0) + ' items'
            });
        });

        return sections;
    }, [parsedData]);

    // Auto-select all on open
    useEffect(() => {
        if (isOpen && availableSections.length > 0) {
            setSelectedKeys(availableSections.map(s => s.key));
        }
    }, [isOpen, availableSections]);

    const toggleSelection = (key) => {
        setSelectedKeys(prev => {
            if (prev.includes(key)) {
                return prev.filter(k => k !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const toggleAll = () => {
        if (selectedKeys.length === availableSections.length) {
            setSelectedKeys([]);
        } else {
            setSelectedKeys(availableSections.map(s => s.key));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl flex flex-col max-h-[90vh] border border-zinc-200 relative overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Decorative Tech Lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-blue-600"></div>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-sm shadow-sm md:shadow-md shadow-blue-200">
                            <Database size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-zinc-900 uppercase tracking-wide leading-none">Import Session</h3>
                                <span className="hidden sm:inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-sm border border-blue-200">
                                    Review Mode
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 font-mono mt-1 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                SRC: {fileName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="group p-2 hover:bg-zinc-100 text-zinc-400 hover:text-red-500 transition-colors rounded-sm"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Content Area with technical grid bg */}
                <div className="p-6 flex-1 overflow-y-auto bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px]">

                    {/* Operation Summary / Warning */}
                    <div className="mb-6 p-4 bg-white border border-l-4 border-l-blue-500 border-y-zinc-200 border-r-zinc-200 shadow-sm rounded-sm">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-500 mt-0.5">
                                <AlertCircle size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">Merge Strategy: Selective Overwrite</h4>
                                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                                    Selected modules will replace current session data. Unselected modules will remain untouched.
                                    <br />
                                    <span className="font-mono text-[10px] text-zinc-400 opacity-75">
                                        &gt; CAUTION: This operation cannot be undone via standard undo stack.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-4 px-1">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                            Available Modules ({availableSections.length})
                        </span>
                        <div className="flex gap-4">
                            <button
                                onClick={toggleAll}
                                className="text-[10px] font-bold text-zinc-500 hover:text-blue-600 uppercase tracking-wider hover:underline transition-colors"
                            >
                                {selectedKeys.length === availableSections.length ? '- Deselect All' : '+ Select All'}
                            </button>
                        </div>
                    </div>

                    {/* Module Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableSections.map((section) => {
                            const isSelected = selectedKeys.includes(section.key);
                            return (
                                <div
                                    key={section.key}
                                    onClick={() => toggleSelection(section.key)}
                                    className={`
                                        group relative p-4 border cursor-pointer transition-all duration-200 rounded-sm
                                        ${isSelected
                                            ? 'bg-blue-50/50 border-blue-500 shadow-sm'
                                            : 'bg-white border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50'
                                        }
                                    `}
                                >
                                    {/* Selection Indicator */}
                                    <div className={`absolute top-3 right-3 transition-colors ${isSelected ? 'text-blue-600' : 'text-zinc-200 group-hover:text-zinc-300'}`}>
                                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </div>

                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`
                                            p-1.5 rounded-sm transition-colors
                                            ${isSelected ? 'bg-blue-200/50 text-blue-700' : 'bg-zinc-100 text-zinc-400'}
                                        `}>
                                            {section.key === 'SETTINGS' ? <FileText size={16} /> : <Database size={16} />}
                                        </div>
                                        <span className="text-[9px] font-mono text-zinc-400">{section.code || 'MOD-XX'}</span>
                                    </div>

                                    <h4 className={`text-xs font-bold uppercase tracking-wide ${isSelected ? 'text-zinc-900' : 'text-zinc-500 group-hover:text-zinc-700'}`}>
                                        {section.label}
                                    </h4>
                                    <p className="text-[10px] font-mono text-zinc-400 mt-1 uppercase">
                                        DATA: {section.count}
                                    </p>

                                    {/* Active Corner Marker */}
                                    {isSelected && (
                                        <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[8px] border-r-[8px] border-b-transparent border-r-blue-500"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="p-5 border-t border-zinc-200 bg-white flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 rounded-sm text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(selectedKeys)}
                        disabled={selectedKeys.length === 0}
                        className={`
                            group relative overflow-hidden px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-all shadow-lg
                            ${selectedKeys.length === 0
                                ? 'bg-zinc-100 text-zinc-300 border border-zinc-200 cursor-not-allowed shadow-none'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                            }
                        `}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Confirm Import <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
