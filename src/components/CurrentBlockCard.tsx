import { ArrowRight, CheckCircle2, Circle, MoreHorizontal } from "lucide-react";
import type { CompletionRecord, RoutineBlock } from "../types";
import { formatTimeRange, isCompleted, isSkipped } from "../lib/routine";
import { RoutineIcon } from "./Icon";
import { ProgressBar } from "./ProgressBar";

interface CurrentBlockCardProps {
  block: RoutineBlock | null;
  next: RoutineBlock | null;
  record: { blocks: Record<string, CompletionRecord> };
  active: boolean;
  finished: boolean;
  completed: number;
  total: number;
  percentage: number;
  onToggle: (block: RoutineBlock) => void;
  onDetails: (block: RoutineBlock) => void;
}

function StageTrail({ current }: { current: RoutineBlock }) {
  if (current.code !== "Group A") return null;
  const stages = [
    { key: "learn", label: "Aprender" },
    { key: "execute", label: "Ejecutar" },
    { key: "review", label: "Repaso" },
  ];
  return (
    <div className="stage-trail" aria-label="Etapas de formación">
      {stages.map((stage, index) => (
        <span className={`stage-trail__item${stage.key === current.stage ? " stage-trail__item--current" : ""}`} key={stage.key}>
          <span className="stage-trail__number">{index + 1}</span>
          {stage.label}
        </span>
      ))}
    </div>
  );
}

export function CurrentBlockCard({ block, next, record, active, finished, completed, total, percentage, onToggle, onDetails }: CurrentBlockCardProps) {
  if (!block) {
    return (
      <section className="current-card current-card--empty" aria-labelledby="current-heading">
        <div className="current-card__eyebrow">AHORA</div>
        <h2 id="current-heading">Fin de semana</h2>
        <p>Descansa, recupera y vuelve al sistema el lunes.</p>
      </section>
    );
  }

  const completedBlock = isCompleted(record, block.id);
  const skippedBlock = isSkipped(record, block.id);
  const label = finished ? "DÍA CERRADO" : active ? "AHORA" : "SIGUIENTE ANCLA";
  const actionLabel = completedBlock ? "Desmarcar bloque" : "Completar bloque";

  return (
    <section className={`current-card${completedBlock ? " current-card--done" : ""}`} aria-labelledby="current-heading">
      <div className="current-card__topline">
        <span className="current-card__eyebrow">{label}</span>
        <span className={`status-pill${skippedBlock ? " status-pill--muted" : completedBlock ? " status-pill--done" : ""}`}>
          {completedBlock ? <CheckCircle2 size={14} aria-hidden="true" /> : skippedBlock ? "Omitido" : active ? "En curso" : "Próximo"}
        </span>
      </div>

      <div className="current-card__identity">
        <span className={`current-icon current-icon--${block.kind}`}><RoutineIcon name={block.icon} size={24} strokeWidth={1.8} /></span>
        <div>
          <h2 id="current-heading">{block.title}</h2>
          <p className="current-card__time">{formatTimeRange(block)}</p>
        </div>
      </div>

      <p className="current-card__description">{block.description}</p>
      <StageTrail current={block} />

      <button className={`primary-action${completedBlock ? " primary-action--done" : ""}`} type="button" onClick={() => onToggle(block)}>
        {completedBlock ? <CheckCircle2 size={20} aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}
        <span>{actionLabel}</span>
      </button>

      <div className="current-card__footer">
        {next ? (
          <span className="next-block"><strong>Siguiente</strong><ArrowRight size={14} aria-hidden="true" /> {next.title} · {next.start === "24:00" ? "00:00" : next.start}</span>
        ) : (
          <span className="next-block">No hay otra ancla pendiente.</span>
        )}
        <button className="icon-button icon-button--quiet" type="button" onClick={() => onDetails(block)} aria-label={`Ver detalles de ${block.title}`}>
          <MoreHorizontal size={19} aria-hidden="true" />
        </button>
      </div>

      <div className="current-card__progress">
        <div className="progress-summary"><span>Hoy {completed}/{total}</span><strong>{percentage}%</strong></div>
        <ProgressBar value={percentage} label="Progreso del día" compact />
      </div>
    </section>
  );
}

