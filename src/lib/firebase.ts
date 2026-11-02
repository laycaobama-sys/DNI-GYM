"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

// Configuración web de Firebase (pública por diseño: la seguridad la dan firestore.rules).
// Se puede sobrescribir con variables NEXT_PUBLIC_FIREBASE_*. NEXT_PUBLIC_DEMO_MODE=1 fuerza el modo demo.
const DEFAULT_CONFIG = {
  apiKey: "AIzaSyAApUK7pH8dI6kNLICSz_zomxVjyPNuksM",
  authDomain: "dni-gym-c6fa2.firebaseapp.com",
  projectId: "dni-gym-c6fa2",
  storageBucket: "dni-gym-c6fa2.firebasestorage.app",
  messagingSenderId: "182655985683",
  appId: "1:182655985683:web:16a4688fe5b6973186f7e6",
  measurementId: "G-XV1FSC1JCX",
};

const demoForced = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || DEFAULT_CONFIG.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || DEFAULT_CONFIG.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEFAULT_CONFIG.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || DEFAULT_CONFIG.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_CONFIG.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || DEFAULT_CONFIG.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || DEFAULT_CONFIG.measurementId,
};

/** true cuando las variables de Firebase están configuradas. Si no, la app funciona en modo demo (datos en el navegador). */
export const firebaseEnabled = !demoForced && Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
export const firebaseProjectId = config.projectId ?? null;

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export function getFirebase() {
  if (!firebaseEnabled) throw new Error("Firebase no está configurado");
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
    auth = getAuth(app);
    auth.languageCode = "es";
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch {
      db = getFirestore(app);
    }
    // Google Analytics de Firebase (solo navegador y si está soportado)
    import("firebase/analytics")
      .then(async ({ getAnalytics, isSupported }) => {
        if (await isSupported()) getAnalytics(app!);
      })
      .catch(() => {});
  }
  return { app: app!, auth: auth!, db: db! };
}

export function googleProvider() {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  return p;
}
