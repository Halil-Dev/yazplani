// Firebase configuration - USER MUST REPLACE WITH THEIR OWN CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB8V_a793PswmxQPH225eISle4tOhG0lMo",
  authDomain: "yazplani.firebaseapp.com",
  projectId: "yazplani",
  storageBucket: "yazplani.firebasestorage.app",
  messagingSenderId: "1098170662232",
  appId: "1:1098170662232:web:dfa00d230f088a05faf92d",
  measurementId: "G-JXZG3J4GCQ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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
