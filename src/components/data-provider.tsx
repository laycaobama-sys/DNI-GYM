"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./auth-provider";
import * as db from "@/lib/db";
import type { BodyLog, Workout } from "@/lib/types";

interface DataState {
  ready: boolean;
  error: string | null;
  workouts: Workout[];
  body: BodyLog[];
  latestWeight?: number;
  saveWorkout: (w: Workout) => Promise<Workout>;
  deleteWorkout: (id: string) => Promise<void>;
  saveBodyLog: (l: BodyLog) => Promise<void>;
  deleteBodyLog: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const Ctx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, updateProfile, profile } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [body, setBody] = useState<BodyLog[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uid = user?.uid;

  const reload = useCallback(async () => {
    if (!uid) return;
    try {
      const [w, b] = await Promise.all([db.listWorkouts(uid), db.listBodyLogs(uid)]);
      setWorkouts(w);
      setBody(b);
      setError(null);
    } catch (e) {
      setError("No se pudieron cargar tus datos. Comprueba tu conexión.");
      db.logEvent({ type: "client_error", uid, message: `load data: ${String((e as Error).message ?? e)}` });
    } finally {
      setReady(true);
    }
  }, [uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    // al sincronizar lo guardado sin conexión, recargar los datos del servidor
    const onSynced = () => reload();
    window.addEventListener("dnigym:synced", onSynced);
    return () => window.removeEventListener("dnigym:synced", onSynced);
  }, [reload]);

  const saveWorkout = useCallback(
    async (w: Workout) => {
      if (!uid) throw new Error("Sin sesión");
      const saved = await db.saveWorkout(uid, w);
      let count = 0;
      setWorkouts((prev) => {
        const next = [saved, ...prev.filter((x) => x.id !== w.id)].sort((a, b) => b.date - a.date);
        count = next.length;
        return next;
      });
      updateProfile({ workoutsCount: count || (profile?.workoutsCount ?? 0) + 1 }).catch(() => {});
      return saved;
    },
    [uid, updateProfile, profile?.workoutsCount],
  );

  const deleteWorkout = useCallback(
    async (id: string) => {
      if (!uid) return;
      await db.deleteWorkout(uid, id);
      setWorkouts((prev) => prev.filter((x) => x.id !== id));
    },
    [uid],
  );

  const saveBodyLog = useCallback(
    async (l: BodyLog) => {
      if (!uid) return;
      await db.saveBodyLog(uid, l);
      setBody((prev) => [...prev.filter((x) => x.id !== l.id), l].sort((a, b) => a.date.localeCompare(b.date)));
    },
    [uid],
  );

  const deleteBodyLog = useCallback(
    async (id: string) => {
      if (!uid) return;
      await db.deleteBodyLog(uid, id);
      setBody((prev) => prev.filter((x) => x.id !== id));
    },
    [uid],
  );

  const latestWeight = useMemo(() => [...body].reverse().find((b) => b.weight)?.weight, [body]);

  const value = useMemo(
    () => ({ ready, error, workouts, body, latestWeight, saveWorkout, deleteWorkout, saveBodyLog, deleteBodyLog, reload }),
    [ready, error, workouts, body, latestWeight, saveWorkout, deleteWorkout, saveBodyLog, deleteBodyLog, reload],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useData debe usarse dentro de <DataProvider>");
  return c;
}
