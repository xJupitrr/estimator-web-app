import React, { useMemo, useState, useEffect } from 'react';
import { X, CheckSquare, Save, AlertCircle, FileText, Database, ArrowRight, Edit3 } from 'lucide-react';

export default function SessionExportModal({ isOpen, onClose, onConfirm, summaryData, fileName }) {
    const [editFileName, setEditFileName] = useState("");

    useEffect(() => {
        if (isOpen) {
            setEditFileName(fileName || "");
        }
    }, [isOpen, fileName]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl flex flex-col max-h-[90vh] border border-zinc-200 relative overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Decorative Tech Lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-emerald-600"></div>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 text-white rounded-sm shadow-sm md:shadow-md shadow-emerald-200">
                            <Save size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-zinc-900 uppercase tracking-wide leading-none">Export Session</h3>
                                <span className="hidden sm:inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-sm border border-emerald-200">
                                    Review Mode
                                </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                <span className="text-xs text-zinc-400 font-mono uppercase tracking-widest whitespace-nowrap">FILE NAME:</span>
                                <div className="relative flex items-center group/input">
                                    <input
                                        type="text"
                                        value={editFileName}
                                        onChange={(e) => setEditFileName(e.target.value)}
                                        className="text-sm font-mono text-zinc-800 bg-white border border-dashed border-zinc-300 rounded px-3 py-1.5 min-w-[400px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    />
                                    <Edit3 size={14} className="absolute right-3 text-zinc-400 group-hover/input:text-emerald-500 pointer-events-none transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="group p-2 hover:bg-zinc-100 text-zinc-400 hover:text-red-500 transition-colors rounded-sm ml-4 self-start"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Content Area with technical grid bg */}
                <div className="p-6 flex-1 overflow-y-auto bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px]">

                    {/* Operation Summary / Warning */}
                    <div className="mb-6 p-4 bg-white border border-l-4 border-l-emerald-500 border-y-zinc-200 border-r-zinc-200 shadow-sm rounded-sm">
                        <div className="flex items-start gap-3">
                            <div className="text-emerald-500 mt-0.5">
                                <AlertCircle size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">Export Overview</h4>
                                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                                    The following modules contain active data and will be included in the session export file.
                                    <br />
                                    <span className="font-mono text-[10px] text-zinc-400 opacity-75">
                                        &gt; NOTE: Empty calculators are automatically omitted to minimize file size.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-4 px-1">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                            Modules to Export ({summaryData.length})
                        </span>
                    </div>

                    {/* Module Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {summaryData.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-sm text-zinc-500 italic border border-dashed border-zinc-300 rounded-sm">
                                No active data found to export.
                            </div>
                        ) : (
                            summaryData.map((section) => (
                                <div
                                    key={section.key}
                                    className="group relative p-4 border bg-emerald-50/50 border-emerald-500 shadow-sm rounded-sm transition-all duration-200"
                                >
                                    {/* Selection Indicator */}
                                    <div className="absolute top-3 right-3 text-emerald-600">
                                        <CheckSquare size={18} />
                                    </div>

                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-1.5 rounded-sm transition-colors bg-emerald-200/50 text-emerald-700">
                                            {section.key === 'SETTINGS' ? <FileText size={16} /> : <Database size={16} />}
                                        </div>
                                        <span className="text-[9px] font-mono text-zinc-400">{section.code || 'MOD-XX'}</span>
                                    </div>

                                    <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-900">
                                        {section.label}
                                    </h4>
                                    <p className="text-[10px] font-mono text-zinc-400 mt-1 uppercase">
                                        DATA: {section.count}
                                    </p>

                                    {/* Active Corner Marker */}
                                    <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[8px] border-r-[8px] border-b-transparent border-r-emerald-500"></div>
                                </div>
                            ))
                        )}
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
                        onClick={() => onConfirm(editFileName)}
                        disabled={summaryData.length === 0}
                        className={`
                            group relative overflow-hidden px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-all shadow-lg
                            ${summaryData.length === 0
                                ? 'bg-zinc-100 text-zinc-300 border border-zinc-200 cursor-not-allowed shadow-none'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                            }
                        `}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Download File <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
