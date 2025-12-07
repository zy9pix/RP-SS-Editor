import React, { useState } from 'react';
import {
    ImageIcon, Crop as CropIcon, Layers, Plus, Trash2, Edit, ChevronDown, ChevronUp, Download, Clapperboard, Minimize
} from 'lucide-react';
import { useEditor } from '@/src/context/EditorContext';
import ImageAdjustments from './ImageAdjustments';
import { FONT_OPTIONS } from '@/src/utils/constants';

const Sidebar = () => {
    const {
        t,
        originalImage, setOriginalImage, setProcessedImage, setIsManualCropping, setCropSelection, setStatusMsg,
        isProcessing, isManualCropping,
        fontFamily, setFontFamily, fontSize, setFontSize, lineHeight, setLineHeight, strokeWidth, setStrokeWidth,
        fontBold, setFontBold, textBackground, setTextBackground,
        exportFormat, setExportFormat,
        processedImage,
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

    return (
        <aside className="w-full md:w-80 bg-[#1a1a1a] border-r border-gray-800 p-4 flex flex-col gap-6 overflow-y-auto z-10 shadow-xl scrollbar-thin">

            {/* Image Controls (Contextual) */}
            {originalImage && (
                <section>
                    <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                        <CropIcon size={16} /> Crop
                    </h2>

                    {/* Preset Grid (Max 6) */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        {resolutionPresets.slice(0, 6).map((preset, idx) => (
                            <button
                                key={idx}
                                onClick={() => startCropWithPreset(preset.width, preset.height)}
                                disabled={isProcessing || isManualCropping}
                                className={`py-2 px-2 rounded flex flex-col items-center justify-center gap-1 font-medium text-xs transition-all border border-gray-700 ${isProcessing || isManualCropping
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    : "bg-[#2a2a2a] hover:bg-[#333] text-gray-200"
                                    }`}
                            >
                                <span className="font-bold">{preset.label}</span>
                                <span className="text-[10px] text-gray-500">{preset.width}x{preset.height}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Image Adjustments (Collapsible) */}
            {originalImage && !isManualCropping && (
                <section className="border border-gray-700 rounded overflow-hidden">
                    <button
                        onClick={() => setIsAdjustmentsOpen(!isAdjustmentsOpen)}
                        className="w-full flex items-center justify-between p-3 bg-[#1e1e1e] hover:bg-[#252525] transition-colors"
                    >
                        <span className="text-xs font-bold text-gray-300 uppercase">Image Adjustments</span>
                        {isAdjustmentsOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </button>

                    {isAdjustmentsOpen && (
                        <div className="p-3 bg-[#1a1a1a]">
                            <ImageAdjustments />
                        </div>
                    )}
                </section>
            )}

            {/* Text Layers */}
            <section className="flex-1 flex flex-col min-h-0">
                <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Layers size={16} /> Text Layers</span>
                    <button
                        onClick={addTextLayer}
                        className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded flex items-center gap-1"
                    >
                        <Plus size={12} /> Add
                    </button>
                </h2>

                {/* Layer List */}
                <div className="flex-1 overflow-y-auto mb-4 bg-[#0f0f0f] rounded border border-gray-700 p-2 space-y-2">
                    {textLayers.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4">No text layers.</p>
                    )}
                    {textLayers.map((layer, idx) => (
                        <div
                            key={layer.id}
                            className={`flex items-center justify-between p-2 rounded border cursor-pointer ${activeLayerId === layer.id ? 'bg-purple-900/20 border-purple-500' : 'bg-[#1e1e1e] border-gray-700 hover:bg-[#252525]'}`}
                            onClick={() => setActiveLayerId(layer.id)}
                        >
                            <div className="truncate text-xs text-gray-300">
                                {layer.lines.length > 0 ? layer.lines[0].text.substring(0, 20) + "..." : `Layer ${idx + 1}`}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveLayerId(layer.id); setIsTextModalOpen(true); }}
                                    className="p-1 hover:text-purple-400 text-gray-500"
                                >
                                    <Edit size={12} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeTextLayer(layer.id); }}
                                    className="p-1 hover:text-red-400 text-gray-500"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto space-y-3 pt-3 border-t border-gray-800">
                    <h3 className="text-[10px] uppercase font-bold text-gray-500">Global Text Style</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                            <label className="text-[10px] text-gray-500 uppercase block mb-1">{t('font')}</label>
                            <select
                                value={fontFamily}
                                onChange={(e) => setFontFamily(e.target.value)}
                                className="w-full bg-[#0f0f0f] border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 outline-none focus:border-purple-500"
                            >
                                {FONT_OPTIONS.map(font => (
                                    <option key={font.value} value={font.value}>{font.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase block mb-1">{t('size')}</label>
                            <input
                                type="number"
                                value={fontSize}
                                onChange={e => setFontSize(Number(e.target.value))}
                                className="w-full bg-[#0f0f0f] border border-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase block mb-1">{t('lineHeight')}</label>
                            <input
                                type="number"
                                value={lineHeight}
                                onChange={e => setLineHeight(Number(e.target.value))}
                                className="w-full bg-[#0f0f0f] border border-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-500 uppercase block mb-1 flex justify-between">
                            <span>{t('outlineStrength')}</span>
                            <span className="text-white">{strokeWidth}</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={strokeWidth}
                            onChange={(e) => setStrokeWidth(Number(e.target.value))}
                            disabled={textBackground}
                            className={`w-full accent-purple-600 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer ${textBackground ? 'opacity-50' : ''}`}
                        />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        {/* Bold & Bg toggles */}
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <input id="boldToggle" type="checkbox" checked={fontBold} onChange={(e) => setFontBold(e.target.checked)} className="w-3 h-3 text-purple-600 bg-[#0f0f0f] border-gray-700 rounded" />
                                <label htmlFor="boldToggle" className="text-xs text-gray-400 select-none">{t('bold')}</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input id="bgToggle" type="checkbox" checked={textBackground} onChange={(e) => setTextBackground(e.target.checked)} className="w-3 h-3 text-purple-600 bg-[#0f0f0f] border-gray-700 rounded" />
                                <label htmlFor="bgToggle" className="text-xs text-gray-400 select-none">{t('blackBg')}</label>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Visual Options (Cinema & Linear) */}
            {originalImage && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800">
                    <button
                        onClick={() => setIsCinematic(!isCinematic)}
                        className={`py-2 px-2 rounded flex items-center justify-center gap-1 font-medium text-xs transition-all border border-gray-700 ${isCinematic ? "bg-purple-900/50 text-purple-200 border-purple-500" : "bg-[#2a2a2a] hover:bg-[#333] text-gray-200"
                            }`}
                    >
                        <Clapperboard size={14} />
                        <span className="uppercase tracking-widest text-[10px]">Cinema</span>
                    </button>
                    <button
                        onClick={() => setIsLinearGradient(!isLinearGradient)}
                        className={`py-2 px-2 rounded flex items-center justify-center gap-1 font-medium text-xs transition-all border border-gray-700 ${isLinearGradient ? "bg-purple-900/50 text-purple-200 border-purple-500" : "bg-[#2a2a2a] hover:bg-[#333] text-gray-200"
                            }`}
                    >
                        <Minimize size={14} className="rotate-180" /> {/* Simulate gradient icon? */}
                        <span className="uppercase tracking-widest text-[10px]">Grading</span>
                    </button>
                </div>
            )}


            {/* Step 3: Export */}
            <section className="mt-2 pt-2 border-t border-gray-800">
                <div className="flex gap-2 mb-2">
                    <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                        className="bg-[#2a2a2a] border border-gray-700 rounded px-2 py-2 text-xs text-gray-300 outline-none flex-1"
                    >
                        <option value="png">PNG</option>
                        <option value="jpeg">JPG</option>
                        <option value="webp">WEBP</option>
                    </select>
                    <button
                        onClick={handleExport}
                        disabled={!processedImage && !originalImage}
                        className="flex-[2] py-2 bg-green-700 hover:bg-green-600 text-white rounded font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20 text-sm"
                    >
                        <Download size={16} />
                        {t('export')}
                    </button>
                </div>
            </section>
        </aside>
    );
};

export default Sidebar;
