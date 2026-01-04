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
        resolutionPresets, setExportHandler
    } = useEditor();

    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const [resizeStart, setResizeStart] = useState<{ x: number, y: number, initialWidth: number, layerId: string } | null>(null);

    // --- RESIZE LOGIC ---
    const handleResizeStart = (e: React.MouseEvent, layerId: string) => {
        e.stopPropagation();
        const layer = textLayers.find(l => l.id === layerId);
        if (!layer) return;
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            initialWidth: layer.maxWidth || 1000, // Default 1000 matches renderer default
            layerId
        });
    };

    const handleResizeMove = (e: MouseEvent) => { // Use native MouseEvent for window listener if needed, but here we use React event from container? No, resizing usually needs window listener to avoid losing focus.
        // Actually, we can use the existing handleMouseMove if we add logic there.
    };

    // --- RENDER WATCHER ---
    // This effect watches for changes in layer TEXT, STYLE, or MAXWIDTH and triggers the re-render.
    useEffect(() => {
        const renderLayers = async () => {
            for (const layer of textLayers) {
                const options = {
                    fontFamily,
                    fontSize,
                    lineHeight,
                    strokeWidth,
                    fontBold,
                    textBackground,
                    maxWidth: layer.maxWidth || 1000
                };

                // Render
                const { dataUrl } = await TextToImageRenderer.generateLayerImage(layer.text, options);

                // Only update if changed (simple check)
                if (layer.cachedImage !== dataUrl) {
                    updateTextLayer(layer.id, { cachedImage: dataUrl });
                }
            }
        };

        const timer = setTimeout(() => {
            renderLayers();
        }, 100);

        return () => clearTimeout(timer);

    }, [
        textLayers.map(l => l.text + l.maxWidth).join('|'), // Watch text AND maxWidth changes
        fontFamily, fontSize, lineHeight, strokeWidth, textBackground, fontBold
    ]);

    // Force re-render on mount
    useEffect(() => {
        // Trigger initial render if needed
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
        // Dragging
        if (dragStart && activeLayerId) {
            updateTextLayer(activeLayerId, {
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
            return;
        }

        // Resizing (Width / Wrap)
        if (resizeStart) {
            const deltaX = e.clientX - resizeStart.x;
            // Dragging right increases maxWidth
            const newWidth = Math.max(200, resizeStart.initialWidth + deltaX);
            updateTextLayer(resizeStart.layerId, {
                maxWidth: newWidth
            });
        }
    };

    const handleMouseUp = () => {
        setDragStart(null);
        setResizeStart(null);
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

    // --- EXPORT logic ---
    const generateImageBlob = async (): Promise<Blob | null> => {
        if (!processedImage && !originalImage) return null;

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

        if (!ctx) return null;

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

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

        // Layers
        const domImg = document.getElementById("main-image") as HTMLImageElement;
        if (domImg) {
            const scale = img.width / domImg.width;

            for (const layer of textLayers) {
                // Re-render text layers at high resolution based on scale
                const scaledOptions = {
                    fontFamily,
                    fontSize: fontSize * scale,
                    lineHeight: lineHeight * scale,
                    strokeWidth: strokeWidth * scale,
                    fontBold,
                    textBackground,
                    maxWidth: (layer.maxWidth || 1000) * scale
                };

                const { dataUrl } = await TextToImageRenderer.generateLayerImage(layer.text, scaledOptions);

                const layerImg = new Image();
                layerImg.src = dataUrl;
                await new Promise(r => layerImg.onload = r);

                const layX = layer.x * scale;
                const layY = (layer.y * scale) + drawYOffset;

                // TextToImageRenderer adds 50px padding to the generated image. 
                // We need to offset by this padding (unscaled, because the renderer adds fixed padding? 
                // Wait, TextToImageRenderer padding is hardcoded 50. 
                // Since we are generating a NEW image, it will have 50px padding.
                // So we just subtract 50 from the draw position.)
                const RENDERER_PADDING = 50;

                const drawX = layX - RENDERER_PADDING;
                const drawY = layY - RENDERER_PADDING;

                ctx.drawImage(layerImg, drawX, drawY);
            }
        }

        return new Promise<Blob | null>(resolve => {
            const extension = exportFormat || 'png';
            // Use maximum quality (1.0) for JPEGs
            canvas.toBlob(resolve, `image/${extension}`, 1.0);
        });
    };

    // Register Handler
    useEffect(() => {
        if (setExportHandler) {
            setExportHandler(generateImageBlob);
        }
    }, [processedImage, originalImage, textLayers, imgBrightness, imgContrast, imgSaturation, isCinematic, isLinearGradient, exportFormat, setExportHandler]);

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
                ctx.imageSmoothingEnabled = true; // Ensure enabled
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, realX, realY, realW, realH, 0, 0, finalW, finalH);
                setProcessedImage(canvas.toDataURL("image/jpeg", 1.0));
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
            onMouseDown={() => setActiveLayerId(null)}
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
                        <h3 className="text-gray-200 font-bold text-lg">{t('uploadTitle')}</h3>
                        <p className="text-gray-500 text-sm">{t('uploadDesc')}</p>
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
                                    // Removed transform scale
                                }}
                            >
                                {layer.cachedImage ? (
                                    <img
                                        src={layer.cachedImage}
                                        alt="layer"
                                        draggable={false}
                                        className="pointer-events-none"
                                        style={{ maxWidth: 'none', marginLeft: '-50px', marginTop: '-50px' }}
                                    />
                                ) : (
                                    <span className="text-xs text-red-500 bg-black">Rendering...</span>
                                )}

                                {/* Resize Handle (East/Right Side for Width) */}
                                {activeLayerId === layer.id && (
                                    <>
                                        {/* Right Handle for Width */}
                                        <div
                                            className="absolute top-1/2 right-0 w-3 h-8 bg-[#CFD71B] border border-black rounded-full cursor-ew-resize z-30 opacity-70 hover:opacity-100 transition-opacity"
                                            style={{ transform: 'translate(50%, -50%)' }}
                                            onMouseDown={(e) => {
                                                handleResizeStart(e, layer.id);
                                            }}
                                        />
                                    </>
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
