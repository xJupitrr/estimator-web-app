import React from 'react';
import { ClipboardCopy, Download } from 'lucide-react';
import { BUTTON_UI } from '../../constants/designSystem';

const ExportButtons = ({ onCopy, onDownload, items = [], filename = "estimate.csv" }) => (
    <div className="flex gap-2">
        <button
            onClick={onCopy}
            className={BUTTON_UI.EXPORT}
            title="Copy table to clipboard for Excel"
        >
            <ClipboardCopy size={14} /> Copy to Clipboard
        </button>
        <button
            onClick={onDownload}
            className={BUTTON_UI.EXPORT}
            title="Download as CSV"
        >
            <Download size={14} /> Download CSV
        </button>
    </div>
);

export default React.memo(ExportButtons);
