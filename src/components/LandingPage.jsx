import React, { useState } from 'react';
import {
    Layers, Box, SquareStack, LayoutTemplate, Columns, PenTool,
    Tent, Hammer, Grid3X3, Paintbrush, Cloud, DoorOpen,
    ArrowRight, Star, Zap, Shield, ChevronRight, Upload, Plus, X,
    LayoutGrid, Brush, HardHat, Terminal, Cpu, Database
} from 'lucide-react';

export default function LandingPage({ tabs, onNavigate, onLoadSession }) {
    const [activeCategory, setActiveCategory] = useState(null);

    const categories = [
        {
            title: "Structure",
            id: "structure",
            code: "STR-01",
            description: "Foundations & Frame",
            color: "blue",
            icon: LayoutGrid,
            tools: ['footing', 'column', 'beam', 'slab', 'suspended-slab', 'lintel-beam', 'roofing']
        },
        {
            title: "Finishes",
            id: "finishes",
            code: "FIN-02",
            description: "Interior & Exterior",
            color: "emerald",
            icon: Brush,
            tools: ['masonry', 'doors-windows', 'ceiling', 'tiles', 'painting']
        },
        {
            title: "Auxiliary",
            id: "auxiliary",
            code: "AUX-03",
            description: "Site Works & Support",
            color: "amber",
            icon: HardHat,
            tools: ['formworks']
        }
    ];

    const getToolById = (id) => tabs.find(t => t.id === id);
    const activeCategoryData = categories.find(c => c.id === activeCategory);

    return (
        <div className="min-h-full bg-zinc-50 text-zinc-900 font-sans tracking-tight overflow-hidden relative selection:bg-blue-100">

            {/* Technical Grid Background - Subtle for Light Mode */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0)_20%,rgba(250,250,250,1)_100%)]"></div>
            </div>

            {/* Corner Decorative Elements */}
            <div className="absolute top-6 left-6 w-4 h-4 border-l border-t border-zinc-300"></div>
            <div className="absolute top-6 right-6 w-4 h-4 border-r border-t border-zinc-300"></div>
            <div className="absolute bottom-6 left-6 w-4 h-4 border-l border-b border-zinc-300"></div>
            <div className="absolute bottom-6 right-6 w-4 h-4 border-r border-b border-zinc-300"></div>

            {/* Coordinates / Data Decorations */}
            <div className="absolute top-8 left-12 text-[9px] font-mono text-zinc-400 tracking-widest hidden md:block uppercase">
                SYS.RDY // {new Date().toLocaleDateString().toUpperCase()}
            </div>
            <div className="absolute bottom-8 right-12 text-[9px] font-mono text-zinc-400 tracking-widest hidden md:block uppercase">
                COORDS: 34.0522° N, 118.2437° W
            </div>

            {/* Main Content Area */}
            <div className="h-screen flex flex-col justify-center items-center relative z-10 px-6">

                {/* Brand Identity */}
                <div className="text-center mb-16 relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-blue-200 bg-white rounded-sm mb-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-blue-600 font-mono font-bold">System Online</span>
                    </div>

                    <h1 className="text-7xl sm:text-9xl md:text-[10rem] font-normal text-zinc-900 mb-2 tracking-[0.05em] leading-none select-none uppercase whitespace-nowrap overflow-hidden" style={{ fontFamily: "'Anton', sans-serif" }}>
                        Limelight
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-zinc-300">
                        <div className="h-px w-12 bg-zinc-200"></div>
                        <p className="text-sm md:text-base font-mono tracking-[0.15em] uppercase text-zinc-500">
                            Advanced Construction Suite
                        </p>
                        <div className="h-px w-12 bg-zinc-200"></div>
                    </div>
                </div>

                {/* Primary Actions Command Center */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-24 w-full max-w-md">
                    <button
                        onClick={() => setActiveCategory('structure')}
                        className="group w-full relative overflow-hidden bg-blue-600 text-white px-8 py-4 rounded-sm font-bold text-sm tracking-widest uppercase transition-all hover:bg-blue-700 shadow-lg shadow-blue-200"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <Plus size={16} /> Initialize Project
                        </span>
                    </button>

                    <button
                        onClick={onLoadSession}
                        className="group w-full relative overflow-hidden bg-white border border-zinc-200 text-zinc-600 px-8 py-4 rounded-sm font-bold text-sm tracking-widest uppercase transition-all hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-400"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <Upload size={16} /> Load Database
                        </span>
                    </button>
                </div>

                {/* Industrial Dock / Module Selector */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2 mb-4">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">System Modules</span>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-zinc-300"></div>
                            <div className="w-1 h-1 bg-zinc-300"></div>
                            <div className="w-1 h-1 bg-zinc-300"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            const isActive = activeCategory === category.id;

                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                                    className={`
                                        group relative flex flex-col items-start p-4 border transition-all duration-300
                                        ${isActive
                                            ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-md'
                                            : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:bg-zinc-50'
                                        }
                                        rounded-sm
                                    `}
                                >
                                    <div className="flex items-center justify-between w-full mb-2">
                                        <Icon size={20} strokeWidth={1.5} />
                                        <span className="text-[9px] font-mono opacity-50">{category.code}</span>
                                    </div>
                                    <span className={`font-bold uppercase tracking-wider text-xs ${isActive ? 'text-blue-700' : 'text-zinc-600'}`}>{category.title}</span>

                                    {/* Active Indicator Corner */}
                                    {isActive && (
                                        <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-r-[8px] border-t-transparent border-r-blue-500"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Technical Modal Overlay */}
            {activeCategory && activeCategoryData && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setActiveCategory(null)}
                >
                    <div
                        className="bg-white w-full max-w-5xl rounded-sm border border-zinc-200 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 relative overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Decorative Modal Lines */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-blue-600"></div>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 bg-zinc-50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 text-white rounded-sm shadow-md shadow-blue-200">
                                    <activeCategoryData.icon size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-bold text-zinc-900 uppercase tracking-wide">{activeCategoryData.title}</h2>
                                        <span className="text-xs font-mono text-white bg-zinc-800 px-2 py-0.5 rounded-sm">{activeCategoryData.code}</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 font-mono mt-1 uppercase tracking-wider">{activeCategoryData.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveCategory(null)}
                                className="p-2 hover:bg-white text-zinc-400 hover:text-zinc-900 transition-colors border border-transparent hover:border-zinc-200 rounded-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content - Technical Grid */}
                        <div className="p-8 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px] max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeCategoryData.tools.map(toolId => {
                                    const tool = getToolById(toolId);
                                    if (!tool) return null;
                                    const Icon = tool.icon;

                                    return (
                                        <button
                                            key={tool.id}
                                            onClick={() => onNavigate(tool.id)}
                                            className="group flex flex-col p-5 bg-white border border-zinc-200 hover:border-blue-500/50 hover:bg-zinc-50 transition-all duration-300 text-left relative overflow-hidden rounded-sm"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="text-zinc-400 group-hover:text-blue-600 transition-colors">
                                                    <Icon size={24} strokeWidth={1.5} />
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
                                                    <ArrowRight size={16} className="text-blue-500" />
                                                </div>
                                            </div>

                                            <h3 className="font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors text-sm uppercase tracking-wide mb-1">
                                                {tool.label}
                                            </h3>
                                            <span className="text-[9px] text-zinc-400 font-mono group-hover:text-zinc-500">
                                                MOD.ID: {tool.id.toUpperCase().substring(0, 3)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
