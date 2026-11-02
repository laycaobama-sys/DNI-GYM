"use client";

import { useState } from "react";
import { ExerciseBrowser } from "@/components/exercise-browser";
import { ExerciseQuickView } from "@/components/exercise-detail";
import { Modal, PageHeader } from "@/components/ui";
import type { Exercise } from "@/data/exercises";

export default function AppExercisesPage() {
  const [sel, setSel] = useState<Exercise | null>(null);
  return (
    <div>
      <PageHeader title="Ejercicios" subtitle="Técnica, músculos y consejos de cada ejercicio" />
      <ExerciseBrowser syncUrl={false} onSelect={setSel} />
      <Modal open={Boolean(sel)} onClose={() => setSel(null)} title={sel?.name ?? ""} wide>
        {sel && <ExerciseQuickView e={sel} />}
      </Modal>
    </div>
  );
}
