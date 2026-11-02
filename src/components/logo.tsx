import Link from "next/link";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#c6ff3d" />
      <path
        d="M9 16.5h3v7H9zM28 16.5h3v7h-3zM12.5 14h3v12h-3zM24.5 14h3v12h-3zM15.5 18.5h9v3h-9z"
        fill="#0b1000"
      />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2.5" aria-label="DNI GYM — inicio">
      <LogoMark />
      <span className="whitespace-nowrap font-display text-lg font-bold tracking-tight">
        DNI<span className="text-accent"> GYM</span>
      </span>
    </Link>
  );
}
