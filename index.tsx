import React, { useState, useRef, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import {
  Upload,
  Scissors,
  Download,
  Type as TypeIcon,
  Layers,
  Image as ImageIcon,
  Settings,
  Sparkles,
  X,
  Crop as CropIcon,
  Check,
  Italic,
  EyeOff,
  Palette,
  Globe,
  Sliders,
  RotateCcw
} from "lucide-react";

// --- Constants & Config ---

const PRESET_COLORS = {
  me: "#c2a2da", 
  do: "#9acccc", 
  chat: "#ffffff", 
  shout: "#ffffff",
  whisper: "#ffff00",
  radio: "#8d8dff", 
  pm: "#ffff00",
  error: "#ff0000",
  server: "#aac4e5",
  low: "#c8c8c8",
  phone: "#4caf50", 
  ooc: "#a0a0a0" 
};

const DEFAULT_CUSTOM_COLORS = [
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF"  // Magenta
];

const FONT_OPTIONS = [
  { name: "Helvetica", value: "Helvetica" },
  { name: "Roboto", value: "Roboto" },
  { name: "Open Sans", value: "Open Sans" },
  { name: "Inter", value: "Inter" },
  { name: "Arial", value: "Arial" },
  { name: "Verdana", value: "Verdana" },
  { name: "Tahoma", value: "Tahoma" },
  { name: "Courier New", value: "Courier New" },
  { name: "Georgia", value: "Georgia" },
  { name: "Trebuchet MS", value: "Trebuchet MS" }
];

const TRANSLATIONS = {
  en: {
    appTitle: "RP Screenshot Editor",
    settings: "Settings",
    apiKey: "Gemini API Key",
    apiKeyPlaceholder: "Enter your Gemini API Key...",
    apiKeyHelp: "Required for AI Filtering.",
    resolution: "Target Output Resolution",
    width: "Width (px)",
    height: "Height (px)",
    resHelp: "If both are set, the crop tool will lock to this aspect ratio. If only width is set, height will scale automatically.",
    customColors: "Custom Toolbar Colors",
    colorsHelp: "These colors appear as buttons in your chat editor.",
    done: "Done",
    uploadStep: "1. UPLOAD IMAGE",
    uploadHelp: "Paste (Ctrl+V), Drag & Drop or Click",
    manualCrop: "Manual Crop & Resize",
    chatStep: "2. CHATLOG",
    loadTxt: "Load .txt",
    aiFilter: "AI Filter",
    filterLabel: "What should I keep/remove?",
    filterPlaceholder: "Ex: Remove OOC logs...",
    go: "Go",
    chatPlaceholder: "Paste chatlog here...",
    renderChat: "Render Chat",
    font: "Font",
    size: "Size (px)",
    lineHeight: "Line Height",
    outlineStrength: "Outline Strength",
    bold: "Bold",
    blackBg: "Black Background",
    export: "Export",
    cropMode: "Crop Mode",
    apply: "Apply",
    cancel: "Cancel",
    dragSelect: "Drag to select.",
    aspectLocked: "Aspect ratio is locked.",
    freeform: "Freeform crop.",
    emptyState: "Drag & Drop or Paste Image Here",
    language: "Language",
    imgUploaded: "Image uploaded. Ready to crop.",
    imgPasted: "Image pasted from clipboard.",
    textPasted: "Text pasted from clipboard.",
    imgDropped: "Image dropped.",
    chatDropped: "Chatlog dropped.",
    cropPrompt: "Click and drag on the image to select crop area.",
    invalidSel: "Invalid selection. Please select an area.",
    processing: "Cropping and resizing...",
    cropDone: "Manual crop complete.",
    errorCrop: "Error processing crop.",
    filterErr: "Failed to filter chat. Check API key.",
    noKey: "Please set your Gemini API Key in settings first.",
    previewPlaceholder: "Default: 1000",
    autoEmpty: "Auto if empty",
    filterBtnLoading: "Filtering...",
    imageAdjustments: "Image Adjustments",
    brightness: "Brightness",
    contrast: "Contrast",
    saturation: "Saturation",
    reset: "Reset"
  },
  tr: {
    appTitle: "RP Ekran Görüntüsü Düzenleyici",
    settings: "Ayarlar",
    apiKey: "Gemini API Anahtarı",
    apiKeyPlaceholder: "Gemini API Anahtarını gir...",
    apiKeyHelp: "Yapay Zeka filtresi için gereklidir.",
    resolution: "Hedef Çıktı Çözünürlüğü",
    width: "Genişlik (px)",
    height: "Yükseklik (px)",
    resHelp: "Her ikisi de ayarlanırsa, kırpma aracı bu en boy oranına kilitlenir. Sadece genişlik ayarlanırsa, yükseklik otomatik ölçeklenir.",
    customColors: "Özel Araç Çubuğu Renkleri",
    colorsHelp: "Bu renkler sohbet editöründe buton olarak görünür.",
    done: "Tamam",
    uploadStep: "1. RESİM YÜKLE",
    uploadHelp: "Yapıştır (Ctrl+V), Sürükle Bırak veya Tıkla",
    manualCrop: "Manuel Kırp & Yeniden Boyutlandır",
    chatStep: "2. SOHBET GÜNLÜĞÜ",
    loadTxt: ".txt Yükle",
    aiFilter: "YZ Filtresi",
    filterLabel: "Neyi saklayayım/kaldırayım?",
    filterPlaceholder: "Ör: OOC logları kaldır...",
    go: "Git",
    chatPlaceholder: "Sohbet günlüğünü buraya yapıştır...",
    renderChat: "Sohbeti Oluştur",
    font: "Yazı Tipi",
    size: "Boyut (px)",
    lineHeight: "Satır Yüksekliği",
    outlineStrength: "Kontür Gücü",
    bold: "Kalın",
    blackBg: "Siyah Arkaplan",
    export: "Dışa Aktar",
    cropMode: "Kırpma Modu",
    apply: "Uygula",
    cancel: "İptal",
    dragSelect: "Seçmek için sürükleyin.",
    aspectLocked: "En boy oranı kilitli.",
    freeform: "Serbest kırpma.",
    emptyState: "Resmi Buraya Sürükle veya Yapıştır",
    language: "Dil / Language",
    imgUploaded: "Resim yüklendi. Kırpmaya hazır.",
    imgPasted: "Resim panodan yapıştırıldı.",
    textPasted: "Metin panodan yapıştırıldı.",
    imgDropped: "Resim bırakıldı.",
    chatDropped: "Chatlog bırakıldı.",
    cropPrompt: "Kırpma alanını seçmek için resmin üzerine tıklayın ve sürükleyin.",
    invalidSel: "Geçersiz seçim. Lütfen bir alan seçin.",
    processing: "Kırpılıyor ve yeniden boyutlandırılıyor...",
    cropDone: "Manuel kırpma tamamlandı.",
    errorCrop: "Kırpma hatası.",
    filterErr: "Sohbet filtrelenemedi. API anahtarını kontrol edin.",
    noKey: "Lütfen önce ayarlardan Gemini API Anahtarınızı ayarlayın.",
    previewPlaceholder: "Varsayılan: 1000",
    autoEmpty: "Boşsa otomatik",
    filterBtnLoading: "Filtreleniyor...",
    imageAdjustments: "Resim Ayarları",
    brightness: "Parlaklık",
    contrast: "Kontrast",
    saturation: "Doygunluk",
    reset: "Sıfırla"
  }
};

// --- Helper Functions ---

interface ChatLine {
  id: string;
  text: string;
  color: string;
}

const parseChatLog = (text: string): ChatLine[] => {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return lines.map((line, idx) => {
    // Clean Timestamps [XX:XX:XX] if present
    let content = line.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, "").trim();
    
    let color = PRESET_COLORS.chat;

    if (content.startsWith("*")) {
      color = PRESET_COLORS.me;
    } else if (content.startsWith(">")) {
      color = PRESET_COLORS.me; 
    } else if (content.includes("(( ") || content.startsWith("((")) {
       if (!content.startsWith("*")) color = PRESET_COLORS.ooc; 
    } else if (content.includes("says:")) {
      color = PRESET_COLORS.chat;
    } else if (content.includes("shouts:")) {
      color = PRESET_COLORS.shout;
    } else if (content.toLowerCase().includes("(radio)") || content.toLowerCase().includes("[radio]")) {
      color = PRESET_COLORS.radio;
    } else if (content.toLowerCase().includes("(cellphone)") || content.toLowerCase().includes("phone")) {
       color = PRESET_COLORS.phone;
    }

    return {
      id: `line-${idx}-${Date.now()}`,
      text: content,
      color,
    };
  });
};

// Helper to insert text at cursor in textarea
const insertAtCursor = (input: HTMLTextAreaElement, prefix: string, suffix: string) => {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;
  const before = text.substring(0, start);
  const selection = text.substring(start, end);
  const after = text.substring(end);

  const newText = before + prefix + selection + suffix + after;
  
  // Return new value and new cursor position
  return {
    text: newText,
    cursorPos: start + prefix.length + selection.length + suffix.length
  };
};

// --- Main Component ---

const App = () => {
  // State
  const [apiKey, setApiKey] = useState<string>("");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  
  // Language State
  const [language, setLanguage] = useState<'en' | 'tr'>('en');

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Resolution Settings
  const [targetWidth, setTargetWidth] = useState<number | "">(1000);
  const [targetHeight, setTargetHeight] = useState<number | "">("");

  // Manual Crop State
  const [isManualCropping, setIsManualCropping] = useState(false);
  const [cropSelection, setCropSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);

  // Chatlog State
  const [chatInput, setChatInput] = useState("");
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
  const [overlayPos, setOverlayPos] = useState({ x: 20, y: 20 });
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Style State 
  const [fontSize, setFontSize] = useState(15); 
  const [lineHeight, setLineHeight] = useState(18);
  const [strokeWidth, setStrokeWidth] = useState(2); // Outline width (Default higher for stroke)
  const [textBackground, setTextBackground] = useState(false); // Black background box
  const [fontFamily, setFontFamily] = useState("Helvetica");
  const [fontBold, setFontBold] = useState(true); 
  const [customColors, setCustomColors] = useState<string[]>(DEFAULT_CUSTOM_COLORS);

  // Image Adjustment State
  const [imgBrightness, setImgBrightness] = useState(100);
  const [imgContrast, setImgContrast] = useState(100);
  const [imgSaturation, setImgSaturation] = useState(100);

  // Export State
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp">("png");

  // AI Filter State
  const [showFilterInput, setShowFilterInput] = useState(false);
  const [filterInstruction, setFilterInstruction] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null); 
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const cropStartPos = useRef<{x: number, y: number} | null>(null);

  // --- Translation Helper ---
  const t = (key: keyof typeof TRANSLATIONS.en) => {
    return TRANSLATIONS[language][key] || TRANSLATIONS['en'][key] || key;
  };

  // --- Persistence & Initialization ---

  useEffect(() => {
    // 1. Language Init
    const savedLang = localStorage.getItem("rp-editor-lang");
    if (savedLang === 'en' || savedLang === 'tr') {
      setLanguage(savedLang);
    } else {
      // Auto-detect
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('tr')) {
        setLanguage('tr');
      } else {
        setLanguage('en');
      }
    }

    // 2. Settings Init
    const savedKey = localStorage.getItem("rp-editor-api-key");
    if (savedKey) setApiKey(savedKey);

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
        if (config.targetWidth !== undefined) setTargetWidth(config.targetWidth);
        if (config.targetHeight !== undefined) setTargetHeight(config.targetHeight);
        if (config.customColors) setCustomColors(config.customColors);
        if (config.exportFormat) setExportFormat(config.exportFormat);
      } catch (e) {
        console.error("Error loading config", e);
      }
    }
  }, []);

  // Save settings
  useEffect(() => {
    const config = { 
      fontSize, 
      lineHeight, 
      fontFamily, 
      fontBold, 
      strokeWidth, 
      textBackground, 
      targetWidth, 
      targetHeight, 
      customColors,
      exportFormat 
    };
    localStorage.setItem("rp-editor-config", JSON.stringify(config));
  }, [fontSize, lineHeight, fontFamily, fontBold, strokeWidth, textBackground, targetWidth, targetHeight, customColors, exportFormat]);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("rp-editor-api-key", key);
  };

  const changeLanguage = (lang: 'en' | 'tr') => {
    setLanguage(lang);
    localStorage.setItem("rp-editor-lang", lang);
  };

  const resetImageAdjustments = () => {
    setImgBrightness(100);
    setImgContrast(100);
    setImgSaturation(100);
  };

  // --- Global Paste & Drop Handlers ---

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
          setChatInput(s);
          setChatLines(parseChatLog(s));
          setStatusMsg(t('textPasted'));
        });
      }
    }
  }, [language]); // Depend on language for translation

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
             setChatInput(text);
             setChatLines(parseChatLog(text));
             setStatusMsg(t('chatDropped'));
          }
        };
        reader.readAsText(file);
      }
    }
  }, [language]);

  useEffect(() => {
    window.addEventListener("paste", handleGlobalPaste);
    window.addEventListener("dragover", (e) => e.preventDefault()); // Allow drop
    window.addEventListener("drop", handleGlobalDrop);

    return () => {
      window.removeEventListener("paste", handleGlobalPaste);
      window.removeEventListener("dragover", (e) => e.preventDefault());
      window.removeEventListener("drop", handleGlobalDrop);
    };
  }, [handleGlobalPaste, handleGlobalDrop]);

  // --- Handlers ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setOriginalImage(url);
      setProcessedImage(null); 
      setIsManualCropping(false); 
      setCropSelection(null);
      setStatusMsg(t('imgUploaded'));
    }
  };

  const handleChatLogUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       const reader = new FileReader();
       reader.onload = (event) => {
         const text = event.target?.result as string;
         if (text) {
            setChatInput(text);
            setChatLines(parseChatLog(text));
         }
       };
       reader.readAsText(file);
     }
  };

  // --- Formatting Toolbar Handler ---
  const applyFormat = (type: 'emote' | 'italic' | 'redact' | 'color', colorHex?: string) => {
    if (!chatInputRef.current) return;
    
    let prefix = "";
    let suffix = "";

    if (type === 'emote') { prefix = "*"; suffix = "*"; }
    if (type === 'italic') { prefix = "/"; suffix = "/"; }
    if (type === 'redact') { prefix = "||"; suffix = "||"; }
    if (type === 'color' && colorHex) { prefix = `[${colorHex}]`; suffix = "[/#]"; }

    const { text, cursorPos } = insertAtCursor(chatInputRef.current, prefix, suffix);
    setChatInput(text);
    
    // Re-parse immediately to show preview
    setChatLines(parseChatLog(text));

    // Restore focus and cursor
    requestAnimationFrame(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
        chatInputRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    });
  };

  const updateCustomColor = (index: number, newColor: string) => {
    const updated = [...customColors];
    updated[index] = newColor;
    setCustomColors(updated);
  };

  // --- Manual Crop Handlers ---

  const startManualCrop = () => {
    setIsManualCropping(true);
    setProcessedImage(null);
    setCropSelection(null);
    setStatusMsg(t('cropPrompt'));
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (!isManualCropping || !cropContainerRef.current) return;
    const rect = cropContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    cropStartPos.current = { x, y };
    setCropSelection({ x, y, w: 0, h: 0 });
    setIsDraggingCrop(true);
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCrop || !cropStartPos.current || !cropContainerRef.current) return;
    const rect = cropContainerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const startX = cropStartPos.current.x;
    const startY = cropStartPos.current.y;

    let w = Math.abs(currentX - startX);
    let h = Math.abs(currentY - startY);
    const x = Math.min(currentX, startX);
    const y = Math.min(currentY, startY);

    // Aspect Ratio Lock if both Target Width & Height are set
    if (targetWidth && targetHeight) {
       const aspect = Number(targetWidth) / Number(targetHeight);
       // Adjust height based on width to maintain aspect
       h = w / aspect;
    }

    setCropSelection({ x, y, w, h });
  };

  const handleCropMouseUp = () => {
    setIsDraggingCrop(false);
  };

  const applyManualCrop = async () => {
    if (!originalImage || !cropSelection || cropSelection.w < 10 || cropSelection.h < 10) {
      setStatusMsg(t('invalidSel'));
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMsg(t('processing'));

      const img = new Image();
      img.src = originalImage;
      await new Promise((r) => (img.onload = r));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No context");

      const previewImg = document.getElementById("manual-crop-preview") as HTMLImageElement;
      if (!previewImg) throw new Error("Preview image not found");

      const scaleX = img.naturalWidth / previewImg.width;
      const scaleY = img.naturalHeight / previewImg.height;

      const realX = cropSelection.x * scaleX;
      const realY = cropSelection.y * scaleY;
      const realW = cropSelection.w * scaleX;
      const realH = cropSelection.h * scaleY;

      // Determine Final Dimensions
      let finalW = 1000; // Default fallback
      let finalH = (finalW / realW) * realH;

      if (targetWidth && targetHeight) {
        finalW = Number(targetWidth);
        finalH = Number(targetHeight);
      } else if (targetWidth) {
        finalW = Number(targetWidth);
        finalH = (finalW / realW) * realH;
      } else if (targetHeight) {
        finalH = Number(targetHeight);
        finalW = (finalH / realH) * realW;
      }

      canvas.width = finalW;
      canvas.height = finalH;

      // Smooth scaling
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        img,
        realX, realY, realW, realH, 
        0, 0, finalW, finalH 
      );

      setProcessedImage(canvas.toDataURL("image/jpeg", 0.9));
      setIsManualCropping(false);
      setStatusMsg(t('cropDone'));

    } catch (error) {
      console.error(error);
      setStatusMsg(t('errorCrop'));
    } finally {
      setIsProcessing(false);
    }
  };

  // --- AI Filter Handler ---

  const handleAIFilter = async () => {
    if (!chatInput.trim()) return;
    if (!apiKey) {
      alert(t('noKey'));
      setIsSettingsOpen(true);
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
      2. Fix Spacing: Ensure there is a space after a character's Lastname if it is missing. (e.g., "John Doe text" instead of "John Doetext" or "John Doe: text" instead of "John Doe:text").
      3. Follow the user instruction above if provided.
      
      Raw Log:
      ${chatInput}

      Return ONLY the filtered chat lines. Do not wrap in markdown, do not add explanations. Maintain the original formatting of the lines that are kept.`;

      const result = await model.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      if (result.text) {
        let cleanText = result.text.trim();
        if (cleanText.startsWith("```")) {
           cleanText = cleanText.replace(/^```(text)?\n/i, "").replace(/\n```$/, "");
        }
        setChatInput(cleanText);
        setChatLines(parseChatLog(cleanText));
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

  const handleProcessChat = () => {
    const lines = parseChatLog(chatInput);
    setChatLines(lines);
  };

  // Dragging Logic for Chat Overlay
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartRef.current = {
      x: e.clientX - overlayPos.x,
      y: e.clientY - overlayPos.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartRef.current) {
      setOverlayPos({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
  };

  // --- Render Rich Text to Canvas (with Wrapping) ---
  const drawWrappedRichText = (
    ctx: CanvasRenderingContext2D, 
    text: string, 
    x: number, 
    y: number, 
    maxWidth: number,
    lineHeight: number,
    baseFontString: string,
    baseColor: string,
    strokeW: number,
    hasBackground: boolean,
    baseFontSize: number
  ) => {
    // Regex to split rich text tokens
    const parts = text.split(/(\[#[0-9a-fA-F]{6}\].*?\[\/#\]|\|\|.*?\|\||\*.*?\*|\/.*?\/)/g);
    
    // Flatten into a stream of word-objects
    interface WordObj {
       text: string;
       width: number;
       font: string;
       fill: string;
       stroke: boolean;
       isRedacted: boolean;
    }
    
    let words: WordObj[] = [];

    parts.forEach(part => {
      if (!part) return;

      let content = part;
      let isItalic = false;
      let isRedacted = false;
      let fill = baseColor;
      let stroke = !hasBackground && strokeW > 0;
      let font = baseFontString; 
      
      // Determine Style
      if (part.startsWith("||") && part.endsWith("||")) {
        isRedacted = true;
        content = part.slice(2, -2);
        stroke = false;
      } else if (part.startsWith("*") && part.endsWith("*")) {
        fill = PRESET_COLORS.me;
        content = part; 
      } else if (part.startsWith("/") && part.endsWith("/")) {
        isItalic = true;
        content = part.slice(1, -1);
      } else if (part.match(/^\[#[0-9a-fA-F]{6}\]/)) {
        const hex = part.match(/^\[(#[0-9a-fA-F]{6})\]/)?.[1];
        if (hex) fill = hex;
        content = part.replace(/^\[#[0-9a-fA-F]{6}\]/, "").replace(/\[\/#\]$/, "");
      }

      // Apply Italic to font string if needed
      if (isItalic) {
          font = "italic " + baseFontString;
      }

      // Split content into words/spaces, capturing whitespace
      const tokens = content.split(/(\s+)/);
      
      tokens.forEach(token => {
          if (!token) return;
          ctx.font = font;
          const metrics = ctx.measureText(token);
          words.push({
              text: token,
              width: metrics.width,
              font,
              fill,
              stroke,
              isRedacted
          });
      });
    });

    // Render loop with wrapping
    let currentY = y;
    
    let lineBuffer: WordObj[] = [];
    let lineBufferWidth = 0;

    const flushLine = () => {
        if (lineBuffer.length === 0) return;

        // 1. Draw Backgrounds (Behind everything)
        let drawX = x;
        lineBuffer.forEach(w => {
            if (hasBackground || w.isRedacted) {
                 ctx.fillStyle = "black";
                 // FIXED: Use lineHeight instead of baseFontSize to close gaps
                 ctx.fillRect(drawX, currentY, w.width, lineHeight); 
            }
            drawX += w.width;
        });

        // 2. Draw Strokes
        drawX = x;
        lineBuffer.forEach(w => {
             if (w.stroke && !w.isRedacted && w.text.trim()) {
                ctx.font = w.font;
                ctx.lineWidth = strokeW * 2;
                ctx.strokeStyle = "black";
                ctx.lineJoin = "round";
                ctx.miterLimit = 2;
                ctx.strokeText(w.text, drawX, currentY);
             }
             drawX += w.width;
        });

        // 3. Draw Fills
        drawX = x;
        lineBuffer.forEach(w => {
             if (!w.isRedacted && w.text.trim()) {
                 ctx.font = w.font;
                 ctx.fillStyle = w.fill;
                 ctx.fillText(w.text, drawX, currentY);
             }
             drawX += w.width;
        });
    };

    words.forEach(word => {
         // Check if adding this word exceeds maxWidth
         if (lineBufferWidth + word.width > maxWidth && lineBuffer.length > 0) {
             // Flush current
             flushLine();
             // Move down
             currentY += lineHeight;
             // Reset
             lineBuffer = [];
             lineBufferWidth = 0;
         }
         
         lineBuffer.push(word);
         lineBufferWidth += word.width;
    });

    // Flush remaining
    flushLine();
    
    // Return the Y coordinate for the NEXT line of chat
    return currentY + lineHeight;
  };

  // Export Logic
  const handleExport = async () => {
    if (!processedImage && !originalImage) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = (processedImage || originalImage) as string;
    await new Promise(r => img.onload = r);

    canvas.width = img.width;
    canvas.height = img.height;

    if (ctx) {
      // Apply filters before drawing the image
      // Note: This relies on modern browser support for context.filter
      ctx.filter = `brightness(${imgBrightness}%) contrast(${imgContrast}%) saturate(${imgSaturation}%)`;

      // Draw BG
      ctx.drawImage(img, 0, 0);

      // Reset filter for text so text isn't affected by image adjustments
      ctx.filter = "none";

      // Draw Text
      const previewImg = document.getElementById("preview-image") as HTMLImageElement;
      const rect = previewImg.getBoundingClientRect();
      const scaleX = img.width / rect.width;
      const scaleY = img.height / rect.height;

      // Font construction
      const baseFontSize = fontSize * scaleX;
      const baseFontString = `${fontBold ? "bold " : ""}${baseFontSize}px ${fontFamily}, sans-serif`;
      
      ctx.textBaseline = "top";
      
      // Calculate starting positions and safe width
      let currentY = (overlayPos.y * scaleY);
      const startX = (overlayPos.x * scaleX);
      // Calculate max width relative to image size, with some right-side padding
      const maxWidth = img.width - startX - (20 * scaleX); 

      chatLines.forEach((line) => {
        currentY = drawWrappedRichText(
          ctx, 
          line.text, 
          startX, 
          currentY, 
          maxWidth,
          lineHeight * scaleY, 
          baseFontString, 
          line.color, 
          strokeWidth * scaleX,
          textBackground,
          baseFontSize
        );
      });

      // Date based filename
      const date = new Date();
      const dateStr = date.getFullYear() + "-" + 
                      String(date.getMonth() + 1).padStart(2, '0') + "-" + 
                      String(date.getDate()).padStart(2, '0') + "_" + 
                      String(date.getHours()).padStart(2, '0') + "-" + 
                      String(date.getMinutes()).padStart(2, '0') + "-" + 
                      String(date.getSeconds()).padStart(2, '0');
      
      const filename = `rp-edit-${dateStr}.${exportFormat}`;

      // Download
      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL(`image/${exportFormat}`, 0.9);
      link.click();
    }
  };

  // Helper to render preview text (HTML/React version of the Canvas logic)
  const renderPreviewLine = (text: string) => {
    const parts = text.split(/(\[#[0-9a-fA-F]{6}\].*?\[\/#\]|\|\|.*?\|\||\*.*?\*|\/.*?\/)/g);
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith("||") && part.endsWith("||")) {
            return <span key={i} className="bg-black text-black select-none px-1">REDACTED</span>;
          } else if (part.startsWith("*") && part.endsWith("*")) {
            return <span key={i} style={{ color: PRESET_COLORS.me }}>{part}</span>;
          } else if (part.startsWith("/") && part.endsWith("/")) {
            return <span key={i} className="italic">{part.slice(1, -1)}</span>;
          } else if (part.match(/^\[#[0-9a-fA-F]{6}\]/)) {
             const hex = part.match(/^\[(#[0-9a-fA-F]{6})\]/)?.[1];
             const content = part.replace(/^\[#[0-9a-fA-F]{6}\]/, "").replace(/\[\/#\]$/, "");
             return <span key={i} style={{ color: hex || 'inherit' }}>{content}</span>
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  };

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

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-gray-700 p-6 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings size={18}/> {t('settings')}</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white"><X size={18}/></button>
             </div>
             
             <div className="mb-6 space-y-4">
               <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">{t('apiKey')}</label>
                  <input 
                    type="password" 
                    placeholder={t('apiKeyPlaceholder')} 
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded p-2 text-sm focus:border-purple-500 outline-none text-white"
                    value={apiKey}
                    onChange={(e) => saveApiKey(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">{t('apiKeyHelp')}</p>
               </div>

                <div className="border-t border-gray-800 pt-4">
                  <label className="block text-xs text-gray-400 mb-2 uppercase font-bold flex items-center gap-2">
                    <Globe size={14}/> {t('language')}
                  </label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => changeLanguage('en')}
                      className={`flex-1 py-2 text-xs font-bold rounded border ${language === 'en' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-[#0a0a0a] border-gray-700 text-gray-400 hover:border-gray-500'}`}
                    >
                      English
                    </button>
                    <button 
                      onClick={() => changeLanguage('tr')}
                      className={`flex-1 py-2 text-xs font-bold rounded border ${language === 'tr' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-[#0a0a0a] border-gray-700 text-gray-400 hover:border-gray-500'}`}
                    >
                      Türkçe
                    </button>
                  </div>
                </div>

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

             <div className="flex justify-end">
               <button 
                 onClick={() => setIsSettingsOpen(false)}
                 className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
               >
                 <Check size={16} /> {t('done')}
               </button>
             </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Sidebar Controls */}
        <aside className="w-full md:w-80 bg-[#1a1a1a] border-r border-gray-800 p-4 flex flex-col gap-6 overflow-y-auto z-10 shadow-xl scrollbar-thin">
          
          {/* Step 1: Image */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <ImageIcon size={16} /> {t('uploadStep')}
            </h2>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer relative group">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto text-gray-500 mb-2 group-hover:text-purple-400" />
              <p className="text-xs text-gray-400">{t('uploadHelp')}</p>
            </div>

            {originalImage && (
              <div className="mt-3 grid grid-cols-1 gap-2">
                <button
                   onClick={startManualCrop}
                   disabled={isProcessing || isManualCropping}
                   className={`w-full py-2 px-2 rounded flex items-center justify-center gap-1 font-medium text-xs transition-all ${
                     isProcessing || isManualCropping
                       ? "bg-gray-700 text-gray-400 cursor-not-allowed" 
                       : "bg-[#2a2a2a] hover:bg-[#333] text-gray-200 border border-gray-700"
                   }`}
                >
                  <CropIcon size={14} />
                  {t('manualCrop')}
                </button>
                
                {statusMsg && <p className="text-[10px] text-gray-500 mt-1 text-center truncate">{statusMsg}</p>}
              </div>
            )}
          </section>

          {/* Step 1.5: Image Adjustments */}
          {originalImage && !isManualCropping && (
             <section>
                <div className="flex justify-between items-center mb-2">
                   <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                     <Sliders size={16} /> {t('imageAdjustments')}
                   </h2>
                   <button 
                     onClick={resetImageAdjustments} 
                     className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                   >
                     <RotateCcw size={10} /> {t('reset')}
                   </button>
                </div>
                
                <div className="space-y-3 p-3 bg-[#0f0f0f] border border-gray-700 rounded">
                   <div>
                     <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                       <span>{t('brightness')}</span>
                       <span>{imgBrightness}%</span>
                     </div>
                     <input 
                       type="range" min="0" max="200" 
                       value={imgBrightness}
                       onChange={(e) => setImgBrightness(Number(e.target.value))}
                       className="w-full accent-purple-600 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                     />
                   </div>
                   <div>
                     <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                       <span>{t('contrast')}</span>
                       <span>{imgContrast}%</span>
                     </div>
                     <input 
                       type="range" min="0" max="200" 
                       value={imgContrast}
                       onChange={(e) => setImgContrast(Number(e.target.value))}
                       className="w-full accent-purple-600 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                     />
                   </div>
                   <div>
                     <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                       <span>{t('saturation')}</span>
                       <span>{imgSaturation}%</span>
                     </div>
                     <input 
                       type="range" min="0" max="200" 
                       value={imgSaturation}
                       onChange={(e) => setImgSaturation(Number(e.target.value))}
                       className="w-full accent-purple-600 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                     />
                   </div>
                </div>
             </section>
          )}

          {/* Step 2: Chatlog */}
          <section className="flex-1 flex flex-col min-h-0">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <TypeIcon size={16} /> {t('chatStep')}
            </h2>
            
            <div className="flex gap-2 mb-2">
               <label className="flex-1 bg-[#2a2a2a] hover:bg-[#333] border border-gray-700 rounded py-1.5 text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Layers size={12} /> {t('loadTxt')}
                  <input type="file" accept=".txt" className="hidden" onChange={handleChatLogUpload} />
               </label>
               <button 
                  onClick={() => setShowFilterInput(!showFilterInput)}
                  className={`flex-1 border border-gray-700 rounded py-1.5 text-xs flex items-center justify-center gap-2 transition-colors ${showFilterInput ? 'bg-purple-900/50 border-purple-500 text-purple-200' : 'bg-[#2a2a2a] hover:bg-[#333]'}`}
               >
                  <Sparkles size={12} /> {t('aiFilter')}
               </button>
            </div>

            {/* AI Filter Input Area */}
            {showFilterInput && (
              <div className="mb-2 p-2 bg-purple-900/20 border border-purple-500/30 rounded animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] text-purple-300 block mb-1">{t('filterLabel')}</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder={t('filterPlaceholder')}
                    className="flex-1 bg-[#0f0f0f] border border-gray-700 rounded px-2 py-1 text-xs focus:border-purple-500 outline-none"
                    value={filterInstruction}
                    onChange={(e) => setFilterInstruction(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAIFilter()}
                  />
                  <button 
                    onClick={handleAIFilter}
                    disabled={isFiltering}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-2 rounded text-xs disabled:opacity-50"
                  >
                    {isFiltering ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div> : t('go')}
                  </button>
                </div>
              </div>
            )}

            {/* Chat Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-1 mb-1 bg-[#0f0f0f] p-1 rounded border border-gray-700 border-b-0 rounded-b-none">
               <button 
                 onClick={() => applyFormat('emote')}
                 className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-[#c2a2da]" 
                 title="Highlight Emote (*text*)"
               >
                 <Palette size={14} />
               </button>
               <button 
                 onClick={() => applyFormat('italic')}
                 className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
                 title="Italic (/text/)"
               >
                 <Italic size={14} />
               </button>
               <button 
                 onClick={() => applyFormat('redact')}
                 className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
                 title="Redact (||text||)"
               >
                 <EyeOff size={14} />
               </button>
               
               {/* Custom Color Buttons */}
               <div className="w-[1px] h-4 bg-gray-700 mx-1"></div>
               {customColors.map((color, idx) => (
                 <button
                    key={idx}
                    onClick={() => applyFormat('color', color)}
                    className="w-5 h-5 rounded border border-gray-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={`Apply Custom Color ${idx + 1}`}
                 />
               ))}
            </div>

            <textarea
              ref={chatInputRef}
              className="w-full flex-1 bg-[#0f0f0f] border border-gray-700 rounded rounded-t-none p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-purple-500 resize-none mb-2"
              placeholder={t('chatPlaceholder')}
              value={chatInput}
              onChange={(e) => {
                setChatInput(e.target.value);
              }}
            />
            <button
              onClick={handleProcessChat}
              className="w-full py-2 bg-[#2a2a2a] hover:bg-[#333] border border-gray-700 rounded text-gray-300 text-xs font-medium transition-colors"
            >
              {t('renderChat')}
            </button>

            {/* Style Controls */}
            <div className="mt-4 space-y-3">
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
                 <div className="flex items-center gap-2">
                   <input 
                     type="checkbox" 
                     id="boldToggle"
                     checked={fontBold}
                     onChange={(e) => setFontBold(e.target.checked)}
                     className="w-3 h-3 rounded border-gray-700 bg-[#0f0f0f] text-purple-600 focus:ring-purple-500 focus:ring-offset-0 focus:ring-1"
                   />
                   <label htmlFor="boldToggle" className="text-xs text-gray-400 cursor-pointer select-none">{t('bold')}</label>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   <input 
                     type="checkbox" 
                     id="bgToggle"
                     checked={textBackground}
                     onChange={(e) => setTextBackground(e.target.checked)}
                     className="w-3 h-3 rounded border-gray-700 bg-[#0f0f0f] text-purple-600 focus:ring-purple-500 focus:ring-offset-0 focus:ring-1"
                   />
                   <label htmlFor="bgToggle" className="text-xs text-gray-400 cursor-pointer select-none">{t('blackBg')}</label>
                 </div>
               </div>
            </div>
          </section>

          {/* Step 3: Export */}
          <section className="mt-auto pt-4 border-t border-gray-800">
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

        {/* Main Canvas Area */}
        <div className="flex-1 bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center p-8 cursor-move bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px]">
          
          {/* Manual Crop Overlay UI */}
          {isManualCropping && originalImage && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="absolute top-4 z-50 flex gap-4 bg-[#1a1a1a] p-2 rounded-lg border border-gray-700 shadow-2xl">
                <div className="text-white text-sm font-bold flex items-center gap-2 px-2">
                  <CropIcon size={16} className="text-purple-400"/> {t('cropMode')}
                </div>
                <button 
                  onClick={applyManualCrop} 
                  className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1"
                >
                  <Check size={12} /> {t('apply')}
                </button>
                <button 
                  onClick={() => setIsManualCropping(false)} 
                  className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1"
                >
                   <X size={12} /> {t('cancel')}
                </button>
              </div>
              
              <div 
                ref={cropContainerRef}
                onMouseDown={handleCropMouseDown}
                onMouseMove={handleCropMouseMove}
                onMouseUp={handleCropMouseUp}
                onMouseLeave={handleCropMouseUp}
                className="relative cursor-crosshair border border-gray-600 shadow-2xl"
                style={{ maxWidth: '90vw', maxHeight: '80vh' }}
              >
                <img 
                  id="manual-crop-preview"
                  src={originalImage} 
                  alt="Crop Source" 
                  className="block max-w-full max-h-[80vh]" 
                  draggable={false}
                />
                {/* The Selection Box */}
                {cropSelection && (
                  <div 
                    className="absolute border-2 border-white bg-white/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                    style={{
                      left: cropSelection.x,
                      top: cropSelection.y,
                      width: cropSelection.w,
                      height: cropSelection.h,
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </div>
              <p className="text-gray-400 text-xs mt-4">{t('dragSelect')} {targetWidth && targetHeight ? t('aspectLocked') : t('freeform')}</p>
            </div>
          )}

          {!processedImage && !originalImage && !isManualCropping && (
             <div className="text-gray-600 flex flex-col items-center pointer-events-none">
               <Layers size={48} className="mb-4 opacity-20" />
               <p>{t('emptyState')}</p>
             </div>
          )}

          {/* Workspace */}
          {!isManualCropping && (
            <div 
               className="relative shadow-2xl select-none group"
               style={{ maxWidth: '100%', maxHeight: '100%' }}
            >
               {/* Background Image */}
               {processedImage ? (
                 <img 
                   id="preview-image"
                   src={processedImage} 
                   alt="Processed" 
                   className="block max-w-full max-h-[80vh] object-contain border border-gray-800"
                   style={{
                      filter: `brightness(${imgBrightness}%) contrast(${imgContrast}%) saturate(${imgSaturation}%)`
                   }}
                   draggable={false}
                 />
               ) : originalImage ? (
                 <img 
                   id="preview-image"
                   src={originalImage} 
                   alt="Original" 
                   className="block max-w-full max-h-[80vh] object-contain border border-gray-800"
                   style={{
                      filter: `brightness(${imgBrightness}%) contrast(${imgContrast}%) saturate(${imgSaturation}%)`
                   }}
                   draggable={false}
                 />
               ) : null}

               {/* Chat Overlay */}
               {chatLines.length > 0 && (originalImage || processedImage) && (
                 <div
                   ref={containerRef}
                   onMouseDown={handleMouseDown}
                   onMouseMove={handleMouseMove}
                   onMouseUp={handleMouseUp}
                   onMouseLeave={handleMouseUp}
                   className="absolute cursor-move z-20 hover:outline hover:outline-1 hover:outline-purple-500/50 rounded p-2"
                   style={{
                     left: overlayPos.x,
                     top: overlayPos.y,
                     pointerEvents: 'auto' 
                   }}
                 >
                   {chatLines.map((line) => {
                     return (
                       <div
                         key={line.id}
                         style={{
                           fontFamily: `${fontFamily}, sans-serif`,
                           fontSize: `${fontSize}px`,
                           fontWeight: fontBold ? 'bold' : 'normal',
                           color: line.color,
                           lineHeight: `${lineHeight}px`,
                           WebkitTextStroke: (!textBackground && strokeWidth > 0) ? `${strokeWidth}px black` : '0',
                           paintOrder: 'stroke fill',
                           backgroundColor: textBackground ? 'black' : 'transparent'
                         }}
                         // CHANGED: Use block and w-fit to stack lines correctly without gaps
                         className={`whitespace-pre-wrap ${textBackground ? 'block w-fit px-0.5' : ''}`}
                       >
                         {/* Render Preview with simple HTML replacements */}
                         {renderPreviewLine(line.text)}
                       </div>
                     )
                   })}
                 </div>
               )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);