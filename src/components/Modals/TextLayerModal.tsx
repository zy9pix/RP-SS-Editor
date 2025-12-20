import React, { useEffect, useRef, useState } from 'react';
import { X, Check, type LucideIcon, Sparkles } from 'lucide-react';
import { useEditor } from '@/src/context/EditorContext';
import { GoogleGenAI } from "@google/genai";
import { parseChatLog, cleanChatLog } from '@/src/utils/chatParser';
import FormattingToolbar from '../editor/FormattingToolbar';

const TextLayerModal = () => {
    const {
        isTextModalOpen, setIsTextModalOpen,
        activeLayerId, textLayers, updateTextLayer,
        apiKey, t, language
    } = useEditor();

    const [localText, setLocalText] = useState("");
    const [showFilterInput, setShowFilterInput] = useState(false);
    const [filterInstruction, setFilterInstruction] = useState("");
    const [isFiltering, setIsFiltering] = useState(false);
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
        // Run the robust cleaner
        const cleaned = cleanChatLog(localText);
        setLocalText(cleaned);
    };


    const handleAIFilter = async () => {
        if (!localText.trim()) return;
        if (!apiKey) {
            alert("Please set API Key in settings first");
            return;
        }

        try {
            setIsFiltering(true);
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const model = ai.models;

            const prompt = `You are a roleplay chatlog cleaner. 
      I will provide a raw chatlog and specific instructions on how to filter it.
      
      User Instruction: "${filterInstruction || "Clean up the log"}"
      
      CRITICAL RULES:
      1. Remove any lines that are consecutive duplicates (same text appearing twice in a row).
      2. Fix Spacing: Ensure there is a space after a character's Lastname if it is missing.
      3. Follow the user instruction above if provided.
      
      Raw Log:
      ${localText}
  
      Return ONLY the filtered chat lines. Do not wrap in markdown. Maintain the original formatting.`;

            const result = await model.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt
            });

            if (result.text) {
                let cleanText = result.text.trim();
                if (cleanText.startsWith("```")) {
                    cleanText = cleanText.replace(/^```(text)?\n/i, "").replace(/\n```$/, "");
                }
                setLocalText(cleanText);
                setShowFilterInput(false);
                setFilterInstruction("");
            }

        } catch (error) {
            console.error("Filter error", error);
            alert(t('filterErr'));
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

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilterInput(!showFilterInput)}
                            className={`flex-1 border border-gray-700 rounded py-2 text-xs flex items-center justify-center gap-2 transition-colors ${showFilterInput ? 'bg-purple-900/50 border-purple-500 text-purple-200' : 'bg-[#2a2a2a] hover:bg-[#333] text-gray-300'}`}
                        >
                            <Sparkles size={14} /> AI Smart Clean
                        </button>
                        <button
                            onClick={handleParseClean}
                            className="flex-1 border border-gray-700 rounded py-2 text-xs flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 transition-colors"
                        >
                            <Check size={14} /> Parse / Clean Timestamps
                        </button>
                    </div>

                    {/* AI Filter Input Area */}
                    {showFilterInput && (
                        <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded animate-in fade-in slide-in-from-top-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Instruction (e.g., 'Remove generic radio messages')"
                                    className="flex-1 bg-[#0f0f0f] border border-gray-700 rounded px-2 py-2 text-xs focus:border-purple-500 outline-none text-white"
                                    value={filterInstruction}
                                    onChange={(e) => setFilterInstruction(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAIFilter()}
                                />
                                <button
                                    onClick={handleAIFilter}
                                    disabled={isFiltering}
                                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 rounded text-xs disabled:opacity-50"
                                >
                                    {isFiltering ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div> : "Clean"}
                                </button>
                            </div>
                        </div>
                    )}

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
