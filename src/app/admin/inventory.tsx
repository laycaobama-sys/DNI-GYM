"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Minus, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Badge, Button, Card, CardHeader, Field, Modal, Spinner, cn } from "@/components/ui";
import { createItem, deleteItem, getInventory, moveItem, updateItem, type Inventory as Inv, type InventoryItem } from "@/lib/admin-api";
import { fmtDateTime, fmtNumber } from "@/lib/fitness";

const CATEGORIES = ["Suplementos", "Bebidas", "Ropa y merchandising", "Material de gimnasio", "Limpieza", "General"];
const eur = (v: number | null) => (v == null ? "—" : v.toLocaleString("es-ES", { style: "currency", currency: "EUR" }));

type Draft = Partial<Pick<InventoryItem, "name" | "category" | "sku" | "unit" | "stock" | "min_stock" | "cost" | "price" | "location" | "notes">>;

export function Inventory() {
  const [inv, setInv] = useState<Inv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [edit, setEdit] = useState<{ id: string | null; d: Draft } | null>(null);
  const [move, setMove] = useState<{ item: InventoryItem; sign: 1 | -1 } | null>(null);
  const [confirmDel, setConfirmDel] = useState<InventoryItem | null>(null);

  const load = useCallback(async () => {
    try {
      setInv(await getInventory());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const items = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return (inv?.items ?? []).filter((i) => (!onlyLow || i.stock <= i.min_stock) && (!nq || `${i.name} ${i.sku ?? ""} ${i.category}`.toLowerCase().includes(nq)));
  }, [inv, q, onlyLow]);
  const low = (inv?.items ?? []).filter((i) => i.stock <= i.min_stock);
  const value = (inv?.items ?? []).reduce((a, i) => a + i.stock * (i.cost ?? 0), 0);
  const retail = (inv?.items ?? []).reduce((a, i) => a + i.stock * (i.price ?? 0), 0);

  if (error) return <p className="rounded-xl border border-critical/30 bg-critical/10 p-4 text-sm text-critical">No se pudo cargar el inventario: {error}</p>;
  if (!inv) return <div className="grid h-64 place-items-center"><Spinner className="size-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-athletic text-4xl font-extrabold uppercase italic leading-none">Control de stock</h1>
          <p className="mt-1 text-sm text-muted">Suplementos, bebidas, ropa, material… Entradas y salidas con historial y avisos de stock mínimo.</p>
        </div>
        <Button onClick={() => setEdit({ id: null, d: { category: "Suplementos", unit: "uds", stock: 0, min_stock: 5 } })}>
          <Plus className="size-4" /> Nuevo producto
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          ["Productos", fmtNumber(inv.items.length)],
          ["Bajo mínimo", fmtNumber(low.length)],
          ["Valor de coste", eur(value)],
          ["Valor de venta", eur(retail)],
        ].map(([k, v], i) => (
          <Card key={k} className={cn("p-4 sm:p-5", i === 1 && low.length > 0 && "border-warning/40")}>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">{k}</p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums sm:text-3xl">{v}</p>
          </Card>
        ))}
      </div>

      {low.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <AlertTriangle className="size-5 shrink-0" />
          <span>
            <strong>Reponer:</strong> {low.map((i) => `${i.name} (${fmtNumber(i.stock)} ${i.unit})`).join(", ")}. Pide al agente de inventario una propuesta de pedido.
          </span>
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Buscar producto, SKU o categoría" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="size-4 accent-[#ff6b1a]" /> Solo bajo mínimo
          </label>
        </div>
        {items.length === 0 ? (
          <div className="grid place-items-center gap-3 p-10 text-center">
            <Package className="size-10 text-muted" />
            <p className="text-sm text-muted">{inv.items.length ? "Ningún producto coincide con la búsqueda." : "Aún no tienes productos. Crea el primero con «Nuevo producto»."}</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((i) => {
              const isLow = i.stock <= i.min_stock;
              return (
                <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="w-full min-w-0 sm:w-auto sm:flex-1">
                    <p className="text-sm font-medium sm:truncate">{i.name}</p>
                    <p className="truncate text-xs text-muted">
                      {i.category}
                      {i.sku && ` · ${i.sku}`}
                      {i.location && ` · ${i.location}`} · venta {eur(i.price)}
                    </p>
                  </div>
                  <div className="flex flex-1 items-center gap-2 sm:flex-none">
                    <Badge tone={isLow ? "warning" : "good"}>
                      {fmtNumber(i.stock)} {i.unit}
                    </Badge>
                    <span className="hidden text-xs text-muted sm:inline">mín. {fmtNumber(i.min_stock)}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setMove({ item: i, sign: -1 })} className="grid size-9 place-items-center rounded-lg bg-white/5 hover:bg-white/10" aria-label={`Salida de ${i.name}`}><Minus className="size-4" /></button>
                    <button onClick={() => setMove({ item: i, sign: 1 })} className="grid size-9 place-items-center rounded-lg bg-accent/15 text-accent hover:bg-accent/25" aria-label={`Entrada de ${i.name}`}><Plus className="size-4" /></button>
                    <button onClick={() => setEdit({ id: i.id, d: { ...i } })} className="grid size-9 place-items-center rounded-lg bg-white/5 hover:bg-white/10" aria-label={`Editar ${i.name}`}><Pencil className="size-4" /></button>
                    <button onClick={() => setConfirmDel(i)} className="grid size-9 place-items-center rounded-lg bg-white/5 text-critical hover:bg-critical/15" aria-label={`Eliminar ${i.name}`}><Trash2 className="size-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Últimos movimientos" subtitle="Entradas y salidas de stock" />
        <ul className="divide-y divide-line">
          {inv.moves.length === 0 && <li className="p-5 text-sm text-muted">Sin movimientos todavía.</li>}
          {inv.moves.slice(0, 25).map((mv) => (
            <li key={mv.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
              <span className={cn("w-16 shrink-0 font-semibold tabular-nums", mv.delta > 0 ? "text-good" : "text-critical")}>
                {mv.delta > 0 ? "+" : ""}
                {fmtNumber(mv.delta)}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {mv.item_name ?? "Producto eliminado"} <span className="text-muted">· {mv.reason}</span>
              </span>
              <span className="hidden shrink-0 text-xs text-muted sm:inline">{fmtDateTime(mv.ts)}</span>
            </li>
          ))}
        </ul>
      </Card>

      {edit && <ItemModal edit={edit} onClose={() => setEdit(null)} onSaved={(r) => { setInv(r); setEdit(null); }} />}
      {move && <MoveModal move={move} onClose={() => setMove(null)} onSaved={(r) => { setInv(r); setMove(null); }} />}
      <Modal open={Boolean(confirmDel)} onClose={() => setConfirmDel(null)} title="Eliminar producto">
        <p className="text-sm text-ink-2">¿Seguro que quieres eliminar «{confirmDel?.name}» y su historial de movimientos? Esta acción no se puede deshacer.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>Cancelar</Button>
          <Button variant="danger" onClick={async () => { if (confirmDel) setInv(await deleteItem(confirmDel.id)); setConfirmDel(null); }}>
            <Trash2 className="size-4" /> Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ItemModal({ edit, onClose, onSaved }: { edit: { id: string | null; d: Draft }; onClose: () => void; onSaved: (r: Inv) => void }) {
  const [d, setD] = useState<Draft>(edit.d);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setD((x) => ({ ...x, [k]: e.target.value }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const body = { ...d };
      if (edit.id) delete body.stock; // el stock solo cambia con movimientos (queda en el historial)
      onSaved(edit.id ? await updateItem(edit.id, body) : await createItem(body));
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={edit.id ? "Editar producto" : "Nuevo producto"}>
      <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nombre" className="sm:col-span-2"><input className="input" value={d.name ?? ""} onChange={set("name")} required maxLength={80} placeholder="Ej.: Proteína whey 1 kg chocolate" /></Field>
        <Field label="Categoría">
          <select className="input" value={d.category ?? "General"} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="SKU / código"><input className="input" value={d.sku ?? ""} onChange={set("sku")} maxLength={40} /></Field>
        {!edit.id && <Field label="Stock inicial"><input className="input" type="number" min={0} step="any" value={d.stock ?? 0} onChange={set("stock")} /></Field>}
        <Field label="Stock mínimo (aviso)"><input className="input" type="number" min={0} step="any" value={d.min_stock ?? 0} onChange={set("min_stock")} /></Field>
        <Field label="Unidad"><input className="input" value={d.unit ?? "uds"} onChange={set("unit")} maxLength={12} /></Field>
        <Field label="Ubicación"><input className="input" value={d.location ?? ""} onChange={set("location")} maxLength={60} placeholder="Ej.: Almacén, recepción" /></Field>
        <Field label="Coste (€)"><input className="input" type="number" min={0} step="0.01" value={d.cost ?? ""} onChange={set("cost")} /></Field>
        <Field label="Precio de venta (€)"><input className="input" type="number" min={0} step="0.01" value={d.price ?? ""} onChange={set("price")} /></Field>
        <Field label="Notas" className="sm:col-span-2"><textarea className="input min-h-20" value={d.notes ?? ""} onChange={set("notes")} maxLength={500} /></Field>
        {err && <p className="text-sm text-critical sm:col-span-2">{err}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function MoveModal({ move, onClose, onSaved }: { move: { item: InventoryItem; sign: 1 | -1 }; onClose: () => void; onSaved: (r: Inv) => void }) {
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState(move.sign > 0 ? "Compra a proveedor" : "Venta");
  const [err, setErr] = useState<string | null>(null);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      onSaved(await moveItem(move.item.id, move.sign * Number(qty), reason));
    } catch (e2) {
      setErr((e2 as Error).message);
    }
  };
  return (
    <Modal open onClose={onClose} title={`${move.sign > 0 ? "Entrada" : "Salida"} · ${move.item.name}`}>
      <form onSubmit={save} className="space-y-3">
        <p className="text-sm text-muted">Stock actual: {fmtNumber(move.item.stock)} {move.item.unit}</p>
        <Field label="Cantidad"><input className="input" type="number" min={0.01} step="any" value={qty} onChange={(e) => setQty(e.target.value)} required /></Field>
        <Field label="Motivo">
          <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
            {(move.sign > 0 ? ["Compra a proveedor", "Devolución", "Ajuste de inventario"] : ["Venta", "Consumo interno", "Merma / caducado", "Ajuste de inventario"]).map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        {err && <p className="text-sm text-critical">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{move.sign > 0 ? "Registrar entrada" : "Registrar salida"}</Button>
        </div>
      </form>
    </Modal>
  );
}
