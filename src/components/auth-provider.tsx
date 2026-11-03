"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getRedirectResult, signInWithPopup, signInWithRedirect, signOut as fbSignOut, type User } from "firebase/auth";
import { getFirebase, googleProvider } from "@/lib/firebase";
import { ApiError, api, backendEnabled, demoLogin, demoProfile, deleteUserData, logEvent, updateProfile as dbUpdateProfile } from "@/lib/db";
import { migrateFromFirestore } from "@/lib/migrate";
import type { UserProfile } from "@/lib/types";

export interface SessionUser {
  uid: string;
  email: string;
  name: string;
  photoURL?: string | null;
}

interface AuthState {
  mode: "cloudflare" | "demo";
  user: SessionUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  devAuth: boolean;
  signInWithGoogle: () => Promise<boolean>;
  signInDev: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const DEMO_SESSION_KEY = "dnigym:demo-session";

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/popup-closed-by-user": "Has cerrado la ventana de Google antes de terminar. Inténtalo de nuevo.",
  "auth/cancelled-popup-request": "Se canceló la ventana de inicio de sesión. Inténtalo de nuevo.",
  "auth/popup-blocked": "Tu navegador bloqueó la ventana de Google. Te redirigimos para iniciar sesión…",
  "auth/network-request-failed": "No hay conexión a internet o la red bloqueó la petición.",
  "auth/unauthorized-domain": "Este dominio no está autorizado para iniciar sesión con Google. Avisa al administrador.",
  "auth/operation-not-allowed": "El acceso con Google no está activado. Avisa al administrador.",
  "auth/user-disabled": "Tu cuenta ha sido desactivada. Contacta con soporte.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  "auth/internal-error": "Error interno de autenticación. Inténtalo de nuevo en unos segundos.",
  "auth/web-storage-unsupported": "Tu navegador bloquea el almacenamiento (modo privado o cookies bloqueadas).",
  "session/invalid-token": "No se pudo verificar tu cuenta de Google. Inténtalo de nuevo.",
  "account/blocked": "Esta cuenta está suspendida.",
};

const toSession = (p: UserProfile): SessionUser => ({ uid: p.uid, email: p.email, name: p.name, photoURL: p.photoURL });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const mode = backendEnabled ? "cloudflare" : "demo";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devAuth, setDevAuth] = useState(false);
  const user = useMemo(() => (profile ? toSession(profile) : null), [profile]);

  const applySession = useCallback((r: { profile: UserProfile | null; isAdmin: boolean }) => {
    setProfile(r.profile);
    setIsAdmin(Boolean(r.isAdmin));
  }, []);

  /** Intercambia el token de Google por una sesión de Cloudflare y migra datos antiguos (una vez). */
  const exchange = useCallback(
    async (fu: User) => {
      const idToken = await fu.getIdToken(true);
      const r = await api<{ profile: UserProfile; isAdmin: boolean }>("/api/auth/session", { method: "POST", body: { idToken } });
      applySession(r);
      const migrated = await migrateFromFirestore(fu.uid);
      if (migrated) setProfile(migrated);
      // la sesión de Firebase ya no hace falta: la sesión real vive en Cloudflare
      fbSignOut(getFirebase().auth).catch(() => {});
    },
    [applySession],
  );

  // ── arranque: recuperar la sesión ──
  useEffect(() => {
    (async () => {
      try {
        if (!backendEnabled) {
          if (localStorage.getItem(DEMO_SESSION_KEY)) applySession({ profile: demoProfile(), isAdmin: true });
          return;
        }
        const [me, cfg] = await Promise.all([
          api<{ profile: UserProfile | null; isAdmin: boolean }>("/api/me"),
          api<{ devAuth: boolean }>("/api/config").catch(() => ({ devAuth: false })),
        ]);
        setDevAuth(Boolean(cfg.devAuth));
        if (me.profile) {
          applySession(me);
          return;
        }
        // vuelta de un inicio de sesión por redirección (móviles que bloquean ventanas emergentes)
        const res = await getRedirectResult(getFirebase().auth).catch((e) => {
          const code = (e as { code?: string }).code ?? "unknown";
          setError(AUTH_ERROR_MESSAGES[code] ?? "No se pudo iniciar sesión. Inténtalo de nuevo.");
          logEvent({ type: "auth_error", code, message: String((e as Error).message ?? e) });
          return null;
        });
        if (res?.user) await exchange(res.user);
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 0)) setError(e instanceof Error ? e.message : "No se pudo cargar tu sesión.");
      } finally {
        setLoading(false);
      }
    })();
  }, [applySession, exchange]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!backendEnabled) {
      localStorage.setItem(DEMO_SESSION_KEY, "1");
      applySession({ profile: await demoLogin(), isAdmin: true });
      return true;
    }
    const { auth } = getFirebase();
    try {
      const cred = await signInWithPopup(auth, googleProvider());
      await exchange(cred.user);
      return true;
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        return false;
      }
      const code = (e as { code?: string }).code ?? "unknown";
      logEvent({ type: "auth_error", code, message: String((e as Error).message ?? e) });
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        setError(AUTH_ERROR_MESSAGES["auth/popup-blocked"]);
        await signInWithRedirect(auth, googleProvider());
        return false;
      }
      setError(AUTH_ERROR_MESSAGES[code] ?? "No se pudo iniciar sesión con Google. Inténtalo de nuevo.");
      return false;
    }
  }, [applySession, exchange]);

  /** Solo desarrollo local (el servidor lo rechaza en producción). */
  const signInDev = useCallback(
    async (email: string) => {
      try {
        applySession(await api<{ profile: UserProfile; isAdmin: boolean }>("/api/auth/dev", { method: "POST", body: { email } }));
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
        return false;
      }
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    if (!backendEnabled) localStorage.removeItem(DEMO_SESSION_KEY);
    else {
      await api("/api/auth/logout", { method: "POST" }).catch(() => {});
      fbSignOut(getFirebase().auth).catch(() => {});
    }
    setProfile(null);
    setIsAdmin(false);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!profile) return;
      const next = await dbUpdateProfile(profile.uid, patch);
      setProfile((p) => (next ? { ...p, ...next } : p ? { ...p, ...patch } : p));
    },
    [profile],
  );

  const refreshProfile = useCallback(async () => {
    if (!backendEnabled) return setProfile(demoProfile());
    const me = await api<{ profile: UserProfile | null; isAdmin: boolean }>("/api/me");
    applySession(me);
  }, [applySession]);

  const deleteAccount = useCallback(async () => {
    if (!profile) return;
    await deleteUserData(profile.uid);
    if (!backendEnabled) localStorage.removeItem(DEMO_SESSION_KEY);
    else fbSignOut(getFirebase().auth).catch(() => {});
    setProfile(null);
    setIsAdmin(false);
  }, [profile]);

  const value = useMemo<AuthState>(
    () => ({
      mode,
      user,
      profile,
      isAdmin,
      loading,
      error,
      devAuth,
      signInWithGoogle,
      signInDev,
      signOut,
      updateProfile,
      refreshProfile,
      deleteAccount,
      clearError: () => setError(null),
    }),
    [mode, user, profile, isAdmin, loading, error, devAuth, signInWithGoogle, signInDev, signOut, updateProfile, refreshProfile, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
