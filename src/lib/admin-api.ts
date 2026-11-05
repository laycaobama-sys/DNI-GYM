// Llamadas del centro de control del dueño (solo administradores; el servidor lo comprueba).
import { api, backendEnabled, streamApi } from "@/lib/db";

export interface KV {
  label: string;
  value: number;
}

export interface Metrics {
  days: number;
  generatedAt: number;
  totals: {
    users: number;
    newRange: number;
    newPrev: number;
    active1: number;
    active7: number;
    active30: number;
    onboarded: number;
    blocked: number;
    verified: number;
    withWorkouts: number;
    admins: number;
    errors7: number;
  };
  series: Record<"signups" | "active" | "workouts" | "visits" | "ai", { d: string; v: number }[]>;
  funnel: KV[];
  retention: { d7: number | null; d30: number | null; d7Base: number; d30Base: number };
  devices: KV[];
  referrers: KV[];
  pages: KV[];
  goals: KV[];
  places: KV[];
  levels: KV[];
  providers: KV[];
  topExercises: KV[];
  hours: KV[];
  recent: { uid: string; name: string; email: string; createdAt: number; provider: string; onboarded: boolean; goal: string | null; workouts: number }[];
  catalog: { exercises: number; routines: number };
}

export type Stage = "nuevo" | "activo" | "en_riesgo" | "inactivo" | "bloqueado";

export interface Customer {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  provider: string;
  role: string;
  blocked: boolean;
  createdAt: number;
  lastActiveAt: number;
  loginCount: number;
  workoutsCount: number;
  onboarded: boolean;
  goal: string | null;
  place: string | null;
  level: string | null;
  tags: string[];
  workouts30: number;
  ai30: number;
  notes: number;
  stage: Stage;
  health: number;
  aiLimit: number | null;
  aiBlocked: boolean;
  plan: string;
}

export interface CrmNote {
  id: number;
  ts: number;
  author_email: string | null;
  text: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string | null;
  unit: string;
  stock: number;
  min_stock: number;
  cost: number | null;
  price: number | null;
  location: string | null;
  notes: string | null;
  updated_at: number;
}

export interface InventoryMove {
  id: number;
  item_id: string;
  item_name: string | null;
  unit: string | null;
  ts: number;
  delta: number;
  reason: string | null;
  actor_email: string | null;
}

export interface Inventory {
  items: InventoryItem[];
  moves: InventoryMove[];
}

export const enabled = backendEnabled;

export const getMetrics = (days: number) => api<Metrics>(`/api/admin/metrics?days=${days}`);
export const getCrm = () => api<Customer[]>("/api/admin/crm");
export const setTags = (uid: string, tags: string[]) => api<{ tags: string[] }>(`/api/admin/crm/${encodeURIComponent(uid)}/tags`, { method: "PUT", body: { tags } });
export const getNotes = (uid: string) => api<CrmNote[]>(`/api/admin/crm/${encodeURIComponent(uid)}/notes`);
export const addNote = (uid: string, text: string) => api<CrmNote[]>(`/api/admin/crm/${encodeURIComponent(uid)}/notes`, { method: "POST", body: { text } });
export const customerAi = (uid: string, onText: (t: string) => void) => streamApi(`/api/admin/crm/${encodeURIComponent(uid)}/ai`, {}, onText);
export const runAgent = (id: string, message: string, onText: (t: string) => void) => streamApi(`/api/admin/agents/${id}`, { message }, onText);

export const getInventory = () => api<Inventory>("/api/admin/inventory");
export const createItem = (b: Partial<InventoryItem>) => api<Inventory>("/api/admin/inventory", { method: "POST", body: b });
export const updateItem = (id: string, b: Partial<InventoryItem>) => api<Inventory>(`/api/admin/inventory/${encodeURIComponent(id)}`, { method: "PATCH", body: b });
export const moveItem = (id: string, delta: number, reason: string) => api<Inventory>(`/api/admin/inventory/${encodeURIComponent(id)}/move`, { method: "POST", body: { delta, reason } });
export const deleteItem = (id: string) => api<Inventory>(`/api/admin/inventory/${encodeURIComponent(id)}`, { method: "DELETE" });

export const STAGE_META: Record<Stage, { label: string; tone: "accent" | "good" | "warning" | "critical" | "neutral"; hint: string }> = {
  nuevo: { label: "Nuevo", tone: "accent", hint: "Registrado hace menos de 7 días" },
  activo: { label: "Activo", tone: "good", hint: "Ha entrado en los últimos 7 días" },
  en_riesgo: { label: "En riesgo", tone: "warning", hint: "Lleva 7–21 días sin entrar" },
  inactivo: { label: "Inactivo", tone: "neutral", hint: "Más de 21 días sin entrar" },
  bloqueado: { label: "Bloqueado", tone: "critical", hint: "Acceso suspendido" },
};

// ───────────────────────── mensajes, correo, ingresos ─────────────────────────

export interface ContactMessage {
  id: number;
  ts: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  user_id: string | null;
  status: "nuevo" | "en_curso" | "resuelto";
}

export interface EmailLog {
  id: number;
  ts: number;
  kind: string;
  to_email: string;
  status: string;
  error: string | null;
}

export interface Revenue {
  enabled: boolean;
  plans: { id: string; name: string; price_cents: number; currency: string; interval: string; features: string; active: number }[];
  activeSubscriptions: number;
  mrrCents: number;
  revenue30Cents: number;
  payments30: number;
  revenueAllCents: number;
  payers: number;
  recent: { id: string; ts: number; amount_cents: number; currency: string; status: string; email: string | null; name: string | null; provider: string | null }[];
  usersByPlan: { k: string; c: number }[];
}

export const getMessages = () => api<ContactMessage[]>("/api/admin/messages");
export const setMessageStatus = (id: number, status: ContactMessage["status"]) => api(`/api/admin/messages/${id}`, { method: "PATCH", body: { status } });
export const getEmailLog = () => api<EmailLog[]>("/api/admin/emails");
export const getRevenue = () => api<Revenue>("/api/admin/revenue");
export const clearErrors = (b: { code?: string | null; message?: string | null }) => api<{ deleted: number }>("/api/admin/errors/clear", { method: "POST", body: b });
export const setUserAi = (uid: string, b: { aiLimit?: number | null; aiBlocked?: boolean }) => api(`/api/admin/users/${encodeURIComponent(uid)}`, { method: "PATCH", body: b });
export const setUserBlocked = (uid: string, blocked: boolean) => api(`/api/admin/users/${encodeURIComponent(uid)}`, { method: "PATCH", body: { blocked } });
