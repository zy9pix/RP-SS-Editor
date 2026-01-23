import React, { useState } from 'react';
import {
    ImageIcon, Crop as CropIcon, Layers, Plus, Trash2, Edit, ChevronDown, ChevronUp, Download, Clapperboard, Minimize, Settings as SettingsIcon, Type,
    CloudUpload, History
} from 'lucide-react';
import { useEditor } from '@/src/context/EditorContext';
import ImageAdjustments from './ImageAdjustments';
import { FONT_OPTIONS } from '@/src/utils/constants';
// ImgurHistoryModal removed
import { ImgbbService } from '@/src/services/imgbbService';
import { toast } from 'sonner';

const ToolPanel = () => {
    const {
        t,
        originalImage, setOriginalImage, setProcessedImage, setIsManualCropping, setCropSelection, setStatusMsg,
        isProcessing, setIsProcessing, isManualCropping,
        fontFamily, setFontFamily, fontSize, setFontSize, lineHeight, setLineHeight, strokeWidth, setStrokeWidth,
        fontBold, setFontBold, textBackground, setTextBackground,
        exportFormat, setExportFormat,
        processedImage, setIsSettingsOpen,
        textLayers, addTextLayer, activeLayerId, setActiveLayerId, removeTextLayer, setIsTextModalOpen,
        isCinematic, setIsCinematic,
        isLinearGradient, setIsLinearGradient,
        resolutionPresets, setTargetWidth, setTargetHeight,
        imgbbApiKey, addToHistory, customFonts,
        setCurrentView, exportImage // Changed from exportHandler
    } = useEditor();

    const [isAdjustmentsOpen, setIsAdjustmentsOpen] = useState(false);
    // isHistoryOpen removed
    const [isUploading, setIsUploading] = useState(false);

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
        if (!exportImage) return;

        setIsProcessing(true);
        const blob = await exportImage();

        if (blob) {
            const url = URL.createObjectURL(blob);
            const date = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            const dateStr = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
            const extension = exportFormat || 'png';
            const filename = `rp-edit-${dateStr}.${extension}`;

            const link = document.createElement("a");
            link.download = filename;
            link.href = url;
            link.click();

            // Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else {
            toast.error(t('exportFailed'));
        }
        setIsProcessing(false);
    };

    const handleImgbbUpload = async () => {
        if (!imgbbApiKey) {
            toast.error(t('imgbbApiKeyRequired'));
            return;
        }

        setIsUploading(true);
        try {
            // Get Image Blob from Workspace via Handler
            let blob: Blob | null = null;
            if (exportImage) {
                blob = await exportImage();
            }

            if (!blob) {
                toast.error(t('failedToGen'));
                setIsUploading(false);
                return;
            }

            // Upload
            // Convert Blob to Base64 manually if service expects string, 
            // OR update service to accept Blob.
            // Service expects base64 string (data url).
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                if (!base64data) return;

                const result = await ImgbbService.uploadImage(base64data, imgbbApiKey);

                if (result && result.link) {
                    addToHistory({
                        id: result.id,
                        link: result.link,
                        deletehash: result.deletehash,
                        date: new Date().toISOString()
                    });
                    navigator.clipboard.writeText(result.link);
                    toast.success(t('uploadSuccess'));
                }
                setIsUploading(false);
            };
        } catch (error: any) {
            console.error("Upload failed", error);
            toast.error(error.message || t('uploadFailed'));
            setIsUploading(false);
        }
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
                    <div className="flex items-center">
                        <span style={{ color: '#CFD71B' }}>Role</span>
                        <span>Shot</span>
                    </div>
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
                            <span>{t('sectionImageTools')}</span>
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
                                <span>{t('btnCinema')}</span>
                            </button>
                            <button
                                onClick={() => setIsLinearGradient(!isLinearGradient)}
                                className={`py-3 px-2 rounded flex flex-col items-center justify-center gap-1 font-medium text-xs transition-all border ${isLinearGradient
                                    ? "bg-[#CFD71B]/10 text-[#CFD71B] border-[#CFD71B]/50"
                                    : "bg-[#141414] hover:bg-[#1a1a1a] text-gray-400 border-transparent"
                                    }`}
                            >
                                <Minimize size={18} className="rotate-180" />
                                <span>{t('btnGradient')}</span>
                            </button>
                        </div>

                        {/* Crop Presets */}
                        {!isManualCropping && (
                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] text-gray-600 uppercase font-bold">{t('lblCropPresets')}</label>
                                <div className="grid grid-cols-3 gap-1">
                                    {resolutionPresets.slice(0, 6).map((preset, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => startCropWithPreset(preset.width, preset.height)}
                                            className="bg-[#141414] hover:bg-[#222] text-gray-300 text-[10px] py-1.5 px-1 rounded border border-[#1a1a1a] truncate"
                                            title={`${preset.width}x${preset.height}`}
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
                                <ImageIcon size={14} className="text-[#CFD71B]" /> {t('btnAdjustments')}
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
                            <Layers size={14} /> {t('sectionLayers')}
                        </div>
                        <button
                            onClick={addTextLayer}
                            style={{ backgroundColor: '#CFD71B', color: 'black' }}
                            className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(207,215,27,0.2)]"
                        >
                            <Plus size={12} /> {t('btnNewText')}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[#101010] rounded-lg border border-[#1a1a1a] p-1 space-y-1 max-h-[250px]">
                        {textLayers.length === 0 && (
                            <div className="h-20 flex flex-col items-center justify-center text-gray-600 text-xs">
                                <Layers size={20} className="mb-2 opacity-50" />
                                <span>{t('noLayers')}</span>
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
                                        {layer.lines.length > 0 ? layer.lines[0].text : t('emptyLayer')}
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
                    <h3 className="text-[10px] uppercase font-bold text-gray-500">{t('sectionGlobalStyle')}</h3>

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
                                {customFonts && customFonts.length > 0 && (
                                    <optgroup label={t('customFonts') || "Custom Fonts"}>
                                        {customFonts.map(font => (
                                            <option key={font.name} value={font.name}>{font.name}</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-2.5 text-gray-500 pointer-events-none" />
                        </div>

                        {/* Size & Line Height */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] text-gray-600 uppercase mb-1 block">{t('lblSize')}</label>
                                <input
                                    type="number"
                                    value={fontSize}
                                    onChange={e => setFontSize(Number(e.target.value))}
                                    className="w-full bg-[#141414] border border-[#1a1a1a] rounded px-2 py-1.5 text-xs text-gray-300 focus:border-[#CFD71B] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] text-gray-600 uppercase mb-1 block">{t('lblSpacing')}</label>
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
                                <label className="text-[9px] text-gray-600 uppercase">{t('lblOutline')}</label>
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
                                <span className="text-xs text-gray-400">{t('lblBold')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={textBackground} onChange={(e) => setTextBackground(e.target.checked)} className="accent-[#CFD71B] bg-[#141414]" />
                                <span className="text-xs text-gray-400">{t('lblBackground')}</span>
                            </label>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer / Export */}
            <div className="p-4 bg-[#0d0d0d] border-t border-[#1a1a1a] sticky bottom-0 z-30 space-y-2">
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

                {/* ImgBB Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleImgbbUpload}
                        disabled={isUploading || (!processedImage && !originalImage)}
                        className="flex-1 bg-[#1a1a1a] hover:bg-[#222] text-gray-300 border border-[#333] py-1.5 rounded text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                    >
                        {isUploading ? (
                            <span className="animate-pulse">Uploading...</span>
                        ) : (
                            <>
                                <CloudUpload size={14} /> Upload to ImgBB
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => setCurrentView('history')}
                        className="px-2 bg-[#1a1a1a] hover:bg-[#222] text-gray-400 border border-[#333] rounded flex items-center justify-center transition-colors"
                        title="Upload History"
                    >
                        <History size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default ToolPanel;
