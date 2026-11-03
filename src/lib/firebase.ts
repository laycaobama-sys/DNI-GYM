"use client";

// Firebase se usa SOLO como proveedor de identidad de Google (ventana «Continuar con Google»).
// La sesión, los datos y los permisos viven en Cloudflare (Worker + D1).
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

// Configuración web de Firebase: pública por diseño.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAApUK7pH8dI6kNLICSz_zomxVjyPNuksM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dni-gym-c6fa2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dni-gym-c6fa2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dni-gym-c6fa2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "182655985683",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:182655985683:web:16a4688fe5b6973186f7e6",
};

export const firebaseProjectId = config.projectId;

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebase() {
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
    auth = getAuth(app);
    auth.languageCode = "es";
  }
  return { app: app!, auth: auth! };
}

export function googleProvider() {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  return p;
}
