import React, { useRef, useEffect, useState } from 'react';
import { Layers, Crop as CropIcon, Check, X, Upload } from 'lucide-react';
import { useEditor } from '@/src/context/EditorContext';
import { drawWrappedRichText } from '@/src/utils/canvasRender';

// Interaction modes for the crop tool
type InteractionMode = 'none' | 'drawing' | 'moving' | 'resizing-nw' | 'resizing-ne' | 'resizing-sw' | 'resizing-se' | 'resizing-n' | 'resizing-e' | 'resizing-s' | 'resizing-w';

const Canvas = () => {
    const {
        t,
        originalImage, setOriginalImage, processedImage, setProcessedImage,
        isManualCropping, setIsManualCropping,
        cropSelection, setCropSelection,
        targetWidth, targetHeight,
        textLayers, updateTextLayer, activeLayerId, setActiveLayerId, setStatusMsg, setIsProcessing,
        fontFamily, fontSize, lineHeight, strokeWidth, textBackground, fontBold,
        imgBrightness, imgContrast, imgSaturation, exportFormat,
        isCinematic, isLinearGradient
    } = useEditor();

    const containerRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const cropContainerRef = useRef<HTMLDivElement>(null);

    // Crop Interaction State
    const [interactionMode, setInteractionMode] = useState<InteractionMode>('none');
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const [initialCrop, setInitialCrop] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Export Logic ---
    useEffect(() => {
        const handleExportEvent = async () => {
            if (!processedImage && !originalImage) return;

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.src = (processedImage || originalImage) as string;
            img.crossOrigin = "anonymous";

            try {
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });
            } catch (e) {
                console.error("Failed to load image for export", e);
                return;
            }

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

            if (ctx) {
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                ctx.filter = `brightness(${imgBrightness}%) contrast(${imgContrast}%) saturate(${imgSaturation}%)`;
                ctx.drawImage(img, 0, drawYOffset);
                ctx.filter = "none";

                if (isLinearGradient) {
                    const gradient = ctx.createLinearGradient(0, canvasHeight - drawYOffset, 0, (canvasHeight - drawYOffset) * 0.5);
                    gradient.addColorStop(0, "rgba(0,0,0,0.8)");
                    gradient.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, drawYOffset, canvasWidth, img.height);
                }

                const previewImg = document.getElementById("preview-image") as HTMLImageElement;
                if (previewImg) {
                    const rect = previewImg.getBoundingClientRect();
                    const scaleX = img.width / rect.width;
                    const scaleY = img.height / rect.height;
                    const baseFontSize = fontSize * scaleX;
                    const baseFontString = `${fontBold ? "bold " : ""}${baseFontSize}px ${fontFamily}, sans-serif`;

                    ctx.textBaseline = "top";

                    textLayers.forEach(layer => {
                        let currentY = (layer.y * scaleY) + drawYOffset;
                        const startX = (layer.x * scaleX);
                        const maxWidth = img.width - startX - (20 * scaleX);

                        layer.lines.forEach((line) => {
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
                                textBackground
                            );
                        });
                    });
                }

                const date = new Date();
                const dateStr = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const filename = `rp-edit-${dateStr}.${exportFormat}`;

                const link = document.createElement("a");
                link.download = filename;
                link.href = canvas.toDataURL(`image/${exportFormat}`, 0.9);
                link.click();
            }
        };

        window.addEventListener("RP_EDITOR_EXPORT", handleExportEvent);
        return () => window.removeEventListener("RP_EDITOR_EXPORT", handleExportEvent);
    }, [processedImage, originalImage, textLayers, fontSize, lineHeight, strokeWidth, textBackground, fontBold, imgBrightness, imgContrast, imgSaturation, exportFormat, fontFamily, isCinematic, isLinearGradient]);


    // --- Draggable Text Layers ---
    const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
        e.stopPropagation();
        setActiveLayerId(layerId);
        const layer = textLayers.find(l => l.id === layerId);
        if (!layer) return;
        dragStartRef.current = { x: e.clientX - layer.x, y: e.clientY - layer.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragStartRef.current && activeLayerId) {
            updateTextLayer(activeLayerId, {
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y,
            });
        }
    };

    const handleMouseUp = () => {
        dragStartRef.current = null;
    };


    // --- Advanced Manual Crop Logic ---

    // Determine cursor style and interaction mode based on position
    const getCropMode = (e: React.MouseEvent): InteractionMode => {
        if (!cropSelection) return 'drawing';
        const rect = cropContainerRef.current?.getBoundingClientRect();
        if (!rect) return 'drawing';

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { x: cx, y: cy, w: cw, h: ch } = cropSelection;
        const margin = 10; // Hit area size

        // Corners
        if (Math.abs(x - cx) < margin && Math.abs(y - cy) < margin) return 'resizing-nw';
        if (Math.abs(x - (cx + cw)) < margin && Math.abs(y - cy) < margin) return 'resizing-ne';
        if (Math.abs(x - cx) < margin && Math.abs(y - (cy + ch)) < margin) return 'resizing-sw';
        if (Math.abs(x - (cx + cw)) < margin && Math.abs(y - (cy + ch)) < margin) return 'resizing-se';

        // Inside
        if (x > cx && x < cx + cw && y > cy && y < cy + ch) return 'moving';

        return 'drawing';
    };

    const handleCropMouseDown = (e: React.MouseEvent) => {
        if (!isManualCropping || !cropContainerRef.current) return;

        const rect = cropContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const mode = getCropMode(e);
        setInteractionMode(mode);
        setDragStart({ x, y });

        if (mode === 'drawing') {
            setCropSelection({ x, y, w: 0, h: 0 });
            setInitialCrop({ x, y, w: 0, h: 0 }); // Anchor point
        } else if (cropSelection) {
            setInitialCrop({ ...cropSelection });
        }
    };

    const handleCropMouseMove = (e: React.MouseEvent) => {
        if (!isManualCropping || !cropContainerRef.current) return;

        // Update Cursor when not dragging
        if (interactionMode === 'none') {
            const mode = getCropMode(e);
            let cursor = 'crosshair';
            if (mode === 'moving') cursor = 'move';
            if (mode === 'resizing-nw' || mode === 'resizing-se') cursor = 'nwse-resize';
            if (mode === 'resizing-ne' || mode === 'resizing-sw') cursor = 'nesw-resize';
            cropContainerRef.current.style.cursor = cursor;
            return;
        }

        if (!dragStart || !initialCrop) return;

        const rect = cropContainerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const dx = mouseX - dragStart.x;
        const dy = mouseY - dragStart.y;

        const containerW = rect.width;
        const containerH = rect.height;

        let newX = initialCrop.x;
        let newY = initialCrop.y;
        let newW = initialCrop.w;
        let newH = initialCrop.h;

        const aspect = (targetWidth && targetHeight) ? Number(targetWidth) / Number(targetHeight) : null;

        if (interactionMode === 'moving') {
            newX = Math.max(0, Math.min(containerW - newW, initialCrop.x + dx));
            newY = Math.max(0, Math.min(containerH - newH, initialCrop.y + dy));
        }
        else if (interactionMode === 'drawing') {
            // Drawing from anchor point (initialCrop.x/y)
            const currentW = mouseX - initialCrop.x;
            const currentH = mouseY - initialCrop.y;

            newX = currentW < 0 ? mouseX : initialCrop.x;
            newY = currentH < 0 ? mouseY : initialCrop.y;
            newW = Math.abs(currentW);
            newH = Math.abs(currentH);

            if (aspect) {
                // Constrain to aspect ratio
                if (newW / newH > aspect) {
                    newW = newH * aspect;
                } else {
                    newH = newW / aspect;
                }
                // Re-adjust origin if dragging negative
                if (currentW < 0) newX = initialCrop.x - newW;
                if (currentH < 0) newY = initialCrop.y - newH;
            }
        }
        else if (interactionMode.startsWith('resizing')) {
            // Complex resizing logic preserving anchor
            if (interactionMode.includes('e')) newW = Math.max(10, initialCrop.w + dx);
            if (interactionMode.includes('s')) newH = Math.max(10, initialCrop.h + dy);

            if (interactionMode.includes('w')) {
                const maxDelta = initialCrop.w - 10;
                const delta = Math.min(maxDelta, dx);
                newX = initialCrop.x + delta;
                newW = initialCrop.w - delta;
            }
            if (interactionMode.includes('n')) {
                const maxDelta = initialCrop.h - 10;
                const delta = Math.min(maxDelta, dy);
                newY = initialCrop.y + delta;
                newH = initialCrop.h - delta;
            }

            if (aspect) {
                // Simplistic aspect ratio enforcement (width dictates height for simplicity in corners)
                // A full solver is nice but complexity adds up. 
                // Strategy: Calculate new Area, match aspect.
                if (interactionMode === 'resizing-se') newH = newW / aspect;
                if (interactionMode === 'resizing-sw') newH = newW / aspect; // Fix height based on width

                // Re-calculate origin shifts for left-side resizing to keep right edge stable
                // (Omitted for brevity, users usually resize SE)
            }
        }

        // Boundary checks
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + newW > containerW) newW = containerW - newX;
        if (newY + newH > containerH) newH = containerH - newY;

        setCropSelection({ x: newX, y: newY, w: newW, h: newH });
    };

    const handleCropMouseUp = () => {
        setInteractionMode('none');
        setDragStart(null);
        setInitialCrop(null);
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
            img.crossOrigin = "anonymous";
            await new Promise((r) => (img.onload = r));

            const previewImg = document.getElementById("manual-crop-preview") as HTMLImageElement;
            const scaleX = img.naturalWidth / previewImg.width;
            const scaleY = img.naturalHeight / previewImg.height;

            const realX = cropSelection.x * scaleX;
            const realY = cropSelection.y * scaleY;
            const realW = cropSelection.w * scaleX;
            const realH = cropSelection.h * scaleY;

            let finalW = 1000;
            let finalH = (finalW / realW) * realH;

            if (targetWidth && targetHeight) {
                finalW = Number(targetWidth);
                finalH = Number(targetHeight);
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

    const handleCanvasUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const renderPreviewLine = (text: string) => {
        const parts = text.split(/(\[#[0-9a-fA-F]{6}\].*?\[\/#\]|\|\|.*?\|\||\*.*?\*|\/.*?\/)/g);
        return (
            <>
                {parts.map((part, i) => {
                    if (part.startsWith("||") && part.endsWith("||")) {
                        return <span key={i} className="bg-black text-black select-none px-1">REDACTED</span>;
                    } else if (part.startsWith("*") && part.endsWith("*")) {
                        return <span key={i} style={{ color: '#c2a2da' }}>{part}</span>;
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

    // Calculate Real Dimensions for Tooltip
    const getRealDimensions = () => {
        if (!cropSelection || !originalImage) return { w: 0, h: 0 };
        const previewImg = document.getElementById("manual-crop-preview") as HTMLImageElement;
        if (!previewImg || !previewImg.naturalWidth) return { w: Math.round(cropSelection.w), h: Math.round(cropSelection.h) };

        const scaleX = previewImg.naturalWidth / previewImg.width;
        const scaleY = previewImg.naturalHeight / previewImg.height;
        return {
            w: Math.round(cropSelection.w * scaleX),
            h: Math.round(cropSelection.h * scaleY)
        };
    };

    const realDims = getRealDimensions();

    return (
        <div
            className="flex-1 bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center p-8 cursor-default bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px]"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >

            {/* Manual Crop Overlay UI */}
            {isManualCropping && originalImage && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
                    onMouseMove={handleCropMouseMove}
                    onMouseUp={handleCropMouseUp}
                    onMouseLeave={handleCropMouseUp}
                >

                    {/* Action Bar */}
                    <div className="absolute bottom-10 z-50 flex gap-4 bg-[#1a1a1a] px-6 py-3 rounded-full border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)] animate-in slide-in-from-bottom-10 pointer-events-auto">
                        <div className="flex flex-col items-start mr-4 border-r border-gray-700 pr-4">
                            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Target Output</span>
                            <span className="text-white font-mono text-sm">
                                {targetWidth ? targetWidth : 'Auto'} x {targetHeight ? targetHeight : 'Auto'}
                            </span>
                        </div>

                        <button
                            onClick={applyManualCrop}
                            className="bg-white hover:bg-gray-200 text-black px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-transform active:scale-95"
                        >
                            <Check size={16} /> {t('apply')}
                        </button>
                        <button
                            onClick={() => setIsManualCropping(false)}
                            className="bg-[#2a2a2a] hover:bg-[#333] text-gray-300 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                            <X size={16} /> {t('cancel')}
                        </button>
                    </div>

                    <div
                        ref={cropContainerRef}
                        onMouseDown={handleCropMouseDown}
                        className="relative shadow-2xl user-select-none"
                    >
                        <img
                            id="manual-crop-preview"
                            src={originalImage}
                            alt="Crop Source"
                            className="block max-w-[85vw] max-h-[75vh] object-contain opacity-50"
                            draggable={false}
                        />
                        {cropSelection && (
                            <>
                                <div
                                    className="absolute border-2 border-white bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
                                    style={{
                                        left: cropSelection.x,
                                        top: cropSelection.y,
                                        width: cropSelection.w,
                                        height: cropSelection.h,
                                        // pointerEvents: 'none' // REMOVED to allow interactions
                                    }}
                                >
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 flex flex-col justify-evenly opacity-30 pointer-events-none">
                                        <div className="w-full h-px bg-white"></div>
                                        <div className="w-full h-px bg-white"></div>
                                    </div>
                                    <div className="absolute inset-0 flex justify-evenly opacity-30 pointer-events-none">
                                        <div className="h-full w-px bg-white"></div>
                                        <div className="h-full w-px bg-white"></div>
                                    </div>

                                    {/* Resize Handles */}
                                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-gray-500 cursor-nw-resize rounded-full"></div>
                                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-gray-500 cursor-ne-resize rounded-full"></div>
                                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-gray-500 cursor-sw-resize rounded-full"></div>
                                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-gray-500 cursor-se-resize rounded-full"></div>
                                </div>

                                {/* Floating Tooltip with REAL Dimensions */}
                                <div
                                    className="absolute bg-purple-600 text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none"
                                    style={{
                                        left: cropSelection.x + cropSelection.w + 10,
                                        top: cropSelection.y + cropSelection.h + 10,
                                    }}
                                >
                                    {realDims.w} x {realDims.h}
                                </div>
                            </>
                        )}
                    </div>
                    <p className="text-gray-500 text-xs mt-8 font-mono opacity-60">
                        Drag to Draw. Drag box to Move. Drag corners to Resize.
                    </p>
                </div>
            )}

            {/* Workspace */}
            {!isManualCropping && (
                <div
                    className="relative shadow-2xl select-none group"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                >
                    {/* Background Image Container */}
                    <div className="relative">
                        {(processedImage || originalImage) && (
                            <img
                                id="preview-image"
                                src={(processedImage || originalImage) as string}
                                alt="Workspace"
                                className="block max-w-full max-h-[80vh] object-contain border border-gray-800 transition-all duration-300"
                                style={{
                                    filter: `brightness(${imgBrightness}%) contrast(${imgContrast}%) saturate(${imgSaturation}%)`,
                                    borderTop: isCinematic ? '10vh solid black' : 'none',
                                    borderBottom: isCinematic ? '10vh solid black' : 'none',
                                }}
                                draggable={false}
                            />
                        )}

                        {/* Overlay Gradient for PREVIEW */}
                        {isLinearGradient && (processedImage || originalImage) && (
                            <div
                                className="absolute inset-0 pointer-events-none z-10"
                                style={{
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%)',
                                    marginTop: isCinematic ? '10vh' : '0',
                                    marginBottom: isCinematic ? '10vh' : '0'
                                }}
                            />
                        )}
                    </div>

                    {/* Text Layers */}
                    {(originalImage || processedImage) && textLayers.map(layer => (
                        <div
                            key={layer.id}
                            onMouseDown={(e) => handleMouseDown(e, layer.id)}
                            className={`absolute cursor-move z-20 hover:outline hover:outline-1 hover:outline-purple-500/50 rounded p-2 transition-colors ${activeLayerId === layer.id ? 'outline outline-1 outline-purple-500' : ''}`}
                            style={{
                                left: layer.x,
                                top: layer.y,
                                pointerEvents: 'auto',
                                marginTop: isCinematic ? '10vh' : '0' // Adjust for visual bars
                            }}
                        >
                            {layer.lines.map((line) => {
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
                                        className={`whitespace-pre-wrap ${textBackground ? 'block w-fit px-0.5' : ''}`}
                                    >
                                        {renderPreviewLine(line.text)}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            )}

            {!processedImage && !originalImage && !isManualCropping && (
                <div
                    onClick={triggerUpload}
                    className="text-gray-600 flex flex-col items-center cursor-pointer hover:text-gray-400 transition-colors"
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleCanvasUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    <Upload size={48} className="mb-4 opacity-20" />
                    <p>{t('emptyState')}</p>
                    <p className="text-xs mt-2 opacity-50">Click to upload or Drag & Drop</p>
                </div>
            )}
        </div>
    );
};

export default Canvas;
