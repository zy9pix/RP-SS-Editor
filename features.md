# 📸 RP Ekran Görüntüsü Düzenleyici (RP-SS-Editor) Özellikleri

RP-SS-Editor, GTA World ve benzeri metin tabanlı Roleplay sunucuları için ekran görüntülerini düzenlemeyi kolaylaştıran, modern ve güçlü bir web aracıdır.

## 📝 1. Gelişmiş Metin İşleme (Text Processing)
*   **Chat Log Ayrıştırma (Parsing):** Ham chat loglarını ("14.DEC.2025" gibi formatlar dahil) otomatik olarak işler.
*   **Akıllı Temizleme (Smart Cleaning):**
    *   Sunucu sistem mesajlarını, timestamps (zaman damgalarını), OOC (Karakter Dışı) sohbetleri ve gereksiz bilgileri (hava durumu, giriş/çıkış logları vb.) otomatik olarak temizler.
    *   "Strict Mode" ile sadece In-Character (IC) hikaye akışını korur.
*   **Glitch ve Hata Düzeltme:** Loglarda oluşabilen kelime birleşme hatalarını (örn. `> İsim SoyisimEylem` -> `> İsim Soyisim Eylem`) otomatik tespit eder ve düzeltir.
*   **Otomatik Renklendirme:** Roleplay türüne göre metinleri otomatik renklerdir:
    *   `*` Eylemler (Me/Do)
    *   `>` Durum Mesajları
    *   `(( ))` OOC Mesajlar
    *   Fısıltı, Bağırma, Telsiz ve Telefon konuşmaları için özel renkler.
*   **Çoklu Katman Sistemi:** Resim üzerine birden fazla ayrı metin bloğu ekleyebilir, her birini bağımsız olarak konumlandırabilir ve düzenleyebilirsiniz.

## 🎨 2. Görsel Düzenleme Araçları (Image Editing)
*   **Kırpma ve Boyutlandırma:**
    *   Serbest Kırpma (Freeform)
    *   Hazır En-Boy Oranları (1:1 Kare, 16:9, 4:3, Portre vb.)
*   **Sinema Modu (Cinema Mode):** Tek tıkla resme sinematik siyah bantlar (letterbox) ekler.
*   **Gradyan Modu (Gradient Mode):** Metinlerin okunabilirliğini artırmak için alt kısma yumuşak, doğrusal bir gölge (gradient) ekler.
*   **Görüntü Ayarları:** Parlaklık, Kontrast ve Doygunluk (Saturation) değerleri ile resmin tonunu ayarlayabilirsiniz.
*   **Sürükle & Bırak:** Resimleri uygulamanın içine sürükleyerek veya panodan (`Ctrl+V`) yapıştırarak hızlıca düzenlemeye başlayabilirsiniz.

## 🤖 3. Yapay Zeka Entegrasyonu (AI Integration)
*   **Google Gemini Desteği:** Chat loglarını daha akıllıca filtrelemek için Google Gemini AI modelini kullanır.
*   **Bağlamsal Filtreleme:** Basit kuralların ötesinde, hikaye bağlamını bozmayacak şekilde OOC içerikleri veya gereksiz satırları yapay zeka yardımıyla temizleyebilir (Kullanıcı API anahtarı gerektirir).

## 🛠️ 4. Kişiselleştirme (Customization)
*   **Yazı Tipi ve Stil:**
    *   Geniş font kütüphanesi ve özel font desteği.
    *   Yazı boyutu, satır yüksekliği, kontür (outline) kalınlığı ayarları.
    *   **Kalın (Bold)** ve **Arka Plan Rengi** seçenekleri.
*   **Karanlık Mod Arayüz:** Göz yormayan, Cyberpunk/Modern estetiğe sahip kullanıcı arayüzü.

## 📤 5. Dışa Aktarma ve Paylaşım (Export & History)
*   **Çıktı Formatları:** PNG, JPEG veya WEBP formatında yüksek kaliteli çıktı alabilirsiniz.
*   **Resim Barındırma (ImgBB):** Düzenlediğiniz resmi tek tıkla ImgBB'ye yükleyip paylaşılabilir link alabilirsiniz.
*   **Geçmiş (History):** Yüklediğiniz resimlerin geçmişini görüntüleyebilir, linklerini kopyalayabilir veya silebilirsiniz.

## 💻 6. Teknik Özellikler
*   **PWA Desteği:** Uygulamayı tarayıcınızdan bilgisayarınıza veya telefonunuza "Uygulama" olarak kurabilirsiniz.
*   **Local Storage:** Ayarlarınız (API anahtarı, tercih edilen font vb.) tarayıcınızda güvenle saklanır.
