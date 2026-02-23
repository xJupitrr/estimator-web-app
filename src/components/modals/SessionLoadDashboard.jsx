import React from 'react';
import { X, FolderOpen, AlertCircle, HardDrive, UploadCloud, Clock, DollarSign } from 'lucide-react';

export default function SessionLoadDashboard({ isOpen, onClose, onBrowseFiles, projectName, lastSaveInfo, projectTotal }) {
    if (!isOpen) return null;

    const formattedTotal = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
    }).format(projectTotal || 0);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl flex flex-col max-h-[90vh] border border-zinc-200 relative overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Decorative Tech Lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-blue-600"></div>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-sm shadow-sm md:shadow-md shadow-blue-200">
                            <FolderOpen size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-zinc-900 uppercase tracking-wide leading-none">Load Session</h3>
                            </div>
                            <p className="text-xs text-zinc-400 font-mono mt-1 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 animate-pulse rounded-full"></span>
                                ACTIVE CACHE READY
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

                {/* Content Area */}
                <div className="p-6 flex-1 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px]">

                    {/* Current Session Panel */}
                    <div className="mb-6">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-3 block">
                            Currently Active Session
                        </span>
                        <div
                            onClick={onClose}
                            className="relative p-5 border bg-white border-zinc-200 shadow-sm rounded-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group overflow-hidden"
                        >
                            {/* Hover highlight line */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="absolute top-4 right-4 text-emerald-500 group-hover:hidden">
                                <AlertCircle size={20} className="rotate-180" />
                            </div>
                            <div className="absolute top-4 right-4 text-blue-500 hidden group-hover:block">
                                <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1">Resume <X size={14} className="rotate-45" /></span>
                            </div>

                            <h4 className="text-lg font-bold text-zinc-900 truncate pr-20 group-hover:text-blue-700 transition-colors">
                                {projectName || 'Untitled Project'}
                            </h4>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Clock size={12} /> Last Saved
                                    </span>
                                    <span className="text-sm font-semibold text-zinc-700">
                                        {lastSaveInfo?.date ? `${lastSaveInfo.date} (v${lastSaveInfo.count})` : 'Unsaved Session'}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <DollarSign size={12} /> Projected Cost
                                    </span>
                                    <span className="text-sm font-semibold text-zinc-700">
                                        {formattedTotal}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10.5px] text-zinc-500 mt-2 leading-relaxed ml-1">
                            Loading a new file will initiate a selective merge. You will be able to choose which tabs are replaced.
                        </p>
                    </div>

                    {/* Import Trigger */}
                    <div>
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-3 block">
                            External Repository
                        </span>
                        <button
                            onClick={() => {
                                onClose();
                                onBrowseFiles();
                            }}
                            className="group relative overflow-hidden w-full p-6 border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-500 transition-all rounded-sm flex flex-col items-center justify-center gap-3"
                        >
                            <div className="p-3 bg-white rounded-full shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                                <UploadCloud size={24} />
                            </div>
                            <div className="text-center">
                                <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Browse CSV Files</h4>
                                <p className="text-[11px] text-zinc-500 mt-1 font-mono">Import .csv previously generated by Estimator</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
