"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteUser,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { firebaseEnabled, getFirebase, googleProvider } from "@/lib/firebase";
import {
  DEMO_USER,
  deleteUserData,
  getProfile,
  isAdminEmail,
  logEvent,
  seedDemoData,
  updateProfile as dbUpdateProfile,
  upsertProfileOnLogin,
} from "@/lib/db";
import type { UserProfile } from "@/lib/types";

export interface SessionUser {
  uid: string;
  email: string;
  name: string;
  photoURL?: string | null;
}

interface AuthState {
  mode: "firebase" | "demo";
  user: SessionUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const DEMO_SESSION_KEY = "dnigym:demo-session";
const ACTIVE_KEY = "dnigym:active-ping";

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/popup-closed-by-user": "Has cerrado la ventana de Google antes de terminar. Inténtalo de nuevo.",
  "auth/cancelled-popup-request": "Se canceló la ventana de inicio de sesión. Inténtalo de nuevo.",
  "auth/popup-blocked": "Tu navegador bloqueó la ventana de Google. Te redirigimos para iniciar sesión…",
  "auth/network-request-failed": "No hay conexión a internet o la red bloqueó la petición.",
  "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase. Avisa al administrador.",
  "auth/operation-not-allowed": "El acceso con Google no está activado. Avisa al administrador.",
  "auth/user-disabled": "Tu cuenta ha sido desactivada. Contacta con soporte.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  "auth/internal-error": "Error interno de autenticación. Inténtalo de nuevo en unos segundos.",
  "auth/web-storage-unsupported": "Tu navegador bloquea el almacenamiento (modo privado o cookies bloqueadas).",
};

function toSession(u: User): SessionUser {
  return { uid: u.uid, email: u.email ?? "", name: u.displayName ?? u.email ?? "Usuario", photoURL: u.photoURL };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const mode = firebaseEnabled ? "firebase" : "demo";
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const explicitLogin = useRef(false);

  const loadSession = useCallback(async (u: SessionUser, provider?: string) => {
    const countLogin = explicitLogin.current;
    explicitLogin.current = false;
    // contamos "activo" como máximo una vez cada 30 min por pestaña
    let touch = countLogin;
    try {
      const last = Number(sessionStorage.getItem(ACTIVE_KEY) || 0);
      if (Date.now() - last > 30 * 60 * 1000) touch = true;
      if (touch) sessionStorage.setItem(ACTIVE_KEY, String(Date.now()));
    } catch {}
    let p: UserProfile | null;
    if (touch) {
      const res = await upsertProfileOnLogin({ ...u, provider }, countLogin);
      p = res.profile;
      if (res.isNew) logEvent({ type: "signup", uid: u.uid, email: u.email, name: u.name });
      else if (countLogin) logEvent({ type: "login", uid: u.uid, email: u.email, name: u.name });
    } else {
      p = (await getProfile(u.uid)) ?? (await upsertProfileOnLogin({ ...u, provider }, false)).profile;
    }
    setProfile(p);
    setIsAdmin(await isAdminEmail(u.email));
  }, []);

  // ── Firebase ──
  useEffect(() => {
    if (!firebaseEnabled) return;
    const { auth } = getFirebase();
    getRedirectResult(auth)
      .then((r) => {
        if (r?.user) explicitLogin.current = true;
      })
      .catch((e) => {
        const code = (e as { code?: string }).code ?? "unknown";
        setError(AUTH_ERROR_MESSAGES[code] ?? "No se pudo iniciar sesión. Inténtalo de nuevo.");
        logEvent({ type: "auth_error", code, message: String((e as Error).message ?? e) });
      });
    return onAuthStateChanged(auth, async (fu) => {
      try {
        if (fu) {
          const s = toSession(fu);
          setUser(s);
          await loadSession(s, fu.providerData[0]?.providerId);
        } else {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (e) {
        const msg = String((e as Error).message ?? e);
        setError("Has iniciado sesión, pero no pudimos cargar tu perfil. Revisa tu conexión y recarga la página.");
        logEvent({ type: "auth_error", code: "profile/load-failed", message: msg, uid: fu?.uid, email: fu?.email ?? undefined });
      } finally {
        setLoading(false);
      }
    });
  }, [loadSession]);

  // ── Modo demo ──
  useEffect(() => {
    if (firebaseEnabled) return;
    (async () => {
      try {
        if (localStorage.getItem(DEMO_SESSION_KEY)) {
          setUser(DEMO_USER);
          await loadSession(DEMO_USER, "demo");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [loadSession]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    explicitLogin.current = true;
    if (!firebaseEnabled) {
      localStorage.setItem(DEMO_SESSION_KEY, "1");
      await upsertProfileOnLogin({ ...DEMO_USER, provider: "demo" }, false);
      seedDemoData(DEMO_USER.uid);
      setUser(DEMO_USER);
      await loadSession(DEMO_USER, "demo");
      return true;
    }
    const { auth } = getFirebase();
    try {
      await signInWithPopup(auth, googleProvider());
      return true;
    } catch (e) {
      const code = (e as { code?: string }).code ?? "unknown";
      logEvent({ type: "auth_error", code, message: String((e as Error).message ?? e) });
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        setError(AUTH_ERROR_MESSAGES["auth/popup-blocked"]);
        await signInWithRedirect(auth, googleProvider());
        return false;
      }
      explicitLogin.current = false;
      setError(AUTH_ERROR_MESSAGES[code] ?? "No se pudo iniciar sesión con Google. Inténtalo de nuevo.");
      return false;
    }
  }, [loadSession]);

  const signOut = useCallback(async () => {
    if (user) await logEvent({ type: "logout", uid: user.uid, email: user.email });
    try {
      sessionStorage.removeItem(ACTIVE_KEY);
    } catch {}
    if (!firebaseEnabled) {
      localStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    await fbSignOut(getFirebase().auth);
  }, [user]);

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!user) return;
      await dbUpdateProfile(user.uid, patch);
      setProfile((p) => (p ? { ...p, ...patch } : p));
    },
    [user],
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setProfile(await getProfile(user.uid));
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    await deleteUserData(user.uid);
    await logEvent({ type: "account_deleted", email: user.email });
    if (firebaseEnabled) {
      const { auth } = getFirebase();
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch {
          await fbSignOut(auth);
        }
      }
    } else {
      localStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
      setProfile(null);
    }
  }, [user]);

  const value = useMemo<AuthState>(
    () => ({
      mode,
      user,
      profile,
      isAdmin,
      loading,
      error,
      signInWithGoogle,
      signOut,
      updateProfile,
      refreshProfile,
      deleteAccount,
      clearError: () => setError(null),
    }),
    [mode, user, profile, isAdmin, loading, error, signInWithGoogle, signOut, updateProfile, refreshProfile, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
