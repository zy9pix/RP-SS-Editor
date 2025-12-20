import { PRESET_COLORS } from './constants';

export interface ChatLine {
    id: string;
    text: string;
    color: string;
}

/**
 * Cleans the raw chat log based on strict RP server rules (Strict Mode).
 * Refined with real data from "14.DEC.2025" log.
 */
export const cleanChatLog = (rawText: string): string => {
    const lines = rawText.split('\n');
    const cleanedLines: string[] = [];
    const knownNames = new Set<string>();

    // PASS 1: Entity Discovery (Find names from ANY Dialogue line)
    // We need to capture names to fix the "> NameAction" glitch later.
    // Formats found in log:
    // 1. "Name Surname: ..."
    // 2. "Name Surname (Durum): ..."
    // 3. "Name Surname seslenir (Target): ..."
    // 4. "(Telsiz) Name Surname: ..." or "(Telsiz) Name Surname:: ..."
    // 5. "Name Surname kısık sesle (Target): ..."
    // 6. "Name Surname (kısık ses): ..."
    // 7. "Name Surname (kısık ses) (Telefon): ..."
    // 8. "Name Surname fısıldar: ..."

    // Unified Regex for Name Capture:
    // Start of line (ignoring potential "(Telsiz) " prefix) -> Capture Two TitleCase Words. as Name.
    const nameRegex = /^(?:\(Telsiz\) )?([A-Z][a-z]+ [A-Z][a-z]+)/;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Skip system lines for discovery to avoid false positives (though capitalized system messages are rare)
        if (trimmed.startsWith('[') || trimmed.startsWith('((')) continue;

        const match = trimmed.match(nameRegex);
        if (match && match[1]) {
            // Additional check: Ensure it's not a known system prefix looking like a name
            const candidate = match[1];
            if (candidate !== "Hava Durumu" && candidate !== "Applied damage" && candidate !== "Menu link" && candidate !== "Oyuncu ID" && candidate !== "Banka Hesap") {
                knownNames.add(candidate);
            }
        }
    }

    // PASS 2: Filtering and Fixing
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (!line) continue;

        // --- 1. STRICT FILTERING (REMOVE) ---

        // 1.1 Suffix/Prefix Checks
        if (line.startsWith('((')) continue;
        if (line.startsWith('[')) continue; // [DATE], [Radyo], [BİLGİ], [HATA], [TEEFON], [GLOBAL OLAY]...
        if (line.startsWith('⚠️')) continue;

        // 1.2 Specific block headers/lines identified in log
        const exactMatches = new Set([
            "GTA World Türkiye'ye hoş geldin.",
            "Welcome to GTA World.",
            "Hava Durumu:",
            "Oyuncu(lar) bulunamadı.",
            "Kapı kilitli.",
            "Kapı kilidini açtın.",
            "Kapının kilidini açtın.",
            "Kapıyı kilitledin.",
            "Mülküne hoş geldin.",
            "Çağrıyı sonlandırdın.",
            "Sohbeti yeniden başlatmak için F2'yi ve imleci görünür yapmak için F3'ü kullanabilirsin. F3 çalışmıyorsa /pc komutunu kullanın.",
            "Araç sigortanın süresi doldu. Yenilemek için 207 numarasını arayabilirsin."
        ]);
        if (exactMatches.has(line)) continue;

        // 1.3 Substring Removal (Aggressive)
        const removeSubstrings = [
            "Oyuncu ID", "Sıcaklık:", "Rüzgar:", "BİLGİ:", "Info:",
            "GTAW Roleplay Oyuncu İstatistikleri", "Karakter | Nakit:", "Banka Hesap Numarası:", "Mülkler |", "İşletme 1:", "Şu anki işi:", "Zaman | Toplam saat:", "Custom Number:", "Premium:", "World Point:", "Panda Point", "TARİH: Sunucu zamanı:", "Son 30 günde geçirilen süre", "Suç Puanı:", "sağlık | Can:",
            "Kapı açıldı mı?", "Kapı kolaylıkla açıldı.", // Mechanic / Do checks usually
            "Applied damage pack:",
            "Kombin adını değiştirmek için",
            "Animasyonları durdurmak ve",
            "Animasyonların yanlış kullanımı",
            "Belirttiğin isimde bir animasyon",
            "tutarında ödeme yaptın",
            "Aracını park ettin",
            "Menu link:",
            "/viewmenu komutuyla",
            "dondurmanızı kaldırmak için",
            "dondurmanı açabilirsin",
            "tevlevizyonun sesini değiştirebilirsin",
            "mülkünün özelliklerini",
            "Saklama alanını başarıyla kaldırdın",
            "Mülkün içerisinden",
            "karakterini değiştirmek için çıkış yaptı",
            "ID'si", // '... adlı oyuncunun ID'si X' lines
            "Konum Oliver Reave tarafından işaretlendi", // GPS markers
            "Sıcak Şarap kullandın", // Item usage text? keeping if ambiguous, but usually system.
            "K'ye basarak dondurmanı",
            "Dimension sıfırlandı",
            "Sahibi olmadığı için kilitli bir mülke girdin",
            "Kapıyı açtın",
            "işletmesine $", "ödeme yaptın", "bahşiş verdin",
            "pos cihazı uzatıyor", "/bpaccept",
            "Admin", "jailed",
            "Sağlık | Can:", "Sahip olunan mülkler:", "Kapıyı kilidini açtın", "İçeriye zorla giriş yapmak için"
        ];

        if (removeSubstrings.some(sub => line.includes(sub))) continue;

        // 1.4 Regex Removal for variable patterns
        if (line.match(/^=.+=$/)) continue; // Separator lines "======"
        if (line.match(/^\( \([0-9]+\) .+ sunucudan ayrıldı\. \)\)$/)) continue; // Quit messages
        if (line.match(/^\([0-9]+\) .+ \(Ping: [0-9]+\)/)) continue; // Ping lines "(94) Aldwin Baker (Ping: 62)..."

        // --- 2. GLITCH FIXING (Correction) ---

        // --- 2. GLITCH FIXING (Correction) ---
        // Fix: > Name SurnameAction -> > Name Surname Action
        // Real examples: "> Aldwin Bakerkapıyı", "> Ferran Montillabirim"
        if (line.startsWith('>')) {
            for (const name of knownNames) {
                const prefix = `> ${name}`;
                // Check if line matches prefix pattern (e.g. "> Aldwin Baker")
                if (line.startsWith(prefix)) {
                    // Check character immediately after name
                    const charAfter = line[prefix.length];

                    // If charAfter is NOT a space, we have a glitch (e.g. 'k' in Bakerkapıyı)
                    if (charAfter && charAfter !== ' ') {
                        // FIX: Insert space
                        line = prefix + ' ' + line.slice(prefix.length);
                    }
                    break;
                }
            }
        }

        // --- 3. FINAL KEEP CHECK ---
        // Ensure it looks like story content
        // Allowed: 
        // - Starts with > or *
        // - Contains : (Dialogue)
        // - Specific format like "(Telsiz)"?

        // If it doesn't match any story format, we might want to drop it? 
        // e.g. "Silvie Holeckova: TAMAM! Teşekkürler!" -> Keep (Contains :)

        cleanedLines.push(line);
    }

    return cleanedLines.join('\n');
};

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
