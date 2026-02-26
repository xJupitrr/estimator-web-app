import React, { useState } from 'react';
import { Tag, Search, Filter, Box, Hammer, Zap, Droplets, LayoutTemplate, Layers, Scissors, Info, Edit3, Save, X, RefreshCw } from 'lucide-react';
import { MATERIAL_DEFAULTS, getDefaultPrices } from '../constants/materials';
import { TABLE_UI } from '../constants/designSystem';
import useLocalStorage from '../hooks/useLocalStorage';

const MaterialPriceList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Manage Global Prices
    const [prices, setPrices] = useLocalStorage('app_material_prices', getDefaultPrices());

    // Track local edits before saving
    const [editingKey, setEditingKey] = useState(null);
    const [editValue, setEditValue] = useState("");

    // Categorize materials based on their keys or names (heuristic)
    const getCategory = (key) => {
        if (key.includes('cement') || key.includes('sand') || key.includes('gravel') || key.includes('bedding')) return 'Aggregates';
        if (key.includes('chb')) return 'Masonry';
        if (key.includes('rebar')) return 'Reinforcements';
        if (key.includes('tie_wire')) return 'Accessories';
        // Formworks / Sheet Goods
        if (key === 'phenolic_1_2' || key === 'phenolic_3_4') return 'Formworks';
        if (key === 'plywood_1_4' || key === 'plywood_1_2' || key === 'plywood_3_4') return 'Drywall';
        if (key.includes('plywood_phenolic') || key.includes('plywood_marine')) return 'Sheet Goods';
        if (key === 'cocoLumber' || key === 'gi_pipe_1_1_2') return 'Formworks';
        if (key.includes('lumber') || key.includes('coco_lumber')) return 'Timber';
        if (key.includes('nails') || key.includes('common_nails')) return 'Hardware';
        if (key.includes('tile') || key.includes('grout') || key.includes('tile_adhesive')) return 'Tiles & Finishes';
        if (key.includes('roof') || key.includes('tekscrew') || (key.includes('sealant') && !key.includes('dw_'))) return 'Roofing';
        if (key.includes('deck') || key.includes('h_frame') || key.includes('cross_brace') || key.includes('u_head') || key.includes('shackle')) return 'Scaffolding';
        // Ceiling
        if (key.includes('ceiling') || key.includes('metal_furring') || key.includes('carrying_channel') || key.includes('blind_rivets') || key.includes('gypsum_board') || key.includes('w_clip') || key.includes('mesh_tape') || key.includes('joint_compound') || key.includes('wall_angle') || key === 'spandrel' || key === 'pvc' || key === 'spandrel_molding' || key === 'pvc_u_molding' || key === 'pvc_h_clip' || key === 'clips' || key.includes('screw_gypsum') || key.includes('screw_hardiflex') || key.includes('screw_metal') || key === 'rivets') return 'Ceiling';
        if (key.includes('paint') || key.includes('skimcoat')) return 'Painting';
        // Drywall boards & insulation
        if (key.startsWith('gypsum_') || key.startsWith('fcb_') || key === 'wpc_fluted' || key === 'acoustic_board' || key === 'drywall_metal_stud' || key === 'drywall_metal_track' || key === 'clips_wpc') return 'Drywall';
        if (key === 'glasswool' || key === 'pe_foam' || key === 'eps_foam' || key === 'rockwool' || key === 'acoustic_fiberglass') return 'Insulation';
        // Plumbing
        if (key.startsWith('ppr_') || key.startsWith('pvc_pipe') || key.startsWith('pvc_elbow') || key.startsWith('pvc_sanitary') || key.startsWith('pvc_wye') || key.startsWith('pvc_cleanout') || key.startsWith('pvc_p_trap') || key.startsWith('pvc_vent') || key.startsWith('pvc_reducer') || key === 'solvent_cement' || key === 'teflon_tape' || key.startsWith('pipe_clamp') || key === 'wc_set' || key === 'lav_set' || key === 'sink_set' || key === 'shower_set' || key === 'hose_bibb' || key === 'floor_drain' || key === 'roof_drain' || key === 'catch_basin' || key === 'urinal_set' || key === 'bidet_set' || key === 'bathtub_set' || key === 'grease_trap' || key === 'water_heater_single' || key === 'water_heater_multi' || key === 'kitchen_faucet' || key === 'lavatory_faucet' || key === 'angle_valve' || key === 'flex_hose' || key === 'laundry_tray') return 'Plumbing';
        // Electrical sub-categories
        if (key.startsWith('thhn_') || key.startsWith('bare_copper') || key === 'pv_cable_4' || key === 'coax_cable' || key === 'cat6_cable') return 'Wiring';
        if (key.startsWith('pvc_pipe_') || key.startsWith('pvc_adapter') || key.startsWith('pvc_locknut') || key.startsWith('pvc_solvent') || key.startsWith('rsc_') || key.startsWith('entrance_cap') || key.startsWith('pipe_strap') || key.startsWith('flex_hose_') || key.startsWith('flex_connector') || key.startsWith('molding_') || key === 'pvc_pipe_20mm' || key === 'pvc_pipe_25mm' || key === 'pvc_pipe_32mm') return 'Conduit & Fittings';
        if (key.startsWith('utility_box') || key.startsWith('junction_box') || key.startsWith('square_box') || key.startsWith('octagonal_box') || key.startsWith('box_cover')) return 'Conduit & Fittings';
        if (key.startsWith('led_') || key.startsWith('integrated_led') || key.startsWith('flood_light') || key.startsWith('downlight') || key.startsWith('track_') || key.startsWith('surface_downlight') || key.startsWith('panel_light') || key === 'gu10_socket' || key === 'ceiling_receptacle' || key === 'emergency_light' || key === 'exit_sign' || key.startsWith('post_lamp') || key === 'garden_spike_light' || key === 'solar_street_light' || key === 'high_bay_light' || key === 't5_led_batten' || key === 'rope_light' || key === 'pendant_light' || key === 'wall_sconce' || key === 'step_light') return 'Lighting';
        if (key.startsWith('switch_') || key.startsWith('outlet_') || key.startsWith('dimmer') || key === 'fan_control' || key.startsWith('water_heater_switch') || key === 'data_outlet' || key === 'tel_outlet') return 'Wiring Devices';
        if (key.startsWith('panel_board') || key.startsWith('breaker_') || key === 'mts_switch' || key === 'meter_base' || key === 'sub_meter') return 'Panel & Breakers';
        if (key === 'smoke_detector' || key === 'doorbell' || key === 'ground_rod' || key === 'ground_clamp' || key === 'weatherproof_enclosure' || key === 'mc4_connector' || key === 'tox_screw' || key === 'expansion_bolt' || key === 'electrical_tape') return 'Electrical';
        if (key.startsWith('elec_')) return 'Electrical';
        if (key.includes('drywall')) return 'Drywall';
        if (key.includes('dw_')) return 'Doors & Windows';
        if (key.includes('angle_bar') || key.includes('c_purlin') || key.includes('c_channel') || key.startsWith('tubular_square') || key.startsWith('tubular_rect') || key.includes('tubular')) return 'Steel Truss';
        return 'Other';
    };

    const categories = [
        'All',
        // Structure
        'Aggregates', 'Masonry', 'Reinforcements', 'Accessories',
        // Finishes
        'Tiles & Finishes', 'Ceiling', 'Painting', 'Drywall', 'Insulation',
        // Formworks & Scaffolding
        'Formworks', 'Sheet Goods', 'Timber', 'Hardware', 'Scaffolding',
        // MEP
        'Plumbing',
        'Wiring', 'Conduit & Fittings', 'Wiring Devices', 'Lighting', 'Panel & Breakers', 'Electrical',
        // Envelope
        'Roofing', 'Doors & Windows', 'Steel Truss',
    ];

    const materials = Object.entries(MATERIAL_DEFAULTS).map(([key, data]) => ({
        key,
        ...data,
        price: prices[key] !== undefined ? prices[key] : data.price,
        category: getCategory(key)
    }));

    const filteredMaterials = materials.filter(m => {
        const matchesSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleStartEdit = (key, currentPrice) => {
        setEditingKey(key);
        setEditValue(currentPrice.toString());
    };

    const handleSaveEdit = (key) => {
        const newPrice = parseFloat(editValue);
        if (!isNaN(newPrice)) {
            setPrices(prev => ({
                ...prev,
                [key]: newPrice
            }));
            // Trigger total update across the app
            window.dispatchEvent(new CustomEvent('project-total-update'));
        }
        setEditingKey(null);
    };

    const handleResetToDefault = () => {
        if (window.confirm("Reset all material prices to system defaults? This will affect all calculations.")) {
            setPrices(getDefaultPrices());
            window.dispatchEvent(new CustomEvent('project-total-update'));
        }
    };

    const getCategoryIcon = (cat) => {
        switch (cat) {
            case 'Aggregates': return <LayoutTemplate size={14} />;
            case 'Masonry': return <Box size={14} />;
            case 'Reinforcements': return <Scissors size={14} />;
            case 'Sheet Goods': return <Layers size={14} />;
            case 'Timber': return <Hammer size={14} />;
            case 'Hardware': return <Hammer size={14} />;
            case 'Accessories': return <Tag size={14} />;
            case 'Tiles & Finishes': return <Layers size={14} />;
            case 'Roofing': return <Box size={14} />;
            case 'Scaffolding': return <Box size={14} />;
            case 'Formworks': return <Layers size={14} />;
            case 'Ceiling': return <LayoutTemplate size={14} />;
            case 'Painting': return <Droplets size={14} />;
            case 'Drywall': return <Layers size={14} />;
            case 'Insulation': return <Layers size={14} />;
            case 'Plumbing': return <Droplets size={14} />;
            case 'Wiring': return <Zap size={14} />;
            case 'Conduit & Fittings': return <Box size={14} />;
            case 'Wiring Devices': return <Zap size={14} />;
            case 'Lighting': return <Zap size={14} />;
            case 'Panel & Breakers': return <Zap size={14} />;
            case 'Electrical': return <Zap size={14} />;
            case 'Doors & Windows': return <Box size={14} />;
            case 'Steel Truss': return <Scissors size={14} />;
            default: return <Info size={14} />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section — matches Manual & FAQ style */}
            <div className="bg-white p-6 rounded-sm border-t-4 border-t-slate-500 border-x border-b border-zinc-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-1/3 -translate-y-1/3 opacity-50 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm shrink-0">
                            <Tag size={24} className="text-slate-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-tight">Materials &amp; Unit Prices</h2>
                            <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
                                Standardized unit rates for estimation. Edit any price to apply it globally across all calculation tabs.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-slate-600 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-sm text-xs font-bold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 transition-all w-full sm:w-64"
                            />
                        </div>
                        <button
                            onClick={handleResetToDefault}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 text-zinc-600 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-50 hover:text-zinc-900 transition-all rounded-sm shadow-sm"
                        >
                            <RefreshCw size={14} /> Reset Defaults
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all border ${selectedCategory === cat
                            ? 'bg-slate-600 border-slate-600 text-white shadow-md'
                            : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Price Table */}
            <div className={TABLE_UI.CONTAINER}>
                <div className="overflow-y-auto max-h-[calc(100vh-22rem)]">
                    <table className={TABLE_UI.TABLE}>
                        <thead className="sticky top-0 z-10">
                            <tr className={TABLE_UI.HEADER_ROW}>
                                <th className={TABLE_UI.HEADER_CELL_LEFT}>Item Description</th>
                                <th className={TABLE_UI.HEADER_CELL_LEFT}>Category</th>
                                <th className={TABLE_UI.HEADER_CELL}>Unit</th>
                                <th className={TABLE_UI.HEADER_CELL_RIGHT}>Unit Price (₱)</th>
                                <th className={`${TABLE_UI.HEADER_CELL} w-24`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filteredMaterials.map((item) => (
                                <tr key={item.key} className="hover:bg-zinc-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zinc-900 group-hover:text-slate-700 transition-colors">
                                                {item.name}
                                            </span>
                                            <span className="text-[11px] font-mono text-zinc-400 mt-0.5 uppercase tracking-tighter">
                                                SKU: {item.key}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-2 px-2 py-1 bg-zinc-100 text-xs font-bold text-zinc-600 rounded-sm uppercase tracking-wider">
                                            <span className="opacity-70">{getCategoryIcon(item.category)}</span>
                                            {item.category}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-mono font-bold text-zinc-500 uppercase">
                                            {item.unit}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {editingKey === item.key ? (
                                            <div className="flex items-center justify-end gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-sm">
                                                <span className="text-[10px] text-yellow-600 font-bold">₱</span>
                                                <input
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-24 bg-transparent border-none text-right font-bold text-sm focus:ring-0 p-0 text-yellow-900"
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-1.5 font-bold text-base text-zinc-900 group-hover:text-slate-600 transition-colors">
                                                <span className="text-xs text-zinc-400 font-normal">₱</span>
                                                {item.price?.toLocaleString('en-PH', { minimumFractionDigits: 2 }) || '0.00'}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {editingKey === item.key ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleSaveEdit(item.key)}
                                                    className="p-1.5 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 transition-colors shadow-sm"
                                                    title="Save Changes"
                                                >
                                                    <Save size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingKey(null)}
                                                    className="p-1.5 bg-zinc-200 text-zinc-600 rounded-sm hover:bg-zinc-300 transition-colors"
                                                    title="Cancel"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleStartEdit(item.key, item.price)}
                                                className="p-1.5 text-zinc-400 hover:text-slate-600 hover:bg-slate-50 transition-all rounded-sm opacity-0 group-hover:opacity-100"
                                                title="Edit Unit Price"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredMaterials.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Search size={32} />
                                            <p className="text-xs font-bold uppercase tracking-widest font-mono">No matching items found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-100 flex justify-between items-center">
                    <p className="text-[10px] text-zinc-400 font-mono tracking-wide">
                        TOTAL ITEMS IN CATALOG: {materials.length}
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            Synchronized Global State
                        </div>
                    </div>
                </div>
            </div>

            {/* Note Section */}
            <div className={`p-4 bg-slate-50 border border-slate-200 rounded-sm flex items-start gap-4 shadow-sm`}>
                <div className="p-2 bg-slate-100 rounded-sm text-slate-600 flex-shrink-0">
                    <Info size={16} />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">Global Price Synchronization</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                        Adjusting unit prices here will automatically update calculations across all system modules (Structure, Finishes, etc.) in real-time. These changes are saved to your local project session.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MaterialPriceList;
