
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCtbNLRoSjEeO6CmYqpUUAgekswCE8-msI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "poetic-inkwell-464523-j5.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "poetic-inkwell-464523-j5",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "poetic-inkwell-464523-j5.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "396048445465",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:396048445465:web:573c785cc1945377533a88",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-5279197F2J",
};

let app: FirebaseApp;

// Check if we're using environment variables or fallback config
const usingEnvVars = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!usingEnvVars) {
  console.info("🔧 Using fallback Firebase configuration. For production, set environment variables in .env.local");
}

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Create a dummy app for development
  app = initializeApp({
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const firebaseApp = app;
export const allConfigured = Object.values(firebaseConfig).every(v => !!v);
export const usingEnvConfig = usingEnvVars;
