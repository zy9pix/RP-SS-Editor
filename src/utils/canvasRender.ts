import { PRESET_COLORS } from './constants';

export const drawWrappedRichText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    baseFontString: string,
    baseColor: string,
    strokeW: number,
    hasBackground: boolean
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
            flushLine();
            currentY += lineHeight;
            lineBuffer = [];
            lineBufferWidth = 0;
        }

        lineBuffer.push(word);
        lineBufferWidth += word.width;
    });

    flushLine();

    return currentY + lineHeight;
};
