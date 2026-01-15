import React, { useState } from 'react';
import { Layers, Info, Box, LayoutTemplate, Columns, PenTool, Grid3X3, Paintbrush } from 'lucide-react';
import SlabOnGrade from './components/calculators/SlabOnGrade';
import Masonry from './components/calculators/Masonry';
import Footing from './components/calculators/Footing';
import Column from './components/calculators/Column';
import Beam from './components/calculators/Beam';
import Tiles from './components/calculators/Tiles';
import Painting from './components/calculators/Painting'; // Added Painting Component

const TABS = [
    { id: 'masonry', label: 'Masonry', component: Masonry, icon: Box },
    { id: 'slab', label: 'Slab on Grade', component: SlabOnGrade, icon: Layers },
    { id: 'footing', label: 'RC Footing', component: Footing, icon: LayoutTemplate },
    { id: 'column', label: 'RC Column', component: Column, icon: Columns },
    { id: 'beam', label: 'RC Beam', component: Beam, icon: PenTool },
    { id: 'tiles', label: 'Tile Works', component: Tiles, icon: Grid3X3 },
    { id: 'painting', label: 'Painting', component: Painting, icon: Paintbrush }, // Added Painting Tab
];

export default function App() {
    const [activeTabId, setActiveTabId] = useState('slab');


    const activeTabLabel = TABS.find(tab => tab.id === activeTabId)?.label;

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
            {/* Header */}
            <header className="bg-slate-900 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
                <div className="container mx-auto max-w-7xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Layers size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight leading-none">Limelight Design</h1>
                            <p className="text-blue-400 text-[10px] font-bold tracking-widest uppercase">
                                Construction Cost Estimator
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><Info size={14} /> Professional Estimator</span>
                        <span className="h-4 w-px bg-slate-700"></span>
                        <span>V1.0</span>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 container mx-auto max-w-7xl p-6 gap-6 relative">

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    {TABS.map((tab) => {
                        const Component = tab.component;
                        return (
                            <div key={tab.id} className={activeTabId === tab.id ? 'block' : 'hidden'}>
                                <Component />
                            </div>
                        );
                    })}
                </main>

                {/* Right Sidebar Tabs */}
                <aside className="w-64 flex-shrink-0 hidden md:block">
                    <div className="sticky top-24 space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Components</h3>
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTabId === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTabId(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 border ${isActive
                                        ? 'bg-white border-blue-500 text-blue-700 shadow-md translate-x-1'
                                        : 'bg-transparent border-transparent text-slate-500 hover:bg-white hover:border-slate-200 hover:shadow-sm'
                                        }`}
                                >
                                    <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                        <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-500'} />
                                    </div>
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </aside>

                {/* Mobile Tab Navigation (Bottom Fixed for small screens, optional but good practice) */}
                {/* For now, sticking to the user request 'right side', assuming desktop context, but a mobile fallback is nice. 
            I'll just leave the right sidebar for now as requested. */}
            </div>
        </div>
    );
}
