import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ChatLine, parseChatLog } from "@/src/utils/chatParser";
import { DEFAULT_CUSTOM_COLORS } from "@/src/utils/constants";
import { TRANSLATIONS } from "@/src/utils/translations";

export interface TextLayer {
    id: string;
    lines: ChatLine[];
    text: string;
    x: number;
    y: number;
    hasGradientBg: boolean;
    cachedImage?: string; // Data URL of the rendered PNG
}

export interface ResolutionPreset {
    width: number;
    height: number;
    label: string;
}

interface EditorState {
    // App Settings
    language: 'en' | 'tr';
    setLanguage: (lang: 'en' | 'tr') => void;
    apiKey: string;
    setApiKey: (key: string) => void;

    // Image State
    originalImage: string | null;
    setOriginalImage: (url: string | null) => void;
    processedImage: string | null;
    setProcessedImage: (url: string | null) => void;
    isProcessing: boolean;
    setIsProcessing: (isProcessing: boolean) => void;
    statusMsg: string;
    setStatusMsg: (msg: string) => void;

    // Visuals
    isCinematic: boolean;
    setIsCinematic: (v: boolean) => void;
    isLinearGradient: boolean;
    setIsLinearGradient: (v: boolean) => void;

    // Manual Crop & Resizing
    isManualCropping: boolean;
    setIsManualCropping: (v: boolean) => void;
    cropSelection: { x: number; y: number; w: number; h: number } | null;
    setCropSelection: (sel: { x: number; y: number; w: number; h: number } | null) => void;

    // Presets
    resolutionPresets: ResolutionPreset[];
    setResolutionPresets: (presets: ResolutionPreset[]) => void;
    activePresetId: string | null;

    // Target Dimensions
    targetWidth: number | "";
    setTargetWidth: (w: number | "") => void;
    targetHeight: number | "";
    setTargetHeight: (h: number | "") => void;

    // Multi-Layer Text State
    textLayers: TextLayer[];
    setTextLayers: (layers: TextLayer[]) => void;
    activeLayerId: string | null; // The layer currently being edited
    setActiveLayerId: (id: string | null) => void;
    isTextModalOpen: boolean;
    setIsTextModalOpen: (v: boolean) => void;

    // Style Settings (Global)
    fontSize: number;
    setFontSize: (v: number) => void;
    lineHeight: number;
    setLineHeight: (v: number) => void;
    strokeWidth: number;
    setStrokeWidth: (v: number) => void;
    textBackground: boolean;
    setTextBackground: (v: boolean) => void;
    fontFamily: string;
    setFontFamily: (v: string) => void;
    fontBold: boolean;
    setFontBold: (v: boolean) => void;
    customColors: string[];
    setCustomColors: (colors: string[]) => void;

    // Image Adjustments
    imgBrightness: number;
    setImgBrightness: (v: number) => void;
    imgContrast: number;
    setImgContrast: (v: number) => void;
    imgSaturation: number;
    setImgSaturation: (v: number) => void;

    // Export
    exportFormat: "png" | "jpeg" | "webp";
    setExportFormat: (fmt: "png" | "jpeg" | "webp") => void;

    // Modals
    isSettingsOpen: boolean;
    setIsSettingsOpen: (v: boolean) => void;

    // Helpers
    t: (key: keyof typeof TRANSLATIONS.en) => string;
    addTextLayer: () => void;
    updateTextLayer: (id: string, updates: Partial<TextLayer>) => void;
    removeTextLayer: (id: string) => void;
}

const EditorContext = createContext<EditorState | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
    // --- State Initialization ---

    const [language, setLanguage] = useState<'en' | 'tr'>('en');
    const [apiKey, setApiKey] = useState("");

    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [isCinematic, setIsCinematic] = useState(false);
    const [isLinearGradient, setIsLinearGradient] = useState(false);

    const [isManualCropping, setIsManualCropping] = useState(false);
    const [cropSelection, setCropSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

    // Default Presets
    const [resolutionPresets, setResolutionPresets] = useState<ResolutionPreset[]>([
        { width: 800, height: 600, label: "Standard (800x600)" },
        { width: 1920, height: 1080, label: "Full HD (1920x1080)" },
        { width: 940, height: 400, label: "Forum Sig (940x400)" }
    ]);
    const [targetWidth, setTargetWidth] = useState<number | "">(1000);
    const [targetHeight, setTargetHeight] = useState<number | "">("");

    // Text Layers
    const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    const [isTextModalOpen, setIsTextModalOpen] = useState(false);

    const [fontSize, setFontSize] = useState(15);
    const [lineHeight, setLineHeight] = useState(18);
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [textBackground, setTextBackground] = useState(false);
    const [fontFamily, setFontFamily] = useState("Helvetica");
    const [fontBold, setFontBold] = useState(true);
    const [customColors, setCustomColors] = useState<string[]>(DEFAULT_CUSTOM_COLORS);

    const [imgBrightness, setImgBrightness] = useState(100);
    const [imgContrast, setImgContrast] = useState(100);
    const [imgSaturation, setImgSaturation] = useState(100);

    const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp">("png");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // --- Persistence & Effects ---

    useEffect(() => {
        const savedLang = localStorage.getItem("rp-editor-lang");
        if (savedLang === 'en' || savedLang === 'tr') setLanguage(savedLang);
        else {
            const browserLang = navigator.language.toLowerCase();
            setLanguage(browserLang.startsWith('tr') ? 'tr' : 'en');
        }

        const savedKey = localStorage.getItem("rp-editor-api-key");
        if (savedKey) setApiKey(savedKey);

        const savedPresets = localStorage.getItem("rp-editor-presets");
        if (savedPresets) {
            try {
                setResolutionPresets(JSON.parse(savedPresets));
            } catch (e) { console.error("Error parsing presets", e); }
        }

        const savedConfig = localStorage.getItem("rp-editor-config");
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                if (config.fontSize) setFontSize(config.fontSize);
                if (config.lineHeight) setLineHeight(config.lineHeight);
                if (config.fontFamily) setFontFamily(config.fontFamily);
                if (config.fontBold !== undefined) setFontBold(config.fontBold);
                if (config.strokeWidth !== undefined) setStrokeWidth(config.strokeWidth);
                if (config.textBackground !== undefined) setTextBackground(config.textBackground);
                if (config.customColors) setCustomColors(config.customColors);
                if (config.exportFormat) setExportFormat(config.exportFormat);
            } catch (e) {
                console.error("Error loading config", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("rp-editor-lang", language);
    }, [language]);

    useEffect(() => {
        if (apiKey) localStorage.setItem("rp-editor-api-key", apiKey);
    }, [apiKey]);

    useEffect(() => {
        localStorage.setItem("rp-editor-presets", JSON.stringify(resolutionPresets));
    }, [resolutionPresets]);

    useEffect(() => {
        const config = {
            fontSize, lineHeight, fontFamily, fontBold, strokeWidth,
            textBackground, customColors, exportFormat
        };
        localStorage.setItem("rp-editor-config", JSON.stringify(config));
    }, [fontSize, lineHeight, fontFamily, fontBold, strokeWidth, textBackground, customColors, exportFormat]);

    // Helpers
    const t = (key: keyof typeof TRANSLATIONS.en) => {
        return TRANSLATIONS[language][key] || TRANSLATIONS['en'][key] || key;
    };

    const addTextLayer = () => {
        const newLayer: TextLayer = {
            id: Date.now().toString(),
            lines: [],
            text: "",
            x: 20,
            y: 20,
            hasGradientBg: false,
            cachedImage: undefined
        };
        setTextLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
        setIsTextModalOpen(true);
    };

    const updateTextLayer = (id: string, updates: Partial<TextLayer>) => {
        setTextLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const removeTextLayer = (id: string) => {
        setTextLayers(prev => prev.filter(l => l.id !== id));
        if (activeLayerId === id) setActiveLayerId(null);
    };

    return (
        <EditorContext.Provider value={{
            language, setLanguage,
            apiKey, setApiKey,
            originalImage, setOriginalImage,
            processedImage, setProcessedImage,
            isProcessing, setIsProcessing,
            statusMsg, setStatusMsg,
            isCinematic, setIsCinematic,
            isLinearGradient, setIsLinearGradient,
            isManualCropping, setIsManualCropping,
            cropSelection, setCropSelection,
            resolutionPresets, setResolutionPresets,
            activePresetId: null,
            targetWidth, setTargetWidth,
            targetHeight, setTargetHeight,
            textLayers, setTextLayers,
            activeLayerId, setActiveLayerId,
            isTextModalOpen, setIsTextModalOpen,
            fontSize, setFontSize,
            lineHeight, setLineHeight,
            strokeWidth, setStrokeWidth,
            textBackground, setTextBackground,
            fontFamily, setFontFamily,
            fontBold, setFontBold,
            customColors, setCustomColors,
            imgBrightness, setImgBrightness,
            imgContrast, setImgContrast,
            imgSaturation, setImgSaturation,
            exportFormat, setExportFormat,
            isSettingsOpen, setIsSettingsOpen,
            t,
            addTextLayer, updateTextLayer, removeTextLayer
        }}>
            {children}
        </EditorContext.Provider>
    );
};

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (context === undefined) {
        throw new Error("useEditor must be used within an EditorProvider");
    }
    return context;
};
