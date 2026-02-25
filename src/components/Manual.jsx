import React, { useState } from 'react';
import { Info, HelpCircle, BookOpen, Layers, Columns, Box, Paintbrush, Zap, Droplets, Tent, Construction, Scissors, Grid3X3, Hammer, DoorOpen, LayoutTemplate, PenTool, SquareStack, Cloud, ChevronDown } from 'lucide-react';

const Manual = () => {
    // State to toggle specific module explanations to keep UI clean
    const [openModules, setOpenModules] = useState({});

    const toggleModule = (id) => {
        setOpenModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const modules = [
        {
            id: 'footing',
            title: 'RC Footing',
            icon: <LayoutTemplate size={16} className="text-blue-600" />,
            steps: [
                "Concrete Volume: Calculated as (Length × Width × Depth). Cement (40kg bags) = Volume × 9.0. Sand = Volume × 0.50. Gravel = Volume × 1.0. A 5% waste allowance is automatically applied to final material quantities.",
                "Main Rebar (Lx): Total bars = Math.ceil(Width / Spacing) + 1. Total length per bar = Length + (2 × hook allowance).",
                "Main Rebar (Ly): Total bars = Math.ceil(Length / Spacing) + 1. Total length per bar = Width + (2 × hook allowance).",
                "Tie Wire: Intersections (Lx count × Ly count) × 0.30m per tie. Converted to kg using (Total Length / 53m/kg) + 5% waste allowance."
            ]
        },
        {
            id: 'column',
            title: 'RC Column',
            icon: <Columns size={16} className="text-blue-600" />,
            steps: [
                "Concrete Volume: Calculated as (Length × Width × Height). Multipliers: Cement = Vol × 9.0; Sand = Vol × 0.50; Gravel = Vol × 1.0. Adds 5% waste.",
                "Main Vertical Rebar: Base length = Column Height + footing anchor (typically 0.60m) + splice length (40 × bar diameter) if exceeding stock lengths.",
                "Lateral Ties/Stirrups: Count = Math.ceil(Height / Spacing). Perimeter = 2 × (Length + Width) - (8 × concrete cover) + 0.15m hook allowance.",
                "Tie Wire: (Main Bar Count × Tie Count) × 0.40m per intersection. Converted to kg (53m/kg factor) + 5% waste."
            ]
        },
        {
            id: 'beam',
            title: 'RC Beam',
            icon: <PenTool size={16} className="text-blue-600" />,
            steps: [
                "Concrete Volume: (Width × Depth × Span Length). Standard Class A multipliers applied (9.0 Cement, 0.5 Sand, 1.0 Gravel) + 5% waste.",
                "Top & Bottom Continuous Bars: Span length + 0.60m anchorage. Splice lengths (40d) added if span exceeds commercial stock length.",
                "Extra Support Bars: Cut length is typically Span / 4 on each end. Midspan Bars: Cut length is typically Span / 2 in the center.",
                "Stirrups: Quantity = Math.ceil(Span Length / Spacing). Length = 2 × (Width + Depth) - (8 × clear cover) + 0.15m hook."
            ]
        },
        {
            id: 'slab',
            title: 'Slab on Grade',
            icon: <Layers size={16} className="text-blue-600" />,
            steps: [
                "Concrete Volume: (Area × Thickness). Multipliers applied for Class A mix + 5% waste.",
                "Temperature/Shrinkage Reinforcement: Calculates bars acting as a grid structure. Number of bars horizontally = Math.ceil(Length / Spacing) + 1. Number of bars vertically = Math.ceil(Width / Spacing) + 1. Includes 40d lapping.",
                "Tie Wire: (Horiz Bars × Vert Bars) × 0.30m length per tie.",
                "Gravel Bedding: Area × Base Thickness (e.g., 0.10m), plus a 10% compaction/waste allowance."
            ]
        },
        {
            id: 'suspended-slab',
            title: 'Suspended Slab',
            icon: <SquareStack size={16} className="text-blue-600" />,
            steps: [
                "Load Mechanics: Evaluates aspect ratio (Length / Width) to classify One-Way (Ratio < 0.5 or > 2.0) or Two-Way slab to adjust main and temperature steel.",
                "Concrete: (Area × Thickness). If Steel Deck is used, concrete volume is reduced by the void/rib volume of the specific deck profile.",
                "Steel Decking: Area / Effective Width of Deck (e.g., 0.93m). Calculates required linear meters and optimizes into commercial lengths.",
                "Rebar: Quantifies bottom continuous bars, top bent-up bars, and temperature steel, including L/3 bend points and 40d splices."
            ]
        },
        {
            id: 'retaining-wall',
            title: 'Retaining/Shear Wall (Concrete)',
            icon: <Layers size={16} className="text-blue-600" />,
            steps: [
                "Volume: (Length × Height × Thickness). Uses Class A multipliers (Cement × 9.0).",
                "Vertical Rebars: Count = Math.ceil(Length / Spacing) + 1. Length = Height + foundation anchorage (0.60m) + splice.",
                "Horizontal Rebars: Count = Math.ceil(Height / Spacing). Length = Length + hook/anchorage.",
                "Tie Wire: Total intersections × 0.40m, converted to kg."
            ]
        },
        {
            id: 'lintel-beam',
            title: 'Lintel Beams',
            icon: <PenTool size={16} className="text-blue-600" />,
            steps: [
                "Similar structural logic to RC Beams but optimized for masonry opening headers.",
                "Typically calculates 4 main continuous bars without midspan/extra support complexity. Stirrups spaced evenly."
            ]
        },
        {
            id: 'masonry',
            title: 'Masonry Works (CHB)',
            icon: <Box size={16} className="text-emerald-600" />,
            steps: [
                "CHB Counting (Tiling Method): Accurately 'tiles' blocks. Lengthwise blocks = Math.ceil(Length / 0.41m). Heightwise blocks = Math.ceil(Height / 0.21m). Total CHB = (Lengthwise * Heightwise).",
                "Mortar Filler (Laying): Area × 0.015 cu.m. volume.",
                "Plastering: Area × Number of Plastered Sides × 0.01 cu.m. (assuming 10mm thickness).",
                "Grout Filler: Area × 0.005 cu.m. (for 4\") or 0.01 cu.m. (for 6\") block cores.",
                "Cement/Sand/Gravel: Mortar (1:3 mix, 1.25 yield) isolates Cement & Sand. Grout (1:2:4 mix, 1.5 yield) includes Gravel. Final counts get 5% waste logic.",
                "Reinforcements: Vertical bars = Length / Spacing. Horizontal bars = Height / Spacing (e.g., every 3 layers). 40d splices included. Tie wire = 0.40m per intersection."
            ]
        },
        {
            id: 'painting',
            title: 'Painting Works',
            icon: <Paintbrush size={16} className="text-emerald-600" />,
            steps: [
                "Area: (Length × Height × 0.90 to account for standard door/window voids) × Number of painted sides.",
                "Primer Coat: Total Area ÷ 25 sqm/gallon.",
                "Skimcoat/Putty: Total Area ÷ 12 sqm/gallon (heavy coat application assumption).",
                "Topcoat: (Total Area ÷ 30 sqm/gallon) × 2 Coats.",
                "A 5% waste multiplier is applied to final gallon purchases."
            ]
        },
        {
            id: 'tiles',
            title: 'Tile Works',
            icon: <Grid3X3 size={16} className="text-emerald-600" />,
            steps: [
                "Tile Count (Direct Tiling Method): Evaluates two orientations (Horizontal vs Vertical laying). Calculates rows and columns using Math.ceil(Room_Dim / Tile_Dim) and picks the one minimizing total tiles. Adds 5% waste padding.",
                "Tile Adhesive: Total Area ÷ 4.0 sqm (Standard yield per 25kg bag using 6mm notch trowel).",
                "Tile Grout: Total Area × 0.30 kg (Standard filler estimate per sqm depending on joint gap). Adds 5% waste."
            ]
        },
        {
            id: 'ceiling',
            title: 'Ceiling Works',
            icon: <Cloud size={16} className="text-emerald-600" />,
            steps: [
                "Boards: Total Area ÷ Board Area (e.g., 2.97 sqm for 4x8 Gypsum).",
                "Carrying Channel: Perimeter + (Area / 1.2m spacing).",
                "Furring/Metal Studs: Area / 0.4m spacing.",
                "Wall Angle: Room Perimeter.",
                "Consumables: Blind Rivets = Area × 16 pcs; Screws = Area × 12 pcs; assumed 5% waste."
            ]
        },
        {
            id: 'doors-windows',
            title: 'Doors & Windows',
            icon: <DoorOpen size={16} className="text-emerald-600" />,
            steps: [
                "Module tracks discrete unit quantities per scheduled item.",
                "Hardware Accessories (hinges, locks) and Installation Additives (sealants, foam) are paired statically to the primary unit count."
            ]
        },
        {
            id: 'formworks',
            title: 'Formworks',
            icon: <Hammer size={16} className="text-amber-600" />,
            steps: [
                "Phenolic/Marine Plywood: Total Contact Area ÷ 2.97 sqm (4x8 sheet). Adds 5% waste.",
                "Lumber (Structural Framing 2x2): Precise linear methodology. Vertical studs placed every 0.60m + Horizontal walers every 0.60m. Lineal meters converted to Board Feet (1m of 2x2 = 1.093 BF).",
                "Nails (CWN): Approximated at 0.15 kg per square meter of formwork area."
            ]
        },
        {
            id: 'electrical',
            title: 'Electrical Works',
            icon: <Zap size={16} className="text-amber-600" />,
            steps: [
                "Fixtures & Devices: Aggregates direct unit quantities input by the user.",
                "Calculates automated pricing but excludes automatic wire/conduit estimation (left for manual rough-in entries) to retain precision for unique floor plans."
            ]
        },
        {
            id: 'plumbing',
            title: 'Plumbing Works',
            icon: <Droplets size={16} className="text-amber-600" />,
            steps: [
                "Fixtures: Aggregates direct unit quantities input by the user.",
                "Piping & Fittings: Evaluated as discrete item counts per schedule row."
            ]
        },
        {
            id: 'steel-truss',
            title: 'Steel Truss',
            icon: <Construction size={16} className="text-slate-600" />,
            steps: [
                "Defines Top Chords, Bottom Chords, and Web Members.",
                "Linear Optimization (1D Bin Packing Algorithm): Sorts all required cut lengths descending and efficiently packs them sequentially into 6.0m standard commercial lengths, minimizing scrap waste dynamically.",
                "Consumables: Welding rod estimated by weight (kg). Cutting discs estimated by cut counts."
            ]
        },
        {
            id: 'rebar-bending',
            title: 'Rebar Bending Schedule',
            icon: <Scissors size={16} className="text-slate-600" />,
            steps: [
                "Imports exact specifications from purely structural modules (Columns, Beams).",
                "Bending/Hook Analytics: Extracts main bar lap splices and stirrup seismic hook angles (135° or 90°).",
                "Provides total weight outputs (in kilograms) and summarizes lengths for fabricator blueprints."
            ]
        },
        {
            id: 'rebar-cutting',
            title: 'Rebar Cutting Schedule',
            icon: <Scissors size={16} className="text-slate-600" />,
            steps: [
                "Aggregate 1D Bin Packing Optimization: Takes all unique rebar pieces specified across the entire project (extracted from Footing, Columns, Beams, Slabs, Walls).",
                "Generates detailed patterns of exactly how to cut 6m, 7.5m, 9m, 10.5m, or 12m commercial bars to fulfill the required pieces while minimizing scrap waste lengths to absolute mathematical constraints."
            ]
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white p-6 rounded-sm border border-zinc-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-1/3 -translate-y-1/3 opacity-50 pointer-events-none"></div>
                <div className="relative z-10 flex items-start gap-4">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
                        <BookOpen size={24} className="text-slate-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-tight">Manual & FAQ</h2>
                        <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
                            Comprehensive guide, frequently asked questions, and in-depth chronology of calculations used strictly across the system.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left Side: General FAQ */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-sm border border-zinc-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-100">
                            <HelpCircle size={18} className="text-blue-600" />
                            <h3 className="text-md font-bold text-zinc-800 uppercase tracking-widest">General FAQ</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-bold text-zinc-700">How do I save my project?</h4>
                                <p className="text-xs text-zinc-500 mt-1">Use the "SAVE" or "SAVE AS" buttons in the top header. This exports a CSV file containing all your project data.</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-zinc-700">Can I load a saved project?</h4>
                                <p className="text-xs text-zinc-500 mt-1">Yes, click "LOAD" in the header or drag and drop a previous session CSV file anywhere on the screen.</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-zinc-700">Why did all my inputs reset?</h4>
                                <p className="text-xs text-zinc-500 mt-1">Data is persisted locally to your browser between reloads. Generating an exported CSV file regularly prevents permanent data loss in case the browser cache clears.</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-zinc-700">How is the total cost calculated?</h4>
                                <p className="text-xs text-zinc-500 mt-1">The total cost at the top navigation bar is the aggregated sum of every single actively included calculation from across all module tabs.</p>
                            </div>
                            <div className="pt-4 border-t border-zinc-100">
                                <p className="text-[10px] text-zinc-400 font-mono text-justify uppercase tracking-tighter">
                                    DISCLAIMER: Values generated by this system are theoretically optimized estimates utilizing standard Philippine industry multipliers. Always consult with a licensed professional engineer for procurement logistics.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Specific Calculation Methodologies */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white p-6 rounded-sm border border-zinc-200 shadow-sm mb-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                            <Info size={18} className="text-blue-600" />
                            <h3 className="text-md font-bold text-zinc-800 uppercase tracking-widest">In-Depth Modulator Algorithms</h3>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">
                            A specific, chronological breakdown elucidating exact mechanical assumptions utilized internally on a per-tab basis. Click on a module below to inspect its inner logic constraints.
                        </p>
                    </div>

                    <div className="space-y-3 pb-8">
                        {modules.map((mod, i) => (
                            <div key={mod.id} className="bg-white border border-zinc-200 rounded-sm shadow-sm overflow-hidden transition-all duration-200">
                                <button
                                    onClick={() => toggleModule(mod.id)}
                                    className="w-full flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-sm bg-white border border-zinc-200 shadow-sm shrink-0">
                                            <span className="text-[10px] font-bold text-zinc-400">{i + 1}</span>
                                        </div>
                                        {mod.icon}
                                        <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">{mod.title}</h4>
                                    </div>
                                    <ChevronDown
                                        size={18}
                                        className={`text-zinc-400 transition-transform duration-300 ${openModules[mod.id] ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {openModules[mod.id] && (
                                    <div className="p-5 border-t border-zinc-100 bg-white">
                                        <ul className="text-xs text-zinc-600 space-y-3 list-disc list-inside px-2">
                                            {mod.steps.map((step, idx) => {
                                                const colonIndex = step.indexOf(':');
                                                if (colonIndex > 0 && colonIndex < 40) {
                                                    const title = step.substring(0, colonIndex);
                                                    const content = step.substring(colonIndex + 1);
                                                    return (
                                                        <li key={idx} className="leading-relaxed">
                                                            <strong className="text-zinc-800 tracking-wide">{title}:</strong>{content}
                                                        </li>
                                                    );
                                                }
                                                return <li key={idx} className="leading-relaxed">{step}</li>;
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Manual;
