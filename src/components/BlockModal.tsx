import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import type { BlockOverride, CompletionRecord, RoutineBlock } from "../types";
import { formatTimeRange, UNAM_SUBJECTS } from "../lib/routine";
import { RoutineIcon } from "./Icon";

interface ModalShellProps {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  onClose: () => void;
}

function ModalShell({ title, eyebrow, children, onClose }: ModalShellProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal__head"><div><span className="eyebrow">{eyebrow}</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button></div>{children}</div></div>;
}

interface BlockDetailsModalProps {
  block: RoutineBlock;
  record: CompletionRecord;
  onClose: () => void;
  onToggle: () => void;
  onSkip: () => void;
  onSave: (record: Partial<CompletionRecord>) => void;
}

export function BlockDetailsModal({ block, record, onClose, onToggle, onSkip, onSave }: BlockDetailsModalProps) {
  const [subject, setSubject] = useState(record.unamSubject ?? "");
  const [activeRecall, setActiveRecall] = useState<boolean | undefined>(record.activeRecall);
  const [output, setOutput] = useState(record.eduvoOutput ?? "");
  const completed = Boolean(record.completedAt);
  const skipped = Boolean(record.skippedAt) && !completed;
  const save = () => onSave({ unamSubject: subject || undefined, activeRecall, eduvoOutput: output.trim() || undefined });

  return <ModalShell title={block.title} eyebrow={formatTimeRange(block)} onClose={onClose}>
    <div className="modal-block-identity"><span className={`current-icon current-icon--${block.kind}`}><RoutineIcon name={block.icon} size={22} /></span><div><p>{block.description}</p>{block.code ? <span className="meta-tag">{block.code}{block.stage ? ` · ${block.stage === "learn" ? "Aprender" : block.stage === "execute" ? "Ejecutar" : "Repaso"}` : ""}</span> : null}</div></div>
    {block.kind === "eduvo" ? <label className="field-label">Output del bloque<input className="text-input" type="text" maxLength={160} placeholder="Ej. Terminé módulo de matemáticas." value={output} onChange={(event) => setOutput(event.target.value)} /></label> : null}
    {block.kind === "institucion educativa" ? <div className="modal-fields"><label className="field-label">Materia<input className="text-input" list="institucion educativa-subjects" placeholder="Opcional" value={subject} onChange={(event) => setSubject(event.target.value)} /><datalist id="institucion educativa-subjects">{UNAM_SUBJECTS.map((item) => <option key={item} value={item} />)}</datalist></label><fieldset className="field-label"><legend>¿Hubo active recall?</legend><div className="choice-row"><label><input type="radio" name="active-recall" checked={activeRecall === true} onChange={() => setActiveRecall(true)} /> Sí</label><label><input type="radio" name="active-recall" checked={activeRecall === false} onChange={() => setActiveRecall(false)} /> No</label></div></fieldset></div> : null}
    <div className="modal-actions"><button className={`primary-action primary-action--modal${completed ? " primary-action--done" : ""}`} type="button" onClick={onToggle}>{completed ? <CheckCircle2 size={18} /> : <span className="check-placeholder">✓</span>} {completed ? "Desmarcar bloque" : "Completar bloque"}</button><button className="secondary-action" type="button" onClick={save}>Guardar detalles</button>{!completed && !skipped ? <button className="text-action text-action--danger" type="button" onClick={onSkip}>Marcar como omitido</button> : null}{skipped ? <span className="modal-status">Este bloque está omitido. Puedes completarlo desde la línea del día.</span> : null}</div>
  </ModalShell>;
}

interface BlockEditorModalProps {
  block: RoutineBlock;
  onClose: () => void;
  onSave: (override: BlockOverride) => void;
}

export function BlockEditorModal({ block, onClose, onSave }: BlockEditorModalProps) {
  const [title, setTitle] = useState(block.title);
  const [description, setDescription] = useState(block.description);
  const [start, setStart] = useState(block.start);
  const [end, setEnd] = useState(block.end);
  return <ModalShell title="Ajuste temporal" eyebrow={block.title} onClose={onClose}>
    <p className="modal-helper">Este cambio solo afecta a la fecha actual. La rutina base permanece intacta.</p>
    <div className="modal-fields"><label className="field-label">Nombre<input className="text-input" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="field-label">Descripción<input className="text-input" value={description} onChange={(event) => setDescription(event.target.value)} /></label></div>
    <div className="time-fields"><label className="field-label">Inicio<input className="text-input" inputMode="numeric" placeholder="HH:MM" value={start} onChange={(event) => setStart(event.target.value)} /></label><label className="field-label">Fin<input className="text-input" inputMode="numeric" placeholder="HH:MM" value={end} onChange={(event) => setEnd(event.target.value)} /></label></div>
    <p className="modal-helper">Usa formato HH:MM. Para medianoche puedes usar 24:00.</p>
    <div className="modal-actions"><button className="primary-action primary-action--modal" type="button" onClick={() => onSave({ title: title.trim() || block.title, description: description.trim() || block.description, start: start.trim() || block.start, end: end.trim() || block.end })}>Guardar ajuste</button><button className="text-action" type="button" onClick={onClose}>Cancelar</button></div>
  </ModalShell>;
}

