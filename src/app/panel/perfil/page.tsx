"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Calculator, Download, LogOut, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useData } from "@/components/data-provider";
import { Avatar } from "@/components/app-shell";
import { Badge, Button, Card, CardHeader, Field, Modal, PageHeader } from "@/components/ui";
import { ACTIVITY_FACTORS, GOAL_LABELS, computeNutritionGoals, fmtDate, fmtNumber } from "@/lib/fitness";
import { exportUserData, resetDemoData } from "@/lib/db";
import type { Activity, Goal, Sex, UserProfile } from "@/lib/types";

export default function ProfilePage() {
  const { profile, updateProfile, signOut, deleteAccount, mode, user } = useAuth();
  const { latestWeight, saveBodyLog } = useData();
  const router = useRouter();
  const [f, setF] = useState<Partial<UserProfile>>(() => ({ ...profile }));
  const [weight, setWeight] = useState<string>(latestWeight ? String(latestWeight) : "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const w = parseFloat(weight.replace(",", ".")) || latestWeight;
  const suggested = useMemo(() => computeNutritionGoals(f, w), [f, w]);
  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  const save = async (applySuggested = false) => {
    setSaving(true);
    try {
      const patch: Partial<UserProfile> = {
        name: f.name,
        sex: f.sex,
        birthYear: f.birthYear,
        heightCm: f.heightCm,
        activity: f.activity,
        goal: f.goal,
        targetWeight: f.targetWeight,
        weeklyWorkoutsGoal: f.weeklyWorkoutsGoal,
        calorieGoal: f.calorieGoal,
        proteinGoal: f.proteinGoal,
        carbsGoal: f.carbsGoal,
        fatGoal: f.fatGoal,
        waterGoal: f.waterGoal,
      };
      if (applySuggested && suggested) Object.assign(patch, suggested, { maintenance: undefined });
      delete (patch as Record<string, unknown>).maintenance;
      patch.onboarded = Boolean(patch.sex && patch.heightCm && patch.birthYear && patch.goal);
      await updateProfile(patch);
      if (weight && w && w !== latestWeight) {
        const today = new Date();
        const k = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        await saveBodyLog({ id: k, date: k, weight: w });
      }
      setF((p) => ({ ...p, ...patch }));
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const download = async () => {
    if (!user) return;
    const data = await exportUserData(user.uid);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dnigym-datos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const num = (v: string) => (v === "" ? undefined : Number(v));

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" subtitle="Tus datos, objetivos y preferencias" />

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <Avatar name={profile?.name} photo={profile?.photoURL} className="size-14 text-base" />
        <div className="flex-1">
          <p className="font-display text-lg font-semibold">{profile?.name}</p>
          <p className="text-sm text-muted">{profile?.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="accent">Plan gratuito</Badge>
            <Badge>Miembro desde {profile?.createdAt ? fmtDate(profile.createdAt, { month: "long", year: "numeric" }) : "—"}</Badge>
            {mode === "demo" && <Badge tone="info">Modo demo</Badge>}
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={async () => {
            await signOut();
            router.replace("/");
          }}
        >
          <LogOut className="size-4" /> Cerrar sesión
        </Button>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Datos personales" subtitle="Se usan para calcular tus calorías y macros" />
          <div className="grid grid-cols-2 gap-4 p-5">
            <Field label="Nombre" className="col-span-2">
              <input className="input" value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Sexo">
              <select className="input" value={f.sex ?? ""} onChange={(e) => set("sex", (e.target.value || undefined) as Sex)}>
                <option value="">Selecciona</option>
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
              </select>
            </Field>
            <Field label="Año de nacimiento">
              <input type="number" className="input" placeholder="1995" value={f.birthYear ?? ""} onChange={(e) => set("birthYear", num(e.target.value))} />
            </Field>
            <Field label="Altura (cm)">
              <input type="number" className="input" placeholder="175" value={f.heightCm ?? ""} onChange={(e) => set("heightCm", num(e.target.value))} />
            </Field>
            <Field label="Peso actual (kg)">
              <input type="number" step="0.1" className="input" placeholder="75" value={weight} onChange={(e) => { setWeight(e.target.value); setSaved(false); }} />
            </Field>
            <Field label="Nivel de actividad" className="col-span-2">
              <select className="input" value={f.activity ?? ""} onChange={(e) => set("activity", (e.target.value || undefined) as Activity)}>
                <option value="">Selecciona</option>
                {Object.entries(ACTIVITY_FACTORS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label} — {v.hint}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Objetivos" />
          <div className="grid grid-cols-2 gap-4 p-5">
            <Field label="Objetivo principal" className="col-span-2">
              <select className="input" value={f.goal ?? ""} onChange={(e) => set("goal", (e.target.value || undefined) as Goal)}>
                <option value="">Selecciona</option>
                {Object.entries(GOAL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Peso objetivo (kg)">
              <input type="number" step="0.1" className="input" value={f.targetWeight ?? ""} onChange={(e) => set("targetWeight", num(e.target.value))} />
            </Field>
            <Field label="Entrenos por semana">
              <input type="number" min={1} max={7} className="input" value={f.weeklyWorkoutsGoal ?? ""} onChange={(e) => set("weeklyWorkoutsGoal", num(e.target.value))} />
            </Field>
            <Field label="Calorías diarias (kcal)">
              <input type="number" className="input" value={f.calorieGoal ?? ""} onChange={(e) => set("calorieGoal", num(e.target.value))} />
            </Field>
            <Field label="Agua (ml)">
              <input type="number" step={250} className="input" value={f.waterGoal ?? ""} onChange={(e) => set("waterGoal", num(e.target.value))} />
            </Field>
            <Field label="Proteína (g)">
              <input type="number" className="input" value={f.proteinGoal ?? ""} onChange={(e) => set("proteinGoal", num(e.target.value))} />
            </Field>
            <Field label="Carbohidratos (g)">
              <input type="number" className="input" value={f.carbsGoal ?? ""} onChange={(e) => set("carbsGoal", num(e.target.value))} />
            </Field>
            <Field label="Grasas (g)">
              <input type="number" className="input" value={f.fatGoal ?? ""} onChange={(e) => set("fatGoal", num(e.target.value))} />
            </Field>
          </div>
          {suggested && (
            <div className="mx-5 mb-5 rounded-xl border border-accent/30 bg-accent/[0.05] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-accent">
                <Calculator className="size-4" /> Recomendación personalizada
              </p>
              <p className="mt-1 text-sm tabular-nums text-ink-2">
                Mantenimiento ~{fmtNumber(suggested.maintenance)} kcal → objetivo <strong className="text-ink">{fmtNumber(suggested.calorieGoal)} kcal</strong> · P {suggested.proteinGoal} g · C {suggested.carbsGoal} g · G {suggested.fatGoal} g · Agua {fmtNumber(suggested.waterGoal / 1000, 1)} L
              </p>
              <Button size="sm" className="mt-3" onClick={() => { setF((p) => ({ ...p, ...suggested })); save(true); }}>
                Aplicar y guardar
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-good">✓ Cambios guardados</span>}
        <Button size="lg" onClick={() => save(false)} disabled={saving}>
          <Save className="size-4" /> {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>

      <Card>
        <CardHeader title="Tus datos" subtitle="Privacidad y control total sobre tu información" />
        <div className="flex flex-col gap-3 p-5 sm:flex-row">
          <Button variant="secondary" onClick={download}>
            <Download className="size-4" /> Exportar mis datos (JSON)
          </Button>
          {mode === "demo" && (
            <Button
              variant="secondary"
              onClick={async () => {
                resetDemoData();
                await signOut();
                router.replace("/login");
              }}
            >
              Reiniciar datos de demostración
            </Button>
          )}
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" /> Eliminar mi cuenta
          </Button>
        </div>
      </Card>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Eliminar cuenta">
        <p className="text-sm text-ink-2">Se borrarán de forma permanente tu perfil, entrenamientos, registros de peso y nutrición. Esta acción no se puede deshacer.</p>
        <Field label='Escribe "ELIMINAR" para confirmar' className="mt-4">
          <input className="input" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} />
        </Field>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          <Button
            variant="danger"
            disabled={deleteText !== "ELIMINAR"}
            onClick={async () => {
              await deleteAccount();
              router.replace("/");
            }}
          >
            Eliminar definitivamente
          </Button>
        </div>
      </Modal>
    </div>
  );
}
