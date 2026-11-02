"use client";

// Capa de datos de DNI GYM.
// - Con Firebase configurado: Firestore (users/{uid}, users/{uid}/workouts|body|nutrition, events, admins).
// - Sin configurar: "modo demo" en localStorage para poder probar toda la app sin backend.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as qLimit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { firebaseEnabled, getFirebase } from "./firebase";
import type { AppEvent, BodyLog, NutritionDay, UserProfile, Workout } from "./types";
import { addDays, dayKey, uid as newId, workoutStats } from "./fitness";
import { ROUTINES } from "@/data/routines";
import { ADMIN_EMAILS } from "./site";
import { EXERCISE_BY_SLUG } from "@/data/exercises";

// ───────────────────────── helpers ─────────────────────────

const clean = <T extends object>(o: T): T =>
  JSON.parse(JSON.stringify(o, (_k, v) => (v === undefined ? null : v)), (_k, v) => (v === null ? undefined : v));

const stripUndefined = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

// ───────────────────────── modo demo (localStorage) ─────────────────────────

interface LocalDB {
  users: Record<string, UserProfile>;
  data: Record<string, { workouts: Workout[]; body: BodyLog[]; nutrition: Record<string, NutritionDay> }>;
  events: AppEvent[];
  admins: string[];
}

const LS_KEY = "dnigym:demo-db:v1";

function readLocal(): LocalDB {
  if (typeof window === "undefined") return { users: {}, data: {}, events: [], admins: [] };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as LocalDB;
  } catch {}
  return { users: {}, data: {}, events: [], admins: [] };
}

function writeLocal(db: LocalDB) {
  try {
    // limitamos el log de eventos en local
    db.events = db.events.slice(-1500);
    localStorage.setItem(LS_KEY, JSON.stringify(db));
  } catch {}
}

function localUserData(db: LocalDB, uid: string) {
  if (!db.data[uid]) db.data[uid] = { workouts: [], body: [], nutrition: {} };
  return db.data[uid];
}

export const DEMO_USER = {
  uid: "demo-user",
  email: "demo@dnigym.app",
  name: "Usuario Demo",
  photoURL: null as string | null,
};

// ───────────────────────── perfil ─────────────────────────

export async function getProfile(uid: string): Promise<UserProfile | null> {
  if (!firebaseEnabled) return readLocal().users[uid] ?? null;
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

/** Crea o actualiza el perfil tras iniciar sesión. Devuelve el perfil y si es un alta nueva. */
export async function upsertProfileOnLogin(
  user: { uid: string; email: string; name: string; photoURL?: string | null; provider?: string },
  countLogin: boolean,
): Promise<{ profile: UserProfile; isNew: boolean }> {
  const now = Date.now();
  const existing = await getProfile(user.uid);
  if (!existing) {
    const profile: UserProfile = stripUndefined({
      uid: user.uid,
      email: user.email,
      name: user.name || user.email.split("@")[0],
      photoURL: user.photoURL ?? null,
      provider: user.provider ?? "google.com",
      createdAt: now,
      lastLoginAt: now,
      lastActiveAt: now,
      loginCount: 1,
      workoutsCount: 0,
      onboarded: false,
      blocked: false,
      weeklyWorkoutsGoal: 3,
    });
    if (!firebaseEnabled) {
      const db = readLocal();
      db.users[user.uid] = profile;
      writeLocal(db);
    } else {
      const { db } = getFirebase();
      await setDoc(doc(db, "users", user.uid), profile);
    }
    return { profile, isNew: true };
  }
  const patch: Partial<UserProfile> = {
    lastActiveAt: now,
    name: existing.name || user.name,
    photoURL: user.photoURL ?? existing.photoURL ?? null,
    email: user.email || existing.email,
  };
  if (countLogin) {
    patch.lastLoginAt = now;
    patch.loginCount = (existing.loginCount ?? 0) + 1;
  }
  await updateProfile(user.uid, patch);
  return { profile: { ...existing, ...patch }, isNew: false };
}

export async function updateProfile(uid: string, patch: Partial<UserProfile>) {
  const p = stripUndefined({ ...patch });
  delete (p as Partial<UserProfile>).blocked; // solo un admin puede cambiarlo
  if (!firebaseEnabled) {
    const db = readLocal();
    if (db.users[uid]) db.users[uid] = { ...db.users[uid], ...p };
    writeLocal(db);
    return;
  }
  const { db } = getFirebase();
  await updateDoc(doc(db, "users", uid), p);
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if (!firebaseEnabled) return readLocal().admins.includes(email) || email === DEMO_USER.email;
  if (ADMIN_EMAILS.includes(email.toLowerCase())) return true;
  try {
    const { db } = getFirebase();
    const snap = await getDoc(doc(db, "admins", email.toLowerCase()));
    return snap.exists();
  } catch {
    return false;
  }
}

// ───────────────────────── entrenamientos ─────────────────────────

export async function listWorkouts(uid: string): Promise<Workout[]> {
  if (!firebaseEnabled) return [...localUserData(readLocal(), uid).workouts].sort((a, b) => b.date - a.date);
  const { db } = getFirebase();
  const snap = await getDocs(query(collection(db, "users", uid, "workouts"), orderBy("date", "desc"), qLimit(1000)));
  return snap.docs.map((d) => ({ ...(d.data() as Workout), id: d.id }));
}

export async function saveWorkout(uid: string, w: Workout) {
  const stats = workoutStats(w);
  const workout = clean({ ...w, ...stats });
  if (!firebaseEnabled) {
    const db = readLocal();
    const data = localUserData(db, uid);
    data.workouts = [workout, ...data.workouts.filter((x) => x.id !== w.id)];
    if (db.users[uid]) db.users[uid].workoutsCount = data.workouts.length;
    writeLocal(db);
    return workout;
  }
  const { db } = getFirebase();
  await setDoc(doc(db, "users", uid, "workouts", w.id), workout);
  return workout;
}

export async function deleteWorkout(uid: string, id: string) {
  if (!firebaseEnabled) {
    const db = readLocal();
    const data = localUserData(db, uid);
    data.workouts = data.workouts.filter((x) => x.id !== id);
    if (db.users[uid]) db.users[uid].workoutsCount = data.workouts.length;
    writeLocal(db);
    return;
  }
  const { db } = getFirebase();
  await deleteDoc(doc(db, "users", uid, "workouts", id));
}

// ───────────────────────── peso y medidas ─────────────────────────

export async function listBodyLogs(uid: string): Promise<BodyLog[]> {
  if (!firebaseEnabled) return [...localUserData(readLocal(), uid).body].sort((a, b) => a.date.localeCompare(b.date));
  const { db } = getFirebase();
  const snap = await getDocs(query(collection(db, "users", uid, "body"), orderBy("date", "asc"), qLimit(2000)));
  return snap.docs.map((d) => d.data() as BodyLog);
}

export async function saveBodyLog(uid: string, log: BodyLog) {
  const l = clean(log);
  if (!firebaseEnabled) {
    const db = readLocal();
    const data = localUserData(db, uid);
    data.body = [...data.body.filter((x) => x.id !== l.id), l];
    writeLocal(db);
    return;
  }
  const { db } = getFirebase();
  await setDoc(doc(db, "users", uid, "body", l.id), l);
}

export async function deleteBodyLog(uid: string, id: string) {
  if (!firebaseEnabled) {
    const db = readLocal();
    const data = localUserData(db, uid);
    data.body = data.body.filter((x) => x.id !== id);
    writeLocal(db);
    return;
  }
  const { db } = getFirebase();
  await deleteDoc(doc(db, "users", uid, "body", id));
}

// ───────────────────────── nutrición ─────────────────────────

export async function getNutritionDay(uid: string, date: string): Promise<NutritionDay> {
  const empty: NutritionDay = { id: date, date, entries: [], waterMl: 0 };
  if (!firebaseEnabled) return localUserData(readLocal(), uid).nutrition[date] ?? empty;
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, "users", uid, "nutrition", date));
  return snap.exists() ? (snap.data() as NutritionDay) : empty;
}

export async function saveNutritionDay(uid: string, day: NutritionDay) {
  const d = clean(day);
  if (!firebaseEnabled) {
    const db = readLocal();
    localUserData(db, uid).nutrition[d.id] = d;
    writeLocal(db);
    return;
  }
  const { db } = getFirebase();
  await setDoc(doc(db, "users", uid, "nutrition", d.id), d);
}

export async function listNutritionDays(uid: string, fromDate: string): Promise<NutritionDay[]> {
  if (!firebaseEnabled)
    return Object.values(localUserData(readLocal(), uid).nutrition)
      .filter((d) => d.date >= fromDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  const { db } = getFirebase();
  const snap = await getDocs(query(collection(db, "users", uid, "nutrition"), where("date", ">=", fromDate), orderBy("date", "asc")));
  return snap.docs.map((d) => d.data() as NutritionDay);
}

// ───────────────────────── exportar / borrar cuenta ─────────────────────────

export async function exportUserData(uid: string) {
  const [profile, workouts, body, nutrition] = await Promise.all([
    getProfile(uid),
    listWorkouts(uid),
    listBodyLogs(uid),
    listNutritionDays(uid, "0000-00-00"),
  ]);
  return { exportedAt: new Date().toISOString(), profile, workouts, body, nutrition };
}

export async function deleteUserData(uid: string) {
  if (!firebaseEnabled) {
    const db = readLocal();
    delete db.users[uid];
    delete db.data[uid];
    writeLocal(db);
    return;
  }
  const { db } = getFirebase();
  for (const sub of ["workouts", "body", "nutrition"]) {
    const snap = await getDocs(collection(db, "users", uid, sub));
    let batch = writeBatch(db);
    let n = 0;
    for (const d of snap.docs) {
      batch.delete(d.ref);
      if (++n % 400 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
    await batch.commit();
  }
  await deleteDoc(doc(db, "users", uid));
}

// ───────────────────────── eventos / analítica ─────────────────────────

export async function logEvent(e: Omit<AppEvent, "ts" | "ua" | "path"> & { path?: string }) {
  const evt: AppEvent = stripUndefined({
    ...e,
    ts: Date.now(),
    path: e.path ?? (typeof location !== "undefined" ? location.pathname : undefined),
    ua: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : undefined,
    message: e.message?.slice(0, 500),
  });
  try {
    if (!firebaseEnabled) {
      const db = readLocal();
      db.events.push({ ...evt, id: newId() });
      writeLocal(db);
      return;
    }
    const { db } = getFirebase();
    await addDoc(collection(db, "events"), evt);
  } catch {
    // la analítica nunca debe romper la app
  }
}

// ───────────────────────── administración ─────────────────────────

export async function adminListUsers(): Promise<UserProfile[]> {
  if (!firebaseEnabled) return Object.values(readLocal().users).sort((a, b) => b.createdAt - a.createdAt);
  const { db } = getFirebase();
  const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), qLimit(2000)));
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function adminListEvents(sinceTs: number, max = 3000): Promise<AppEvent[]> {
  if (!firebaseEnabled)
    return readLocal()
      .events.filter((e) => e.ts >= sinceTs)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, max);
  const { db } = getFirebase();
  const snap = await getDocs(query(collection(db, "events"), where("ts", ">=", sinceTs), orderBy("ts", "desc"), qLimit(max)));
  return snap.docs.map((d) => ({ ...(d.data() as AppEvent), id: d.id }));
}

export async function adminSetBlocked(uid: string, blocked: boolean) {
  if (!firebaseEnabled) {
    const db = readLocal();
    if (db.users[uid]) db.users[uid].blocked = blocked;
    writeLocal(db);
    return;
  }
  const { db } = getFirebase();
  await updateDoc(doc(db, "users", uid), { blocked });
}

export async function adminDeleteEvent(id: string) {
  if (!firebaseEnabled) {
    const db = readLocal();
    db.events = db.events.filter((e) => e.id !== id);
    writeLocal(db);
    return;
  }
  const { db } = getFirebase();
  await deleteDoc(doc(db, "events", id));
}

// ───────────────────────── datos de ejemplo (solo modo demo) ─────────────────────────

/** Genera 10 semanas de historial realista para el usuario demo y algunos usuarios/eventos de ejemplo para el panel de administración. */
export function seedDemoData(uid: string) {
  const db = readLocal();
  const data = localUserData(db, uid);
  if (data.workouts.length) return;

  const now = new Date();
  const plan = ROUTINES.find((r) => r.slug === "torso-pierna-4-dias")!;
  const progress: Record<string, number> = {
    "press-banca-con-barra": 55,
    "remo-con-barra": 50,
    "press-militar-con-barra": 32.5,
    "sentadilla-con-barra": 70,
    "peso-muerto-rumano": 60,
    "prensa-de-piernas": 120,
    "hip-thrust": 70,
    "press-inclinado-con-mancuernas": 20,
  };
  const workouts: Workout[] = [];
  let dayIdx = 0;
  for (let d = 70; d >= 1; d--) {
    const date = addDays(now, -d);
    const wd = date.getDay();
    if (![1, 2, 4, 5].includes(wd)) continue; // lun, mar, jue, vie
    if (Math.random() < 0.1) continue; // algún día saltado
    const day = plan.days[dayIdx % plan.days.length];
    dayIdx++;
    date.setHours(18, 30, 0, 0);
    const weekFactor = 1 + (70 - d) / 70 * 0.12;
    const exercises = day.items.map((it) => {
      const ex = EXERCISE_BY_SLUG[it.slug];
      const base = progress[it.slug] ?? (ex.equipment === "máquina" || ex.equipment === "polea" ? 35 : ex.equipment === "peso corporal" ? 0 : 14);
      const weight = Math.round((base * weekFactor) / 2.5) * 2.5;
      const reps = parseInt(it.reps) || 10;
      return {
        slug: it.slug,
        name: ex.name,
        timed: ex.timed,
        rest: it.rest,
        target: it.reps,
        sets: Array.from({ length: it.sets }, (_, i) => ({ reps: Math.max(1, reps + 2 - i), weight, done: true })),
      };
    });
    const w: Workout = {
      id: newId(),
      name: `${plan.name} · ${day.name}`,
      date: date.getTime(),
      durationSec: 3000 + Math.round(Math.random() * 1500),
      routineSlug: plan.slug,
      exercises,
      volume: 0,
      totalSets: 0,
    };
    Object.assign(w, workoutStats(w));
    workouts.push(w);
  }
  data.workouts = workouts.reverse();

  // peso: de 82.4 a ~79.6 kg con ruido
  data.body = [];
  for (let d = 70; d >= 0; d -= 2) {
    const date = addDays(now, -d);
    const weight = Math.round((82.4 - (70 - d) * 0.04 + (Math.random() - 0.5) * 0.6) * 10) / 10;
    const log: BodyLog = { id: dayKey(date), date: dayKey(date), weight };
    if (d % 14 === 0) Object.assign(log, { waist: Math.round(88 - (70 - d) * 0.05), bodyFat: Math.round((19 - (70 - d) * 0.03) * 10) / 10 });
    data.body.push(log);
  }

  // nutrición: últimos 7 días
  const sample = [
    { name: "Copos de avena", grams: 60, kcal: 227, protein: 8, carbs: 40, fat: 4, meal: "desayuno" as const },
    { name: "Leche semidesnatada", grams: 250, kcal: 115, protein: 8, carbs: 12, fat: 4, meal: "desayuno" as const },
    { name: "Pechuga de pollo (cocinada)", grams: 180, kcal: 297, protein: 56, carbs: 0, fat: 6, meal: "comida" as const },
    { name: "Arroz blanco (cocido)", grams: 220, kcal: 286, protein: 6, carbs: 62, fat: 1, meal: "comida" as const },
    { name: "Aceite de oliva", grams: 10, kcal: 88, protein: 0, carbs: 0, fat: 10, meal: "comida" as const },
    { name: "Yogur proteico / skyr", grams: 150, kcal: 95, protein: 17, carbs: 6, fat: 0, meal: "merienda" as const },
    { name: "Plátano", grams: 120, kcal: 107, protein: 1, carbs: 28, fat: 0, meal: "merienda" as const },
    { name: "Salmón", grams: 150, kcal: 312, protein: 30, carbs: 0, fat: 20, meal: "cena" as const },
    { name: "Patata (cocida)", grams: 250, kcal: 218, protein: 5, carbs: 50, fat: 0, meal: "cena" as const },
    { name: "Brócoli", grams: 150, kcal: 51, protein: 4, carbs: 10, fat: 1, meal: "cena" as const },
  ];
  for (let d = 6; d >= 0; d--) {
    const k = dayKey(addDays(now, -d));
    const entries = sample
      .filter((_, i) => d !== 0 || i < 6)
      .map((s) => ({ ...s, id: newId(), grams: Math.round(s.grams * (0.9 + Math.random() * 0.2)) }));
    data.nutrition[k] = { id: k, date: k, entries, waterMl: d === 0 ? 1250 : 2000 + Math.round(Math.random() * 4) * 250 };
  }

  if (db.users[uid]) {
    db.users[uid] = {
      ...db.users[uid],
      onboarded: true,
      sex: "hombre",
      birthYear: 1994,
      heightCm: 178,
      activity: "moderado",
      goal: "perder",
      targetWeight: 77,
      planSlug: "torso-pierna-4-dias",
      level: "intermedio",
      place: "gimnasio",
      focusAreas: ["pecho", "piernas"],
      weeklyWorkoutsGoal: 4,
      calorieGoal: 2250,
      proteinGoal: 175,
      carbsGoal: 225,
      fatGoal: 70,
      waterGoal: 2750,
      workoutsCount: data.workouts.length,
    };
  }

  // usuarios y eventos de ejemplo para el panel de administración
  const names = [
    "Lucía Martín", "Carlos Gómez", "Ana Ruiz", "Javier López", "Marta Sánchez", "Pablo Díaz",
    "Sofía Navarro", "Diego Torres", "Elena Romero", "Hugo Castro", "Paula Ortega", "Álvaro Molina",
  ];
  const t = Date.now();
  names.forEach((n, i) => {
    const id = `ejemplo-${i}`;
    const created = t - (i * 2.3 + Math.random() * 2) * 86400000;
    const last = Math.max(created, t - Math.random() * 6 * 86400000);
    const email = n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(" ", ".") + "@ejemplo.com";
    db.users[id] = {
      uid: id,
      email,
      name: n,
      createdAt: created,
      lastLoginAt: last,
      lastActiveAt: last,
      loginCount: 1 + Math.floor(Math.random() * 25),
      workoutsCount: Math.floor(Math.random() * 30),
      blocked: i === 7,
      onboarded: i % 3 !== 0,
      demo: true,
    };
    db.events.push({ id: newId(), type: "signup", ts: created, uid: id, email, name: n, path: "/login" });
    for (let k = 0; k < 6; k++) {
      const ts = created + Math.random() * (t - created);
      db.events.push({ id: newId(), type: "login", ts, uid: id, email, name: n, path: "/login" });
    }
  });
  for (let k = 0; k < 220; k++) {
    db.events.push({
      id: newId(),
      type: "visit",
      ts: t - Math.random() * 30 * 86400000,
      path: ["/", "/ejercicios", "/rutinas", "/calculadoras/calorias", "/ejercicios/hip-thrust", "/ejercicios/sentadilla-con-barra"][k % 6],
      ref: ["google.com", "", "chatgpt.com", "perplexity.ai", "instagram.com"][k % 5],
    });
  }
  db.events.push(
    { id: newId(), type: "auth_error", ts: t - 3 * 3600000, code: "auth/popup-closed-by-user", message: "El usuario cerró la ventana de Google antes de terminar.", path: "/login" },
    { id: newId(), type: "auth_error", ts: t - 26 * 3600000, code: "auth/popup-blocked", message: "El navegador bloqueó la ventana emergente de Google.", path: "/login", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari" },
    { id: newId(), type: "client_error", ts: t - 50 * 3600000, message: "TypeError: Failed to fetch", path: "/panel/nutricion" },
  );
  writeLocal(db);
}

export function resetDemoData() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}
