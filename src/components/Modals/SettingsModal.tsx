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
        t
    } = useEditor();

    const [newPresetW, setNewPresetW] = useState(1920);
    const [newPresetH, setNewPresetH] = useState(1080);
    const [newPresetName, setNewPresetName] = useState("");

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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-[#1e1e1e] border border-gray-700 p-6 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings size={20} className="text-purple-500" /> {t('settings')}</h2>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="space-y-6">

                    {/* API Key */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">{t('apiKey')}</label>
                        <input
                            type="password"
                            placeholder={t('apiKeyPlaceholder')}
                            className="w-full bg-[#0a0a0a] border border-gray-700 rounded p-2 text-sm focus:border-purple-500 outline-none text-white"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-[10px] text-gray-500 mt-1">{t('apiKeyHelp')}</p>
                    </div>

                    {/* Language */}
                    <div className="border-t border-gray-800 pt-4">
                        <label className="block text-xs text-gray-400 mb-2 uppercase font-bold flex items-center gap-2">
                            <Globe size={14} /> {t('language')}
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`flex-1 py-2 text-xs font-bold rounded border ${language === 'en' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-[#0a0a0a] border-gray-700 text-gray-400 hover:border-gray-500'}`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage('tr')}
                                className={`flex-1 py-2 text-xs font-bold rounded border ${language === 'tr' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-[#0a0a0a] border-gray-700 text-gray-400 hover:border-gray-500'}`}
                            >
                                Türkçe
                            </button>
                        </div>
                    </div>

                    {/* Resolution Presets */}
                    <div className="border-t border-gray-800 pt-4">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Resolution Presets</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto mb-2 pr-1 scrollbar-thin">
                            {resolutionPresets.map((preset, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-[#0f0f0f] p-2 rounded border border-gray-700">
                                    <span className="text-xs text-gray-300">{preset.label} <span className="text-gray-500">({preset.width}x{preset.height})</span></span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleApplyPreset(preset.width, preset.height)} className="text-xs text-purple-400 hover:text-purple-300">Apply</button>
                                        <button onClick={() => handeRemovePreset(idx)} className="text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <input
                                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded px-2 py-1 text-xs mb-1 text-white"
                                    placeholder="Label"
                                    value={newPresetName} onChange={e => setNewPresetName(e.target.value)}
                                />
                                <div className="flex gap-1">
                                    <input type="number" className="w-1/2 bg-[#0f0f0f] border border-gray-700 rounded px-2 py-1 text-xs text-white" placeholder="W" value={newPresetW} onChange={e => setNewPresetW(Number(e.target.value))} />
                                    <input type="number" className="w-1/2 bg-[#0f0f0f] border border-gray-700 rounded px-2 py-1 text-xs text-white" placeholder="H" value={newPresetH} onChange={e => setNewPresetH(Number(e.target.value))} />
                                </div>
                            </div>
                            <button onClick={handleAddPreset} className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded h-fit">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Custom Resolution */}
                    <div className="border-t border-gray-800 pt-4">
                        <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">{t('resolution')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-[10px] text-gray-500 block mb-1">{t('width')}</span>
                                <input
                                    type="number"
                                    placeholder={t('previewPlaceholder')}
                                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded p-2 text-sm focus:border-purple-500 outline-none text-white"
                                    value={targetWidth}
                                    onChange={(e) => setTargetWidth(e.target.value ? Number(e.target.value) : "")}
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 block mb-1">{t('height')}</span>
                                <input
                                    type="number"
                                    placeholder={t('autoEmpty')}
                                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded p-2 text-sm focus:border-purple-500 outline-none text-white"
                                    value={targetHeight}
                                    onChange={(e) => setTargetHeight(e.target.value ? Number(e.target.value) : "")}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">
                            {t('resHelp')}
                        </p>
                    </div>

                    {/* Colors */}
                    <div className="border-t border-gray-800 pt-4">
                        <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">{t('customColors')}</label>
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

                <div className="flex justify-end mt-6">
                    <button
                        onClick={() => setIsSettingsOpen(false)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
                    >
                        <Check size={16} /> {t('done')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
