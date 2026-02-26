import React, { useState } from 'react';
import { Info, HelpCircle, BookOpen, Layers, Columns, Box, Paintbrush, Zap, Droplets, Tent, Construction, Scissors, Grid3X3, Hammer, DoorOpen, LayoutTemplate, PenTool, SquareStack, Cloud, ChevronDown } from 'lucide-react';
import { THEME_COLORS, CARD_UI } from '../constants/designSystem';

const Manual = () => {
    const THEME = 'slate'; // Fixed theme for Manual
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
                "Concrete Volume: Calculated as (Width × Length × Depth × Quantity).",
                "Concrete Mix: Cement, Sand, and Gravel quantities derived from user-selected mix (Class AA, A, B, or C).",
                "Main Rebar (Lx & Ly): Cut length = (Side Dimension + 0.20m default hook). Quantity = (Math.ceil(Opposite_Side / Spacing) + 1) × Footing_Qty.",
                "Rebar Pcs: Total Linear Meters / Stock Length (e.g., 6.0m), rounded up.",
                "Tie Wire: (Total Intersections × 0.35m cut length) / 53m/kg + 5% waste."
            ]
        },
        {
            id: 'column',
            title: 'RC Column',
            icon: <Columns size={16} className="text-blue-600" />,
            steps: [
                "Concrete Volume: (Width × Length × Height × Quantity). Materials (9/0.5/1.0 etc) depend on selected mix + 5% waste.",
                "Vertical Rebar: Cut length = Height + 40d splice (0.4m min) + footing anchor (0.25m min). Quantity = Bars_per_column × Column_Qty.",
                "Lateral Ties: Cut length = 2 × ((Width - 2×Cover) + (Length - 2×Cover)) + 2 × seismic hook (12d or 0.075m). Cover is fixed at 40mm.",
                "Tie Count: (Math.ceil(Height / Spacing) + 1) × Column_Qty.",
                "Tie Wire: (Vertical Bars × Total Ties) × 0.35m cut length per tie / 53m/kg + 5% waste."
            ]
        },
        {
            id: 'beam',
            title: 'RC Beam',
            icon: <PenTool size={16} className="text-blue-600" />,
            steps: [
                "Concrete Volume: (Width × Depth × Span × Quantity). Materials are based on dynamic proportions for the selected mix + 5% waste.",
                "Main Bars (Continuous): Cut length = Span + (2 × 40d anchorage/splice). Supports 1D Bin Packing optimization for stock length selection.",
                "Extra Top Bars (Supports): Cut length = (0.3 × Span) + (2 × 40d anchorage).",
                "Extra Bottom Bars (Midspan): Cut length = (0.4 × Span) + (2 × 40d anchorage).",
                "Stirrups: Cut length = 2 × ((Width - 2×Cover) + (Depth - 2×Cover)) + 2 × seismic hook. Spacing = Math.ceil(Span / Spacing) + 1.",
                "Tie Wire: Total intersections (Main + Supports + Midspan × Ties) × 0.35m / 53m/kg + 5% waste."
            ]
        },
        {
            id: 'slab',
            title: 'Slab on Grade',
            icon: <Layers size={16} className="text-blue-600" />,
            steps: [
                "Concrete: (Area × Thickness × Quantity). Quantities are accumulated per slab based on individual concrete mix selection. Includes 5% waste.",
                "Gravel Bedding: Area × Bedding_Thickness × 1.05 waste/compaction.",
                "Rebar Grid: Horizontal bars count = ceil(Width/Spacing)+1; Vertical bars count = ceil(Length/Spacing)+1.",
                "S BBS Cut Lengths: Physical bar cuts are determined by span. If span > stock (e.g., 6m), it calculates 'Stock_Length' bars + 'Overlap_Splice' (40d) + 'Tail_Cuts'.",
                "Tie Wire: (Total Intersections × 0.35m cut length) / 53m/kg + 5% waste."
            ]
        },
        {
            id: 'suspended-slab',
            title: 'Suspended Slab',
            icon: <SquareStack size={16} className="text-blue-600" />,
            steps: [
                "Slab Analysis: Ratio = (Long Span / Short Span). > 2.0 = One-Way; Else = Two-Way.",
                "Concrete: (Area × Thickness × Quantity) minus Steel Deck rib volume (if deck used). Materials derived from selected concrete mix. 5% waste.",
                "Formwork: (L × W) Soffit + Perimeter Sides. Sheet Count = Total_Area / 2.9768 (standard 4x8 sheet). 5% waste.",
                "Steel Deck: Total Area / Effective Width (0.90m). 5% waste.",
                "Rebar (Cranked): Top reinforcement uses crank factor (Length + 2 × 0.42 × EffectiveDepth + 2 × 12d hooks). Bottom bars = Straight + 12d hooks.",
                "Shoring (Coco): Grid 0.6x0.6. Posts, Stringers (2x3), Joists (2x2), and Bracing (30% of posts vol) calculated in Board Feet.",
                "Shoring (H-Frame): Grid 1.2x1.2. Towers count = ceil(L/1.2) * ceil(W/1.2). Calculates Frames (2/layer), Braces (4/layer), and U-Heads (4/tower).",
                "Tie Wire: (Total Intersections × 0.35m cut length) / 53m/kg + 5% waste."
            ]
        },
        {
            id: 'retaining-wall',
            title: 'Concrete Wall',
            icon: <Layers size={16} className="text-blue-600" />,
            steps: [
                "Volume: (Length × Height × Thickness × Quantity). Materials derived from dynamic concrete mix proportion (Class AA, A, B, C).",
                "Vertical Rebar: (Math.floor(Length / VertSpacing) + 1) × LayerCount (Single/Double Mat). Each bar cut to Height with 40d splices.",
                "Horizontal Rebar: (Math.floor(Height / HorizSpacing) + 1) × LayerCount. Each bar cut to Length with 40d splices.",
                "Tie Wire: (Total Intersections × 0.35m cut length) / 53m/kg + 5% waste."
            ]
        },
        {
            id: 'lintel-beam',
            title: 'Lintel Beams',
            icon: <PenTool size={16} className="text-blue-600" />,
            steps: [
                "Span: Opening Width + 0.40m total bearing (0.20m each side).",
                "Concrete: (Span × Depth × Height × Quantity). Quantities based on selected concrete mix + 5% waste.",
                "Main Rebar: (Span + 2 × 40d splice) × Main_Bar_Count. Optimization: Yield = floor(StockLength / CutLength). BarsRequired = ceil(TotalCount / Yield).",
                "Ties/Stirrups: Cut length = 2 × ((Height-2c) + (Depth-2c)) + 2 × Hook. Quantity = ceil(Span / Spacing) + 1.",
                "Tie Wire: (Total Intersections × 0.35m cut length) / 53m/kg + 5% waste."
            ]
        },
        {
            id: 'masonry',
            title: 'Masonry Works (CHB)',
            icon: <Box size={16} className="text-emerald-600" />,
            steps: [
                "CHB Count (Tiling Method): ceil(Length / 0.41m) × ceil(Height / 0.21m) × Quantity. Block pitch is 0.41m (L) × 0.21m (H) including 10mm mortar joint.",
                "Mortar (Laying) — True Geometric Volume: V_bed = t × depth × (Area / 0.21). V_head = t × 0.19m × depth × (Area / (0.41 × 0.21)). Total wet mortar = V_bed + V_head, where t = 10mm joint thickness.",
                <div className="mt-1 overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse">
                        <thead>
                            <tr className="bg-zinc-100 text-zinc-600">
                                <th className="border border-zinc-200 px-2 py-1 text-left font-bold">CHB Size</th>
                                <th className="border border-zinc-200 px-2 py-1 text-center font-bold">Depth</th>
                                <th className="border border-zinc-200 px-2 py-1 text-center font-bold">Wet Mortar (m³/m²)</th>
                                <th className="border border-zinc-200 px-2 py-1 text-center font-bold">Grout Factor (m³/m²)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ['4" (10cm)', '100mm', '≈0.00697', '0.0050'],
                                ['5" (12.5cm)', '125mm', '≈0.00871', '0.0065'],
                                ['6" (15cm)', '150mm', '≈0.01045', '0.0100'],
                                ['8" (20cm)', '200mm', '≈0.01393', '0.0150'],
                            ].map(([size, depth, mortar, grout], i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                                    <td className="border border-zinc-200 px-2 py-1 font-semibold text-zinc-800">{size}</td>
                                    <td className="border border-zinc-200 px-2 py-1 text-center font-mono text-zinc-600">{depth}</td>
                                    <td className="border border-zinc-200 px-2 py-1 text-center font-mono text-emerald-700">{mortar}</td>
                                    <td className="border border-zinc-200 px-2 py-1 text-center font-mono text-blue-700">{grout}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>,
                "Dry Materials: wet_vol × 1.25 (yield) = dry_vol. At 1:3 mix → Cement = dry_vol/4 / 0.035 bags; Sand = dry_vol × 3/4 m³. Grout uses selected concrete mix (yields Cement + Sand + Gravel).",
                "Reinforcements: Vertical = ceil(Length/Spacing). Horizontal = ceil(Height/LayerSpacing). 40d splices included. Tie Wire: intersections × 0.35m / 53m/kg + 5% waste."
            ]
        },
        {
            id: 'painting',
            title: 'Painting Works',
            icon: <Paintbrush size={16} className="text-emerald-600" />,
            steps: [
                "Effective Area: (Length × Height × Sides × Quantity). Voids for openings can be subtracted by reducing 'Quantity' manually.",
                "Primer Coat: Total Area ÷ 25 sqm/gallon (4L).",
                "Skimcoat/Putty: Total Area ÷ 20 sqm/bag (20kg bag application).",
                "Topcoat/Finish: (Total Area ÷ 25 sqm/gallon) × 2 Coats."
            ]
        },
        {
            id: 'tiles',
            title: 'Tile Works',
            icon: <Grid3X3 size={16} className="text-emerald-600" />,
            steps: [
                "Tile Count (Precision Method): Compares laying directions. Dir1 = ceil(L/TileW) * ceil(W/TileH). Dir2 = ceil(L/TileH) * ceil(W/TileW). Result = min(Dir1, Dir2) + 5% waste.",
                "Tile Adhesive: Total Area ÷ 4.0 sqm (Standard yield per 25kg bag).",
                "Tile Grout: Total Area × 0.30 kg (Joint filler estimate)."
            ]
        },
        {
            id: 'ceiling',
            title: 'Ceiling Works',
            icon: <Cloud size={16} className="text-emerald-600" />,
            steps: [
                "Sheet Boards: Precision tiling method (like tiles) comparing sheet orientations for minimum cuts. 5% waste.",
                "Carrying Channel (Primary): ceil(Width / 1.2m spacing) × Length. Converted to 5.0m commercial lengths.",
                "Furring Channel (Secondary): ceil(Length / 0.4m spacing) × Width. Converted to 5.0m commercial lengths.",
                "Wall Angle: Perimeter / 3.0m commercial length.",
                "Consumables: 1 screw per 0.25m of furring. W-Clips = CarryingRuns × FurringRuns. 4 rivets per W-Clip intersection."
            ]
        },
        {
            id: 'drywall',
            title: 'Drywall Works',
            icon: <Columns size={16} className="text-emerald-600" />,
            steps: [
                "Sheet Boards: Precision tiling method (orientation check) for Gypsum (9/12/15mm), Fiber Cement (3.5–12mm), Marine Plywood (1/4, 1/2, 3/4\"), WPC Fluted Panels, and Acoustic Boards. 5% waste included.",
                "Metal Framing: Tracks = Length × 2 ÷ 3.0m. Studs = (ceil(L / 0.4m) + 1) × Height_per_stud ÷ 3.0m. Accessories: 4 rivets/connection, 1.5m mesh tape/m², 1 pail compound/40m².",
                "Filler Materials — True Geometric Volume: Cavity Volume = Wall Area × Filler Thickness. Unit Volume = w × l × t. Quantity = Cavity Vol / Unit Vol.",
                <div className="mt-1 overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse">
                        <thead>
                            <tr className="bg-zinc-100 text-zinc-600">
                                <th className="border border-zinc-200 px-2 py-1 text-left font-bold">Material</th>
                                <th className="border border-zinc-200 px-2 py-1 text-center font-bold">W × L</th>
                                <th className="border border-zinc-200 px-2 py-1 text-center font-bold">Thickness</th>
                                <th className="border border-zinc-200 px-2 py-1 text-center font-bold">Unit</th>
                                <th className="border border-zinc-200 px-2 py-1 text-center font-bold">Category</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ['Glasswool Roll', '1.2m × 15m', '50mm', 'rolls', 'Thermal'],
                                ['PE Foam Roll', '1.0m × 50m', '12mm', 'rolls', 'Thermal'],
                                ['EPS Foam Board', '1.2m × 2.4m', '50mm', 'pcs', 'Thermal'],
                                ['Rockwool Slab', '0.6m × 1.2m', '50mm', 'pcs', 'Acoustical'],
                                ['Acoustic Fiberglass', '0.6m × 1.2m', '50mm', 'pcs', 'Acoustical'],
                            ].map(([name, dims, thk, unit, cat], i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                                    <td className="border border-zinc-200 px-2 py-1 font-semibold text-zinc-800">{name}</td>
                                    <td className="border border-zinc-200 px-2 py-1 text-center font-mono text-zinc-600">{dims}</td>
                                    <td className="border border-zinc-200 px-2 py-1 text-center font-mono text-blue-700">{thk}</td>
                                    <td className="border border-zinc-200 px-2 py-1 text-center text-zinc-500">{unit}</td>
                                    <td className="border border-zinc-200 px-2 py-1 text-center">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${cat === 'Thermal' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'
                                            }`}>{cat}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>,
            ]
        },
        {
            id: 'doors-windows',
            title: 'Doors & Windows',
            icon: <DoorOpen size={16} className="text-emerald-600" />,
            steps: [
                "Scheduling: Tracks unit counts and pairs them with specific hardware sets.",
                "Frame Material (LM): Door Jamb = (2 × Height + 1 × Width). Window Frame = (2 × Height + 2 × Width).",
                "Internal Profiling: Mullions added if Width > 1.2m. Transoms added if Height > 1.5m. 10% waste for profiles.",
                "Silicone Sealant: Total Perimeter / 10m (avg yield per 300ml cartridge)."
            ]
        },
        {
            id: 'formworks',
            title: 'Formworks',
            icon: <Hammer size={16} className="text-amber-600" />,
            steps: [
                "Tiling Method: Instead of area division, each contact face is 'tiled' with 4x8 panels. Minimized orientation is selected per face. 5% waste.",
                "Lumber Studs: (Perimeter / 0.6m spacing) × 2 (factor) × Height.",
                "Lumber Walers: (Height / 0.6m spacing) × 2 (inner/outer) × Perimeter.",
                "Lumber Volume: Total linear meters of 2x2 converted to Board Feet (1m = 1.093 BF)."
            ]
        },
        {
            id: 'roofing',
            title: 'Roofing Works',
            icon: <Construction size={16} className="text-slate-600" />,
            steps: [
                "Sheet Count: ceil(Width / Effective_Width) × Quantity. Effective width depends on type (e.g., Rib-Type = 1.0m, Corrugated = 0.76m).",
                "Linear Meters: SheetCount × Length. Includes user-defined waste factor.",
                "Tek Screws: Total Linear Meters × 5 pcs (heuristic density)."
            ]
        },
        {
            id: 'steel-truss',
            title: 'Steel Truss',
            icon: <Construction size={16} className="text-slate-600" />,
            steps: [
                "Material Types: Angle Bar, C-Channel, Tubular Square, and Tubular Rectangular. Each part entry requires a Type, Size, and Thickness. All standard Philippine market sizes are available (e.g., Angle Bar 25×25 to 100×100mm, C-Channel 75×50 to 200×50mm, Tubulars in all common dimensions).",
                "Cutting Lengths: Each part defines one or more cut patterns (length × quantity). The system aggregates all cuts per unique material specification.",
                "Linear Optimization (1D Bin Packing): Cuts are packed into 6.0m stock bars using First-Fit-Decreasing algorithm to minimize scrap. 5mm kerf allowance is deducted per cut.",
                "Cutting Pattern Map: Visual modal shows each 6m bar as a colored segment diagram with efficiency % and total waste (m) per material type.",
                "Unit Prices: Pulled from the Materials Price List, keyed by exact type+size+thickness combination (e.g., angle_bar_50mm x 50mm (2\"x2\")_3.0mm)."
            ]
        },
        {
            id: 'electrical',
            title: 'Electrical Works',
            icon: <Zap size={16} className="text-amber-600" />,
            steps: [
                "Fixtures & Devices: Aggregates direct unit quantities input by the user.",
                "Rough-in Logic: Calculates automated pricing for items but excludes automatic wire/conduit estimation to maintain precision for unique floor plans."
            ]
        },
        {
            id: 'plumbing',
            title: 'Plumbing Works',
            icon: <Droplets size={16} className="text-amber-600" />,
            steps: [
                "Fixtures: Aggregates direct unit quantities input by the user.",
                "Piping & Fittings: Evaluated as discrete item counts per schedule row. Pricing is dynamically pulled from the materials database."
            ]
        },
        {
            id: 'rebar-cutting',
            title: 'Optimization Schedules',
            icon: <Scissors size={16} className="text-slate-600" />,
            steps: [
                "Bar Bending Schedule (BBS): Displays actual physical cut lengths for every element, accounting for concrete cover, seismic hooks (135°), and overlap splices.",
                "Global Cutting List: Aggregates all cuts across the project. It tests standard stock lengths (6m, 7.5m, 9m, 10.5m, 12m) and recommends the most efficient stock purchase for each diameter to minimize total project scrap waste."
            ]
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className={`bg-white p-6 rounded-sm border-t-4 border-t-${THEME}-500 border-x border-b border-zinc-200 shadow-sm relative overflow-hidden`}>
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
                    <div className={`bg-white p-6 rounded-sm border-l-4 border-l-${THEME}-500 border-y border-r border-zinc-200 shadow-sm`}>
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
                    <div className={`bg-white p-6 rounded-sm border-l-4 border-l-${THEME}-500 border-y border-r border-zinc-200 shadow-sm mb-4`}>
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
                                                if (typeof step !== 'string') {
                                                    return <li key={idx} className="leading-relaxed list-none -ml-4">{step}</li>;
                                                }
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
