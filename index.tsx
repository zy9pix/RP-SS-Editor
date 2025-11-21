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
  Save
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

const FONT_OPTIONS = [
  { name: "Helvetica", value: "Helvetica" },
  { name: "Verdana (Classic)", value: "Verdana" },
  { name: "Arial", value: "Arial" },
  { name: "Tahoma", value: "Tahoma" },
  { name: "Courier New", value: "Courier New" },
  { name: "Georgia", value: "Georgia" },
  { name: "Trebuchet MS", value: "Trebuchet MS" }
];

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

// --- Main Component ---

const App = () => {
  // State
  const [apiKey, setApiKey] = useState<string>("");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null); // The 1000px cropped version
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Manual Crop State
  const [isManualCropping, setIsManualCropping] = useState(false);
  const [cropSelection, setCropSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);

  // Chatlog State
  const [chatInput, setChatInput] = useState("");
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
  const [overlayPos, setOverlayPos] = useState({ x: 20, y: 20 });
  
  // Style State (Defaults will be overwritten by localStorage if present)
  const [fontSize, setFontSize] = useState(15); 
  const [lineHeight, setLineHeight] = useState(18);
  const [strokeWidth, setStrokeWidth] = useState(3); 
  const [fontFamily, setFontFamily] = useState("Helvetica");
  const [fontBold, setFontBold] = useState(true); 

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

  // --- Persistence & Initialization ---

  useEffect(() => {
    // Load settings from localStorage
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
      } catch (e) {
        console.error("Error loading config", e);
      }
    }
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    const config = { fontSize, lineHeight, fontFamily, fontBold };
    localStorage.setItem("rp-editor-config", JSON.stringify(config));
  }, [fontSize, lineHeight, fontFamily, fontBold]);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("rp-editor-api-key", key);
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
          setStatusMsg("Image pasted from clipboard.");
        }
      } else if (item.type === "text/plain") {
        // If user is typing in a specific input, don't hijack
        if (
          document.activeElement?.tagName === "INPUT" || 
          document.activeElement?.tagName === "TEXTAREA"
        ) {
          return; 
        }
        item.getAsString((s) => {
          setChatInput(s);
          setChatLines(parseChatLog(s));
          setStatusMsg("Text pasted from clipboard.");
        });
      }
    }
  }, []);

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
        setStatusMsg("Image dropped.");
      } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
             setChatInput(text);
             setChatLines(parseChatLog(text));
             setStatusMsg("Chatlog dropped.");
          }
        };
        reader.readAsText(file);
      }
    }
  }, []);

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
      setStatusMsg("Image uploaded. Ready to crop.");
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

  // --- Manual Crop Handlers ---

  const startManualCrop = () => {
    setIsManualCropping(true);
    setProcessedImage(null);
    setCropSelection(null);
    setStatusMsg("Click and drag on the image to select crop area.");
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

    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);
    const x = Math.min(currentX, startX);
    const y = Math.min(currentY, startY);

    setCropSelection({ x, y, w, h });
  };

  const handleCropMouseUp = () => {
    setIsDraggingCrop(false);
  };

  const applyManualCrop = async () => {
    if (!originalImage || !cropSelection || cropSelection.w < 10 || cropSelection.h < 10) {
      setStatusMsg("Invalid selection. Please select an area.");
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMsg("Cropping and resizing...");

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

      // Target width 1000px
      const targetWidth = 1000;
      const resizeScale = targetWidth / realW;
      const targetHeight = realH * resizeScale;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.drawImage(
        img,
        realX, realY, realW, realH, 
        0, 0, targetWidth, targetHeight 
      );

      setProcessedImage(canvas.toDataURL("image/jpeg", 0.9));
      setIsManualCropping(false);
      setStatusMsg("Manual crop complete.");

    } catch (error) {
      console.error(error);
      setStatusMsg("Error processing crop.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- AI Filter Handler ---

  const handleAIFilter = async () => {
    if (!chatInput.trim()) return;
    if (!apiKey) {
      alert("Please set your Gemini API Key in settings first.");
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
        // Cleanup just in case model adds backticks
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
      alert("Failed to filter chat. Check API key.");
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
      // Draw BG
      ctx.drawImage(img, 0, 0);

      // Draw Text
      const previewImg = document.getElementById("preview-image") as HTMLImageElement;
      const rect = previewImg.getBoundingClientRect();
      const scaleX = img.width / rect.width;
      const scaleY = img.height / rect.height;

      // Font construction
      const fontString = `${fontBold ? "bold " : ""}${fontSize * scaleX}px ${fontFamily}, sans-serif`;
      ctx.font = fontString;
      
      ctx.textBaseline = "top";
      ctx.lineWidth = strokeWidth * scaleX; 
      ctx.lineJoin = "round";
      ctx.strokeStyle = "black";

      chatLines.forEach((line, idx) => {
        const y = (overlayPos.y * scaleY) + (idx * lineHeight * scaleY);
        const x = (overlayPos.x * scaleX);
        
        // Draw outline (stroke)
        ctx.strokeText(line.text, x, y);
        // Draw fill
        ctx.fillStyle = line.color;
        ctx.fillText(line.text, x, y);
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

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-[#1e1e1e] border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scissors className="text-purple-400" />
          <h1 className="text-xl font-bold text-white">RP Screenshot Editor</h1>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="text-gray-400 hover:text-white transition-colors p-2 rounded hover:bg-gray-700"
          title="Settings & API Key"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-gray-700 p-6 rounded-lg shadow-2xl w-full max-w-md">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings size={18}/> Settings</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white"><X size={18}/></button>
             </div>
             
             <div className="mb-4">
               <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Gemini API Key</label>
               <input 
                 type="password" 
                 placeholder="Enter your Gemini API Key..." 
                 className="w-full bg-[#0a0a0a] border border-gray-700 rounded p-2 text-sm focus:border-purple-500 outline-none text-white"
                 value={apiKey}
                 onChange={(e) => saveApiKey(e.target.value)}
               />
               <p className="text-[10px] text-gray-500 mt-2">
                 Required for AI Filtering. The key is saved in your browser's local storage.
               </p>
             </div>

             <div className="flex justify-end">
               <button 
                 onClick={() => setIsSettingsOpen(false)}
                 className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
               >
                 <Check size={16} /> Done
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
              <ImageIcon size={16} /> 1. UPLOAD IMAGE
            </h2>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer relative group">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto text-gray-500 mb-2 group-hover:text-purple-400" />
              <p className="text-xs text-gray-400">Paste (Ctrl+V), Drag & Drop or Click</p>
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
                  Manual Crop & Resize
                </button>
                
                {statusMsg && <p className="text-[10px] text-gray-500 mt-1 text-center truncate">{statusMsg}</p>}
              </div>
            )}
          </section>

          {/* Step 2: Chatlog */}
          <section className="flex-1 flex flex-col min-h-0">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <TypeIcon size={16} /> 2. CHATLOG
            </h2>
            
            <div className="flex gap-2 mb-2">
               <label className="flex-1 bg-[#2a2a2a] hover:bg-[#333] border border-gray-700 rounded py-1.5 text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Layers size={12} /> Load .txt
                  <input type="file" accept=".txt" className="hidden" onChange={handleChatLogUpload} />
               </label>
               <button 
                  onClick={() => setShowFilterInput(!showFilterInput)}
                  className={`flex-1 border border-gray-700 rounded py-1.5 text-xs flex items-center justify-center gap-2 transition-colors ${showFilterInput ? 'bg-purple-900/50 border-purple-500 text-purple-200' : 'bg-[#2a2a2a] hover:bg-[#333]'}`}
               >
                  <Sparkles size={12} /> AI Filter
               </button>
            </div>

            {/* AI Filter Input Area */}
            {showFilterInput && (
              <div className="mb-2 p-2 bg-purple-900/20 border border-purple-500/30 rounded animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] text-purple-300 block mb-1">What should I keep/remove?</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Ex: Remove OOC logs..."
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
                    {isFiltering ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div> : "Go"}
                  </button>
                </div>
              </div>
            )}

            <textarea
              className="w-full flex-1 bg-[#0f0f0f] border border-gray-700 rounded p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-purple-500 resize-none mb-2"
              placeholder="Paste chatlog here (Ctrl+V)..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              onClick={handleProcessChat}
              className="w-full py-2 bg-[#2a2a2a] hover:bg-[#333] border border-gray-700 rounded text-gray-300 text-xs font-medium transition-colors"
            >
              Render Chat
            </button>

            {/* Style Controls */}
            <div className="mt-4 grid grid-cols-2 gap-2">
               <div className="col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase block mb-1">Font</label>
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
                 <label className="text-[10px] text-gray-500 uppercase block mb-1">Size (px)</label>
                 <input 
                    type="number" 
                    value={fontSize} 
                    onChange={e => setFontSize(Number(e.target.value))}
                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-purple-500"
                 />
               </div>
               <div>
                 <label className="text-[10px] text-gray-500 uppercase block mb-1">Line Height</label>
                 <input 
                    type="number" 
                    value={lineHeight} 
                    onChange={e => setLineHeight(Number(e.target.value))}
                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-purple-500"
                 />
               </div>
               <div className="col-span-2 flex items-center gap-2 mt-1">
                 <input 
                   type="checkbox" 
                   id="boldToggle"
                   checked={fontBold}
                   onChange={(e) => setFontBold(e.target.checked)}
                   className="w-3 h-3 rounded border-gray-700 bg-[#0f0f0f] text-purple-600 focus:ring-purple-500 focus:ring-offset-0 focus:ring-1"
                 />
                 <label htmlFor="boldToggle" className="text-xs text-gray-400 cursor-pointer select-none">Bold Text</label>
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
                  Export
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
                  <CropIcon size={16} className="text-purple-400"/> Manual Crop Mode
                </div>
                <button 
                  onClick={applyManualCrop} 
                  className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1"
                >
                  <Check size={12} /> Apply & Resize (1000px)
                </button>
                <button 
                  onClick={() => setIsManualCropping(false)} 
                  className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1"
                >
                   <X size={12} /> Cancel
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
              <p className="text-gray-400 text-xs mt-4">Drag to select the area you want to keep.</p>
            </div>
          )}

          {!processedImage && !originalImage && !isManualCropping && (
             <div className="text-gray-600 flex flex-col items-center pointer-events-none">
               <Layers size={48} className="mb-4 opacity-20" />
               <p>Drag & Drop or Paste Image Here</p>
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
                   draggable={false}
                 />
               ) : originalImage ? (
                 <img 
                   id="preview-image"
                   src={originalImage} 
                   alt="Original" 
                   className="block max-w-full max-h-[80vh] object-contain border border-gray-800"
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
                   {chatLines.map((line) => (
                     <div
                       key={line.id}
                       style={{
                         fontFamily: `${fontFamily}, sans-serif`,
                         fontSize: `${fontSize}px`,
                         fontWeight: fontBold ? 'bold' : 'normal',
                         color: line.color,
                         lineHeight: `${lineHeight}px`,
                         textShadow: 
                           `-1px -1px 0 #000, 
                            1px -1px 0 #000, 
                            -1px 1px 0 #000, 
                            1px 1px 0 #000`
                       }}
                       className="whitespace-pre-wrap"
                     >
                       {line.text}
                     </div>
                   ))}
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