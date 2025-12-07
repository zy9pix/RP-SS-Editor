export const insertAtCursor = (input: HTMLTextAreaElement, prefix: string, suffix: string) => {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + selection + suffix + after;

    // Return new value and new cursor position
    return {
        text: newText,
        cursorPos: start + prefix.length + selection.length + suffix.length
    };
};
