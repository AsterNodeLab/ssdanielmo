import type { DailyProgress, DailyRecord, RoutineBlock, RoutineDay } from "../types";
import { ANCHORS, displayDate } from "../lib/routine";
import { RoutineIcon } from "./Icon";
import { CurrentBlockCard } from "./CurrentBlockCard";
import { Timeline } from "./Timeline";
import { ProgressBar } from "./ProgressBar";

interface TodayViewProps {
  now: Date;
  day: RoutineDay | null;
  record: DailyRecord;
  blocks: RoutineBlock[];
  progress: DailyProgress;
  context: { primary: RoutineBlock | null; next: RoutineBlock | null; active: boolean; finished: boolean };
  focusMode: boolean;
  onToggle: (block: RoutineBlock) => void;
  onDetails: (block: RoutineBlock) => void;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function AnchorRail() {
  return (
    <div className="anchor-rail" aria-label="Anclas del día">
      {ANCHORS.map((anchor) => (
        <div className="anchor-rail__item" key={anchor.time}>
          <span className="anchor-rail__time">{anchor.time}</span>
          <span className="anchor-rail__icon"><RoutineIcon name={anchor.icon} size={15} /></span>
          <span>{anchor.label}</span>
        </div>
      ))}
    </div>
  );
}

export function TodayView({ now, day, record, blocks, progress, context, focusMode, onToggle, onDetails }: TodayViewProps) {
  const dateLabel = displayDate(now);
  const dayTitle = day?.label ?? "Fin de semana";
  return (
    <div className="today-view">
      <header className="today-header">
        <div className="today-header__brand"><span className="brand-mark"><RoutineIcon name="zap" size={17} /></span><span>Routine OS</span></div>
        <div className="today-header__clock"><strong>{now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false })}</strong><span>· {dayTitle}</span></div>
      </header>

      <section className="today-intro" aria-labelledby="today-title">
        <div><span className="eyebrow">{greetingForHour(now.getHours())}</span><h1 id="today-title">{dateLabel}</h1><p className="today-subtitle">No improvisar el día.</p></div>
        <div className="today-progress-summary"><div><strong>{progress.completed} <span>/ {progress.total}</span></strong><small>bloques completados</small></div><strong className="today-percent">{progress.percentage}%</strong></div>
      </section>
      <ProgressBar value={progress.percentage} label={`${progress.percentage}% del día`} />

      {day ? <AnchorRail /> : <section className="weekend-banner"><span className="weekend-banner__icon"><RoutineIcon name="moon" size={21} /></span><div><strong>Fin de semana</strong><p>El sistema vuelve el lunes. Hoy no hay bloques que perseguir.</p></div></section>}

      <CurrentBlockCard block={context.primary} next={context.next} record={record} active={context.active} finished={context.finished} completed={progress.completed} total={progress.total} percentage={progress.percentage} onToggle={onToggle} onDetails={onDetails} />

      {day && focusMode ? <section className="focus-banner"><span className="focus-banner__icon"><RoutineIcon name="focus" size={20} /></span><div><strong>Modo enfoque activo</strong><p>Solo ves el bloque que guía este momento y el siguiente. La línea completa queda fuera de vista.</p></div></section> : null}
      {day && !focusMode ? <Timeline blocks={blocks} record={record} now={now} onToggle={onToggle} onDetails={onDetails} /> : null}

      <p className="today-rule"><span>↳</span> Si un bloque falla, no lo muevas a medianoche. Se registra y se continúa con la siguiente ancla.</p>
    </div>
  );
}

