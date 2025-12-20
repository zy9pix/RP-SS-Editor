import React, { useState } from 'react';
import {
    ImageIcon, Crop as CropIcon, Layers, Plus, Trash2, Edit, ChevronDown, ChevronUp, Download, Clapperboard, Minimize, Settings as SettingsIcon, Type
} from 'lucide-react';
import { useEditor } from '@/src/context/EditorContext';
import ImageAdjustments from './ImageAdjustments';
import { FONT_OPTIONS } from '@/src/utils/constants';

const ToolPanel = () => {
    const {
        t,
        originalImage, setOriginalImage, setProcessedImage, setIsManualCropping, setCropSelection, setStatusMsg,
        isProcessing, isManualCropping,
        fontFamily, setFontFamily, fontSize, setFontSize, lineHeight, setLineHeight, strokeWidth, setStrokeWidth,
        fontBold, setFontBold, textBackground, setTextBackground,
        exportFormat, setExportFormat,
        processedImage, setIsSettingsOpen,
        textLayers, addTextLayer, activeLayerId, setActiveLayerId, removeTextLayer, setIsTextModalOpen,
        isCinematic, setIsCinematic,
        isLinearGradient, setIsLinearGradient,
        resolutionPresets, setTargetWidth, setTargetHeight
    } = useEditor();

    const [isAdjustmentsOpen, setIsAdjustmentsOpen] = useState(false);

    // Handlers
    const startCropWithPreset = (w: number, h: number) => {
        setTargetWidth(w);
        setTargetHeight(h);
        setIsManualCropping(true);
        setProcessedImage(null);
        setCropSelection(null);
        setStatusMsg(t('cropPrompt'));
    };

    const handleExport = async () => {
        window.dispatchEvent(new CustomEvent("RP_EDITOR_EXPORT"));
    };

    // --- Active Layer logic ---
    const activeLayer = textLayers.find(l => l.id === activeLayerId);

    return (
        <aside className="w-full md:w-80 h-full flex flex-col gap-4 overflow-y-auto z-20 shadow-2xl scrollbar-thin border-l border-[#1a1a1a]"
            style={{ backgroundColor: '#0B0B0C' }} // Requested Deep Black
        >
            {/* Header */}
            <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between sticky top-0 bg-[#0B0B0C] z-30">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    <span style={{ color: '#CFD71B' }}>RP</span> Editor
                </h1>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-gray-500 hover:text-white transition-colors"
                >
                    <SettingsIcon size={18} />
                </button>
            </div>

            <div className="flex-1 px-4 space-y-6 pb-4">

                {/* 1. Global Controls / Image Actions */}
                {originalImage && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <span>Image Tools</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setIsCinematic(!isCinematic)}
                                className={`py-3 px-2 rounded flex flex-col items-center justify-center gap-1 font-medium text-xs transition-all border ${isCinematic
                                        ? "bg-[#CFD71B]/10 text-[#CFD71B] border-[#CFD71B]/50"
                                        : "bg-[#141414] hover:bg-[#1a1a1a] text-gray-400 border-transparent"
                                    }`}
                            >
                                <Clapperboard size={18} />
                                <span>Cinema</span>
                            </button>
                            <button
                                onClick={() => setIsLinearGradient(!isLinearGradient)}
                                className={`py-3 px-2 rounded flex flex-col items-center justify-center gap-1 font-medium text-xs transition-all border ${isLinearGradient
                                        ? "bg-[#CFD71B]/10 text-[#CFD71B] border-[#CFD71B]/50"
                                        : "bg-[#141414] hover:bg-[#1a1a1a] text-gray-400 border-transparent"
                                    }`}
                            >
                                <Minimize size={18} className="rotate-180" />
                                <span>Gradient</span>
                            </button>
                        </div>

                        {/* Crop Presets */}
                        {!isManualCropping && (
                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] text-gray-600 uppercase font-bold">Crop Presets</label>
                                <div className="grid grid-cols-3 gap-1">
                                    {resolutionPresets.slice(0, 3).map((preset, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => startCropWithPreset(preset.width, preset.height)}
                                            className="bg-[#141414] hover:bg-[#222] text-gray-300 text-[10px] py-1.5 px-1 rounded border border-[#1a1a1a] truncate"
                                        >
                                            {preset.label.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* 2. Image Adjustments */}
                {originalImage && !isManualCropping && (
                    <section className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#101010]">
                        <button
                            onClick={() => setIsAdjustmentsOpen(!isAdjustmentsOpen)}
                            className="w-full flex items-center justify-between p-3 hover:bg-[#1a1a1a] transition-colors"
                        >
                            <span className="text-xs font-bold text-gray-300 flex items-center gap-2">
                                <ImageIcon size={14} className="text-[#CFD71B]" /> Adjustments
                            </span>
                            {isAdjustmentsOpen ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                        </button>
                        {isAdjustmentsOpen && (
                            <div className="p-3 bg-[#0d0d0d] border-t border-[#1a1a1a]">
                                <ImageAdjustments />
                            </div>
                        )}
                    </section>
                )}

                {/* 3. Text Layers */}
                <section className="flex flex-col gap-3 min-h-[200px]">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Layers size={14} /> Layers
                        </div>
                        <button
                            onClick={addTextLayer}
                            style={{ backgroundColor: '#CFD71B', color: 'black' }}
                            className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(207,215,27,0.2)]"
                        >
                            <Plus size={12} /> New Text
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[#101010] rounded-lg border border-[#1a1a1a] p-1 space-y-1 max-h-[250px]">
                        {textLayers.length === 0 && (
                            <div className="h-20 flex flex-col items-center justify-center text-gray-600 text-xs">
                                <Layers size={20} className="mb-2 opacity-50" />
                                <span>No layers yet</span>
                            </div>
                        )}
                        {textLayers.map((layer, idx) => (
                            <div
                                key={layer.id}
                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all border ${activeLayerId === layer.id
                                        ? 'bg-[#1a1a1a] border-[#CFD71B]/30'
                                        : 'hover:bg-[#161616] border-transparent'
                                    }`}
                                onClick={() => setActiveLayerId(layer.id)}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${activeLayerId === layer.id ? 'bg-[#CFD71B] text-black' : 'bg-[#222] text-gray-500'}`}>
                                        {idx + 1}
                                    </span>
                                    <span className={`text-xs truncate ${activeLayerId === layer.id ? 'text-gray-200' : 'text-gray-500'}`}>
                                        {layer.lines.length > 0 ? layer.lines[0].text : "(Empty)"}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveLayerId(layer.id); setIsTextModalOpen(true); }}
                                        className="p-1.5 hover:text-[#CFD71B] text-gray-600 transition-colors"
                                    >
                                        <Edit size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeTextLayer(layer.id); }}
                                        className="p-1.5 hover:text-red-500 text-gray-600 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. Text Properties (Always visible, applying to GLOBAL) */}
                <section className="space-y-4 pt-4 border-t border-[#1a1a1a]">
                    <h3 className="text-[10px] uppercase font-bold text-gray-500">Global Text Style</h3>

                    <div className="space-y-3">
                        {/* Font Family */}
                        <div className="relative">
                            <select
                                value={fontFamily}
                                onChange={(e) => setFontFamily(e.target.value)}
                                className="w-full bg-[#141414] border border-[#1a1a1a] rounded px-3 py-2 text-xs text-gray-300 outline-none focus:border-[#CFD71B] appearance-none"
                            >
                                {FONT_OPTIONS.map(font => (
                                    <option key={font.value} value={font.value}>{font.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-2.5 text-gray-500 pointer-events-none" />
                        </div>

                        {/* Size & Line Height */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] text-gray-600 uppercase mb-1 block">Size</label>
                                <input
                                    type="number"
                                    value={fontSize}
                                    onChange={e => setFontSize(Number(e.target.value))}
                                    className="w-full bg-[#141414] border border-[#1a1a1a] rounded px-2 py-1.5 text-xs text-gray-300 focus:border-[#CFD71B] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] text-gray-600 uppercase mb-1 block">Spacing</label>
                                <input
                                    type="number"
                                    value={lineHeight}
                                    onChange={e => setLineHeight(Number(e.target.value))}
                                    className="w-full bg-[#141414] border border-[#1a1a1a] rounded px-2 py-1.5 text-xs text-gray-300 focus:border-[#CFD71B] outline-none"
                                />
                            </div>
                        </div>

                        {/* Stroke */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-[9px] text-gray-600 uppercase">Outline</label>
                                <span className="text-[9px] text-gray-400">{strokeWidth}px</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="5" step="0.5"
                                value={strokeWidth}
                                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                                disabled={textBackground}
                                className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-[#CFD71B]"
                            />
                        </div>

                        {/* Toggles */}
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={fontBold} onChange={(e) => setFontBold(e.target.checked)} className="accent-[#CFD71B] bg-[#141414]" />
                                <span className="text-xs text-gray-400">Bold</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={textBackground} onChange={(e) => setTextBackground(e.target.checked)} className="accent-[#CFD71B] bg-[#141414]" />
                                <span className="text-xs text-gray-400">Background</span>
                            </label>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer / Export */}
            <div className="p-4 bg-[#0d0d0d] border-t border-[#1a1a1a] sticky bottom-0 z-30">
                <div className="flex gap-2">
                    <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                        className="bg-[#141414] border border-[#1a1a1a] rounded px-2 text-xs text-gray-400 outline-none w-20"
                    >
                        <option value="png">PNG</option>
                        <option value="jpeg">JPG</option>
                        <option value="webp">WEBP</option>
                    </select>
                    <button
                        onClick={handleExport}
                        disabled={!processedImage && !originalImage}
                        style={{ backgroundColor: '#CFD71B' }}
                        className="flex-1 py-2 text-black rounded font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all hover:brightness-110"
                    >
                        <Download size={16} />
                        {t('export')}
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default ToolPanel;
