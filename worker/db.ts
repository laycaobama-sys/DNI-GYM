import type { Env } from "./env";

/** Versión del esquema. Súbela y añade pasos en MIGRATIONS para evolucionarlo sin perder datos. */
const SCHEMA_VERSION = 3;

const MIGRATIONS: Record<number, string[]> = {
  1: [
    `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      photo_url TEXT,
      provider TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      blocked INTEGER NOT NULL DEFAULT 0,
      profile TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      last_login_at INTEGER NOT NULL,
      last_active_at INTEGER NOT NULL,
      login_count INTEGER NOT NULL DEFAULT 0,
      workouts_count INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users(email)`,
    `CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL,
      ua TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id)`,
    `CREATE TABLE IF NOT EXISTS workouts (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date INTEGER NOT NULL,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, id)
    )`,
    `CREATE INDEX IF NOT EXISTS workouts_user_date ON workouts(user_id, date DESC)`,
    `CREATE TABLE IF NOT EXISTS body_logs (
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, date)
    )`,
    `CREATE TABLE IF NOT EXISTS nutrition_days (
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, date)
    )`,
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      ts INTEGER NOT NULL,
      user_id TEXT,
      email TEXT,
      name TEXT,
      code TEXT,
      message TEXT,
      path TEXT,
      ua TEXT,
      ref TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS events_ts ON events(ts DESC)`,
    `CREATE TABLE IF NOT EXISTS ai_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      ts INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS ai_messages_user ON ai_messages(user_id, id DESC)`,
    `CREATE TABLE IF NOT EXISTS ai_usage (
      user_id TEXT NOT NULL,
      day TEXT NOT NULL,
      requests INTEGER NOT NULL DEFAULT 0,
      tokens INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, day)
    )`,
    `CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      window INTEGER NOT NULL,
      count INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      actor_id TEXT NOT NULL,
      actor_email TEXT,
      action TEXT NOT NULL,
      target TEXT,
      detail TEXT
    )`,
  ],
  // v2: cuentas propias (correo + contraseña), Google OAuth directo y enlaces de un solo uso
  2: [
    `ALTER TABLE users ADD COLUMN password_hash TEXT`,
    `ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN google_sub TEXT`,
    `UPDATE users SET email_verified = 1 WHERE provider LIKE 'google%'`,
    `CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL`,
    `CREATE TABLE IF NOT EXISTS auth_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      purpose TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      created_by TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS auth_tokens_user ON auth_tokens(user_id)`,
  ],
  // v3: CRM (etiquetas y notas), inventario (stock) e índices para métricas
  3: [
    `CREATE TABLE IF NOT EXISTS crm (
      user_id TEXT PRIMARY KEY,
      tags TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS crm_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      ts INTEGER NOT NULL,
      author_email TEXT,
      text TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS crm_notes_user ON crm_notes(user_id, id DESC)`,
    `CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      sku TEXT,
      unit TEXT NOT NULL DEFAULT 'uds',
      stock REAL NOT NULL DEFAULT 0,
      min_stock REAL NOT NULL DEFAULT 0,
      cost REAL,
      price REAL,
      location TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS inventory_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT NOT NULL,
      ts INTEGER NOT NULL,
      delta REAL NOT NULL,
      reason TEXT,
      actor_email TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS inventory_moves_item ON inventory_moves(item_id, id DESC)`,
    `CREATE INDEX IF NOT EXISTS users_created ON users(created_at)`,
    `CREATE INDEX IF NOT EXISTS events_type_ts ON events(type, ts)`,
    `CREATE INDEX IF NOT EXISTS workouts_date ON workouts(date)`,
  ],
};

let ready: Promise<void> | null = null;

/** Crea o actualiza el esquema la primera vez que el Worker lo necesita (una vez por instancia). */
export function ensureSchema(env: Env) {
  ready ??= (async () => {
    let current = 0;
    try {
      const row = await env.DB.prepare("SELECT value FROM meta WHERE key = 'schema_version'").first<{ value: string }>();
      current = Number(row?.value ?? 0);
    } catch {
      current = 0;
    }
    for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
      await env.DB.batch(MIGRATIONS[v].map((sql) => env.DB.prepare(sql)));
      await env.DB.prepare("INSERT INTO meta (key, value) VALUES ('schema_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
        .bind(String(v))
        .run();
    }
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

/** Limitador sencillo de peticiones por clave y ventana de tiempo (persistido en D1). */
export async function rateLimit(env: Env, key: string, limit: number, windowSec: number) {
  const window = Math.floor(Date.now() / 1000 / windowSec);
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (key, window, count) VALUES (?1, ?2, 1)
     ON CONFLICT(key) DO UPDATE SET count = CASE WHEN window = ?2 THEN count + 1 ELSE 1 END, window = ?2
     RETURNING count`,
  )
    .bind(key, window)
    .first<{ count: number }>();
  return (row?.count ?? 1) <= limit;
}

export async function audit(env: Env, actor: { id: string; email: string }, action: string, target?: string, detail?: unknown) {
  await env.DB.prepare("INSERT INTO audit_log (ts, actor_id, actor_email, action, target, detail) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(Date.now(), actor.id, actor.email, action, target ?? null, detail ? JSON.stringify(detail).slice(0, 2000) : null)
    .run();
}
