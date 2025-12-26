export const ImgurService = {
    /**
     * Upload a base64 or blob image to Imgur.
     * @param imageBase64 The image data (base64 string without data:image/... prefix, or raw)
     * @param clientId Use "Client-ID <ID>"
     */
    uploadImage: async (imageBase64: string, clientId: string) => {
        // Strip data prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const formData = new FormData();
        formData.append("image", base64Data);
        formData.append("type", "base64");

        const response = await fetch("https://api.imgur.com/3/image", {
            method: "POST",
            headers: {
                Authorization: `Client-ID ${clientId}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.data?.error || "Imgur Upload Failed");
        }

        const data = await response.json();
        return data.data; // Includes link, deletehash, etc.
    }
};
