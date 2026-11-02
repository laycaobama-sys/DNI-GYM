import { BicepsFlexed, CalendarCheck, Dumbbell, Flag, Flame, Scale, Target, Timer, Trophy, Zap, type LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = { BicepsFlexed, CalendarCheck, Dumbbell, Flag, Flame, Scale, Target, Timer, Trophy, Zap };

export function AchievementIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Trophy;
  return <Icon className={className} />;
}
