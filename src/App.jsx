import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from './contexts/HistoryContext';
import useLocalStorage from './hooks/useLocalStorage';
import { Layers, Info, Box, LayoutTemplate, Columns, PenTool, Grid3X3, Paintbrush, Cloud, Hammer, SquareStack, Tent, Save, Upload, DoorOpen, Home } from 'lucide-react';
import LandingPage from './components/LandingPage';
import SlabOnGrade from './components/calculators/SlabOnGrade';
import Masonry from './components/calculators/Masonry';
import Footing from './components/calculators/Footing';
import Column from './components/calculators/Column';
import Beam from './components/calculators/Beam';
import Tiles from './components/calculators/Tiles';
import Painting from './components/calculators/Painting';
import Ceiling from './components/calculators/Ceiling';
import Roofing from './components/calculators/Roofing';
import Formworks from './components/calculators/Formworks';
import SuspendedSlab from './components/calculators/SuspendedSlab';
import DoorsWindows from './components/calculators/DoorsWindows';
import LintelBeam from './components/calculators/LintelBeam';
import { exportProjectToCSV, importProjectFromCSV } from './utils/sessionManager';

const TABS = [
    { id: 'masonry', label: 'Masonry', component: Masonry, icon: Box },
    { id: 'slab', label: 'Slab on Grade', component: SlabOnGrade, icon: Layers },
    { id: 'suspended-slab', label: 'Suspended Slab', component: SuspendedSlab, icon: SquareStack },
    { id: 'footing', label: 'RC Footing', component: Footing, icon: LayoutTemplate },
    { id: 'column', label: 'RC Column', component: Column, icon: Columns },
    { id: 'beam', label: 'RC Beam', component: Beam, icon: PenTool },
    { id: 'roofing', label: 'Roofing', component: Roofing, icon: Tent },
    { id: 'formworks', label: 'Formworks', component: Formworks, icon: Hammer },
    { id: 'tiles', label: 'Tile Works', component: Tiles, icon: Grid3X3 },
    { id: 'painting', label: 'Painting', component: Painting, icon: Paintbrush },
    { id: 'ceiling', label: 'Ceiling Works', component: Ceiling, icon: Cloud },
    { id: 'doors-windows', label: 'Doors & Windows', component: DoorsWindows, icon: DoorOpen },
    { id: 'lintel-beam', label: 'Lintel Beams', component: LintelBeam, icon: PenTool },
];

const getInitialColumn = () => ({
    id: Date.now() + Math.random(),
    quantity: 1,
    length_m: "",
    width_m: "",
    height_m: "",
    main_bar_sku: '16_9.0',
    main_bar_count: "",
    tie_bar_sku: '10_6.0',
    tie_spacing_mm: "",
});

const getInitialBeam = () => ({
    id: crypto.randomUUID(),
    quantity: 1,
    length_m: "",
    width_m: "",
    height_m: "",
    main_bar_sku: '16_9.0',
    main_bar_count: "",
    tie_bar_sku: '10_6.0',
    tie_spacing_mm: "",
    cut_support_sku: '12_6.0',
    cut_support_count: "",
    cut_midspan_sku: '12_6.0',
    cut_midspan_count: "",
});


export default function App() {
    const { undo, redo } = useHistory();
    const [activeTabId, setActiveTabId] = useState(() => {
        return localStorage.getItem('last_active_tab') || 'home';
    });

    useEffect(() => {
        // Clear the redirect flag after it's been consumed by state initialization
        const saved = localStorage.getItem('last_active_tab');
        if (saved) {
            localStorage.removeItem('last_active_tab');
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                } else if (e.key === 'y') {
                    e.preventDefault();
                    redo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);


    // Persisted via localStorage
    const [columns, setColumns] = useLocalStorage('app_columns', [getInitialColumn()]);
    const [beams, setBeams] = useLocalStorage('app_beams', [getInitialBeam()]);

    const fileInputRef = useRef(null);

    const handleSaveSession = () => {
        const csv = exportProjectToCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `project_session_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    const handleLoadSession = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            await importProjectFromCSV(file);
            // After loading, redirect to the first calculator tab if current on home/landing
            localStorage.setItem('last_active_tab', TABS[0].id);
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Failed to load session. Check file format.');
        }
    };

    const triggerLoadSession = () => {
        fileInputRef.current?.click();
    };

    const activeTabLabel = TABS.find(tab => tab.id === activeTabId)?.label;

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
            {/* Header - Hidden on Home */}
            {/* Header - Industrial / Architectural Style (Light) */}
            {activeTabId !== 'home' && (
                <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 text-zinc-900 font-sans shadow-sm">
                    <div className="container mx-auto max-w-full px-0 flex h-16 divide-x divide-zinc-200">

                        {/* Zone 1: Brand Anchor */}
                        <div className="flex-shrink-0 flex items-center px-6 hover:bg-zinc-50 transition-colors cursor-pointer group" onClick={() => setActiveTabId('home')}>
                            <div className="flex items-center gap-4">
                                <div className="p-2 border border-blue-200 bg-blue-50 rounded-sm group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300">
                                    <Home size={18} className="text-blue-600 group-hover:text-white" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-normal tracking-wide leading-none uppercase text-zinc-900" style={{ fontFamily: "'Anton', sans-serif" }}>
                                        Limelight
                                    </h1>
                                    <p className="text-[9px] text-zinc-400 font-mono tracking-widest uppercase mt-0.5">
                                        System V1.0
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Zone 2: Context / Info */}
                        <div className="flex-grow hidden md:flex items-center px-6 justify-between bg-zinc-50/50">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest border border-zinc-200 px-2 py-0.5 rounded-sm">Active Module</span>
                                <span className="text-sm font-bold tracking-tight text-zinc-800">{TABS.find(t => t.id === activeTabId)?.label || 'Dashboard'}</span>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Project Phase</span>
                                    <span className="text-xs font-bold text-blue-600">Estimation</span>
                                </div>
                                <div className="h-8 w-px bg-zinc-200"></div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Date</span>
                                    <span className="text-xs text-zinc-600 font-mono">{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Zone 3: Utilities */}
                        <div className="flex-shrink-0 flex items-center px-6 gap-3 bg-white">
                            <button
                                onClick={handleSaveSession}
                                className="flex items-center gap-2 h-9 px-4 border border-emerald-200 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-xs font-bold uppercase tracking-wider transition-all rounded-sm group shadow-sm"
                            >
                                <Save size={14} className="group-hover:scale-110 transition-transform" /> SAVE
                            </button>
                            <button
                                onClick={triggerLoadSession}
                                className="flex items-center gap-2 h-9 px-4 border border-zinc-200 bg-white hover:bg-zinc-800 hover:border-zinc-800 hover:text-white text-zinc-600 text-xs font-bold uppercase tracking-wider transition-all rounded-sm shadow-sm"
                            >
                                <Upload size={14} /> LOAD
                            </button>
                        </div>

                    </div>
                    {/* Technical decorative line */}
                    <div className="h-[2px] w-full bg-blue-600"></div>
                </header>
            )}

            {/* Hidden Input for File Upload - Always present for both header and landing page access */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleLoadSession}
                accept=".csv"
                className="hidden"
            />

            {/* Main Layout */}
            <div className={`flex flex-1 container mx-auto max-w-full ${activeTabId === 'home' ? 'p-0' : 'p-6 gap-6'} relative`}>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    {activeTabId === 'home' ? (
                        <LandingPage
                            tabs={TABS}
                            onNavigate={setActiveTabId}
                            onLoadSession={triggerLoadSession}
                        />
                    ) : (
                        TABS.map((tab) => {
                            const Component = tab.component;
                            // Pass columns/beams state to relevant components
                            const props = {};
                            if (tab.id === 'column') {
                                props.columns = columns;
                                props.setColumns = setColumns;
                            } else if (tab.id === 'beam') {
                                props.beams = beams;
                                props.setBeams = setBeams;
                            } else if (tab.id === 'formworks') {
                                props.columns = columns;
                                props.beams = beams;
                            }
                            return (
                                <div key={tab.id} className={activeTabId === tab.id ? 'block' : 'hidden'}>
                                    <Component {...props} />
                                </div>
                            );
                        })
                    )}
                </main>

                {/* Right Sidebar Tabs - Only show when NOT on home */}
                {activeTabId !== 'home' && (
                    <aside className="w-64 flex-shrink-0 hidden md:block">
                        <div className="sticky top-24 space-y-2">
                            <div className="flex items-center justify-between px-2 mb-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Components</h3>
                                <button
                                    onClick={() => setActiveTabId('home')}
                                    className="text-xs font-bold text-blue-500 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1"
                                >
                                    <Home size={12} /> Home
                                </button>
                            </div>
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
                )}
            </div>
        </div>
    );
}
