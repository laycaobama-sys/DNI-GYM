"use client";

import { useState } from "react";
import { BellRing, CalendarPlus, Check } from "lucide-react";
import { useAuth } from "./auth-provider";
import { Card, CardHeader, cn } from "./ui";

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const ICS_DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

function buildIcs(days: number[], time: string, url: string) {
  const [h, m] = time.split(":").map(Number);
  const now = new Date();
  // primer día de la semana que coincide a partir de hoy
  const start = new Date(now);
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (days.includes((d.getDay() + 6) % 7)) {
      start.setTime(d.getTime());
      break;
    }
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const dt = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T${pad(h)}${pad(m)}00`;
  const end = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T${pad(h + 1 > 23 ? 23 : h + 1)}${pad(m)}00`;
  const stamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DNI GYM//Recordatorios//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:dnigym-${stamp}@dnigym`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dt}`,
    `DTEND:${end}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${days.map((d) => ICS_DAYS[d]).join(",")}`,
    "SUMMARY:Entreno DNI GYM",
    `DESCRIPTION:Tu entreno de hoy te espera: ${url}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Hora de entrenar con DNI GYM",
    "TRIGGER:-PT15M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Recordatorios de entreno mediante el calendario del móvil (funciona en iPhone y Android). */
export function Reminders() {
  const { profile, updateProfile } = useAuth();
  const [days, setDays] = useState<number[]>(profile?.trainDays ?? [0, 2, 4]);
  const [time, setTime] = useState(profile?.trainTime ?? "19:00");
  const [done, setDone] = useState(false);

  const add = async () => {
    await updateProfile({ trainDays: days, trainTime: time }).catch(() => {});
    const blob = new Blob([buildIcs(days, time, `${window.location.origin}/panel/`)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "recordatorios-dni-gym.ics";
    a.click();
    URL.revokeObjectURL(a.href);
    setDone(true);
  };

  return (
    <Card>
      <CardHeader title="Recordatorios de entreno" subtitle="Elige tus días y tu hora: te avisaremos 15 minutos antes desde el calendario del móvil." />
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((d, i) => {
            const on = days.includes(i);
            return (
              <button
                key={d}
                onClick={() => setDays(on ? days.filter((x) => x !== i) : [...days, i].sort())}
                aria-pressed={on}
                className={cn("h-11 rounded-xl text-sm font-bold", on ? "bg-accent text-accent-ink" : "border border-line text-ink-2")}
              >
                {d}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-3">
            <BellRing className="size-5 text-accent" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input w-32" aria-label="Hora de entreno" />
          </label>
          <button onClick={add} disabled={!days.length} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-50">
            {done ? <Check className="size-4" /> : <CalendarPlus className="size-4" />} {done ? "Añadido · ábrelo para guardarlo" : "Añadir a mi calendario"}
          </button>
        </div>
      </div>
    </Card>
  );
}
