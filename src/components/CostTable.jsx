import React from 'react';
import { Trash2, TrendingUp, Package } from 'lucide-react';
import { calculateMaterial } from '../utils/calculator';
import clsx from 'clsx';

export default function CostTable({ items, onDelete }) {
    const calculations = items.map(item => ({
        ...item,
        ...calculateMaterial(item)
    }));

    const grandTotal = calculations.reduce((sum, item) => sum + item.totalCost, 0);

    if (items.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-800">No items added yet</h3>
                <p className="text-slate-500 mt-1">Start by adding materials above.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-left">
                            <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Details</th>
                            <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Dimensions</th>
                            <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Qty</th>
                            <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total Qty</th>
                            <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Unit Price</th>
                            <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total Price</th>
                            <th className="py-4 px-6 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {calculations.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="font-medium text-slate-800">{item.name}</div>
                                    <div className="text-xs text-slate-500 inline-block px-2 py-0.5 rounded-full bg-slate-100 mt-1">
                                        {item.category}
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-right font-mono text-sm text-slate-600">
                                    {['m', 'sqm', 'cum'].includes(item.unit) ? (
                                        <>
                                            {item.length && <span title="Length">L:{item.length}</span>}
                                            {item.width && <span title="Width" className="ml-2">W:{item.width}</span>}
                                            {item.height && <span title="Height" className="ml-2">H:{item.height}</span>}
                                        </>
                                    ) : <span className="text-slate-300">-</span>}
                                </td>
                                <td className="py-4 px-6 text-right text-slate-600">{item.quantity}</td>
                                <td className="py-4 px-6 text-right font-medium text-slate-800">
                                    {item.calculatedQuantity} <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                                </td>
                                <td className="py-4 px-6 text-right text-slate-600">${parseFloat(item.unitPrice).toFixed(2)}</td>
                                <td className="py-4 px-6 text-right font-bold text-slate-800">${item.totalCost.toFixed(2)}</td>
                                <td className="py-4 px-6">
                                    <button
                                        onClick={() => onDelete(item.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr>
                            <td colSpan={5} className="py-4 px-6 text-right font-bold text-slate-600">Grand Total</td>
                            <td className="py-4 px-6 text-right font-bold text-2xl text-blue-600">${grandTotal.toFixed(2)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
