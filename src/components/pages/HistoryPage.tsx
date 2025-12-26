import React, { useState } from 'react';
import { ArrowLeft, Copy, ExternalLink, Calendar, Trash2, CheckCircle } from 'lucide-react';
import { useEditor } from '@/src/context/EditorContext';

const HistoryPage = () => {
    const { uploadHistory, t, clearHistory, setCurrentView } = useEditor();
    const [auditLog, setAuditLog] = useState<string | null>(null);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setAuditLog(text);
        setTimeout(() => setAuditLog(null), 2000);
    };

    return (
        <div className="flex-1 bg-[#050505] p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1a1a1a]">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentView('editor')}
                            className="bg-[#141414] hover:bg-[#222] text-gray-400 hover:text-white p-2 rounded-full transition-all border border-[#1a1a1a]"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-bold text-white">Upload History</h1>
                    </div>
                    {uploadHistory.length > 0 && (
                        <button
                            onClick={clearHistory}
                            className="text-red-500 text-sm flex items-center gap-2 hover:text-red-400 bg-red-500/10 px-4 py-2 rounded border border-red-500/20"
                        >
                            <Trash2 size={16} /> Clear All
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {uploadHistory.length === 0 ? (
                        <div className="text-center text-gray-500 py-20 bg-[#0B0B0C] rounded-lg border border-[#1a1a1a]">
                            <p className="text-lg">No uploads yet.</p>
                            <p className="text-sm mt-2 opacity-50">Images you upload to ImgBB will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {uploadHistory.map((item) => (
                                <div key={item.id} className="bg-[#0B0B0C] border border-[#1a1a1a] rounded-lg p-4 flex gap-4 group hover:border-[#CFD71B]/30 transition-all">
                                    <div className="w-24 h-24 bg-black rounded overflow-hidden flex-shrink-0 border border-[#1a1a1a]">
                                        <img src={item.link} alt="thumb" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">

                                        {/* Link Input */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        readOnly
                                                        value={item.link}
                                                        className="w-full bg-[#141414] border border-[#222] rounded px-3 py-2 text-xs text-gray-300 truncate cursor-pointer hover:border-[#CFD71B] focus:outline-none focus:border-[#CFD71B]"
                                                        onClick={() => copyToClipboard(item.link)}
                                                    />
                                                    {auditLog === item.link && (
                                                        <span className="absolute right-2 top-1.5 text-[#CFD71B] animate-in fade-in duration-200">
                                                            <CheckCircle size={14} />
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(item.link)}
                                                    className="bg-[#CFD71B] hover:bg-[#e5ed3b] text-black p-2 rounded transition-colors"
                                                    title="Copy Link"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] text-gray-600 flex items-center gap-1">
                                                <Calendar size={12} /> {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
                                            </span>
                                            <a
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-[#CFD71B] hover:underline flex items-center gap-1 font-medium"
                                            >
                                                Open Image <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;
