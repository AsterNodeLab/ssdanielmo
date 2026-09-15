export type Weekday = 1 | 2 | 3 | 4 | 5;

export type ViewName = "today" | "week" | "routine" | "settings";

export type Theme = "light" | "dark";

export type IconName =
  | "activity"
  | "apple"
  | "bed"
  | "book"
  | "brain"
  | "briefcase"
  | "check"
  | "coffee"
  | "dumbbell"
  | "droplets"
  | "focus"
  | "graduation"
  | "laptop"
  | "lightbulb"
  | "moon"
  | "pen"
  | "refresh"
  | "rocket"
  | "settings"
  | "sparkles"
  | "sun"
  | "timer"
  | "utensils"
  | "users"
  | "zap";

export type BlockKind =
  | "sleep"
  | "health"
  | "meal"
  | "unam"
  | "eduvo"
  | "uvm"
  | "classes"
  | "gym"
  | "break"
  | "transition"
  | "class"
  | "flex";

export type MetricKey =
  | "sleep"
  | "breakfast"
  | "light"
  | "familyMeal"
  | "gym"
  | "postGym"
  | "shutdown"
  | "unamDeep"
  | "unamRecall"
  | "eduvoPrimary"
  | "eduvoOutput"
  | "uvm"
  | "classSession";

export type Stage = "learn" | "execute" | "review";

export interface RoutineBlock {
  id: string;
  start: string;
  end: string;
  title: string;
  description: string;
  icon: IconName;
  kind: BlockKind;
  metric?: MetricKey;
  stage?: Stage;
  code?: "E1577" | "E1598";
  tags?: string[];
}

export interface RoutineDay {
  weekday: Weekday;
  label: string;
  shortLabel: string;
  subtitle: string;
  blocks: RoutineBlock[];
  accent: "blue" | "green" | "amber" | "violet" | "slate" | "red";
}

export interface BlockOverride {
  title?: string;
  description?: string;
  start?: string;
  end?: string;
}

export interface CompletionRecord {
  completedAt?: string;
  skippedAt?: string;
  unamSubject?: string;
  activeRecall?: boolean;
  eduvoOutput?: string;
}

export interface DailyRecord {
  dateKey: string;
  blocks: Record<string, CompletionRecord>;
  overrides: Record<string, BlockOverride>;
  updatedAt?: string;
}

export interface AppSettings {
  theme: Theme;
  vibration: boolean;
  focusMode: boolean;
  updatedAt?: string;
}

export interface AppData {
  version: 1;
  dailyRecords: Record<string, DailyRecord>;
  settings: AppSettings;
}

export interface DailyProgress {
  completed: number;
  total: number;
  skipped: number;
  percentage: number;
}

export interface WeekMetrics {
  daily: Array<{ dateKey: string; weekday: Weekday; percentage: number; completed: number; total: number }>;
  compliance: number;
  sleep: number;
  unamDeep: number;
  unamRecall: number;
  eduvoSessions: number;
  eduvoOutputs: Array<{ dateKey: string; title: string; output: string }>;
  gym: number;
  classSessions: number;
  uvm: number;
}

