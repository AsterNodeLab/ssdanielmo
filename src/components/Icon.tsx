import {
  Activity,
  Apple,
  BedDouble,
  BookOpen,
  Brain,
  Briefcase,
  Check,
  Coffee,
  Dumbbell,
  Droplets,
  Focus,
  GraduationCap,
  Laptop,
  Lightbulb,
  Moon,
  PenLine,
  RefreshCw,
  Rocket,
  Settings,
  Sparkles,
  Sun,
  Timer,
  Utensils,
  Users,
  Zap,
  type LucideProps,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "../types";

const iconMap: Record<IconName, LucideIcon> = {
  activity: Activity,
  apple: Apple,
  bed: BedDouble,
  book: BookOpen,
  brain: Brain,
  briefcase: Briefcase,
  check: Check,
  coffee: Coffee,
  dumbbell: Dumbbell,
  droplets: Droplets,
  focus: Focus,
  graduation: GraduationCap,
  laptop: Laptop,
  lightbulb: Lightbulb,
  moon: Moon,
  pen: PenLine,
  refresh: RefreshCw,
  rocket: Rocket,
  settings: Settings,
  sparkles: Sparkles,
  sun: Sun,
  timer: Timer,
  utensils: Utensils,
  users: Users,
  zap: Zap,
};

export function RoutineIcon({ name, ...props }: { name: IconName } & LucideProps) {
  const IconComponent = iconMap[name];
  return <IconComponent aria-hidden="true" {...props} />;
}

