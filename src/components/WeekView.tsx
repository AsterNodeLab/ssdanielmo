import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Brain, Dumbbell, GraduationCap, Moon, Rocket, Target } from "lucide-react";
import type { AppData } from "../types";
import { displayShortDate, displayWeekRange, getWeekMetrics, routineDayForKey } from "../lib/routine";
import { ProgressBar } from "./ProgressBar";

interface WeekViewProps {
  data: AppData;
  dates: Date[];
  currentDateKey: string;
  streak: number;
  onPrevious: () => void;
  onNext: () => void;
  onCurrent: () => void;
}

function MetricCard({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span className="metric-icon">{icon}</span>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-detail">{detail}</span>
    </article>
  );
}

export function WeekView({ data, dates, currentDateKey, streak, onPrevious, onNext, onCurrent }: WeekViewProps) {
  const metrics = getWeekMetrics(dates, data);
  return (
    <div className="view-stack">
      <header className="page-heading page-heading--week">
        <div>
          <span className="eyebrow">Ritmo, no castigo</span>
          <h1>Esta semana</h1>
          <p>{displayWeekRange(dates)}</p>
        </div>
        <div className="week-controls" aria-label="Navegar semanas">
          <button className="icon-button" type="button" onClick={onPrevious} aria-label="Semana anterior"><ArrowLeft size={19} /></button>
          <button className="icon-button" type="button" onClick={onCurrent} aria-label="Volver a esta semana"><Target size={17} /></button>
          <button className="icon-button" type="button" onClick={onNext} aria-label="Semana siguiente"><ArrowRight size={19} /></button>
        </div>
      </header>

      <section className="week-compliance-card">
        <div className="week-compliance-card__head">
          <div><span className="eyebrow">Cumplimiento semanal</span><strong>{metrics.compliance}%</strong></div>
          <span className="streak-note">{streak ? `${streak} ${streak === 1 ? "día" : "días"} siguiendo el sistema` : "Empieza con la siguiente ancla"}</span>
        </div>
        <ProgressBar value={metrics.compliance} label="Cumplimiento semanal" />
      </section>

      <section className="week-list" aria-labelledby="week-list-heading">
        <div className="section-heading"><div><span className="eyebrow">Lunes a viernes</span><h2 id="week-list-heading">Tu semana en una mirada</h2></div></div>
        {metrics.daily.map((day) => {
          const routineDay = routineDayForKey(day.dateKey);
          const isToday = day.dateKey === currentDateKey;
          return (
            <article className={`week-day-row${isToday ? " week-day-row--today" : ""}`} key={day.dateKey}>
              <div className="week-day-label"><strong>{routineDay?.shortLabel}</strong><span>{displayShortDate(new Date(`${day.dateKey}T12:00:00`))}</span></div>
              <ProgressBar value={day.percentage} compact label={`${routineDay?.label}: ${day.percentage}%`} />
              <strong className="week-day-percentage">{day.percentage}%</strong>
              <span className="week-day-count">{day.completed}/{day.total}</span>
            </article>
          );
        })}
      </section>

      <section aria-labelledby="metrics-heading">
        <div className="section-heading"><div><span className="eyebrow">Prioridades</span><h2 id="metrics-heading">Métricas que importan</h2></div></div>
        <div className="metric-grid">
          <MetricCard icon={<Moon size={18} />} label="Sueño" value={`${metrics.sleep} / 5`} detail="anclas nocturnas" tone="sleep" />
          <MetricCard icon={<Brain size={18} />} label="institucion educativa" value={`${metrics.unamDeep} / 5`} detail={`${metrics.unamRecall} active recall`} tone="institucion educativa" />
          <MetricCard icon={<Rocket size={18} />} label="EDUVO" value={`${metrics.eduvoSessions} / 5`} detail={`${metrics.eduvoOutputs.length} outputs`} tone="eduvo" />
          <MetricCard icon={<Dumbbell size={18} />} label="Gym" value={`${metrics.gym} / 5`} detail="entrenamientos" tone="gym" />
          <MetricCard icon={<GraduationCap size={18} />} label="Training" value={`${metrics.topClasses} / 4`} detail="clases preparadas" tone="top" />
          <MetricCard icon={<BookOpen size={18} />} label="institucion educativa" value={`${metrics.institucion educativa} / 2`} detail="bloques semanales" tone="institucion educativa" />
        </div>
      </section>

      <section className="eduvo-week-card" aria-labelledby="eduvo-week-heading">
        <div className="eduvo-week-card__head"><span className="metric-icon metric-icon--eduvo"><Rocket size={18} /></span><div><span className="eyebrow">Construir · no consumir</span><h2 id="eduvo-week-heading">EDUVO esta semana</h2></div></div>
        <div className="eduvo-week-stats"><div><span>Sesiones</span><strong>{metrics.eduvoSessions} / 5</strong></div><div><span>Outputs</span><strong>{metrics.eduvoOutputs.length} / 5</strong></div></div>
        {metrics.eduvoOutputs.length ? (
          <ul className="output-list">
            {metrics.eduvoOutputs.slice(-5).reverse().map((item) => <li key={`${item.dateKey}-${item.title}-${item.output}`}><span className="output-dot" /><span>{item.output}</span></li>)}
          </ul>
        ) : <p className="empty-note">Los outputs concretos que registres aparecerán aquí.</p>}
      </section>

      <p className="quiet-rule"><span>→</span> Si un bloque falla, se registra y se continúa con la siguiente ancla.</p>
    </div>
  );
}

