import React, { useRef, useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useEditor } from '@/src/context/EditorContext';

// Interaction modes for the crop tool
type InteractionMode = 'none' | 'drawing' | 'moving' | 'resizing-nw' | 'resizing-ne' | 'resizing-sw' | 'resizing-se' | 'resizing-n' | 'resizing-e' | 'resizing-s' | 'resizing-w';

interface CropOverlayProps {
    imageSrc: string;
    onApply: () => void;
    onCancel: () => void;
}

const CropOverlay: React.FC<CropOverlayProps> = ({ imageSrc, onApply, onCancel }) => {
    const {
        t,
        cropSelection, setCropSelection,
        targetWidth, targetHeight
    } = useEditor();

    const containerRef = useRef<HTMLDivElement>(null);
    const [interactionMode, setInteractionMode] = useState<InteractionMode>('none');
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const [initialCrop, setInitialCrop] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

    // Determine cursor style and interaction mode based on position
    const getCropMode = (e: React.MouseEvent): InteractionMode => {
        if (!cropSelection) return 'drawing';
        const rect = containerRef.current?.getBoundingClientRect();
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

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
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

    const handleMouseMove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!containerRef.current) return;

        // Update Cursor when not dragging
        if (interactionMode === 'none') {
            const mode = getCropMode(e);
            let cursor = 'crosshair';
            if (mode === 'moving') cursor = 'move';
            if (mode === 'resizing-nw' || mode === 'resizing-se') cursor = 'nwse-resize';
            if (mode === 'resizing-ne' || mode === 'resizing-sw') cursor = 'nesw-resize';
            containerRef.current.style.cursor = cursor;
            return;
        }

        if (!dragStart || !initialCrop) return;

        const rect = containerRef.current.getBoundingClientRect();
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
            const currentW = mouseX - initialCrop.x;
            const currentH = mouseY - initialCrop.y;

            newX = currentW < 0 ? mouseX : initialCrop.x;
            newY = currentH < 0 ? mouseY : initialCrop.y;
            newW = Math.abs(currentW);
            newH = Math.abs(currentH);

            if (aspect) {
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
            // Simple resizing (expand/contract)
            // Complex resizing logic preserving anchor
            if (interactionMode.includes('e')) newW = Math.max(10, initialCrop.w + dx);
            if (interactionMode.includes('s')) newH = Math.max(10, initialCrop.h + dy);

            if (interactionMode.includes('w')) {
                const delta = Math.min(initialCrop.w - 10, dx);
                newX = initialCrop.x + delta;
                newW = initialCrop.w - delta;
            }
            if (interactionMode.includes('n')) {
                const delta = Math.min(initialCrop.h - 10, dy);
                newY = initialCrop.y + delta;
                newH = initialCrop.h - delta;
            }

            if (aspect) {
                if (interactionMode === 'resizing-se') newH = newW / aspect;
                if (interactionMode === 'resizing-sw') newH = newW / aspect;
            }
        }

        // Boundary checks
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + newW > containerW) newW = containerW - newX;
        if (newY + newH > containerH) newH = containerH - newY;

        setCropSelection({ x: newX, y: newY, w: newW, h: newH });
    };

    const handleMouseUp = () => {
        setInteractionMode('none');
        setDragStart(null);
        setInitialCrop(null);
    };

    // Calculate Real Dimensions
    const getRealDimensions = () => {
        if (!cropSelection || !imageSrc) return { w: 0, h: 0 };
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
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md">

            {/* Toolbar */}
            <div className="absolute bottom-12 z-50 flex gap-4 bg-[#1a1a1a] px-6 py-3 rounded-full border border-[#CFD71B]/50 shadow-[0_0_30px_rgba(207,215,27,0.2)]">
                <div className="flex flex-col items-start mr-4 border-r border-gray-700 pr-4">
                    <span className="text-[10px] text-[#CFD71B] font-bold uppercase tracking-wider">Target Size</span>
                    <span className="text-white font-mono text-sm">
                        {targetWidth ? targetWidth : 'Free'} x {targetHeight ? targetHeight : 'Free'}
                    </span>
                </div>

                <button
                    onClick={onApply}
                    className="bg-white hover:bg-gray-200 text-black px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2"
                >
                    <Check size={16} /> Apply
                </button>
                <button
                    onClick={onCancel}
                    className="bg-[#2a2a2a] hover:bg-[#333] text-gray-300 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2"
                >
                    <X size={16} /> Cancel
                </button>
            </div>

            <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="relative select-none"
            >
                <img
                    id="manual-crop-preview"
                    src={imageSrc}
                    alt="Crop Source"
                    className="block max-w-[90vw] max-h-[80vh] object-contain opacity-50"
                    draggable={false}
                />

                {cropSelection && (
                    <div
                        className="absolute border-2 border-white bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.8)]"
                        style={{
                            left: cropSelection.x,
                            top: cropSelection.y,
                            width: cropSelection.w,
                            height: cropSelection.h,
                        }}
                    >
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-evenly opacity-30 pointer-events-none">
                            <div className="w-full h-px bg-white/50"></div>
                            <div className="w-full h-px bg-white/50"></div>
                        </div>
                        <div className="absolute inset-0 flex justify-evenly opacity-30 pointer-events-none">
                            <div className="h-full w-px bg-white/50"></div>
                            <div className="h-full w-px bg-white/50"></div>
                        </div>

                        {/* Handles */}
                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#CFD71B] cursor-nw-resize rounded-full"></div>
                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#CFD71B] cursor-ne-resize rounded-full"></div>
                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#CFD71B] cursor-sw-resize rounded-full"></div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#CFD71B] cursor-se-resize rounded-full"></div>

                        {/* Dimensions Label */}
                        <div
                            className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#CFD71B] text-black text-[10px] font-mono px-2 py-1 rounded font-bold whitespace-nowrap"
                        >
                            {realDims.w} x {realDims.h}
                        </div>
                    </div>
                )}
            </div>
            <p className="text-gray-500 text-xs mt-4 font-mono opacity-50 absolute top-4">
                Drag to Crop • Corners to Resize
            </p>
        </div>
    );
};

export default CropOverlay;
