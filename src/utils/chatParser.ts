import { PRESET_COLORS } from './constants';

export interface ChatLine {
    id: string;
    text: string;
    color: string;
}

/**
 * Cleans the raw chat log based on strict RP server rules (Strict Mode).
 * Removes timestamps, system messages, and OOC content while preserving In-Character dialogue and actions.
 * @param rawText - The raw chat log string from the server.
 * @returns A cleaned string containing only relevant RP lines.
 */
export const cleanChatLog = (rawText: string): string => {
    const lines = rawText.split('\n').map(l => l.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, ""));
    const cleanedLines: string[] = [];
    const knownNames = new Set<string>();

    // Regex Definitions for Whitelist
    // 1. Actions: Start with * or >
    const actionRegex = /^[*>]/.test(""); // Just a placeholder, we use startsWith checks for speed usually, but let's define patterns if needed.

    // 2. Dialogues
    // Standard: "Name Surname: Msg"
    // Modified: "Name Surname (modifier): Msg"
    // Targeted: "Name Surname seslenir (Target): Msg" or "Name Surname fısıldar: Msg"
    // Radio: "(Telsiz) Name Surname: Msg"
    // Phone: "Name Surname (Telefon): Msg" or "Name Surname (Phone): Msg"

    // Core Name Pattern: Two Capitalized Words (e.g., "John Doe")
    // Note: We used a regex in previous version, let's refine it.
    // Allow for potential "Name Surname DeSomething" (3 words)? rare but possible. Let's stick to standard 2-3 words.
    // But Strict Mode relies on the structure mostly.

    // We will iterate and check specific "Keep" conditions.

    // Regex for capturing names from potential dialogue lines to use in Glitch Fix
    const nameCaptureRegex = /^(?:\(Telsiz\) )?([A-Z][a-z]+ [A-Z][a-z]+)/;

    // PASS 1: Entity Discovery (Preserved for Glitch Fix)
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        // Skip obvious non-dialogue for name mining to avoid noise
        if (trimmed.startsWith('[') || trimmed.startsWith('((')) continue;

        const match = trimmed.match(nameCaptureRegex);
        if (match && match[1]) {
            const candidate = match[1];
            // Filtration of system "Names"
            const systemKeywords = ["Hava Durumu", "Applied damage", "Menu link", "Oyuncu ID", "Banka Hesap", "Kapı kilitli", "Mülküne hoş", "Araç sigortanın"];
            if (!systemKeywords.some(k => candidate.includes(k))) {
                knownNames.add(candidate);
            }
        }
    }

    // PASS 2: Block Processing & Whitelisting
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // --- 1. Glitch Correction (Pre-Filter) ---
        // Fix: > Name SurnameAction -> > Name Surname Action
        if (line.startsWith('>')) {
            for (const name of knownNames) {
                const prefix = `> ${name}`;
                if (line.startsWith(prefix)) {
                    const charAfter = line[prefix.length];
                    if (charAfter && charAfter !== ' ') {
                        line = prefix + ' ' + line.slice(prefix.length);
                    }
                    break;
                }
            }
        }

        // --- 2. Whitelist Checks ---
        let keep = false;

        // Rule A: Actions (* or >)
        // STRICT: Must start with * or >. 
        if (line.startsWith('*') || line.startsWith('>')) {
            keep = true;
        }

        // Rule B: Standard & Modified Dialogue
        // Pattern: Starts with Name Surname, contains ": " eventually.
        // We need to be careful not to keep "BİLGİ: ..." or "HATA: ..."
        // So we check if the 'Author' looks like a Roleplay Name.

        if (!keep) {
            // Check for "(Telsiz) " prefix availability
            let contentToCheck = line;
            if (line.startsWith("(Telsiz) ")) {
                contentToCheck = line.substring(9); // remove prefix
            }

            // Extract potential name at start
            // Looking for "Name Surname" at start
            const nameMatch = contentToCheck.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/);

            if (nameMatch) {
                const potentialName = nameMatch[1];

                // Exclude System 'Names'
                const invalidNames = ["Trucker Seviyesi", "Hava Durumu", "Sıcaklık: ", "Rüzgar: ", "Kapı kilitli", "Mülküne hoş", "Mülkler |", "Karakter |", "Sağlık |", "Zaman |", "Son 30", "Suç Puanı", "Banka Hesap", "Custom Number", "Premium: ", "World Point", "Panda Point", "Menu link"];
                // Also "Oyuncu ID"

                const isSystem = invalidNames.some(sys => line.startsWith(sys) || potentialName === sys) || contentToCheck.startsWith("Oyuncu ID");

                if (!isSystem) {
                    // It has a name. Now does it look like dialogue?
                    // Dialogue usually has a colon ": " OR it's a specific "seslenir" without colon? (Log: "Name Surname seslenir (Target): Msg" -> has colon)
                    // Log: "Name Surname (Telefon): Msg" -> has colon

                    if (line.includes(": ")) {
                        keep = true;
                    }
                    // Case: Shout without colon? (Rare, usually "matches (bağırır):")
                    else if (line.match(/(bağırır|seslenir|fısıldar)/)) {
                        // Even if colon is missing (glitch?), if it has speech verb + Name, keep it.
                        keep = true;
                    }
                }
            }
        }

        // Rule C: Radio / Phone special cases
        // (Handled by Rule B generally if they follow "Name: Msg" structure, but let's double check)

        if (keep) {
            // DUPLICATE CHECK: For lines starting with '>', check if it's a consecutive duplicate
            if (line.startsWith('>')) {
                const lastLine = cleanedLines[cleanedLines.length - 1];
                if (lastLine && lastLine === line) {
                    continue; // Skip strict duplicate
                }
            }
            cleanedLines.push(line);
        }
    }

    return cleanedLines.join('\n');
};

/**
 * Parses a cleaned chat log string into structured ChatLine objects.
 * Assigns appropriate colors based on line content (e.g., actions, radio, phone).
 * @param text - The cleaned chat log text.
 * @returns An array of ChatLine objects ready for rendering.
 */
export const parseChatLog = (text: string): ChatLine[] => {
    const lines = text.split("\n").filter((l) => l.trim() !== "");
    return lines.map((line, idx) => {
        // Clean Timestamps [XX:XX:XX] if present (Visual cleanup only)
        let content = line.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, "").trim();
        // Also clean the "[DATE: ...]" header if it somehow survived strict cleaning but is passed here

        let color = PRESET_COLORS.chat;

        if (content.startsWith("*")) {
            color = PRESET_COLORS.me;
            // Feature: Highlight quoted text in white within actions
            // Regex to find "text" and wrap in color tag
            // We need to use the hex code for PRESET_COLORS.chat (usually white/grey) inside the tag
            // Using a darker/lighter white? canvasRender uses standard CSS colors or hex.
            // Let's assume PRESET_COLORS.chat is white-ish.

            // Note: PRESET_COLORS.chat might be a variable. Let's hardcode white for clarity or use constant if we could.
            // We will format it as `[#ffffff]quoted text[/#]`.
            content = content.replace(/"([^"]+)"/g, `[#ffffff]"$1"[/#]`);

        } else if (content.startsWith(">")) {
            color = PRESET_COLORS.me;
        } else if (content.includes("(( ") || content.startsWith("((")) {
            if (!content.startsWith("*")) color = PRESET_COLORS.ooc;
        } else if (content.includes("says:")) {
            color = PRESET_COLORS.chat;
        } else if (content.includes("shouts:")) {
            color = PRESET_COLORS.shout;
        } else if (content.match(/fısıldar:|kısık sesle|algak ses|sessizce|seslenir/i)) {
            // Broad matching for low voice / shout modifiers if they appear in text bodies
            // The log shows "Name Surname (kısık ses): ..." -> usually white/grey.
            // "Name Surname seslenir (...):" -> White.
            color = PRESET_COLORS.chat;
        } else if (content.toLowerCase().includes("(radio)") || content.toLowerCase().includes("[radio]") || content.startsWith("(Telsiz)")) {
            color = PRESET_COLORS.radio;
        } else if (content.toLowerCase().includes("(cellphone)") || content.toLowerCase().includes("(telefon)") || content.toLowerCase().includes("phone")) {
            color = PRESET_COLORS.phone;
        }

        return {
            id: `line-${idx}-${Date.now()}`,
            text: content,
            color,
        };
    });
};
