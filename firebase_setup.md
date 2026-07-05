# 🔥 Firebase Kurulum Kılavuzu

YazPlanı uygulamasının Gmail ile giriş yapabilmesi ve verileri bulutta saklayabilmesi için ücretsiz bir Firebase projesi oluşturmanız gerekmektedir. Aşağıdaki adımları sırayla takip edin:

---

## 1. Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin ve Google hesabınızla giriş yapın.
2. **"Proje ekle"** (Add project) butonuna tıklayın.
3. Proje adı olarak **`YazPlani`** yazın ve **Devam et**'e basın.
4. Google Analytics adımında dilerseniz kapatabilir veya varsayılan ayarlarla **Proje oluştur** diyerek projenin hazır olmasını bekleyin.

---

## 2. Google Girişini (Authentication) Aktif Etme

1. Firebase sol menüsünden **Build > Authentication** seçeneğine gidin.
2. **"Get Started"** (Başlayın) butonuna tıklayın.
3. Giriş yöntemleri (Sign-in method) sekmesinden **"Google"** seçeneğini seçin.
4. Sağ üstteki **Aktif Et** (Enable) anahtarını açın.
5. Proje destek e-postası (Project support email) kısmından kendi Gmail adresinizi seçin.
6. **Kaydet** (Save) butonuna tıklayın.

---

## 3. Firestore Veritabanını (Cloud Firestore) Aktif Etme

1. Firebase sol menüsünden **Build > Firestore Database** seçeneğine gidin.
2. **"Veritabanı oluştur"** (Create database) butonuna tıklayın.
3. Veritabanı konumu (Location) olarak size en yakın bölgeyi (örneğin `europe-west3` veya varsayılan `nam5`) seçin ve **Sonraki**'ye basın.
4. Başlangıç kuralları adımında **"Test modunda başla"** (Start in test mode) seçeneğini işaretleyin. *(Bu kuralları daha sonra sadece giriş yapmış kullanıcıların veri yazabilmesi için güncelleyeceğiz)*.
5. **Oluştur** (Create) butonuna tıklayın.

---

## 4. Web Uygulaması Ekleme ve Config Bilgilerini Alma

1. Firebase konsolunun ana sayfasına dönün (sol üstteki ev/home ikonuna veya Proje Genel Bakışı yazısına tıklayın).
2. Sayfanın ortasında yer alan platform ikonlarından **Web (`</>`)** ikonuna tıklayın.
3. Uygulama takma adı (App nickname) olarak **`YazPlani Web`** yazın ve **Uygulamayı kaydet** deyin.
4. Karşınıza gelen ekranda `const firebaseConfig = { ... };` şeklinde bir kod bloğu çıkacaktır.
5. Bu kod bloğunun içerisindeki değerleri kopyalayın.

---

## 5. Kodu Güncelleme

Kopyaladığınız bu değerleri projenizdeki [firebase-config.js](file:///c:/Users/halil/Desktop/projeler/yazplani/js/firebase-config.js) dosyasındaki değerlerle değiştirin:

```javascript
const firebaseConfig = {
    apiKey: "SİZİN_API_KEYİNİZ",
    authDomain: "SİZİN_PROJECT.firebaseapp.com",
    projectId: "SİZİN_PROJECT_ID",
    storageBucket: "SİZİN_PROJECT.firebasestorage.app",
    messagingSenderId: "SİZİN_SENDER_ID",
    appId: "SİZİN_APP_ID"
};
```

---

## 6. Firestore Güvenlik Kuralları (Önemli 🔒)

Uygulamanın güvenliği ve herkesin sadece kendi planlarını görebilmesi için, Firestore Database ekranındaki **Kurallar (Rules)** sekmesine gidip aşağıdaki kuralları yapıştırın ve **Yayınla (Publish)** deyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
*Bu kural sayesinde giriş yapan her kullanıcı yalnızca `users/{kendi_kullanici_id'si}` altındaki verilere erişebilir. Başkalarının verilerini göremez.*
