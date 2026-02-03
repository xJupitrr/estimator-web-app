import React, { useState } from 'react';
import { PlusCircle, Calculator } from 'lucide-react';

const UNITS = [
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'm', label: 'Meters (m)' },
    { value: 'sqm', label: 'Square Meters (m²)' },
    { value: 'cum', label: 'Cubic Meters (m³)' },
    { value: 'kg', label: 'Kilograms (kg)' },
];

const CATEGORIES = ['Structure', 'Wall', 'Floor', 'Roof', 'Electrical', 'Plumbing', 'Finishes', 'Others'];

const INITIAL_STATE = {
    name: '',
    category: 'Structure',
    length: '',
    width: '',
    height: '',
    quantity: '1',
    unit: 'pcs',
    unitPrice: '',
};

export default function InputForm({ onAddItem }) {
    const [formData, setFormData] = useState(INITIAL_STATE);

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddItem({
            id: Date.now() + Math.random(),
            ...formData,
            timestamp: Date.now(),
        });
        setFormData(INITIAL_STATE);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Calculator size={20} />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Add Material</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Item Name</label>
                    <input
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., 16mm Rebar, Cemenet Bags"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Category</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Unit</label>
                    <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Length (m)</label>
                    <input
                        type="number"
                        step="0.01"
                        name="length"
                        value={formData.length}
                        onChange={handleChange}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        disabled={['pcs', 'kg', 'l'].includes(formData.unit)}
                        title={['pcs', 'kg'].includes(formData.unit) ? "Not applicable for this unit" : ""}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Width (m)</label>
                    <input
                        type="number"
                        step="0.01"
                        name="width"
                        value={formData.width}
                        onChange={handleChange}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        disabled={['pcs', 'kg', 'l', 'm'].includes(formData.unit)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Height (m)</label>
                    <input
                        type="number"
                        step="0.01"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        disabled={['pcs', 'kg', 'l', 'm', 'sqm'].includes(formData.unit)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
                    <input
                        required
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Unit Price ($)</label>
                    <input
                        required
                        type="number"
                        step="0.01"
                        name="unitPrice"
                        value={formData.unitPrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-medium"
                    />
                </div>
            </div>

            <button
                type="submit"
                className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
                <PlusCircle size={18} />
                Add to Estimate
            </button>
        </form>
    );
}
