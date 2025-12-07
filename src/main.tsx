// This file will be updated in next step to handle 'setChatInput' being removed
// but for now, we just need to adapt AppContent because setChatInput is technically removed from Context root
// but wait, I kept 'setChatInput' in the EditorContext interface above (check write_to_file content).
// ah, I kept chatInput/setChatInput in the context!
// So main.tsx AppContent logic for Paste/Drop should still work fine if it just updates that state.
// BUT, Sidebar doesn't use it anymore for rendering ONE chat block. Sidebar now uses textLayers.
// I should update main.tsx to: when pasting text, create a NEW layer instead of updating chatInput.
import React, { useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Settings, Scissors } from "lucide-react";

import { EditorProvider, useEditor } from "@/src/context/EditorContext";
import Sidebar from "@/src/components/editor/Sidebar";
import Canvas from "@/src/components/editor/Canvas";
import SettingsModal from "@/src/components/Modals/SettingsModal";
// We need the Modal for Text Editing now
import TextLayerModal from "@/src/components/Modals/TextLayerModal";
import { parseChatLog } from "@/src/utils/chatParser";

const AppContent = () => {
    const {
        t,
        setIsSettingsOpen,
        setOriginalImage, setProcessedImage, setIsManualCropping, setCropSelection, setStatusMsg,
        addTextLayer, setTextLayers, setIsTextModalOpen, setActiveLayerId
    } = useEditor();

    // Helper to add text as layer
    const createLayerFromText = (text: string) => {
        const newLine = parseChatLog(text);
        const newLayer = {
            id: Date.now().toString(),
            lines: newLine,
            text: text,
            x: 50,
            y: 50,
            hasGradientBg: false
        };
        setTextLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
        // setIsTextModalOpen(true); // Don't auto open modal on paste, just add it
        setStatusMsg(t('textPasted'));
    };

    const handleGlobalPaste = useCallback((e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.indexOf("image") !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    setOriginalImage(url);
                    setProcessedImage(null);
                    setIsManualCropping(false);
                    setCropSelection(null);
                    setStatusMsg(t('imgPasted'));
                }
            } else if (item.type === "text/plain") {
                if (
                    document.activeElement?.tagName === "INPUT" ||
                    document.activeElement?.tagName === "TEXTAREA"
                ) {
                    return;
                }
                item.getAsString((s) => {
                    createLayerFromText(s);
                });
            }
        }
    }, [t]);

    const handleGlobalDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith("image/")) {
                const url = URL.createObjectURL(file);
                setOriginalImage(url);
                setProcessedImage(null);
                setIsManualCropping(false);
                setStatusMsg(t('imgDropped'));
            } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const text = event.target?.result as string;
                    if (text) {
                        createLayerFromText(text);
                    }
                };
                reader.readAsText(file);
            }
        }
    }, [t]);

    useEffect(() => {
        window.addEventListener("paste", handleGlobalPaste);
        window.addEventListener("dragover", (e) => e.preventDefault());
        window.addEventListener("drop", handleGlobalDrop);
        return () => {
            window.removeEventListener("paste", handleGlobalPaste);
            window.removeEventListener("dragover", (e) => e.preventDefault());
            window.removeEventListener("drop", handleGlobalDrop);
        };
    }, [handleGlobalPaste, handleGlobalDrop]);

    return (
        <div className="min-h-screen bg-[#121212] text-gray-200 font-sans flex flex-col">
            {/* Header */}
            <header className="bg-[#1e1e1e] border-b border-gray-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Scissors className="text-purple-400" />
                    <h1 className="text-xl font-bold text-white">{t('appTitle')}</h1>
                </div>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-gray-400 hover:text-white transition-colors p-2 rounded hover:bg-gray-700"
                    title={t('settings')}
                >
                    <Settings size={20} />
                </button>
            </header>

            <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                <Sidebar />
                <Canvas />
            </main>

            <SettingsModal />
            <TextLayerModal />
        </div>
    );
};

const App = () => {
    return (
        <EditorProvider>
            <AppContent />
        </EditorProvider>
    );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
