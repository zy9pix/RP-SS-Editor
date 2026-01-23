import { drawWrappedRichText } from '../utils/canvasRender';
import { parseChatLog } from '../utils/chatParser';

interface RenderOptions {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    strokeWidth: number;
    fontBold: boolean;
    textBackground: boolean;
    maxWidth: number;
}

export const TextToImageRenderer = {
    /**
     * Renders a chat log text into a PNG Data URL.
     * This ensures that the text matches exactly what is seen in preview when exported,
     * as the layer itself becomes an image.
     */
    generateLayerImage: async (text: string, options: RenderOptions): Promise<{ dataUrl: string; width: number; height: number }> => {
        const {
            fontFamily,
            fontSize,
            lineHeight,
            strokeWidth,
            fontBold,
            textBackground,
            maxWidth
        } = options;

        const PADDING = 50; // Increased padding to 50px to be absolutely safe against cutoff


        // 1. Parse text (colors, timestamps etc) - although drawWrappedRichText handles regex, 
        // we might want to pre-process if needed. For now, drawWrappedRichText handles the parsing internally.

        // 2. Measure Pass: Determine height needed
        // We create a dummy canvas to measure
        const measureCanvas = document.createElement('canvas');
        const measureCtx = measureCanvas.getContext('2d');
        if (!measureCtx) throw new Error("Could not get canvas context");

        // Set width to maxWidth to calculate wrapping correctly
        measureCanvas.width = maxWidth;
        measureCanvas.height = 10000; // Arbitrary large height for measuring

        const baseFontString = `${fontBold ? "bold " : ""}${fontSize}px "${fontFamily}", sans-serif`;

        // Wait for font to load before measuring and drawing
        const standardFonts = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Palatino", "Garamond", "Bookman", "Comic Sans MS", "Trebuchet MS", "Arial Black", "Impact", "sans-serif", "serif", "monospace"];

        if (!standardFonts.includes(fontFamily)) {
            console.log(`[FontFix] Attempting to load custom font: "${fontFamily}"`);
            try {
                // Try loading up to 3 times with a small delay
                for (let i = 0; i < 3; i++) {
                    const isAlreadyLoaded = document.fonts.check(`${fontBold ? "bold " : ""}1em "${fontFamily}"`);
                    if (isAlreadyLoaded) {
                        console.log(`[FontFix] Font "${fontFamily}" is LOADED.`);
                        break;
                    }

                    console.log(`[FontFix] Load attempt ${i + 1} for "${fontFamily}"...`);
                    await document.fonts.load(`${fontBold ? "bold " : ""}1em "${fontFamily}"`);

                    // Small wait for browser to settle
                    await new Promise(r => setTimeout(r, 100));

                    if (document.fonts.check(`${fontBold ? "bold " : ""}1em "${fontFamily}"`)) {
                        console.log(`[FontFix] Font "${fontFamily}" LOADED after attempt ${i + 1}.`);
                        break;
                    }

                    if (i === 2) {
                        console.warn(`[FontFix] Font "${fontFamily}" failed to load after all attempts. Falling back.`);
                    }
                }
            } catch (e) {
                console.error(`[FontFix] Error during font load for "${fontFamily}":`, e);
            }
        }

        // Calculate height by "dry running" the draw
        // drawWrappedRichText returns the NEXT Y position, so if we start at 0, the result is total height
        const totalHeight = drawWrappedRichText(
            measureCtx,
            text,
            0, // x
            0, // y
            maxWidth,
            lineHeight,
            baseFontString,
            "white", // placeholder color
            strokeWidth,
            textBackground
        );

        // 3. Render Pass
        const canvas = document.createElement('canvas');
        canvas.width = maxWidth + (PADDING * 2);
        canvas.height = Math.ceil(totalHeight) + (PADDING * 2);

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get main canvas context");

        // Clear (transparent)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw for real
        // We iterate through lines manually if we were using parseChatLog results, 
        // but drawWrappedRichText takes raw string and handles parsing.
        // However, parseChatLog in utils adds COLOR info based on content (e.g. *me* is purple).
        // drawWrappedRichText ALSO does some regex. 
        // Let's check: drawWrappedRichText handles specific tokens like *text* or [color].
        // does it handle start-of-line logic like parseChatLog does?
        // Checking canvasRender.ts... it splits by tokens. It DOES NOT seem to handle "entire line starts with >" coloring logic.
        // It relies on parseChatLog to have done that? No, drawWrappedRichText parses "parts".

        // Wait, the current app uses `textLayers.lines.forEach`. `lines` comes from `parseChatLog`.
        // So `parseChatLog` breaks it into lines and assigns COLORS.
        // `drawWrappedRichText` takes A STRING (one line) and renders it with wrapping.
        // So we need to iterate over the parsed lines here too!

        const lines = parseChatLog(text);

        let currentY = 0;

        lines.forEach(line => {
            // drawWrappedRichText returns the y after the block
            currentY = drawWrappedRichText(
                ctx,
                line.text,
                0, // x (relative to this layer canvas)
                currentY, // y
                maxWidth,
                lineHeight,
                baseFontString,
                line.color, // Color from parser
                strokeWidth,
                textBackground
            );
        });

        // If the measurement pass was slightly off because we measure the whole block vs line-by-line,
        // we might run out of space or have too much.
        // Actually, since we are doing line-by-line, the total height is just currentY now.
        // We should probably resize the canvas AFTER drawing? 
        // No, resizing clears canvas.

        // Better approach: 
        // 1. Calculate total height by iterating lines.
        // 2. Resize canvas.
        // 3. Draw.

        let calculatedHeight = 0;
        lines.forEach(line => {
            calculatedHeight = drawWrappedRichText(
                measureCtx,
                line.text,
                0,
                calculatedHeight,
                maxWidth,
                lineHeight,
                baseFontString,
                line.color,
                strokeWidth,
                textBackground
            );
        });

        // Resize actual canvas
        canvas.height = Math.ceil(calculatedHeight) + (PADDING * 2);

        // Draw for real
        currentY = PADDING; // Start with Padding
        lines.forEach(line => {
            currentY = drawWrappedRichText(
                ctx,
                line.text,
                PADDING, // x offset
                currentY,
                maxWidth,
                lineHeight,
                baseFontString,
                line.color,
                strokeWidth,
                textBackground
            );
        });

        return {
            dataUrl: canvas.toDataURL("image/png"),
            width: canvas.width,
            height: canvas.height
        };
    }
};
