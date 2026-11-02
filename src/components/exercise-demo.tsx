import Image from "next/image";
import { exerciseImages, type Exercise } from "@/data/exercises";
import { cn } from "@/lib/cn";

/** Demostración animada: alterna la posición inicial y final del ejercicio. */
export function ExerciseDemo({
  exercise,
  className,
  priority,
  sizes = "(max-width: 768px) 100vw, 33vw",
  showLabels,
}: {
  exercise: Pick<Exercise, "src" | "name">;
  className?: string;
  priority?: boolean;
  sizes?: string;
  showLabels?: boolean;
}) {
  const [a, b] = exerciseImages(exercise);
  return (
    <div className={cn("relative aspect-[3/2] overflow-hidden bg-white", className)}>
      <Image src={a} alt={`${exercise.name}: posición inicial`} fill sizes={sizes} priority={priority} className="object-cover" />
      <Image
        src={b}
        alt={`${exercise.name}: posición final`}
        fill
        sizes={sizes}
        priority={priority}
        className="animate-frame object-cover"
      />
      {showLabels && (
        <div className="pointer-events-none absolute bottom-2 left-2 flex gap-1.5 text-[11px] font-semibold">
          <span className="rounded-md bg-black/70 px-2 py-1 text-white backdrop-blur">▶ Demostración</span>
        </div>
      )}
    </div>
  );
}
