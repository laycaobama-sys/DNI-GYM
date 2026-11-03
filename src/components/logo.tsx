import Link from "next/link";

const D_PATH =
  "M20 13h15.5C47 13 54 21 51.6 32.4 49.3 43.6 40.6 51 28.6 51H10.4L20 13Zm8.3 9.2-5.3 20.6h5.6c7 0 12-4.4 13.4-11 1.3-6-2.2-9.6-8.2-9.6h-5.5Z";

/** Monograma de DNI GYM: «D» itálica con corte de velocidad. */
export function LogoMark({ className = "size-9", inverted }: { className?: string; inverted?: boolean }) {
  const bg = inverted ? "#0b0d0f" : "#ff6b1a";
  const fg = inverted ? "#ff6b1a" : "#160700";
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="15" fill={bg} />
      <path fill={fg} fillRule="evenodd" d={D_PATH} />
      <path fill={bg} d="M4 40.5 60 26v5.2L4 45.7z" />
    </svg>
  );
}

export function Logo({ href = "/", compact }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2.5" aria-label="DNI GYM — inicio">
      <LogoMark />
      {!compact && (
        <span className="whitespace-nowrap font-athletic text-[1.6rem] font-extrabold uppercase italic leading-none tracking-tight">
          DNI <span className="text-accent">Gym</span>
        </span>
      )}
    </Link>
  );
}
