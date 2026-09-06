import { ChevronRight } from "lucide-react";
import { ROUTINE } from "../lib/routine";
import type { RoutineBlock, Weekday } from "../types";
import { RoutineIcon } from "./Icon";

interface RoutineViewProps {
  selectedWeekday: Weekday;
  onSelectWeekday: (weekday: Weekday) => void;
  onDetails: (block: RoutineBlock) => void;
}

const weekdays: Weekday[] = [1, 2, 3, 4, 5];

export function RoutineView({ selectedWeekday, onSelectWeekday, onDetails }: RoutineViewProps) {
  const day = ROUTINE[selectedWeekday];
  return (
    <div className="view-stack">
      <header className="page-heading"><div><span className="eyebrow">La base del sistema</span><h1>Rutina</h1><p>Una estructura estable para reducir decisiones.</p></div></header>
      <div className="weekday-tabs" role="tablist" aria-label="Seleccionar día de rutina">
        {weekdays.map((weekday) => {
          const item = ROUTINE[weekday];
          return <button className={`weekday-tab weekday-tab--${item.accent}${selectedWeekday === weekday ? " weekday-tab--active" : ""}`} type="button" role="tab" aria-selected={selectedWeekday === weekday} key={weekday} onClick={() => onSelectWeekday(weekday)}><strong>{item.shortLabel}</strong><span>{item.subtitle.split(" · ")[0]}</span></button>;
        })}
      </div>
      <section className={`routine-day-card routine-day-card--${day.accent}`} aria-labelledby="routine-day-heading">
        <div className="routine-day-card__head"><div><span className="eyebrow">{day.label}</span><h2 id="routine-day-heading">{day.subtitle}</h2></div><span className="routine-block-count">{day.blocks.length} bloques</span></div>
        <div className="routine-list">
          {day.blocks.map((block) => (
            <button className="routine-row" type="button" key={block.id} onClick={() => onDetails(block)}>
              <span className="routine-row__time"><strong>{block.start === "24:00" ? "00:00" : block.start}</strong><span>{block.end === "24:00" ? "00:00" : block.end}</span></span>
              <span className="routine-row__icon"><RoutineIcon name={block.icon} size={18} /></span>
              <span className="routine-row__copy"><strong>{block.title}</strong><span>{block.description}</span></span>
              <ChevronRight className="routine-row__arrow" size={17} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
      <div className="anchor-card"><span className="anchor-card__icon"><RoutineIcon name="zap" size={20} /></span><div><span className="eyebrow">Regla central</span><p><strong>No improvisar el día.</strong> Las anclas permanecen aunque un bloque se mueva o falle.</p></div></div>
    </div>
  );
}

