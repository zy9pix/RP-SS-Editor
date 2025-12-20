import React, { useRef, useEffect, useState } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { useEditor } from '@/src/context/EditorContext';
import { TextToImageRenderer } from '@/src/services/TextToImageRenderer';
import { parseChatLog } from '@/src/utils/chatParser';
import CropOverlay from './overlays/CropOverlay';

// --- Workspace: The main stage ---
const Workspace = () => {
    const {
        t,
        originalImage, setOriginalImage, processedImage, setProcessedImage,
        isManualCropping, setIsManualCropping, cropSelection, setCropSelection,
        targetWidth, targetHeight,
        textLayers, updateTextLayer, activeLayerId, setActiveLayerId, setStatusMsg, setIsProcessing,
        fontFamily, fontSize, lineHeight, strokeWidth, textBackground, fontBold,
        imgBrightness, imgContrast, imgSaturation, exportFormat,
        isCinematic, isLinearGradient,
        resolutionPresets
    } = useEditor();

    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);

    // --- RENDER WATCHER ---
    // This effect watches for changes in layer TEXT or STYLE and triggers the re-render of the PNG for that layer.
    useEffect(() => {
        const renderLayers = async () => {
            // Check if any layer needs rendering logic (e.g. if cachedImage is missing or styles changed)
            // Ideally, we only re-render the layers whose "hash" of style+text changed. 
            // Since we don't have a deep compare here effectively, we will re-run the render for ALL layers 
            // periodically or when dependencies change. 
            // Optimization: Only update if cache is empty or if we detect a change? 
            // For now, let's just re-render ALL layers when global styles change or layer text changes.
            // This might be slightly expensive but standard for < 10 layers.

            // Note: We can't update state inside this loop directly if it triggers generic re-renders loop.
            // We should check if we *need* to update.

            // To avoid infinite loops, we need to compare current props vs stored props... 
            // Actually, we can just trigger this when `fontSize`, `fontFamily` etc change.

            for (const layer of textLayers) {
                // Determine if we need to re-render. 
                // We'll calculate a simple "signature" or just re-render.
                // Let's just re-render and compare DataURL length? 

                // Construct options
                const options = {
                    fontFamily,
                    fontSize,
                    lineHeight,
                    strokeWidth,
                    fontBold,
                    textBackground,
                    maxWidth: 1000 // Fixed max width for chat logs usually, or relative to image?
                    // The old Canvas.tsx used dynamic MaxWidth based on image. 
                    // We probably should calculate this based on the uploaded image.
                };

                // Helper to get image width
                let limit = 800; // default
                const imgEl = document.getElementById("main-image") as HTMLImageElement;
                if (imgEl && imgEl.naturalWidth) {
                    // Scaling factor check... 
                    // The layer x/y are relative to the CSS pixels usually... 
                    // Wait, `layer.x` in the old app was pixels relative to the DOM element?
                    // Yes, Canvas.tsx rendered using absolute positioning on top of image.

                    // TextToImageRenderer generates a HIGH RES png.
                    // If we display it in DOM, we should match the scale.
                }

                // Render
                const { dataUrl } = await TextToImageRenderer.generateLayerImage(layer.text, options);

                // Only update if changed
                if (layer.cachedImage !== dataUrl) {
                    updateTextLayer(layer.id, { cachedImage: dataUrl });
                }
            }
        };

        const timer = setTimeout(() => {
            renderLayers();
        }, 100); // 100ms debounce

        return () => clearTimeout(timer);

    }, [
        // Dependencies required for re-render
        textLayers.map(l => l.text).join('|'), // Watch text changes
        fontFamily, fontSize, lineHeight, strokeWidth, textBackground, fontBold
    ]);

    // Force re-render of all layers on mount (cache buster for dev iterations)
    // This ensures that if we changed the Renderer logic (like padding), the old dataURLs in state are replaced.
    useEffect(() => {
        const refreshLayers = async () => {
            // We iterate and force update. 
            // Since `updateTextLayer` merges, and we just want to re-trigger the main Render Watcher...
            // The main render watcher depends on `textLayers.map(l => l.text)`.
            // We can just set a temporary flag or cleared cachedImage?
            // Let's clear cachedImages on mount.

            // Check if we have layers with data but old styling? 
            // Actually, the easiest way is to loop and set cachedImage: undefined.
            // But that triggers a state update per layer.

            // Better: The Render Watcher above checks `if (layer.cachedImage !== dataUrl)`.
            // If we change the PADDING code, the `dataUrl` generated NEW will differ from `layer.cachedImage` (old).
            // So it SHOULD auto-update?
            // YES, provided `TextToImageRenderer.generateLayerImage` is called.
            // The effect runs on mount? Yes.
            // So it should have updated. 
            // maybe I need to check if the effect actually ran?
            // It depends on `textLayers` changing. On mount, it runs.
        };
        // refreshLayers();
    }, []);

    // --- DRAG LOGIC ---
    const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
        e.stopPropagation();
        setActiveLayerId(layerId);
        const layer = textLayers.find(l => l.id === layerId);
        if (!layer) return;
        setDragStart({ x: e.clientX - layer.x, y: e.clientY - layer.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragStart && activeLayerId) {
            updateTextLayer(activeLayerId, {
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setDragStart(null);
    };

    // --- UPLOAD ---
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setOriginalImage(url);
            setProcessedImage(null);
        }
    };

    // --- EXPORT logic reuse (Simplified for now) ---
    // The previous export logic used `await new Promise`. 
    // We can rely on a cleaner implementation later, but for now 
    // we need to ensure the export listener is attached.
    useEffect(() => {
        const doExport = async () => {
            if (!processedImage && !originalImage) return;

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.src = (processedImage || originalImage) as string;
            img.crossOrigin = "anonymous";
            await new Promise(r => img.onload = r);

            // Setup sizes
            let canvasWidth = img.width;
            let canvasHeight = img.height;
            let drawYOffset = 0;
            if (isCinematic) {
                const barHeight = Math.round(img.height * 0.10);
                canvasHeight = img.height + (barHeight * 2);
                drawYOffset = barHeight;
            }
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            if (!ctx) return;

            // BG
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Filter & Image
            ctx.filter = `brightness(${imgBrightness}%) contrast(${imgContrast}%) saturate(${imgSaturation}%)`;
            ctx.drawImage(img, 0, drawYOffset);
            ctx.filter = "none";

            // Gradient
            if (isLinearGradient) {
                const gradient = ctx.createLinearGradient(0, canvasHeight - drawYOffset, 0, (canvasHeight - drawYOffset) * 0.5);
                gradient.addColorStop(0, "rgba(0,0,0,0.8)");
                gradient.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = gradient;
                ctx.fillRect(0, drawYOffset, canvasWidth, img.height);
            }

            // Layers - NOW USING CACHED PNGs!
            // We need to map the DOM position to Canvas position.
            // The DOM image is responsive. The Canvas image is full resolution.
            const domImg = document.getElementById("main-image") as HTMLImageElement;
            if (domImg) {
                const scale = img.width / domImg.width; // e.g. 1920 / 800 = 2.4

                for (const layer of textLayers) {
                    if (!layer.cachedImage) continue; // Skip if not rendered yet

                    const layerImg = new Image();
                    layerImg.src = layer.cachedImage;
                    await new Promise(r => layerImg.onload = r);

                    const layX = layer.x * scale;
                    const layY = (layer.y * scale) + drawYOffset;

                    // Draw the layer image (it's already the correct size for the text, just need to scale it?)
                    // Wait, TextToImageRenderer uses a fixed `maxWidth` (1000). 
                    // If the DOM preview reduces that image, we are fine. 
                    // But if we want 1:1, we should probably render the layer AT the scale of the export?
                    // Or just draw the PNG scaled by `scale`?
                    // Since `TextToImageRenderer` renders at `fontSize`, and `fontSize` is usually PX.
                    // If user sets 15px font, they expect 15px on the image? Or 15px on screen? 
                    // Usually 15px on screen. If image is huge, 15px is tiny.
                    // The old app scaled font size.
                    // `const baseFontSize = fontSize * scaleX;` in old Canvas.tsx.

                    // PROBLEM: We rendered the PNG at `fontSize` (e.g. 15).
                    // If we draw that PNG onto a 4000px wide image, it will be tiny.
                    // We need to scale the PNG draw.

                    // Ideally, TextToImageRenderer should receive the `scale` or the target font size?
                    // But we cached it! 
                    // If `Workspace` shows scaled down version, the cache is "low res" vs "high res"?
                    // No, "fontSize" in state is "logical pixels".

                    // Solution: 
                    // The cached PNG is generated at `fontSize`. 
                    // When exporting, we must scale the layer PNG by `scale`.

                    ctx.drawImage(layerImg, layX, layY, layerImg.width * scale, layerImg.height * scale);
                }
            }

            // Trigger Download
            const link = document.createElement("a");
            link.download = `rp-export.${exportFormat}`;
            link.href = canvas.toDataURL(`image/${exportFormat}`, 0.9);
            link.click();
        };

        window.addEventListener("RP_EDITOR_EXPORT", doExport);
        return () => window.removeEventListener("RP_EDITOR_EXPORT", doExport);
    }, [processedImage, originalImage, textLayers, imgBrightness, imgContrast, imgSaturation, isCinematic, isLinearGradient, exportFormat]);

    const handleApplyCrop = async () => {
        if (!originalImage || !cropSelection || cropSelection.w < 10 || cropSelection.h < 10) {
            setStatusMsg(t('invalidSel'));
            return;
        }
        try {
            setIsProcessing(true);
            setStatusMsg(t('processing'));

            const img = new Image();
            img.src = originalImage;
            img.crossOrigin = "anonymous";
            await new Promise((r) => (img.onload = r));

            const previewImg = document.getElementById("manual-crop-preview") as HTMLImageElement;
            const scaleX = img.naturalWidth / previewImg.width;
            const scaleY = img.naturalHeight / previewImg.height;

            const realX = cropSelection.x * scaleX;
            const realY = cropSelection.y * scaleY;
            const realW = cropSelection.w * scaleX;
            const realH = cropSelection.h * scaleY;

            let finalW = targetWidth ? Number(targetWidth) : realW;
            let finalH = targetHeight ? Number(targetHeight) : realH;

            // If explicit width, scale height to maintain aspect of the SELECTION
            if (targetWidth && !targetHeight) {
                // Not standard behavior but if only width provided? 
                // Context sets both usually for presets.
            }

            const canvas = document.createElement("canvas");
            canvas.width = finalW;
            canvas.height = finalH;
            const ctx = canvas.getContext("2d");

            if (ctx) {
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, realX, realY, realW, realH, 0, 0, finalW, finalH);
                setProcessedImage(canvas.toDataURL("image/jpeg", 0.9));
                setIsManualCropping(false);
                setStatusMsg(t('cropDone'));
            }
        } catch (error) {
            console.error(error);
            setStatusMsg(t('errorCrop'));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className="flex-1 bg-[#050505] relative overflow-hidden flex items-center justify-center p-8 bg-[url('/grid.svg')] cursor-default"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {isManualCropping && originalImage && (
                <CropOverlay
                    imageSrc={originalImage}
                    onApply={handleApplyCrop}
                    onCancel={() => setIsManualCropping(false)}
                />
            )}

            {/* Empty State */}
            {!originalImage && !processedImage && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#CFD71B]/30 hover:border-[#CFD71B] rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all group hover:bg-[#CFD71B]/5"
                >
                    <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                    <div className="bg-[#CFD71B]/10 p-6 rounded-full group-hover:scale-110 transition-transform">
                        <Upload size={40} className="text-[#CFD71B]" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-gray-200 font-bold text-lg">Upload Screenshot</h3>
                        <p className="text-gray-500 text-sm">Drag & drop or click to browse</p>
                    </div>
                </div>
            )}

            {/* Main Stage */}
            {(originalImage || processedImage) && (
                <div className="relative shadow-2xl group select-none">
                    {/* Base Image */}
                    <div className="relative" style={{
                        borderTop: isCinematic ? '10vh solid black' : 'none',
                        borderBottom: isCinematic ? '10vh solid black' : 'none',
                        transition: 'border 0.3s ease'
                    }}>
                        <img
                            id="main-image"
                            src={(processedImage || originalImage) as string}
                            alt="Stage"
                            className="max-w-full max-h-[85vh] object-contain block shadow-black"
                            style={{
                                filter: `brightness(${imgBrightness}%) contrast(${imgContrast}%) saturate(${imgSaturation}%)`
                            }}
                            draggable={false}
                        />

                        {/* Gradient Overlay */}
                        {isLinearGradient && (
                            <div className="absolute inset-0 z-10 pointer-events-none"
                                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%)' }}
                            />
                        )}

                        {/* Layers (Absolute on top of image wrapper) - Note: This needs to be relative to the IMAGE dimensions, not the div including cinema bars if bars are CSS borders.
                           But here I applied bars as borders. So absolute children 0,0 starts INSIDE the border? 
                           No, inside the padding box. 
                           Allows for text to overlap limits.
                        */}

                        {textLayers.map(layer => (
                            <div
                                key={layer.id}
                                onMouseDown={(e) => handleMouseDown(e, layer.id)}
                                className={`absolute z-20 hover:outline hover:outline-1 hover:outline-[#CFD71B] cursor-move ${activeLayerId === layer.id ? 'outline outline-1 outline-[#CFD71B]' : ''}`}
                                style={{
                                    left: layer.x,
                                    top: layer.y,
                                }}
                            >
                                {layer.cachedImage ? (
                                    <img
                                        src={layer.cachedImage}
                                        alt="layer"
                                        draggable={false}
                                        className="pointer-events-none"
                                        style={{ maxWidth: 'none', marginLeft: '-50px', marginTop: '-50px' }} // Compensate for PADDING=50
                                    />
                                ) : (
                                    <span className="text-xs text-red-500 bg-black">Rendering...</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Workspace;
