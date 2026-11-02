export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-[#d4ff63] shadow-[0_0_0_1px_rgb(198_255_61/0.4),0_8px_30px_-8px_rgb(198_255_61/0.55)]",
  secondary: "bg-surface-3 text-ink hover:bg-line border border-line",
  outline: "border border-line-strong text-ink hover:border-ink-2 hover:bg-white/[0.03]",
  ghost: "text-ink-2 hover:text-ink hover:bg-white/5",
  danger: "bg-critical/10 text-critical border border-critical/30 hover:bg-critical/20",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    variants[variant],
    sizes[size],
    extra,
  );
}

