import Link from "next/link";

const D_PATH =
  "M20 13h15.5C47 13 54 21 51.6 32.4 49.3 43.6 40.6 51 28.6 51H10.4L20 13Zm8.3 9.2-5.3 20.6h5.6c7 0 12-4.4 13.4-11 1.3-6-2.2-9.6-8.2-9.6h-5.5Z";

/** Monograma de DNI GYM: «D» itálica atravesada por una barra olímpica. */
export function LogoMark({ className = "size-9", inverted }: { className?: string; inverted?: boolean }) {
  const tile = inverted ? "#ff6b1a" : "#0d0e10";
  const d = inverted ? "#160700" : "#ff6b1a";
  const bar = inverted ? "#160700" : "#f4f4f5";
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="15" fill={tile} />
      {!inverted && <rect x="0.5" y="0.5" width="63" height="63" rx="14.5" fill="none" stroke="rgb(255 255 255 / 0.12)" />}
      <path fill={d} fillRule="evenodd" d={D_PATH} />
      <rect x="3" y="28.6" width="58" height="5.8" rx="2.9" fill={tile} />
      <rect x="9" y="30.2" width="46" height="2.6" rx="1.3" fill={bar} />
      <rect x="4.2" y="24.5" width="3.6" height="14" rx="1.4" fill={bar} />
      <rect x="8.6" y="26.5" width="2.8" height="10" rx="1.2" fill={bar} />
      <rect x="56.2" y="24.5" width="3.6" height="14" rx="1.4" fill={bar} />
      <rect x="52.6" y="26.5" width="2.8" height="10" rx="1.2" fill={bar} />
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
