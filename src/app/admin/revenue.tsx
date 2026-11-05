"use client";

import { useEffect, useState } from "react";
import { CreditCard, Crown, Info, Receipt, Repeat, TrendingUp, Users } from "lucide-react";
import { Badge, Card, CardHeader, Spinner } from "@/components/ui";
import { getRevenue, type Revenue as R } from "@/lib/admin-api";
import { fmtDateTime, fmtNumber } from "@/lib/fitness";

const eur = (cents: number, cur = "EUR") => (cents / 100).toLocaleString("es-ES", { style: "currency", currency: cur });

export function Revenue() {
  const [r, setR] = useState<R | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    getRevenue().then(setR).catch((e) => setErr((e as Error).message));
  }, []);
  if (err) return <p className="rounded-xl border border-critical/30 bg-critical/10 p-4 text-sm text-critical">No se pudieron cargar los ingresos: {err}</p>;
  if (!r) return <div className="grid h-64 place-items-center"><Spinner className="size-8" /></div>;
  const totalUsers = r.usersByPlan.reduce((a, b) => a + Number(b.c), 0);
  const arpu = r.payers ? r.revenueAllCents / r.payers : 0;

  const kpis = [
    { label: "MRR (ingreso mensual)", value: eur(r.mrrCents), icon: Repeat },
    { label: "Ingresos 30 días", value: eur(r.revenue30Cents), icon: TrendingUp, hint: `${fmtNumber(r.payments30)} pagos` },
    { label: "Suscripciones activas", value: fmtNumber(r.activeSubscriptions), icon: Crown },
    { label: "Clientes de pago", value: fmtNumber(r.payers), icon: Users, hint: totalUsers ? `${fmtNumber((r.payers / totalUsers) * 100)}% de conversión` : undefined },
    { label: "Ingresos totales", value: eur(r.revenueAllCents), icon: CreditCard },
    { label: "Ingreso medio por cliente", value: eur(arpu), icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-athletic text-4xl font-extrabold uppercase italic leading-none">Ingresos</h1>
        <p className="mt-1 text-sm text-muted">Suscripciones, pagos y planes. Todo listo para cuando actives los pagos.</p>
      </div>

      {!r.enabled && (
        <div className="flex gap-3 rounded-2xl border border-sky/30 bg-sky/10 p-4 text-sm text-ink-2">
          <Info className="size-5 shrink-0 text-sky" />
          <p>
            <strong className="text-ink">Los pagos aún no están activados:</strong> ahora mismo DNI GYM es 100 % gratis y estas cifras están a cero (no mostramos datos inventados).
            La base de datos ya tiene planes, suscripciones y pagos preparados: cuando decidas los precios se conecta la pasarela (Stripe) y esta pantalla se llenará sola.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted">
              <span>{k.label}</span>
              <span className="grid size-8 place-items-center rounded-lg bg-accent/10 text-accent"><k.icon className="size-4" /></span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold tabular-nums sm:text-3xl">{k.value}</p>
            {k.hint && <p className="mt-1 text-xs text-muted">{k.hint}</p>}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Planes" subtitle="Lo que ofrece cada plan" />
          <ul className="divide-y divide-line">
            {r.plans.map((p) => {
              let features: string[] = [];
              try {
                features = JSON.parse(p.features);
              } catch {}
              const users = Number(r.usersByPlan.find((u) => u.k === p.id)?.c ?? 0);
              return (
                <li key={p.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-lg font-semibold">{p.name}</p>
                    <Badge tone={p.price_cents ? "accent" : "good"}>{p.price_cents ? `${eur(p.price_cents, p.currency)}/${p.interval === "year" ? "año" : "mes"}` : "Gratis"}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">{fmtNumber(users)} usuarios</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {features.map((f) => (
                      <li key={f} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-ink-2">{f}</li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader title="Últimos pagos" subtitle="Quién ha pagado, cuánto y cuándo" />
          {r.recent.length === 0 ? (
            <div className="grid place-items-center gap-2 p-10 text-center">
              <Receipt className="size-10 text-muted" />
              <p className="text-sm text-muted">Todavía no hay pagos. Aparecerán aquí en tiempo real.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {r.recent.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name || p.email}</p>
                    <p className="truncate text-xs text-muted">{p.email} · {fmtDateTime(p.ts)}</p>
                  </div>
                  <Badge tone={p.status === "paid" ? "good" : p.status === "refunded" ? "warning" : "neutral"}>{p.status === "paid" ? "Pagado" : p.status}</Badge>
                  <span className="w-24 text-right font-semibold tabular-nums">{eur(p.amount_cents, p.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
