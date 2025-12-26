
import { cleanChatLog } from './chatParser';

const sampleLog = `
[DATE: 14/DEC/2025 | TIME: 21:42:31]
GTA World Türkiye'ye hoş geldin.
BİLGİ: Panik alarmının ses seviyesini %75 olarak değiştirdin.
Welcome to GTA World.
Oyuncu ID 244.
Hava Durumu: 
Sıcaklık: 6.07°C (42.72F). Şu anda hava moderate or heavy snow showers.
> Aldwin Bakeryavaşca başını kaldırır, direksiyondan çeker kanayan burnunu koluyla tamponlar.
* Clara Morales gözlerini kısıp şaşkın şekilde etrafına bakınır.
> Aldwin Bakerkapıyı açmaya çalışır, açamaz ayağı ile tekmeleyip açmaya çalışır.
* Aldwin Baker yavaşca eğilir, Clara'ya doğru bakınır.
Shawn Beckett: İyi misiniz?
Aldwin Baker: Siktir, Heeey... Kızım iyi misin?
[HATA] Doing mesajon çok uzun. En fazla 50 karakter içerebilir.
* Burnundan hafif bir kan sızıyor, alnında kızarıklık var. (( Clara Morales ))
> Nathan Caparzo  birim durumunu günceller.
(Telsiz) Ferran Montilla: LSPD 2A1, LSFD.
Audrey Allen: Herkes iyi mi?
Kapı kolaylıkla açıldı. (( Clara Morales ))
Applied damage pack: Light Car Crash
Nathan Caparzo seslenir (Clara Morales): İyi misiniz hanımefendi?
`;

const cleaned = cleanChatLog(sampleLog);

console.log("--- ORIGINAL ---");
console.log(sampleLog);
console.log("--- CLEANED ---");
console.log(cleaned);
console.log("----------------");
