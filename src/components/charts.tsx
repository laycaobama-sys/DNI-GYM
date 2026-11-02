"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtNumber } from "@/lib/fitness";

const AXIS = { stroke: "#7d8590", fontSize: 11, tickLine: false, axisLine: false } as const;
const GRID = { stroke: "rgba(255,255,255,0.06)", vertical: false } as const;

export interface Point {
  label: string;
  value: number | null;
  sub?: string;
}

function TooltipBox({ active, payload, unit, digits }: { active?: boolean; payload?: { payload: Point }[]; unit?: string; digits: number }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  if (p.value == null) return null;
  return (
    <div className="rounded-xl border border-line-strong bg-surface-3/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="text-muted">{p.sub ?? p.label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
        {fmtNumber(p.value, digits)} {unit}
      </p>
    </div>
  );
}

export function TrendChart({
  data,
  unit,
  height = 220,
  digits = 1,
  target,
  color = "#c6ff3d",
  domainPad = 1,
}: {
  data: Point[];
  unit?: string;
  height?: number;
  digits?: number;
  target?: number;
  color?: string;
  domainPad?: number;
}) {
  const id = `g${color.replace("#", "")}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" {...AXIS} minTickGap={24} />
          <YAxis
            {...AXIS}
            width={44}
            domain={[(min: number) => (min >= 0 ? Math.max(0, Math.floor(min - domainPad)) : Math.floor(min - domainPad)), (max: number) => Math.ceil(max + domainPad)]}
            tickFormatter={(v) => fmtNumber(v)}
          />
          {target != null && <ReferenceLine y={target} stroke="#7d8590" strokeDasharray="4 4" label={{ value: `Objetivo ${fmtNumber(target, 1)}`, fill: "#7d8590", fontSize: 11, position: "insideTopRight" }} />}
          <Tooltip content={<TooltipBox unit={unit} digits={digits} />} cursor={{ stroke: "rgba(255,255,255,0.25)", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            connectNulls
            animationDuration={500}
            dot={false}
            activeDot={{ r: 5, stroke: "#0e1013", strokeWidth: 2, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({
  data,
  unit,
  height = 220,
  digits = 0,
  color = "#c6ff3d",
  target,
}: {
  data: Point[];
  unit?: string;
  height?: number;
  digits?: number;
  color?: string;
  target?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" {...AXIS} />
          <YAxis {...AXIS} width={44} tickFormatter={(v) => (v >= 1000 ? `${fmtNumber(v / 1000, 1)}k` : fmtNumber(v))} />
          {target != null && <ReferenceLine y={target} stroke="#7d8590" strokeDasharray="4 4" />}
          <Tooltip content={<TooltipBox unit={unit} digits={digits} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={36} animationDuration={500} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barras horizontales simples (HTML) para distribuciones por categoría */
export function HBarList({ items, unit }: { items: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label} className="group">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-ink-2">{i.label}</span>
            <span className="font-semibold tabular-nums">
              {fmtNumber(i.value)} {unit}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
