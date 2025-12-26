export interface ImgbbResponse {
    data: {
        id: string;
        title: string;
        url_viewer: string;
        url: string;
        display_url: string;
        width: string;
        height: string;
        size: string;
        time: string;
        expiration: string;
        image: {
            filename: string;
            name: string;
            mime: string;
            extension: string;
            url: string;
        };
        thumb: {
            filename: string;
            name: string;
            mime: string;
            extension: string;
            url: string;
        };
        delete_url: string;
    };
    success: boolean;
    status: number;
}

export const ImgbbService = {
    /**
     * Uploads a base64 image string to ImgBB.
     * @param base64Image The full base64 string (including data:image/png;base64,... prefix)
     * @param apiKey The ImgBB API Key
     */
    uploadImage: async (base64Image: string, apiKey: string): Promise<{ id: string; link: string; deletehash: string } | null> => {
        if (!apiKey) {
            throw new Error("ImgBB API Key is required.");
        }

        // Remove the data URL prefix to get just the base64 string
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

        const formData = new FormData();
        formData.append("image", base64Data);
        // Optional: Expiration? No, keep it permanent by default.

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData?.error?.message || `ImgBB Upload Failed: ${response.status}`);
        }

        const data: ImgbbResponse = await response.json();

        if (data.success) {
            return {
                id: data.data.id,
                link: data.data.url,
                deletehash: data.data.delete_url // ImgBB gives a delete_url, not just a hash, but we can store it here.
            };
        }

        return null;
    }
};
