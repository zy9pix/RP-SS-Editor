import en from '../locales/en.json';
import tr from '../locales/tr.json';

export const TRANSLATIONS = {
    en: {
        ...en,
        imgurClientIdRequired: "Please enter Imgur Client ID in Settings first.",
        imgbbApiKeyRequired: "Please enter ImgBB API Key in Settings first.",
        imgbbApiKeyHelp: "Get your API Key from api.imgbb.com and paste it here.",
        uploadSuccess: "Uploaded & Link Copied!",
        uploadHistory: "Upload History",
        clearAll: "Clear All",
        noUploads: "No uploads yet.",
        noUploadsDesc: "Images you upload to ImgBB will appear here.",
        openImage: "Open Image",
        uploadFailed: "Upload failed",
        exportFailed: "Export failed",
        failedToGen: "Failed to generate image."
    },
    tr: {
        ...tr,
        imgurClientIdRequired: "Önce Ayarlardan Imgur İstemci Kimliği (Client ID) giriniz.",
        imgbbApiKeyRequired: "Önce Ayarlardan ImgBB API Anahtarınızı giriniz.",
        imgbbApiKeyHelp: "api.imgbb.com adresinden API Anahtarınızı alıp buraya yapıştırın.",
        uploadSuccess: "Yüklendi ve Bağlantı Kopyalandı!",
        uploadHistory: "Yükleme Geçmişi",
        clearAll: "Tümünü Temizle",
        noUploads: "Henüz yükleme yok.",
        noUploadsDesc: "ImgBB'ye yüklediğiniz görseller burada görünecektir.",
        openImage: "Resmi Aç",
        uploadFailed: "Yükleme başarısız",
        exportFailed: "Dışa aktarma başarısız",
        failedToGen: "Görüntü oluşturulamadı."
    }
};
