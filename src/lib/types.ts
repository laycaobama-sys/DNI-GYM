export type Sex = "hombre" | "mujer";
export type Activity = "sedentario" | "ligero" | "moderado" | "alto" | "muy_alto";
export type Goal = "perder" | "mantener" | "ganar";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string | null;
  provider?: string;
  createdAt: number;
  lastLoginAt: number;
  lastActiveAt?: number;
  loginCount: number;
  workoutsCount?: number;
  blocked?: boolean;
  onboarded?: boolean;
  sex?: Sex;
  birthYear?: number;
  heightCm?: number;
  activity?: Activity;
  goal?: Goal;
  targetWeight?: number;
  weeklyWorkoutsGoal?: number;
  calorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  waterGoal?: number;
  demo?: boolean;
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  done: boolean;
}

export interface WorkoutExercise {
  slug: string;
  name: string;
  timed?: boolean;
  rest?: number;
  target?: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  date: number;
  durationSec: number;
  exercises: WorkoutExercise[];
  volume: number;
  totalSets: number;
  routineSlug?: string;
  notes?: string;
}

export interface BodyLog {
  id: string; // YYYY-MM-DD
  date: string;
  weight?: number;
  bodyFat?: number;
  waist?: number;
  chest?: number;
  arm?: number;
  hip?: number;
  thigh?: number;
}

export type Meal = "desayuno" | "comida" | "merienda" | "cena" | "snack";

export interface FoodEntry {
  id: string;
  foodId?: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  meal: Meal;
}

export interface NutritionDay {
  id: string; // YYYY-MM-DD
  date: string;
  entries: FoodEntry[];
  waterMl: number;
}

export type EventType =
  | "signup"
  | "login"
  | "logout"
  | "auth_error"
  | "client_error"
  | "visit"
  | "workout_completed"
  | "account_deleted";

export interface AppEvent {
  id?: string;
  type: EventType;
  ts: number;
  uid?: string;
  email?: string;
  name?: string;
  code?: string;
  message?: string;
  path?: string;
  ua?: string;
  ref?: string;
}
