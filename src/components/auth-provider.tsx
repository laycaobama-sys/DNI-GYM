"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, api, backendEnabled, demoLogin, demoProfile, deleteUserData, updateProfile as dbUpdateProfile } from "@/lib/db";
import type { UserProfile } from "@/lib/types";

export interface SessionUser {
  uid: string;
  email: string;
  name: string;
  photoURL?: string | null;
}

export interface AuthConfig {
  google: boolean;
  turnstileSiteKey: string | null;
  devAuth: boolean;
  ai: boolean;
}

type SessionReply = { profile: UserProfile; isAdmin: boolean; isNew?: boolean };

interface AuthState {
  mode: "cloudflare" | "demo";
  user: SessionUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  config: AuthConfig;
  /** compatibilidad: true si el acceso de desarrollo está activo */
  devAuth: boolean;
  signUp: (d: { name: string; email: string; password: string; turnstile?: string; acceptTerms: boolean }) => Promise<SessionReply>;
  signIn: (d: { email: string; password: string; turnstile?: string }) => Promise<SessionReply>;
  requestReset: (d: { email: string; turnstile?: string }) => Promise<void>;
  resetPassword: (d: { token: string; password: string }) => Promise<SessionReply>;
  changePassword: (d: { current?: string; password: string }) => Promise<void>;
  signInWithGoogle: () => void;
  signInDev: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const DEMO_SESSION_KEY = "dnigym:demo-session";

/** Textos para los códigos de error de acceso (también los usa el panel de administración). */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/wrong-credentials": "Correo o contraseña incorrectos.",
  "auth/no-password": "La cuenta existe pero aún no tiene contraseña (se creó con Google).",
  "account/blocked": "Esta cuenta está suspendida.",
  "google-off": "El acceso con Google todavía no está activado.",
  "google-cancelled": "Has cancelado el acceso con Google.",
  "google-state": "La sesión de Google caducó o se abrió en otra pestaña. Inténtalo de nuevo.",
  "google-code": "Google no devolvió el código de acceso. Inténtalo de nuevo.",
  "google-token": "Google rechazó el acceso. Inténtalo de nuevo en unos segundos.",
  "google-verify": "No se pudo verificar tu cuenta de Google. Inténtalo de nuevo.",
  "account-blocked": "Esta cuenta está suspendida. Escríbenos para revisarlo.",
  rate: "Demasiados intentos. Espera unos minutos.",
  "reset/requested": "El usuario pidió cambiar su contraseña: genera un enlace desde Usuarios.",
  "reset/unknown-email": "Alguien pidió cambiar la contraseña de un correo que no tiene cuenta.",
  "reset/completed": "Contraseña cambiada con enlace.",
  "password/changed": "Contraseña cambiada desde el perfil.",
};

const toSession = (p: UserProfile): SessionUser => ({ uid: p.uid, email: p.email, name: p.name, photoURL: p.photoURL });
const DEFAULT_CONFIG: AuthConfig = { google: false, turnstileSiteKey: null, devAuth: false, ai: false };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const mode = backendEnabled ? "cloudflare" : "demo";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AuthConfig>(DEFAULT_CONFIG);
  const user = useMemo(() => (profile ? toSession(profile) : null), [profile]);

  const applySession = useCallback((r: { profile: UserProfile | null; isAdmin: boolean }) => {
    setProfile(r.profile);
    setIsAdmin(Boolean(r.isAdmin));
  }, []);

  // ── arranque: recuperar la sesión y la configuración ──
  useEffect(() => {
    (async () => {
      try {
        if (!backendEnabled) {
          if (localStorage.getItem(DEMO_SESSION_KEY)) applySession({ profile: demoProfile(), isAdmin: true });
          return;
        }
        const [me, cfg] = await Promise.all([
          api<{ profile: UserProfile | null; isAdmin: boolean }>("/api/me"),
          api<Partial<AuthConfig>>("/api/config").catch(() => ({}) as Partial<AuthConfig>),
        ]);
        setConfig({ ...DEFAULT_CONFIG, ...cfg });
        if (me.profile) applySession(me);
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 0)) setError(e instanceof Error ? e.message : "No se pudo cargar tu sesión.");
      } finally {
        setLoading(false);
      }
    })();
  }, [applySession]);

  /** En modo demostración cualquier acceso entra con el usuario de prueba. */
  const demoSession = useCallback(async (): Promise<SessionReply> => {
    localStorage.setItem(DEMO_SESSION_KEY, "1");
    const r = { profile: await demoLogin(), isAdmin: true };
    applySession(r);
    return r;
  }, [applySession]);

  const session = useCallback(
    async (path: string, body: unknown) => {
      setError(null);
      if (!backendEnabled) return demoSession();
      const r = await api<SessionReply>(path, { method: "POST", body });
      applySession(r);
      return r;
    },
    [applySession, demoSession],
  );

  const signUp = useCallback<AuthState["signUp"]>((d) => session("/api/auth/signup", d), [session]);
  const signIn = useCallback<AuthState["signIn"]>((d) => session("/api/auth/login", d), [session]);
  const resetPassword = useCallback<AuthState["resetPassword"]>((d) => session("/api/auth/reset", d), [session]);

  const requestReset = useCallback<AuthState["requestReset"]>(async (d) => {
    if (!backendEnabled) return;
    await api("/api/auth/forgot", { method: "POST", body: d });
  }, []);

  const changePassword = useCallback<AuthState["changePassword"]>(
    async (d) => {
      if (!backendEnabled) return;
      await api("/api/auth/password", { method: "POST", body: d });
      await api<{ profile: UserProfile | null; isAdmin: boolean }>("/api/me").then(applySession);
    },
    [applySession],
  );

  /** Google: redirección completa al flujo OAuth del Worker (sin ventanas emergentes). */
  const signInWithGoogle = useCallback(() => {
    if (!backendEnabled) {
      demoSession();
      return;
    }
    window.location.assign(new URL("/api/auth/google", window.location.origin).href);
  }, [demoSession]);

  /** Solo desarrollo local (el servidor lo rechaza en producción). */
  const signInDev = useCallback(
    async (email: string) => {
      try {
        await session("/api/auth/dev", { email });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
        return false;
      }
    },
    [session],
  );

  const signOut = useCallback(async () => {
    if (!backendEnabled) localStorage.removeItem(DEMO_SESSION_KEY);
    else await api("/api/auth/logout", { method: "POST" }).catch(() => {});
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
    applySession(await api<{ profile: UserProfile | null; isAdmin: boolean }>("/api/me"));
  }, [applySession]);

  const deleteAccount = useCallback(async () => {
    if (!profile) return;
    await deleteUserData(profile.uid);
    if (!backendEnabled) localStorage.removeItem(DEMO_SESSION_KEY);
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
      config,
      devAuth: config.devAuth,
      signUp,
      signIn,
      requestReset,
      resetPassword,
      changePassword,
      signInWithGoogle,
      signInDev,
      signOut,
      updateProfile,
      refreshProfile,
      deleteAccount,
      clearError: () => setError(null),
    }),
    [mode, user, profile, isAdmin, loading, error, config, signUp, signIn, requestReset, resetPassword, changePassword, signInWithGoogle, signInDev, signOut, updateProfile, refreshProfile, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
