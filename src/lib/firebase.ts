// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4T9ck6OmWd_SjzL9HZt_dAN70mYvQKDY",
  authDomain: "utm-propria.firebaseapp.com",
  projectId: "utm-propria",
  storageBucket: "utm-propria.firebasestorage.app",
  messagingSenderId: "1025720951189",
  appId: "1:1025720951189:web:843c4ceaad08e63fe1969c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with optimized cache settings
export const db = initializeFirestore(app, {
  localCache: {
    kind: "persistent"
  }
});

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;