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
        if (key.includes('wire') || key.includes('tie_wire')) return 'Accessories';
        if (key.includes('plywood') || key.includes('phenolic') || key.includes('marine')) return 'Sheet Goods';
        if (key.includes('lumber') || key.includes('coco_lumber')) return 'Timber';
        if (key.includes('nails') || key.includes('common_nails')) return 'Hardware';
        if (key.includes('tile') || key.includes('grout') || key.includes('adhesive')) return 'Tiles & Finishes';
        if (key.includes('roof') || key.includes('tekscrew') || key.includes('sealant') && !key.includes('dw_')) return 'Roofing';
        if (key.includes('deck') || key.includes('h_frame') || key.includes('cross_brace') || key.includes('u_head') || key.includes('shackle')) return 'Scaffolding';
        if (key.includes('ceiling') || key.includes('metal_furring') || key.includes('carrying_channel') || key.includes('blind_rivets') || key.includes('gypsum_board') || key.includes('w_clip') || key.includes('mesh_tape') || key.includes('joint_compound') || key.includes('wall_angle')) return 'Ceiling';
        if (key.includes('paint') || key.includes('skimcoat')) return 'Painting';
        if (key.includes('pvc_pipe') || key.includes('ppr_pipe') || key.includes('wc_set') || key.includes('lav_set') || key.includes('sink_set')) return 'Plumbing';
        if (key.includes('thhn') || key.includes('elec_')) return 'Electrical';
        if (key.includes('drywall')) return 'Drywall';
        if (key.includes('dw_')) return 'Doors & Windows';
        if (key.includes('angle_bar') || key.includes('c_purlin') || key.includes('tubular')) return 'Steel Truss';
        return 'Other';
    };

    const categories = [
        'All', 'Aggregates', 'Masonry', 'Reinforcements', 'Accessories',
        'Sheet Goods', 'Timber', 'Hardware', 'Tiles & Finishes', 'Roofing',
        'Scaffolding', 'Ceiling', 'Painting', 'Plumbing', 'Electrical',
        'Drywall', 'Doors & Windows', 'Steel Truss'
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
            case 'Hardware': return <Zap size={14} />;
            case 'Accessories': return <Tag size={14} />;
            case 'Tiles & Finishes': return <Layers size={14} />;
            case 'Roofing': return <Box size={14} />;
            case 'Scaffolding': return <Box size={14} />;
            case 'Ceiling': return <LayoutTemplate size={14} />;
            case 'Painting': return <Droplets size={14} />;
            case 'Plumbing': return <Droplets size={14} />;
            case 'Electrical': return <Zap size={14} />;
            case 'Drywall': return <Layers size={14} />;
            case 'Doors & Windows': return <Box size={14} />;
            case 'Steel Truss': return <Scissors size={14} />;
            default: return <Info size={14} />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-sm border border-zinc-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-600"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Tag className="text-slate-600" size={18} />
                            <h2 className="text-sm font-mono font-bold uppercase tracking-[0.2em] text-slate-600">Master Item Directory</h2>
                        </div>
                        <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight" style={{ fontFamily: "'Anton', sans-serif" }}>
                            Materials & Unit Prices
                        </h1>
                        <p className="text-xs text-zinc-500 font-mono mt-1">Standardized rates for estimation and site budgeting</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
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
                <table className={TABLE_UI.TABLE}>
                    <thead>
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
                                        <span className="text-xs font-bold text-zinc-900 group-hover:text-slate-700 transition-colors">
                                            {item.name}
                                        </span>
                                        <span className="text-[9px] font-mono text-zinc-400 mt-0.5 uppercase tracking-tighter">
                                            SKU: {item.key}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="inline-flex items-center gap-2 px-2 py-1 bg-zinc-100 text-[10px] font-bold text-zinc-600 rounded-sm uppercase tracking-wider">
                                        <span className="opacity-70">{getCategoryIcon(item.category)}</span>
                                        {item.category}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
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
                                        <div className="flex items-center justify-end gap-1.5 font-bold text-sm text-zinc-900 group-hover:text-slate-600 transition-colors">
                                            <span className="text-[10px] text-zinc-400 font-normal">₱</span>
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
