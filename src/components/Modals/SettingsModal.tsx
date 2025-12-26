import React, { useState } from 'react';
import { Settings, X, Globe, Check, Plus, Trash2 } from 'lucide-react';
import { useEditor } from '@/src/context/EditorContext';

const SettingsModal = () => {
    const {
        isSettingsOpen, setIsSettingsOpen,
        apiKey, setApiKey,
        language, setLanguage,
        targetWidth, setTargetWidth,
        targetHeight, setTargetHeight,
        customColors, setCustomColors,
        resolutionPresets, setResolutionPresets,
        customFonts, addCustomFont, removeCustomFont, imgbbApiKey, setImgbbApiKey,
        t
    } = useEditor();

    const [newPresetW, setNewPresetW] = useState(1920);
    const [newPresetH, setNewPresetH] = useState(1080);
    const [newPresetName, setNewPresetName] = useState("");
    const [newFontName, setNewFontName] = useState("");
    const [newFontUrl, setNewFontUrl] = useState("");

    if (!isSettingsOpen) return null;

    const updateCustomColor = (index: number, newColor: string) => {
        const updated = [...customColors];
        updated[index] = newColor;
        setCustomColors(updated);
    };

    const handleAddPreset = () => {
        if (!newPresetName) return;
        setResolutionPresets([...resolutionPresets, { width: newPresetW, height: newPresetH, label: newPresetName }]);
        setNewPresetName("");
    };

    const handleApplyPreset = (w: number, h: number) => {
        setTargetWidth(w);
        setTargetHeight(h);
    };

    const handeRemovePreset = (idx: number) => {
        const newPresets = [...resolutionPresets];
        newPresets.splice(idx, 1);
        setResolutionPresets(newPresets);
    };

    const handleAddFontUrl = () => {
        if (!newFontName || !newFontUrl) return;
        addCustomFont(newFontName, newFontUrl);
        setNewFontName("");
        setNewFontUrl("");
    };

    const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            // Use filename as default name if prompt? just use filename without ext
            const name = file.name.split('.')[0];
            addCustomFont(name, result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-[#0B0B0C] border border-[#1a1a1a] p-6 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b border-[#1a1a1a] pb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings size={20} className="text-[#CFD71B]" />
                        <span className="text-white">{t('settings')}</span>
                    </h2>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="space-y-6">

                    {/* API Key */}
                    <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">{t('apiKey')}</label>
                        <input
                            type="password"
                            placeholder={t('apiKeyPlaceholder')}
                            className="w-full bg-[#141414] border border-[#1a1a1a] rounded p-2 text-sm focus:border-[#CFD71B] outline-none text-white transition-colors"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-[10px] text-gray-500 mt-1">{t('apiKeyHelp')}</p>
                    </div>

                    {/* Language */}
                    <div className="border-t border-[#1a1a1a] pt-4">
                        <label className="block text-xs text-gray-500 mb-2 uppercase font-bold flex items-center gap-2 tracking-wider">
                            <Globe size={14} /> {t('language')}
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`flex-1 py-2 text-xs font-bold rounded border transition-all ${language === 'en' ? 'bg-[#CFD71B]/10 border-[#CFD71B] text-[#CFD71B]' : 'bg-[#141414] border-[#1a1a1a] text-gray-400 hover:border-gray-500'}`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage('tr')}
                                className={`flex-1 py-2 text-xs font-bold rounded border transition-all ${language === 'tr' ? 'bg-[#CFD71B]/10 border-[#CFD71B] text-[#CFD71B]' : 'bg-[#141414] border-[#1a1a1a] text-gray-400 hover:border-gray-500'}`}
                            >
                                Türkçe
                            </button>
                        </div>
                    </div>

                    {/* Resolution Presets */}
                    <div className="border-t border-[#1a1a1a] pt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Resolution Presets</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto mb-2 pr-1 scrollbar-thin">
                            {Array.isArray(resolutionPresets) && resolutionPresets.map((preset, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-[#141414] p-2 rounded border border-[#1a1a1a] hover:border-gray-700 transition-colors">
                                    <span className="text-xs text-gray-300">{preset.label} <span className="text-gray-500">({preset.width}x{preset.height})</span></span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleApplyPreset(preset.width, preset.height)} className="text-xs text-[#CFD71B] hover:text-[#e5ed3b] font-medium">Apply</button>
                                        <button onClick={() => handeRemovePreset(idx)} className="text-gray-600 hover:text-red-400"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <input
                                    className="w-full bg-[#141414] border border-[#1a1a1a] rounded px-2 py-2 text-xs mb-1 text-white focus:border-[#CFD71B] outline-none"
                                    placeholder="Label"
                                    value={newPresetName} onChange={e => setNewPresetName(e.target.value)}
                                />
                                <div className="flex gap-1">
                                    <input type="number" className="w-1/2 bg-[#141414] border border-[#1a1a1a] rounded px-2 py-2 text-xs text-white focus:border-[#CFD71B] outline-none" placeholder="W" value={newPresetW} onChange={e => setNewPresetW(Number(e.target.value))} />
                                    <input type="number" className="w-1/2 bg-[#141414] border border-[#1a1a1a] rounded px-2 py-2 text-xs text-white focus:border-[#CFD71B] outline-none" placeholder="H" value={newPresetH} onChange={e => setNewPresetH(Number(e.target.value))} />
                                </div>
                            </div>
                            <button onClick={handleAddPreset} className="bg-[#CFD71B] hover:bg-[#b0b71b] text-black p-2 rounded h-fit transition-colors">
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>




                    {/* ImgBB Integration */}
                    <div className="border-t border-[#1a1a1a] pt-4">
                        <label className="block text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">ImgBB Integration</label>
                        <div>
                            <input
                                type="text"
                                placeholder="ImgBB API Key"
                                className="w-full bg-[#141414] border border-[#1a1a1a] rounded p-2 text-xs text-gray-300 focus:border-[#CFD71B] outline-none mb-2"
                                value={imgbbApiKey}
                                onChange={(e) => setImgbbApiKey(e.target.value)}
                            />
                            <p className="text-[10px] text-gray-500">
                                {t('imgbbApiKeyHelp') || "Enter your ImgBB API Key to enable uploads."}
                            </p>
                        </div>
                    </div>

                    {/* Custom Fonts */}
                    <div className="border-t border-[#1a1a1a] pt-4">
                        <label className="block text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">Custom Fonts</label>

                        {/* List Existing Custom Fonts */}
                        {Array.isArray(customFonts) && customFonts.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {customFonts.map((font) => (
                                    <div key={font.name} className="bg-[#141414] border border-[#1a1a1a] rounded px-2 py-1 flex items-center gap-2">
                                        <span className="text-xs text-gray-300">{font.name}</span>
                                        <button onClick={() => removeCustomFont(font.name)} className="text-gray-600 hover:text-red-400">
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add New Font */}
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Font Name"
                                    value={newFontName}
                                    onChange={(e) => setNewFontName(e.target.value)}
                                    className="bg-[#141414] border border-[#1a1a1a] rounded px-2 py-1.5 text-xs flex-1 focus:border-[#CFD71B] outline-none text-gray-300"
                                />
                                <input
                                    type="text"
                                    placeholder="Font URL (e.g. Google Fonts CSS)"
                                    value={newFontUrl}
                                    onChange={(e) => setNewFontUrl(e.target.value)}
                                    className="bg-[#141414] border border-[#1a1a1a] rounded px-2 py-1.5 text-xs flex-[2] focus:border-[#CFD71B] outline-none text-gray-300"
                                />
                                <button
                                    onClick={handleAddFontUrl}
                                    disabled={!newFontName || !newFontUrl}
                                    className="bg-[#1a1a1a] hover:bg-[#222] text-gray-300 px-3 rounded text-xs border border-[#1a1a1a] disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">OR Upload .TTF/.OTF</span>
                                <input
                                    type="file"
                                    accept=".ttf,.otf,.woff"
                                    onChange={handleFontUpload}
                                    className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-[#1a1a1a] file:text-gray-300 hover:file:bg-[#222]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="border-t border-[#1a1a1a] pt-4">
                        <label className="block text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">{t('customColors')}</label>
                        <div className="flex gap-2 flex-wrap">
                            {customColors.map((color, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-1">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => updateCustomColor(idx, e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"
                                    />
                                    <span className="text-[9px] text-gray-500 uppercase">{idx + 1}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">{t('colorsHelp')}</p>
                    </div>
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-[#1a1a1a]">
                    <button
                        onClick={() => setIsSettingsOpen(false)}
                        className="bg-[#CFD71B] hover:bg-[#b0b71b] text-black px-6 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                        <Check size={16} /> {t('done')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
