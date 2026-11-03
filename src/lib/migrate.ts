"use client";

// Migración única: copia a Cloudflare D1 los datos que el usuario tenía en Firestore (versión anterior).
// No borra nada en ningún sitio y el servidor ignora lo que ya existe.
import { api } from "./db";
import { getFirebase } from "./firebase";
import type { UserProfile } from "./types";

export async function migrateFromFirestore(uid: string): Promise<UserProfile | null> {
  const key = `dnigym:migrated:${uid}`;
  try {
    if (localStorage.getItem(key)) return null;
  } catch {}
  try {
    const { app, auth } = getFirebase();
    if (!auth.currentUser || auth.currentUser.uid !== uid) return null;
    const fs = await import("firebase/firestore");
    const db = fs.getFirestore(app);
    const [profileSnap, w, b, n] = await Promise.all([
      fs.getDoc(fs.doc(db, "users", uid)),
      fs.getDocs(fs.collection(db, "users", uid, "workouts")),
      fs.getDocs(fs.collection(db, "users", uid, "body")),
      fs.getDocs(fs.collection(db, "users", uid, "nutrition")),
    ]);
    const payload = {
      profile: profileSnap.exists() ? profileSnap.data() : undefined,
      workouts: w.docs.map((d) => ({ ...d.data(), id: d.id })),
      body: b.docs.map((d) => d.data()),
      nutrition: n.docs.map((d) => d.data()),
    };
    let profile: UserProfile | null = null;
    if (payload.profile || payload.workouts.length || payload.body.length || payload.nutrition.length) {
      const r = await api<{ profile: UserProfile }>("/api/import", { method: "POST", body: payload });
      profile = r.profile;
    }
    try {
      localStorage.setItem(key, String(Date.now()));
    } catch {}
    return profile;
  } catch {
    // sin datos antiguos o sin permisos: no es un error para el usuario
    return null;
  }
}
