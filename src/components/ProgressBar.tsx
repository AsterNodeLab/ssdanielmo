interface ProgressBarProps {
  value: number;
  label?: string;
  compact?: boolean;
}

export function ProgressBar({ value, label, compact = false }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={`progress-wrap${compact ? " progress-wrap--compact" : ""}`}>
      <div className="progress-track" role="progressbar" aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progreso"}>
        <span className="progress-fill" style={{ width: `${safeValue}%` }} />
      </div>
      {label ? <span className="progress-label">{label}</span> : null}
    </div>
  );
}

