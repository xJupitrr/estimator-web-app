import React, { useState } from 'react';
import { ClipboardCopy, Download, Check } from 'lucide-react';
import { copyToClipboard, downloadCSV } from '../../utils/export';

export default function ExportButtons({ items, filename = 'estimate.csv', inputs = [], inputHeaders = [] }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const success = await copyToClipboard(items);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-200"
            >
                {copied ? (
                    <><Check size={16} className="text-green-600" /> Copied</>
                ) : (
                    <><ClipboardCopy size={16} className="text-slate-500" /> Copy</>
                )}
            </button>
            <button
                onClick={() => downloadCSV(items, filename, inputs, inputHeaders)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors focus:ring-2 focus:ring-blue-200"
            >
                <Download size={16} className="text-blue-500" /> CSV
            </button>
        </>
    );
}
