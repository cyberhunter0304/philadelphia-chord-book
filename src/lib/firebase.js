import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";

/** True once real Firebase web config is provided via env vars. */
export const firebaseConfigured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

const firebaseConfig = {
  // Placeholders keep the SDK from throwing at construction when unconfigured;
  // any real call will fail until VITE_FIREBASE_* is set (see README).
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-unconfigured-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-unconfigured",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "0",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo",
};

// getApps() guard keeps Vite HMR from re-initializing and throwing.
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function makeDb() {
  try {
    return initializeFirestore(app, { localCache: persistentLocalCache() });
  } catch {
    return getFirestore(app);
  }
}

export const db = makeDb();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

if (import.meta.env.VITE_USE_EMULATORS === "true" && !globalThis.__pcbEmulators) {
  globalThis.__pcbEmulators = true;
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8081);
  } catch {
    /* ignore */
  }
}
