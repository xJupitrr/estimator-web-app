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
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
                {copied ? (
                    <><Check size={16} className="text-emerald-600" /> Copied</>
                ) : (
                    <><ClipboardCopy size={16} className="text-slate-500" /> Copy to Clipboard</>
                )}
            </button>
            <button
                onClick={() => downloadCSV(items, filename, inputs, inputHeaders)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
                <Download size={16} className="text-slate-500" /> Download CSV
            </button>
        </>
    );
}
