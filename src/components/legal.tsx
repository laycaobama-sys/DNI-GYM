export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">Última actualización: {updated}</p>
      <div className="mt-10 space-y-6 leading-relaxed text-ink-2 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2 [&_a]:text-accent [&_a]:underline [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:text-sm [&_th]:border-b [&_th]:border-line [&_th]:p-2 [&_th]:text-left [&_th]:text-ink [&_td]:border-b [&_td]:border-line [&_td]:p-2 [&_td]:align-top">
        {children}
      </div>
    </article>
  );
}
