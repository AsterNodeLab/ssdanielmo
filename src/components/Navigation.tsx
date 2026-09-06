import { CalendarDays, Focus, Settings, Sun } from "lucide-react";
import type { ViewName } from "../types";

const navItems: Array<{ id: ViewName; label: string }> = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Semana" },
  { id: "routine", label: "Rutina" },
  { id: "settings", label: "Ajustes" },
];

const icons = {
  today: Sun,
  week: CalendarDays,
  routine: Focus,
  settings: Settings,
};

interface NavigationProps {
  activeView: ViewName;
  onChange: (view: ViewName) => void;
}

export function Navigation({ activeView, onChange }: NavigationProps) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      <div className="bottom-nav__inner">
        {navItems.map((item) => {
          const Icon = icons[item.id];
          const active = item.id === activeView;
          return (
            <button
              className={`nav-button${active ? " nav-button--active" : ""}`}
              type="button"
              key={item.id}
              aria-current={active ? "page" : undefined}
              onClick={() => onChange(item.id)}
            >
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

