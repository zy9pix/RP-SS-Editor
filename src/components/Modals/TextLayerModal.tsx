import React, { useEffect, useRef, useState } from 'react';
import { X, Check, type LucideIcon, Sparkles } from 'lucide-react';
import { useEditor } from '@/src/context/EditorContext';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { parseChatLog, cleanChatLog } from '@/src/utils/chatParser';
import FormattingToolbar from '../editor/FormattingToolbar';

const TextLayerModal = () => {
    const {
        isTextModalOpen, setIsTextModalOpen,
        activeLayerId, textLayers, updateTextLayer,
        apiKey, t, language
    } = useEditor();

    const [localText, setLocalText] = useState("");
    const [aiMode, setAiMode] = useState<'none' | 'filter' | 'summarize'>('none');
    const [filterInstruction, setFilterInstruction] = useState("");
    const [isFiltering, setIsFiltering] = useState(false);
    const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isTextModalOpen && activeLayerId) {
            const layer = textLayers.find(l => l.id === activeLayerId);
            if (layer) {
                setLocalText(layer.text);
            }
        }
    }, [isTextModalOpen, activeLayerId, textLayers]);

    const handleSave = () => {
        if (!activeLayerId) return;
        const parsed = parseChatLog(localText);
        updateTextLayer(activeLayerId, {
            text: localText,
            lines: parsed
        });
        setIsTextModalOpen(false);
    };

    const handleClose = () => {
        setIsTextModalOpen(false);
    };

    const handleParseClean = () => {
        const cleaned = cleanChatLog(localText);
        setLocalText(cleaned);
    };

    const handleAITask = async () => {
        if (!apiKey) {
            alert(t('noKey'));
            return;
        }

        if (!localText.trim()) {
            alert(t('textRequired'));
            return;
        }

        try {
            setIsFiltering(true);
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const model = ai.models;

            let prompt = "";
            let systemInstruction = "You are a helpful assistant for Roleplay chatlogs.";

            if (aiMode === 'filter') {
                if (!filterInstruction.trim()) {
                    alert(t('topicRequired'));
                    setIsFiltering(false);
                    return;
                }
                systemInstruction = "You are a precise chatlog filter.";
                prompt = `
                I will provide a roleplay chatlog.
                TASK: Filter this chatlog to strictly retain ONLY the lines that are relevant to the following topic/keyword: "${filterInstruction}".
                
                RULES:
                1. Return only the relevant lines.
                2. Do not change the text content of the lines.
                3. Do not add any conversational filler.
                4. Maintain original formatting.
                
                CHATLOG:
                ${localText}
                `;
            } else if (aiMode === 'summarize') {
                systemInstruction = "You are a creative storyteller.";

                let wordLimit = "100";
                if (summaryLength === 'short') wordLimit = "50";
                if (summaryLength === 'long') wordLimit = "300";

                prompt = `
                I will provide a roleplay chatlog.
                TASK: Write a compelling, short narrative summary of the events in this chatlog.
                
                RULES:
                1. Use past tense.
                2. Focus on the key actions and dialogue.
                3. Keep it under ${wordLimit} words.
                4. Do not use bullet points, write it as a story paragraph.
                5. Write the summary in the same language as the chatlog content.
                
                CHATLOG:
                ${localText}
                `;
            }

            const result = await model.generateContent({
                model: "gemini-3-flash-preview",
                contents: [{
                    role: 'user',
                    parts: [{ text: systemInstruction + "\n" + prompt }]
                }],
                config: {
                    tools: [],
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    ]
                }
            });

            // Handle response based on GoogleGenAI SDK structure
            // Using implicit casting to any to access candidates if types are missing/mismatched in strict mode
            // or simply text() if valid. The key is catching the text.

            // Note: In newer SDKs, result might contain text() method or candidates array.
            // We check for 'text' function or candidates.
            let outText = "";

            // @ts-ignore - bypassing potential type mismatch for alpha SDK
            if (typeof result.text === 'function') {
                // @ts-ignore
                outText = result.text();
            } else if (result.candidates && result.candidates.length > 0) {
                const part = result.candidates[0].content?.parts?.[0];
                if (part && part.text) outText = part.text;
            }

            if (outText) {
                let cleanText = outText.trim();
                // Clean code blocks if helpful AI adds them
                if (cleanText.startsWith("```")) {
                    cleanText = cleanText.replace(/^```(text|markdown)?\n/i, "").replace(/\n```$/, "");
                }
                setLocalText(cleanText);
                setAiMode('none');
                setFilterInstruction("");
            }

        } catch (error) {
            console.error("AI Error", error);
            alert("AI Error: " + error);
        } finally {
            setIsFiltering(false);
        }
    };

    if (!isTextModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-white font-bold flex items-center gap-2">
                        Edit Text Layer
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
                    {/* AI Toolbar */}
                    <div className="flex flex-col gap-2 p-3 bg-purple-900/10 border border-purple-500/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                                <Sparkles size={12} /> {t('aiTools')}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setAiMode(aiMode === 'filter' ? 'none' : 'filter')}
                                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all border ${aiMode === 'filter'
                                        ? 'bg-purple-600 text-white border-purple-400'
                                        : 'bg-[#0f0f0f] text-gray-400 border-gray-700 hover:border-gray-500'}`}
                                >
                                    {t('filterTopic')}
                                </button>
                                <button
                                    onClick={() => {
                                        setAiMode('summarize');
                                    }}
                                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all border ${aiMode === 'summarize'
                                        ? 'bg-purple-600 text-white border-purple-400'
                                        : 'bg-[#0f0f0f] text-gray-400 border-gray-700 hover:border-gray-500'}`}
                                >
                                    {t('summarize')}
                                </button>
                            </div>
                        </div>

                        {/* AI Inputs / Actions Area */}
                        {aiMode !== 'none' && (
                            <div className="mt-2 flex gap-2 animate-in slide-in-from-top-2">
                                {aiMode === 'filter' && (
                                    <input
                                        type="text"
                                        placeholder={t('enterTopic')}
                                        className="flex-1 bg-[#0f0f0f] border border-gray-700 rounded px-2 py-1.5 text-xs focus:border-purple-500 outline-none text-white"
                                        value={filterInstruction}
                                        onChange={(e) => setFilterInstruction(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAITask()}
                                        autoFocus
                                    />
                                )}
                                {aiMode === 'summarize' && (
                                    <div className="flex-1 flex gap-2 items-center">
                                        <span className="text-xs text-gray-400 italic">{t('summaryLength')}</span>
                                        <select
                                            value={summaryLength}
                                            onChange={(e) => setSummaryLength(e.target.value as any)}
                                            className="bg-[#0f0f0f] border border-gray-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
                                        >
                                            <option value="short">{t('short')}</option>
                                            <option value="medium">{t('medium')}</option>
                                            <option value="long">{t('long')}</option>
                                        </select>
                                    </div>
                                )}

                                <button
                                    onClick={handleAITask}
                                    disabled={isFiltering}
                                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50 min-w-[60px] flex items-center justify-center"
                                >
                                    {isFiltering ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div> : t('go')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Standard Parsing Tools */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleParseClean}
                            className="w-full border border-gray-700 rounded py-2 text-xs flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 transition-colors"
                        >
                            <Check size={14} /> Parse / Clean Timestamps (Standard)
                        </button>
                    </div>

                    <FormattingToolbar inputRef={inputRef} />

                    <textarea
                        ref={inputRef}
                        value={localText}
                        onChange={(e) => setLocalText(e.target.value)}
                        className="flex-1 bg-[#0f0f0f] border border-gray-700 rounded p-4 font-mono text-sm text-gray-300 outline-none focus:border-purple-500 min-h-[300px] resize-none"
                        placeholder="Paste chatlog here..."
                    />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 rounded text-gray-300 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium flex items-center gap-2"
                    >
                        <Check size={16} /> Save Layer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TextLayerModal;
