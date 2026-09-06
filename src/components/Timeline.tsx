import { Check, MoreHorizontal } from "lucide-react";
import type { CompletionRecord, RoutineBlock } from "../types";
import { formatTime, getCompletion, isCompleted, isSkipped, timeToMinutes } from "../lib/routine";
import { RoutineIcon } from "./Icon";

type TimelineStatus = "completed" | "skipped" | "current" | "late" | "pending";

interface TimelineProps {
  blocks: RoutineBlock[];
  record: { blocks: Record<string, CompletionRecord> };
  now: Date;
  onToggle: (block: RoutineBlock) => void;
  onDetails: (block: RoutineBlock) => void;
}

function statusFor(block: RoutineBlock, record: TimelineProps["record"], now: Date): TimelineStatus {
  if (isCompleted(record, block.id)) return "completed";
  if (isSkipped(record, block.id)) return "skipped";
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (timeToMinutes(block.start) <= minutes && minutes < timeToMinutes(block.end)) return "current";
  if (timeToMinutes(block.end) <= minutes) return "late";
  return "pending";
}

const statusLabels: Record<TimelineStatus, string> = {
  completed: "Completado",
  skipped: "Omitido",
  current: "Ahora",
  late: "Pendiente atrasado",
  pending: "Pendiente",
};

export function Timeline({ blocks, record, now, onToggle, onDetails }: TimelineProps) {
  return (
    <section className="timeline-section" aria-labelledby="timeline-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Sin improvisar</span>
          <h2 id="timeline-heading">Línea del día</h2>
        </div>
        <span className="section-count">{blocks.length} bloques</span>
      </div>
      <ol className="timeline">
        {blocks.map((block) => {
          const status = statusFor(block, record, now);
          const completion = getCompletion(record, block.id);
          return (
            <li className={`timeline-item timeline-item--${status}`} key={block.id}>
              <div className="timeline-time" aria-label={`De ${formatTime(block.start)} a ${formatTime(block.end)}`}>
                <strong>{formatTime(block.start)}</strong>
                <span>{formatTime(block.end)}</span>
              </div>
              <button className="timeline-hit" type="button" onClick={() => onToggle(block)} aria-pressed={status === "completed"}>
                <span className="timeline-icon"><RoutineIcon name={block.icon} size={18} strokeWidth={1.8} /></span>
                <span className="timeline-copy">
                  <span className="timeline-title-row">
                    <strong>{block.title}</strong>
                    {block.stage ? <span className="stage-tag">{block.stage === "learn" ? "1" : block.stage === "execute" ? "2" : "3"}</span> : null}
                  </span>
                  <span className="timeline-description">{block.description}</span>
                  {status === "late" ? <span className="late-label">Pendiente atrasado · continúa con la siguiente ancla</span> : null}
                  {completion.eduvoOutput ? <span className="timeline-note">Output: {completion.eduvoOutput}</span> : null}
                  {completion.unamSubject ? <span className="timeline-note">{completion.unamSubject}{completion.activeRecall ? " · active recall" : ""}</span> : null}
                </span>
                <span className="timeline-status" aria-label={statusLabels[status]}>
                  {status === "completed" ? <Check size={18} strokeWidth={2.4} aria-hidden="true" /> : status === "skipped" ? "–" : ""}
                </span>
              </button>
              <button className="icon-button timeline-details" type="button" onClick={() => onDetails(block)} aria-label={`Detalles de ${block.title}`}>
                <MoreHorizontal size={19} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

