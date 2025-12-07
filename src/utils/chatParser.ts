import { PRESET_COLORS } from './constants';

export interface ChatLine {
    id: string;
    text: string;
    color: string;
}

export const parseChatLog = (text: string): ChatLine[] => {
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
