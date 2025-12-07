import React, { RefObject } from 'react';
import { Palette, Italic, EyeOff } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { insertAtCursor } from '../../utils/helpers';
import { parseChatLog } from '../../utils/chatParser';

interface FormattingToolbarProps {
    inputRef: RefObject<HTMLTextAreaElement | null>;
}

const FormattingToolbar = ({ inputRef }: FormattingToolbarProps) => {
    const { customColors, setChatInput, setChatLines } = useEditor();

    const applyFormat = (type: 'emote' | 'italic' | 'redact' | 'color', colorHex?: string) => {
        if (!inputRef.current) return;

        let prefix = "";
        let suffix = "";

        if (type === 'emote') { prefix = "*"; suffix = "*"; }
        if (type === 'italic') { prefix = "/"; suffix = "/"; }
        if (type === 'redact') { prefix = "||"; suffix = "||"; }
        if (type === 'color' && colorHex) { prefix = `[${colorHex}]`; suffix = "[/#]"; }

        const { text, cursorPos } = insertAtCursor(inputRef.current, prefix, suffix);
        setChatInput(text);
        setChatLines(parseChatLog(text));

        requestAnimationFrame(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(cursorPos, cursorPos);
            }
        });
    };

    return (
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
    );
};

export default FormattingToolbar;
