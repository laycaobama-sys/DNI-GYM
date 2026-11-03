import { cn } from "@/lib/cn";

type Region =
  | "chest" | "shoulders" | "biceps" | "forearms" | "abs" | "obliques" | "quads" | "adductors"
  | "traps" | "reardelts" | "lats" | "midback" | "triceps" | "lowerback" | "glutes" | "hamstrings" | "calves";

const RULES: [RegExp, Region[]][] = [
  [/pectoral|pecho/, ["chest"]],
  [/deltoides posterior|manguito/, ["reardelts"]],
  [/deltoides|hombro/, ["shoulders"]],
  [/b[ií]ceps|braquial(?!i)/, ["biceps"]],
  [/braquiorradial|antebrazo/, ["forearms"]],
  [/recto abdominal|transverso|core|abdomen|flexores de cadera/, ["abs"]],
  [/oblicuo/, ["obliques"]],
  [/cu[aá]driceps|piernas/, ["quads"]],
  [/aductor/, ["adductors"]],
  [/trapecio superior/, ["traps"]],
  [/trapecio medio|romboides|espalda/, ["midback"]],
  [/trapecio/, ["traps"]],
  [/dorsal|redondo/, ["lats"]],
  [/tr[ií]ceps/, ["triceps"]],
  [/erectores|lumbar/, ["lowerback"]],
  [/gl[uú]te/, ["glutes"]],
  [/isquio/, ["hamstrings"]],
  [/gemelo|s[oó]leo|gastrocnemio/, ["calves"]],
];

function regionsOf(muscles: string[]) {
  const out = new Set<Region>();
  for (const m of muscles) {
    const s = m.toLowerCase();
    for (const [re, regs] of RULES) if (re.test(s)) regs.forEach((r) => out.add(r));
  }
  return out;
}

const BASE = "#20252b";
const IDLE = "#2c333b";

/** Silueta base: cabeza, tronco, brazos y piernas. */
function Silhouette() {
  return (
    <g fill={BASE}>
      <circle cx="50" cy="15" r="10" />
      <rect x="45" y="23" width="10" height="9" rx="3" />
      <path d="M30 34 Q50 28 70 34 L72 60 Q68 90 64 96 L36 96 Q32 90 28 60 Z" />
      <rect x="19" y="34" width="12" height="58" rx="6" />
      <rect x="69" y="34" width="12" height="58" rx="6" />
      <path d="M35 92 L65 92 L66 104 L52 108 L48 108 L34 104 Z" />
      <rect x="34" y="98" width="15" height="88" rx="7" />
      <rect x="51" y="98" width="15" height="88" rx="7" />
    </g>
  );
}

function Shape({ k, children }: { k: Region; children: React.ReactNode }) {
  return <g data-region={k}>{children}</g>;
}

export function MuscleMap({ primary, secondary, className }: { primary: string[]; secondary: string[]; className?: string }) {
  const p = regionsOf(primary);
  const s = regionsOf(secondary);
  const fill = (r: Region) => (p.has(r) ? "var(--color-accent)" : s.has(r) ? "rgb(255 107 26 / 0.38)" : IDLE);
  return (
    <figure className={cn("rounded-3xl border border-line bg-surface p-4", className)}>
      <div className="grid grid-cols-2 gap-2">
        {/* Frente */}
        <svg viewBox="0 0 100 192" className="h-auto w-full" role="img" aria-label="Músculos trabajados, vista frontal">
          <Silhouette />
          <Shape k="shoulders">
            <ellipse cx="29" cy="40" rx="8" ry="7" fill={fill("shoulders")} />
            <ellipse cx="71" cy="40" rx="8" ry="7" fill={fill("shoulders")} />
          </Shape>
          <Shape k="chest">
            <path d="M37 40 Q49 38 49 44 L49 54 Q42 58 36 53 Q33 46 37 40Z" fill={fill("chest")} />
            <path d="M63 40 Q51 38 51 44 L51 54 Q58 58 64 53 Q67 46 63 40Z" fill={fill("chest")} />
          </Shape>
          <Shape k="biceps">
            <ellipse cx="25" cy="56" rx="4.6" ry="9" fill={fill("biceps")} />
            <ellipse cx="75" cy="56" rx="4.6" ry="9" fill={fill("biceps")} />
          </Shape>
          <Shape k="forearms">
            <ellipse cx="25" cy="78" rx="4.2" ry="10" fill={fill("forearms")} />
            <ellipse cx="75" cy="78" rx="4.2" ry="10" fill={fill("forearms")} />
          </Shape>
          <Shape k="abs">
            <rect x="43.5" y="58" width="13" height="32" rx="4" fill={fill("abs")} />
            <path d="M43.5 68 H56.5 M43.5 78 H56.5 M50 58 V90" stroke={BASE} strokeWidth="1.2" />
          </Shape>
          <Shape k="obliques">
            <path d="M36 60 Q41 62 42 72 L41 88 Q36 84 34 74 Z" fill={fill("obliques")} />
            <path d="M64 60 Q59 62 58 72 L59 88 Q64 84 66 74 Z" fill={fill("obliques")} />
          </Shape>
          <Shape k="quads">
            <path d="M35 104 Q41 100 48 106 L47 140 Q42 146 37 140 Q33 122 35 104Z" fill={fill("quads")} />
            <path d="M65 104 Q59 100 52 106 L53 140 Q58 146 63 140 Q67 122 65 104Z" fill={fill("quads")} />
          </Shape>
          <Shape k="adductors">
            <path d="M48 106 L49.5 108 L49 128 L46.5 124 Z" fill={fill("adductors")} />
            <path d="M52 106 L50.5 108 L51 128 L53.5 124 Z" fill={fill("adductors")} />
          </Shape>
          <ellipse cx="41.5" cy="163" rx="5" ry="15" fill={IDLE} />
          <ellipse cx="58.5" cy="163" rx="5" ry="15" fill={IDLE} />
        </svg>
        {/* Espalda */}
        <svg viewBox="0 0 100 192" className="h-auto w-full" role="img" aria-label="Músculos trabajados, vista posterior">
          <Silhouette />
          <Shape k="traps">
            <path d="M40 31 L50 28 L60 31 L56 44 L50 48 L44 44Z" fill={fill("traps")} />
          </Shape>
          <Shape k="reardelts">
            <ellipse cx="29" cy="40" rx="8" ry="7" fill={fill("reardelts")} />
            <ellipse cx="71" cy="40" rx="8" ry="7" fill={fill("reardelts")} />
          </Shape>
          <Shape k="midback">
            <path d="M44 45 L50 49 L56 45 L57 60 L50 64 L43 60Z" fill={fill("midback")} />
          </Shape>
          <Shape k="lats">
            <path d="M36 44 Q42 46 43 58 L44 74 Q38 72 34 62 Q33 50 36 44Z" fill={fill("lats")} />
            <path d="M64 44 Q58 46 57 58 L56 74 Q62 72 66 62 Q67 50 64 44Z" fill={fill("lats")} />
          </Shape>
          <Shape k="triceps">
            <ellipse cx="25" cy="56" rx="4.6" ry="9.5" fill={fill("triceps")} />
            <ellipse cx="75" cy="56" rx="4.6" ry="9.5" fill={fill("triceps")} />
          </Shape>
          <Shape k="forearms">
            <ellipse cx="25" cy="78" rx="4.2" ry="10" fill={fill("forearms")} />
            <ellipse cx="75" cy="78" rx="4.2" ry="10" fill={fill("forearms")} />
          </Shape>
          <Shape k="lowerback">
            <rect x="44" y="66" width="12" height="22" rx="4" fill={fill("lowerback")} />
          </Shape>
          <Shape k="glutes">
            <ellipse cx="42.5" cy="100" rx="8" ry="8.5" fill={fill("glutes")} />
            <ellipse cx="57.5" cy="100" rx="8" ry="8.5" fill={fill("glutes")} />
          </Shape>
          <Shape k="hamstrings">
            <path d="M35 112 Q41 108 48 112 L47 142 Q42 147 37 142 Q34 126 35 112Z" fill={fill("hamstrings")} />
            <path d="M65 112 Q59 108 52 112 L53 142 Q58 147 63 142 Q66 126 65 112Z" fill={fill("hamstrings")} />
          </Shape>
          <Shape k="calves">
            <ellipse cx="41.5" cy="160" rx="5.5" ry="13" fill={fill("calves")} />
            <ellipse cx="58.5" cy="160" rx="5.5" ry="13" fill={fill("calves")} />
          </Shape>
        </svg>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-accent" /> Principal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-accent/40" /> Secundario
        </span>
        <span>Frente · Espalda</span>
      </figcaption>
    </figure>
  );
}
