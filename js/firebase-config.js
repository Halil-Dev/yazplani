// Firebase configuration - Read from environment variables via Vite safely
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const hasKeys = env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_API_KEY !== 'YOUR_API_KEY';

if (!hasKeys) {
    const errorMsg = "⚠️ HATA: Firebase API anahtarları bulunamadı!\n\n" +
        "Lütfen şunlardan emin olun:\n" +
        "1. Projeyi 'npm run dev' komutu ile çalıştırdığınızdan (Vite sunucusu çevre değişkenlerini yüklemek için gereklidir).\n" +
        "2. .env.local dosyanızın oluşturulduğundan ve doğru API anahtarlarını barındırdığından.\n\n" +
        "Tarayıcı konsolunu (F12) açarak detaylı hata mesajlarını inceleyebilirsiniz.";
    console.error(errorMsg);
    // Show user-friendly alert on DOM load
    document.addEventListener('DOMContentLoaded', () => {
        if (window.UI && window.UI.showToast) {
            window.UI.showToast('Firebase API anahtarları eksik! .env.local dosyasını kontrol edin.', 'error');
        } else {
            alert(errorMsg);
        }
    });
}

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || "missing-api-key",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "missing-auth-domain",
    projectId: env.VITE_FIREBASE_PROJECT_ID || "missing-project-id",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "missing-storage-bucket",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "missing-sender-id",
    appId: env.VITE_FIREBASE_APP_ID || "missing-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Bind to window to allow access from other modules
window.auth = auth;
window.db = db;

// Enable offline persistence
db.enablePersistence().catch(err => {
    if (err.code === 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
        console.warn('Persistence not supported by this browser.');
    } else {
        console.log('Persistence error:', err.code);
    }
});
