"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/ui";
import { CHALLENGES, CHALLENGE_DAYS } from "@/data/challenges";

export default function PanelChallengesPage() {
  const { profile } = useAuth();
  return (
    <div>
      <PageHeader title="Retos de 30 días" subtitle="Un entreno corto al día, sin material, que sube de nivel contigo" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CHALLENGES.map((c) => {
          const done = profile?.challenges?.[c.slug]?.length ?? 0;
          return (
            <Link key={c.slug} href={`/panel/retos/${c.slug}`} className="group relative aspect-[16/10] overflow-hidden rounded-3xl border border-white/10">
              <Image src={c.cover} alt="" fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-athletic text-4xl font-extrabold uppercase italic leading-none">{c.name}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(done / CHALLENGE_DAYS) * 100}%` }} />
                </div>
                <p className="mt-1.5 text-sm text-white/70">{done ? `${done} de ${CHALLENGE_DAYS} días completados` : c.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
