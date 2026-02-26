import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from './contexts/HistoryContext';
import useLocalStorage from './hooks/useLocalStorage';
import { Layers, Info, Box, LayoutTemplate, Columns, PenTool, Grid3X3, Paintbrush, Cloud, Zap, Droplets, Hammer, SquareStack, Tent, Save, Upload, DoorOpen, Home, RotateCw, Construction, Scissors, SaveAll, Tag } from 'lucide-react';
import LandingPage from './components/LandingPage';
import SlabOnGrade from './components/calculators/SlabOnGrade';
import Masonry from './components/calculators/Masonry';
import { initGlobalCalculator } from './utils/globalCalculator';
import Footing from './components/calculators/Footing';
import SteelTruss from './components/calculators/SteelTruss';
import Column from './components/calculators/Column';
import Beam from './components/calculators/Beam';
import Tiles from './components/calculators/Tiles';
import Painting from './components/calculators/Painting';
import Ceiling from './components/calculators/Ceiling';
import Roofing from './components/calculators/Roofing';
import Formworks from './components/calculators/Formworks';
import SuspendedSlab from './components/calculators/SuspendedSlab';
import DoorsWindows from './components/calculators/DoorsWindows';
import Electrical from './components/calculators/Electrical';
import Plumbing from './components/calculators/Plumbing';
import LintelBeam from './components/calculators/LintelBeam';
import ConcreteWall from './components/calculators/ConcreteWall';
import RebarSchedule from './components/calculators/RebarSchedule';
import RebarCuttingSchedule from './components/calculators/RebarCuttingSchedule';
import Drywall from './components/calculators/Drywall';

import { exportProjectToCSV, parseProjectCSV, applySessionData, getExportSummary } from './utils/sessionManager';
import { getSessionData } from './utils/sessionCache';
import SessionImportModal from './components/modals/SessionImportModal';
import SessionExportModal from './components/modals/SessionExportModal';
import SessionLoadDashboard from './components/modals/SessionLoadDashboard';
import Manual from './components/Manual';
import MaterialPriceList from './components/MaterialPriceList';

const TABS = [
    { id: 'masonry', label: 'Masonry', component: Masonry, icon: Box },
    { id: 'retaining-wall', label: 'Retaining/Shear Wall', component: ConcreteWall, icon: Layers },
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
    { id: 'drywall', label: 'Drywall Works', component: Drywall, icon: Columns },
    { id: 'electrical', label: 'Electrical Works', component: Electrical, icon: Zap },
    { id: 'plumbing', label: 'Plumbing Works', component: Plumbing, icon: Droplets },
    { id: 'doors-windows', label: 'Doors & Windows', component: DoorsWindows, icon: DoorOpen },
    { id: 'steel-truss', label: 'Steel Truss', component: SteelTruss, icon: Construction },
    { id: 'lintel-beam', label: 'Lintel Beams', component: LintelBeam, icon: PenTool },
    { id: 'rebar-schedule', label: 'Rebar Bending Schedule', component: RebarSchedule, icon: Scissors },
    { id: 'rebar-cutting-schedule', label: 'Rebar Cutting Schedule', component: RebarCuttingSchedule, icon: Scissors },
    { id: 'manual', label: 'Manual & FAQ', component: Manual, icon: Info },
    { id: 'price-list', label: 'Price List', component: MaterialPriceList, icon: Tag },
];

const TAB_CATEGORIES = [
    {
        title: "Structure",
        id: "structure",
        code: "STR-01",
        color: "blue",
        tabs: ['footing', 'column', 'beam', 'slab', 'suspended-slab', 'retaining-wall', 'lintel-beam', 'steel-truss', 'roofing', 'rebar-schedule', 'rebar-cutting-schedule']
    },
    {
        title: "Finishes",
        id: "finishes",
        code: "FIN-02",
        color: "emerald",
        tabs: ['masonry', 'doors-windows', 'drywall', 'ceiling', 'tiles', 'painting']
    },
    {
        title: "Auxiliary",
        id: "auxiliary",
        code: "AUX-03",
        color: "amber",
        tabs: ['formworks']
    },
    {
        title: "MEP Works",
        id: "mep",
        code: "MEP-04",
        color: "amber",
        tabs: ['electrical', 'plumbing']
    },
    {
        title: "Help & Docs",
        id: "help",
        code: "HLP-05",
        color: "slate",
        tabs: ['manual', 'price-list']
    }
];

const getInitialColumn = () => ({
    id: Date.now() + Math.random(),
    quantity: "",
    length_m: "",
    width_m: "",
    height_m: "",
    main_rebar_cuts: [{ sku: '', length: '', quantity: '' }],
    tie_bar_sku: '',
    tie_spacing_mm: "",
    isExcluded: false,
});

const getInitialBeam = () => ({
    id: Date.now() + Math.random(),
    quantity: "",
    length_m: "",      // Width (B)
    width_m: "",       // Depth (H)
    height_m: "",      // Length (L)
    main_rebar_cuts: [{ sku: '', length: '', quantity: '' }],
    tie_bar_sku: '',
    tie_spacing_mm: "",
    cut_support_cuts: [{ sku: '', length: '', quantity: '' }],
    cut_midspan_cuts: [{ sku: '', length: '', quantity: '' }],
    isExcluded: false,
});


export default function App() {
    const { undo, redo, clearHistory } = useHistory();
    const [activeTabId, setActiveTabId] = useState('home');
    const [fileHandle, setFileHandle] = useState(null);

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
                } else if (e.key === 's') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        handleSaveAsSession();
                    } else {
                        handleSaveSession();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, fileHandle]); // fileHandle dependency for closure over state


    // Persisted via localStorage
    // Unified State - Syncing with component local storage keys for cross-tab availability
    const [columns, setColumns] = useLocalStorage('app_columns', [getInitialColumn()]);
    const [beams, setBeams] = useLocalStorage('app_beams', [getInitialBeam()]);
    const [retainingWalls] = useLocalStorage('concrete_walls', []);
    const [projectName, setProjectName] = useLocalStorage('project_name', 'Untitled Project');
    const [lastSaveInfo, setLastSaveInfo] = useLocalStorage('last_save_info', { date: '', count: 0 });

    const [projectTotal, setProjectTotal] = useState(0);

    // Sync total cost from all modules
    useEffect(() => {
        const calculateTotal = () => {
            const costKeys = [
                'masonry_total', 'slab_total', 'suspended_slab_total', 'footing_total',
                'column_total', 'beam_total', 'roofing_total', 'formworks_total',
                'tiles_total', 'painting_total', 'ceiling_total', 'drywall_total', 'electrical_total',
                'plumbing_total', 'doors_windows_total', 'lintel_beam_total', 'steel_truss_total',
                'concrete_wall_total'
            ];
            let total = 0;
            costKeys.forEach(key => {
                const val = getSessionData(key);
                if (val) total += parseFloat(val) || 0;
            });
            setProjectTotal(total);
        };

        // Initial calculation
        calculateTotal();

        // Listen for internal storage changes (custom events from components)
        const handleRefresh = () => calculateTotal();
        window.addEventListener('project-total-update', handleRefresh);
        window.addEventListener('project-session-loaded', handleRefresh);

        return () => {
            window.removeEventListener('project-total-update', handleRefresh);
            window.removeEventListener('project-session-loaded', handleRefresh);
        };
    }, []);

    const fileInputRef = useRef(null);

    // --- Export Modal State ---
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportSummaryData, setExportSummaryData] = useState([]);
    const [exportFileName, setExportFileName] = useState("");

    async function verifyPermission(fileHandle, readWrite) {
        const options = {};
        if (readWrite) {
            options.mode = 'readwrite';
        }
        if ((await fileHandle.queryPermission(options)) === 'granted') {
            return true;
        }
        if ((await fileHandle.requestPermission(options)) === 'granted') {
            return true;
        }
        return false;
    }

    const handleSaveSession = async () => {
        const today = new Date().toISOString().slice(0, 10);
        let currentVersion = 1;

        if (lastSaveInfo.date === today) {
            currentVersion = lastSaveInfo.count + 1;
        }

        const csv = exportProjectToCSV();

        if (fileHandle) {
            try {
                const permission = await verifyPermission(fileHandle, true);
                if (permission) {
                    const writable = await fileHandle.createWritable();
                    await writable.write(csv);
                    await writable.close();

                    setLastSaveInfo({ date: today, count: currentVersion });
                    alert(`Successfully saved to ${fileHandle.name}`);
                    return;
                }
            } catch (err) {
                console.error("Failed to save via file handle, falling back to Save As", err);
            }
        }

        handleSaveAsSession();
    };

    const handleSaveAsSession = () => {
        const today = new Date().toISOString().slice(0, 10);
        let currentVersion = 1;

        if (lastSaveInfo.date === today) {
            currentVersion = lastSaveInfo.count + 1;
        }

        setLastSaveInfo({ date: today, count: currentVersion });

        const fileName = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${today.replace(/-/g, '')}_v${currentVersion}.csv`;
        const summary = getExportSummary();

        setExportFileName(fileName);
        setExportSummaryData(summary);
        setExportModalOpen(true);
    };

    const confirmExport = async (finalFileName) => {
        const csv = exportProjectToCSV();

        try {
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: finalFileName || exportFileName,
                    types: [{
                        description: 'CSV Files',
                        accept: { 'text/csv': ['.csv'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(csv);
                await writable.close();
                setFileHandle(handle);
            } else {
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = finalFileName || exportFileName;
                link.click();
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error("Save As failed", err);
                alert("Failed to save file.");
            }
        }

        setExportModalOpen(false);
    };

    // Initialize Global Events
    useEffect(() => {
        const cleanupCalc = initGlobalCalculator();
        return () => {
            cleanupCalc();
        };
    }, []);

    // --- Import Modal State ---
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [loadDashboardOpen, setLoadDashboardOpen] = useState(false);
    const [parsedSessionData, setParsedSessionData] = useState(null);
    const [currentImportFileName, setCurrentImportFileName] = useState("");

    const handleLoadSession = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Parse first, don't apply yet
            const data = await parseProjectCSV(file);
            setParsedSessionData(data);
            setCurrentImportFileName(file.name);
            setImportModalOpen(true);

            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error(err);
            alert('Failed to parse session file. Check format.');
        }
    };

    const handleConfirmImport = (selectedKeys) => {
        if (!parsedSessionData) return;

        try {
            applySessionData(parsedSessionData, selectedKeys);

            // 1. Clear Undo/Redo history as we're starting a "new" imported session state
            clearHistory();

            // 2. Switch to the first calculator tab to ensure we leave the landing page
            setActiveTabId(TABS[0].id);

            // 3. Notify all listeners to refresh their local state
            window.dispatchEvent(new CustomEvent('project-session-loaded'));

            setImportModalOpen(false);
            setParsedSessionData(null);
        } catch (err) {
            console.error("Import failed", err);
            alert("Failed to apply imported data.");
        }
    };

    const triggerLoadSession = () => {
        setLoadDashboardOpen(true);
    };

    const handleLoadSessionFS = async () => {
        try {
            if ('showOpenFilePicker' in window) {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'CSV Files',
                        accept: { 'text/csv': ['.csv'] }
                    }]
                });
                const file = await handle.getFile();
                setFileHandle(handle);

                const data = await parseProjectCSV(file);
                setParsedSessionData(data);
                setCurrentImportFileName(file.name);
                setImportModalOpen(true);
            } else {
                fileInputRef.current?.click();
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
                alert('Failed to open file.');
            }
        }
    };

    const activeTabLabel = TABS.find(tab => tab.id === activeTabId)?.label;
    const activeCategory = TAB_CATEGORIES.find(cat => cat.tabs.includes(activeTabId));
    const accentColor = activeCategory ? activeCategory.color : 'blue';

    // --- Drag & Drop Handlers ---
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.relatedTarget === null) {
            setIsDragging(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            const item = e.dataTransfer.items[0];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file && file.name.endsWith('.csv')) {
                    if (typeof item.getAsFileSystemHandle === 'function') {
                        try {
                            const handle = await item.getAsFileSystemHandle();
                            setFileHandle(handle);
                        } catch (err) {
                            console.error(err);
                            setFileHandle(null);
                        }
                    } else {
                        setFileHandle(null);
                    }
                    await handleLoadSession({ target: { files: [file] } });
                    return;
                } else if (file) {
                    alert('Please drop a valid CSV session file.');
                    return;
                }
            }
        }

        // Fallback for files list
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.csv')) {
                setFileHandle(null);
                await handleLoadSession({ target: { files: [file] } });
            } else {
                alert('Please drop a valid CSV session file.');
            }
        }
    };

    return (
        <div
            className="h-screen overflow-hidden bg-gray-50 font-sans flex flex-col relative print:block print:h-auto print:overflow-visible"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag & Drop Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-[100] bg-blue-600/90 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
                    <div className="flex flex-col items-center p-12 border-4 border-white/30 rounded-xl bg-white/10 animate-pulse">
                        <Upload size={64} className="text-white mb-6" />
                        <h2 className="text-3xl font-bold text-white uppercase tracking-widest mb-2">Drop to Load Session</h2>
                        <p className="text-white/80 font-mono text-sm">Release the file to import project data</p>
                    </div>
                </div>
            )}
            {/* Header - Hidden on Home */}
            {/* Header - Industrial / Architectural Style (Light) */}
            {activeTabId !== 'home' && (
                <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 text-zinc-900 font-sans shadow-sm print:hidden">
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
                        <div className="flex-grow hidden lg:flex items-center px-6 justify-between bg-zinc-50/50">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Project Name</span>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        placeholder="Enter Project Name..."
                                        className="bg-transparent border-none text-sm font-bold text-zinc-800 focus:ring-0 focus:outline-none placeholder:text-zinc-300 w-48 hover:bg-zinc-100/50 rounded-sm px-1 -mx-1 border-b border-dashed border-transparent focus:border-blue-400 transition-all"
                                    />
                                </div>
                                <div className="h-8 w-px bg-zinc-200"></div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Project Cost</span>
                                        <button
                                            onClick={() => window.dispatchEvent(new CustomEvent('trigger-global-recalc'))}
                                            className="text-zinc-400 hover:text-blue-600 transition-colors"
                                            title="Recalculate Session Totals"
                                        >
                                            <RotateCw size={10} />
                                        </button>
                                    </div>
                                    <span className="text-sm font-bold tracking-tight text-emerald-600">
                                        ₱{projectTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
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
                                title="Save (Ctrl+S)"
                            >
                                <Save size={14} className="group-hover:scale-110 transition-transform" /> SAVE
                            </button>
                            <button
                                onClick={handleSaveAsSession}
                                className="flex items-center gap-2 h-9 px-4 border border-emerald-200 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-xs font-bold uppercase tracking-wider transition-all rounded-sm group shadow-sm"
                                title="Save As (Ctrl+Shift+S)"
                            >
                                <SaveAll size={14} className="group-hover:scale-110 transition-transform" /> SAVE AS
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
                    <div className={`h-[2px] w-full bg-${accentColor}-600 shadow-sm`}></div>
                </header>
            )}

            {/* Import Modal */}
            <SessionImportModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onConfirm={handleConfirmImport}
                parsedData={parsedSessionData}
                fileName={currentImportFileName}
            />

            {/* Load Dashboard Modal */}
            <SessionLoadDashboard
                isOpen={loadDashboardOpen}
                onClose={() => setLoadDashboardOpen(false)}
                onResume={async () => {
                    setLoadDashboardOpen(false);
                    try {
                        // Export current session to CSV and re-parse to leverage the Import/Review modal
                        const csvString = exportProjectToCSV();
                        const blob = new Blob([csvString], { type: 'text/csv' });
                        const file = new File([blob], projectName + ".csv", { type: "text/csv" });

                        const data = await parseProjectCSV(file);
                        setParsedSessionData(data);
                        setCurrentImportFileName("CURRENT_SESSION_CACHE");
                        setImportModalOpen(true);
                    } catch (e) {
                        console.error("Error formatting resume data for import modal", e);
                        if (activeTabId === 'home') {
                            setActiveTabId(TABS[0].id);
                        }
                    }
                }}
                onBrowseFiles={handleLoadSessionFS}
                projectName={projectName}
                lastSaveInfo={lastSaveInfo}
                projectTotal={projectTotal}
            />

            {/* Export Confirmation Modal */}
            <SessionExportModal
                isOpen={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                onConfirm={confirmExport}
                summaryData={exportSummaryData}
                fileName={exportFileName}
            />

            {/* Hidden Input for File Upload - Always present for both header and landing page access */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleLoadSession}
                accept=".csv"
                className="hidden"
            />

            {/* Main Layout */}
            <div className={`flex flex-1 overflow-hidden container mx-auto max-w-full ${activeTabId === 'home' ? 'p-0' : 'p-6 gap-6'} relative print:block print:overflow-visible print:p-0`}>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 h-full overflow-y-auto hide-scrollbar print:block print:overflow-visible pb-12">
                    {activeTabId === 'home' ? (
                        <LandingPage
                            tabs={TABS}
                            onNavigate={setActiveTabId}
                            onLoadSession={triggerLoadSession}
                        />
                    ) : (
                        (() => {
                            const activeTab = TABS.find(t => t.id === activeTabId);
                            if (!activeTab || !activeTab.component) {
                                return (
                                    <div className="flex-grow flex items-center justify-center p-8 text-center">
                                        <div className="max-w-md space-y-4">
                                            <div className="p-4 bg-zinc-100 rounded-sm border border-zinc-200">
                                                <Home className="mx-auto text-zinc-400 mb-2" size={48} />
                                                <h3 className="text-lg font-bold text-zinc-900 uppercase">Module Unavailable</h3>
                                                <p className="text-xs text-zinc-500 font-mono">ID: {activeTabId || 'UNKNOWN'}</p>
                                            </div>
                                            <button
                                                onClick={() => setActiveTabId('home')}
                                                className="px-6 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-blue-700 transition-colors"
                                            >
                                                Return to Command Center
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            const Component = activeTab.component;
                            const props = {};
                            if (activeTab.id === 'column') {
                                props.columns = columns;
                                props.setColumns = setColumns;
                            } else if (activeTab.id === 'beam') {
                                props.beams = beams;
                                props.setBeams = setBeams;
                            } else if (activeTab.id === 'formworks') {
                                props.columns = columns;
                                props.beams = beams;
                                props.retainingWalls = retainingWalls;
                            }
                            return <Component {...props} />;
                        })()
                    )}
                </main>

                {/* Right Sidebar Tabs - Only show when NOT on home */}
                {activeTabId !== 'home' && (
                    <aside className="w-64 flex-shrink-0 hidden lg:block h-full overflow-y-auto hide-scrollbar print:hidden">
                        <div className="space-y-6 pb-24">
                            {TAB_CATEGORIES.map((category) => (
                                <div key={category.id} className="space-y-2">
                                    <div className="flex items-center justify-between px-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1 h-3 rounded-full bg-${category.tabs.some(id => id === activeTabId) ? category.color : 'zinc'}-500 transition-colors`}></div>
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                                                {category.title}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-mono text-zinc-300">{category.code}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {category.tabs.map((tabId) => {
                                            const tab = TABS.find(t => t.id === tabId);
                                            if (!tab) return null;
                                            const Icon = tab.icon;
                                            const isActive = activeTabId === tab.id;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTabId(tab.id)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-[11px] font-bold transition-all duration-200 border uppercase tracking-wider ${isActive
                                                        ? `bg-white border-${category.color}-500 text-${category.color}-700 shadow-sm translate-x-1`
                                                        : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900'
                                                        }`}
                                                >
                                                    <div className={`p-1 rounded-sm ${isActive ? `bg-${category.color}-50` : 'bg-transparent opacity-60'}`}>
                                                        <Icon size={14} className={isActive ? `text-${category.color}-600` : 'text-zinc-400'} />
                                                    </div>
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="h-px bg-zinc-100 mx-2"></div>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
