import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from './contexts/HistoryContext';
import useLocalStorage from './hooks/useLocalStorage';
import { Layers, Info, Box, LayoutTemplate, Columns, PenTool, Grid3X3, Paintbrush, Cloud, Hammer, SquareStack, Tent, Save, Upload, DoorOpen } from 'lucide-react';
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
    const [activeTabId, setActiveTabId] = useState('slab');

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
            alert('Session loaded successfully! The page will now reload.');
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Failed to load session. Check file format.');
        }
    };

    const activeTabLabel = TABS.find(tab => tab.id === activeTabId)?.label;

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
            {/* Header */}
            <header className="bg-slate-900 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
                <div className="container mx-auto max-w-full flex justify-between items-center">
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
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        {/* Session Controls */}
                        <div className="flex items-center gap-2 mr-4">
                            <button
                                onClick={handleSaveSession}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors text-xs font-bold uppercase tracking-wider"
                            >
                                <Save size={14} /> Save Session
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors text-xs font-bold uppercase tracking-wider"
                            >
                                <Upload size={14} /> Load Session
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleLoadSession}
                                accept=".csv"
                                className="hidden"
                            />
                        </div>
                        <span className="hidden md:flex items-center gap-1"><Info size={14} /> Professional Estimator</span>
                        <span className="h-4 w-px bg-slate-700 hidden md:block"></span>
                        <span className="hidden md:block">V1.0</span>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 container mx-auto max-w-full p-6 gap-6 relative">

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    {TABS.map((tab) => {
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
