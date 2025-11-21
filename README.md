# RP Screenshot Editor

A specialized web tool for Text-Based Roleplay servers to easily edit screenshots and overlay chatlogs with cinematic quality.

## Features

*   **Drag & Drop / Paste Support**: Simply drag images or text files onto the window, or use CTRL+V to paste content directly.
*   **Smart Chatlog Parsing**: Automatically colors chat lines based on RP context (Chat, /me, /do, Radio, Phone, etc.).
*   **Manual Crop & Resize**: Select the action area of your screenshot and automatically resize it to a standard 1000px width for forum consistency.
*   **AI-Powered Chat Filter**: Uses Google Gemini 2.5 Flash to intelligently clean up chatlogs, removing duplicates, fixing spacing, or filtering specific content based on your instructions.
*   **Customizable Typography**: Choose from classic fonts (Helvetica, Verdana, Georgia, etc.), adjust size, bolding, and line height.
*   **Persistence**: Your API Key and styling preferences are saved automatically in your browser.
*   **Export**: Save your work as PNG, JPG, or WEBP with auto-generated timestamps.

## Setup & Usage

This project is built with React and utilizes the Google GenAI SDK.

1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    ```
4.  **Configure API Key**:
    *   Click the **Settings (Gear)** icon in the top right corner.
    *   Enter your **Gemini API Key**. (Get one at [aistudio.google.com](https://aistudio.google.com/)).
    *   This key is stored locally in your browser.

## AI Features

To use the "Magic Filter" button:
1.  Ensure you have entered your API Key in settings.
2.  Paste a raw chatlog.
3.  Click "AI Filter".
4.  (Optional) Type a command like "Remove OOC" or "Only keep lines from John".

## License

MIT
