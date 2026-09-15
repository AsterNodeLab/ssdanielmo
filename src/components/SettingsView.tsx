import { useState, type FormEvent } from "react";
import { Cloud, Download, ExternalLink, LoaderCircle, LogIn, LogOut, Moon, Palette, RefreshCw, RotateCcw, Smartphone, Sun, Upload, UserRound, Vibrate, Wrench } from "lucide-react";
import type { SyncStatus } from "../lib/sync";
import type { AppSettings, RoutineBlock } from "../types";
import { formatTimeRange } from "../lib/routine";

interface SettingsViewProps {
  settings: AppSettings;
  todayBlocks: RoutineBlock[];
  dateLabel: string;
  canInstall: boolean;
  authConfigured: boolean;
  authLoading: boolean;
  userEmail: string | null;
  authError?: string;
  authNotice?: string;
  syncStatus: SyncStatus;
  pendingCount: number;
  lastSyncedAt: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onSyncNow: () => Promise<void>;
  onSettingsChange: (settings: Partial<AppSettings>) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onResetDay: () => void;
  onEditBlock: (block: RoutineBlock) => void;
  onInstall: () => void;
}

function syncLabel(status: SyncStatus, pendingCount: number): string {
  if (status === "pending") return pendingCount > 0 ? `Cambios pendientes · ${pendingCount}` : "Cambios pendientes";
  if (status === "syncing") return "Sincronizando";
  if (status === "synced") return "Sincronizado";
  if (status === "offline") return "Sin conexión";
  if (status === "error") return "Error de sincronización";
  return "Solo local";
}

function formatLastSync(value: string | null): string {
  if (!value) return "Aún no";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Aún no";
  return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function SettingsView({ settings, todayBlocks, dateLabel, canInstall, authConfigured, authLoading, userEmail, authError, authNotice, syncStatus, pendingCount, lastSyncedAt, onLogin, onSignUp, onLogout, onSyncNow, onSettingsChange, onExport, onImport, onResetDay, onEditBlock, onInstall }: SettingsViewProps) {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) return;
    setAuthBusy(true);
    try {
      if (authMode === "login") await onLogin(email.trim(), password);
      else await onSignUp(email.trim(), password);
    } finally {
      setAuthBusy(false);
    }
  };

  const syncNow = async () => {
    setSyncBusy(true);
    try {
      await onSyncNow();
    } finally {
      setSyncBusy(false);
    }
  };

  const logout = async () => {
    setAuthBusy(true);
    try {
      await onLogout();
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <div className="view-stack">
      <header className="page-heading"><div><span className="eyebrow">Menos fricción</span><h1>Ajustes</h1><p>Lo mínimo para que el sistema se adapte a ti.</p></div></header>

      <section className="settings-card settings-card--highlight">
        <div className="settings-card__head"><span className="settings-icon"><Wrench size={19} /></span><div><h2>Modo enfoque</h2><p>Solo muestra ahora, siguiente y progreso.</p></div></div>
        <button className={`switch${settings.focusMode ? " switch--on" : ""}`} type="button" role="switch" aria-checked={settings.focusMode} onClick={() => onSettingsChange({ focusMode: !settings.focusMode })}><span className="switch__thumb" /><span className="sr-only">{settings.focusMode ? "Desactivar" : "Activar"} modo enfoque</span></button>
      </section>

      <section className="settings-card">
        <div className="settings-card__head"><span className="settings-icon"><Palette size={19} /></span><div><h2>Aspecto</h2><p>Claro para el día, oscuro para bajar revoluciones.</p></div></div>
        <div className="segmented-control" role="radiogroup" aria-label="Tema de la aplicación">
          <button className={settings.theme === "light" ? "segmented-control__button segmented-control__button--active" : "segmented-control__button"} type="button" onClick={() => onSettingsChange({ theme: "light" })}><Sun size={16} /> Claro</button>
          <button className={settings.theme === "dark" ? "segmented-control__button segmented-control__button--active" : "segmented-control__button"} type="button" onClick={() => onSettingsChange({ theme: "dark" })}><Moon size={16} /> Oscuro</button>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card__head"><span className="settings-icon"><Vibrate size={19} /></span><div><h2>Vibración breve</h2><p>Una confirmación discreta al marcar un bloque.</p></div></div>
        <button className={`switch${settings.vibration ? " switch--on" : ""}`} type="button" role="switch" aria-checked={settings.vibration} onClick={() => onSettingsChange({ vibration: !settings.vibration })}><span className="switch__thumb" /><span className="sr-only">{settings.vibration ? "Desactivar" : "Activar"} vibración</span></button>
      </section>

      <section className="settings-card settings-card--sync">
        <div className="settings-card__head"><span className="settings-icon"><Cloud size={19} /></span><div><h2>Cuenta y sincronización</h2><p>Tu rutina sigue funcionando localmente aunque no haya conexión.</p></div></div>
        {!authConfigured ? <div className="sync-setup-note"><strong>Modo local activo</strong><span>Configura las variables de Supabase para sincronizar entre dispositivos. El historial local y los respaldos siguen disponibles.</span></div> : authLoading ? <div className="sync-loading"><LoaderCircle size={17} className="spin" /> Comprobando sesión…</div> : userEmail ? <>
          <div className="account-email"><UserRound size={16} /><span>{userEmail}</span></div>
          <div className="sync-meta">
            <div><span>Estado</span><strong className={`sync-status sync-status--${syncStatus}`}><span className="sync-status__dot" />{syncLabel(syncStatus, pendingCount)}</strong></div>
            <div><span>Última sincronización</span><strong>{formatLastSync(lastSyncedAt)}</strong></div>
          </div>
          {authError ? <p className="auth-message auth-message--error" role="alert">{authError}</p> : null}
          {authNotice ? <p className="auth-message auth-message--notice" role="status">{authNotice}</p> : null}
          <div className="settings-actions settings-actions--account">
            <button className="secondary-action" type="button" onClick={syncNow} disabled={syncBusy}><RefreshCw size={17} className={syncBusy ? "spin" : undefined} /> {syncBusy ? "Sincronizando…" : "Sincronizar ahora"}</button>
            <button className="secondary-action" type="button" onClick={logout} disabled={authBusy}><LogOut size={17} /> Cerrar sesión</button>
          </div>
        </> : <>
          <div className="auth-mode-toggle" role="tablist" aria-label="Acceso a Routine OS">
            <button className={authMode === "login" ? "auth-mode-toggle__button auth-mode-toggle__button--active" : "auth-mode-toggle__button"} type="button" role="tab" aria-selected={authMode === "login"} onClick={() => setAuthMode("login")}>Entrar</button>
            <button className={authMode === "signup" ? "auth-mode-toggle__button auth-mode-toggle__button--active" : "auth-mode-toggle__button"} type="button" role="tab" aria-selected={authMode === "signup"} onClick={() => setAuthMode("signup")}>Crear cuenta</button>
          </div>
          <form className="auth-form" onSubmit={submitAuth}>
            <label className="auth-field"><span>Email</span><input className="text-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" required /></label>
            <label className="auth-field"><span>Contraseña</span><input className="text-input" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required /></label>
            {authError ? <p className="auth-message auth-message--error" role="alert">{authError}</p> : null}
            {authNotice ? <p className="auth-message auth-message--notice" role="status">{authNotice}</p> : null}
            <button className="primary-action" type="submit" disabled={authBusy}><LogIn size={17} className={authBusy ? "spin" : undefined} /> {authBusy ? "Procesando…" : authMode === "login" ? "Entrar y sincronizar" : "Crear cuenta"}</button>
          </form>
        </>}
      </section>

      <section className="settings-card">
        <div className="settings-card__head"><span className="settings-icon"><Wrench size={19} /></span><div><h2>Ajustes temporales</h2><p>{dateLabel}</p></div></div>
        <div className="settings-block-list">
          {todayBlocks.map((block) => <button className="settings-block-row" type="button" key={block.id} onClick={() => onEditBlock(block)}><span><strong>{block.title}</strong><small>{formatTimeRange(block)}</small></span><span className="settings-block-row__edit">Editar</span></button>)}
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card__head"><span className="settings-icon"><Download size={19} /></span><div><h2>Respaldo local</h2><p>Guarda tu historial para cambiar de teléfono sin perderlo.</p></div></div>
        <div className="settings-actions">
          <button className="secondary-action" type="button" onClick={onExport}><Download size={17} /> Exportar JSON</button>
          <label className="secondary-action" htmlFor="backup-import"><Upload size={17} /> Importar JSON<input id="backup-import" type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.currentTarget.value = ""; }} /></label>
        </div>
      </section>

      <section className="settings-card settings-card--install">
        <div className="settings-card__head"><span className="settings-icon"><Smartphone size={19} /></span><div><h2>Instalar en Android</h2><p>{canInstall ? "La PWA está lista para añadirse a tu pantalla de inicio." : "Abre el menú de Chrome y elige Añadir a pantalla de inicio."}</p></div></div>
        {canInstall ? <button className="secondary-action" type="button" onClick={onInstall}><Smartphone size={17} /> Instalar Routine OS</button> : <span className="install-hint"><ExternalLink size={15} /> Chrome · menú · Añadir a pantalla de inicio</span>}
      </section>

      <section className="settings-card settings-card--danger">
        <div className="settings-card__head"><span className="settings-icon"><RotateCcw size={19} /></span><div><h2>Reiniciar día</h2><p>Solo borra los checks de hoy. El historial anterior permanece.</p></div></div>
        <button className="danger-action" type="button" onClick={onResetDay}><RotateCcw size={17} /> Reiniciar progreso de hoy</button>
      </section>

      <footer className="settings-footer"><span>Routine OS · offline-first</span><span>Sin analytics · datos bajo tu control</span></footer>
    </div>
  );
}

