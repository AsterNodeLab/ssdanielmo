import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { CheckCircle2, CloudOff, Undo2 } from "lucide-react";
import type { AppData, AppSettings, BlockOverride, CompletionRecord, DailyRecord, RoutineBlock, ViewName, Weekday } from "./types";
import { BlockDetailsModal, BlockEditorModal } from "./components/BlockModal";
import { Navigation } from "./components/Navigation";
import { RoutineView } from "./components/RoutineView";
import { SettingsView } from "./components/SettingsView";
import { TodayView } from "./components/TodayView";
import { WeekView } from "./components/WeekView";
import { dateKeyFromDate, getBlocksForKey, getCurrentContext, getProgress, getRecord, getStreak, getWeekDates, routineDayForKey, weekdayFromDate } from "./lib/routine";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { getLastSyncedAt, getPendingCount, queueDataChanges, syncAppData, type SyncStatus } from "./lib/sync";
import { createEmptyDailyRecord, createInitialData, loadAppData, parseBackup, prepareAppDataForUser, saveAppData, saveAppDataForUser, serializeBackup } from "./lib/storage";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface DetailModalState {
  kind: "details";
  dateKey: string;
  block: RoutineBlock;
}

interface EditorModalState {
  kind: "editor";
  dateKey: string;
  block: RoutineBlock;
}

type ModalState = DetailModalState | EditorModalState;

interface UndoState {
  dateKey: string;
  blockId: string;
  previous?: CompletionRecord;
}

interface ToastState {
  message: string;
  canUndo?: boolean;
}

interface SyncInfo {
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt: string | null;
  error?: string;
}

function isEmptyCompletion(record: CompletionRecord): boolean {
  return !record.completedAt && !record.skippedAt && !record.unamSubject && record.activeRecall === undefined && !record.eduvoOutput;
}

function isValidTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/.test(value);
}

function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | undefined>();
  const [authNotice, setAuthNotice] = useState<string | undefined>();
  const [syncInfo, setSyncInfo] = useState<SyncInfo>({ status: "local", pendingCount: 0, lastSyncedAt: null });
  const [now, setNow] = useState(() => new Date());
  const [activeView, setActiveView] = useState<ViewName>("today");
  const [weekOffset, setWeekOffset] = useState(0);
  const [routineWeekday, setRoutineWeekday] = useState<Weekday>(() => weekdayFromDate(new Date()) ?? 1);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const toastTimer = useRef<number | null>(null);
  const dataRef = useRef(data);
  const previousDataRef = useRef(data);
  const previousUserIdRef = useRef<string | null>(null);
  const suppressDataEffectsRef = useRef(false);
  const syncInFlightRef = useRef<Promise<void> | null>(null);
  const syncRequestedRef = useRef(false);

  dataRef.current = data;
  const sessionUserId = session?.user.id ?? null;
  const todayKey = dateKeyFromDate(now);
  const todayRecord = useMemo(() => getRecord(data, todayKey), [data, todayKey]);
  const todayBlocks = useMemo(() => getBlocksForKey(todayKey, data), [data, todayKey]);
  const todayDay = useMemo(() => routineDayForKey(todayKey), [todayKey]);
  const todayProgress = useMemo(() => getProgress(todayBlocks, todayRecord), [todayBlocks, todayRecord]);
  const currentContext = useMemo(() => getCurrentContext(todayBlocks, todayRecord, now), [todayBlocks, todayRecord, now]);
  const weekDates = useMemo(() => {
    const anchor = new Date(now);
    anchor.setDate(anchor.getDate() + weekOffset * 7);
    return getWeekDates(anchor);
  }, [now, weekOffset]);
  const routineDateKey = useMemo(() => dateKeyFromDate(getWeekDates(now)[routineWeekday - 1]), [now, routineWeekday]);
  const streak = useMemo(() => getStreak(data, now), [data, now]);

  const notify = useCallback((message: string, canUndo = false) => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    setToast({ message, canUndo });
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      setUndoState(null);
    }, 4500);
  }, []);

  const runSync = useCallback(async () => {
    if (!sessionUserId) return;
    const inFlight = syncInFlightRef.current;
    if (inFlight) {
      syncRequestedRef.current = true;
      await inFlight;
      if (syncRequestedRef.current) {
        syncRequestedRef.current = false;
        await runSync();
      }
      return;
    }

    const snapshot = dataRef.current;
    const operation = (async () => {
      setSyncInfo((current) => ({ ...current, status: "syncing", error: undefined, pendingCount: getPendingCount(sessionUserId) }));
      const result = await syncAppData(sessionUserId, snapshot);
      if (dataRef.current === snapshot && result.data !== snapshot) {
        suppressDataEffectsRef.current = true;
        dataRef.current = result.data;
        setData(result.data);
        saveAppDataForUser(sessionUserId, result.data);
      }
      setSyncInfo({ status: result.status, pendingCount: result.pendingCount, lastSyncedAt: result.lastSyncedAt, error: result.error });
    })();

    syncInFlightRef.current = operation;
    try {
      await operation;
    } finally {
      if (syncInFlightRef.current === operation) syncInFlightRef.current = null;
    }
  }, [sessionUserId]);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;
    void supabase.auth.getSession().then(({ data: sessionData, error }) => {
      if (!mounted) return;
      if (error) setAuthError(error.message);
      setSession(sessionData.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setAuthLoading(false);
      if (!nextSession) {
        setAuthError(undefined);
        setAuthNotice(undefined);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (sessionUserId) {
      const prepared = prepareAppDataForUser(sessionUserId, dataRef.current);
      if (prepared !== dataRef.current) {
        suppressDataEffectsRef.current = true;
        dataRef.current = prepared;
        setData(prepared);
      } else {
        previousDataRef.current = prepared;
        saveAppDataForUser(sessionUserId, prepared);
      }
      previousUserIdRef.current = sessionUserId;
      setSyncInfo({ status: "syncing", pendingCount: getPendingCount(sessionUserId), lastSyncedAt: getLastSyncedAt(sessionUserId) });
      return;
    }

    if (previousUserIdRef.current) {
      const anonymousData = createInitialData();
      suppressDataEffectsRef.current = true;
      dataRef.current = anonymousData;
      setData(anonymousData);
    }
    previousUserIdRef.current = null;
    setSyncInfo({ status: "local", pendingCount: 0, lastSyncedAt: null });
  }, [sessionUserId]);

  useEffect(() => {
    if (suppressDataEffectsRef.current) {
      suppressDataEffectsRef.current = false;
      previousDataRef.current = data;
      if (sessionUserId) saveAppDataForUser(sessionUserId, data);
      return;
    }
    if (previousDataRef.current === data) return;

    const previous = previousDataRef.current;
    if (sessionUserId) {
      saveAppDataForUser(sessionUserId, data);
      queueDataChanges(sessionUserId, previous, data);
      const pendingCount = getPendingCount(sessionUserId);
      setSyncInfo((current) => ({ ...current, status: pendingCount ? "pending" : current.status, pendingCount }));
      void runSync();
    } else {
      saveAppData(data);
    }
    previousDataRef.current = data;
  }, [data, runSync, sessionUserId]);

  useEffect(() => {
    if (sessionUserId) void runSync();
  }, [runSync, sessionUserId]);

  useEffect(() => {
    const onOnline = () => {
      if (sessionUserId) void runSync();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [runSync, sessionUserId]);

  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    themeMeta?.setAttribute("content", data.settings.theme === "dark" ? "#171715" : "#f4f2ed");
  }, [data.settings.theme]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const updateDailyRecord = useCallback((dateKey: string, updater: (record: DailyRecord) => DailyRecord) => {
    setData((previous) => {
      const current = getRecord(previous, dateKey);
      const nextRecord = updater(current);
      return {
        ...previous,
        dailyRecords: {
          ...previous.dailyRecords,
          [dateKey]: { ...nextRecord, updatedAt: new Date().toISOString() },
        },
      };
    });
  }, []);

  const toggleBlock = useCallback((dateKey: string, block: RoutineBlock) => {
    const previousRecord = data.dailyRecords[dateKey]?.blocks[block.id];
    const wasCompleted = Boolean(previousRecord?.completedAt);
    updateDailyRecord(dateKey, (current) => {
      const blocks = { ...current.blocks };
      if (wasCompleted) {
        const next = { ...blocks[block.id] };
        delete next.completedAt;
        delete next.skippedAt;
        if (isEmptyCompletion(next)) delete blocks[block.id];
        else blocks[block.id] = next;
      } else {
        blocks[block.id] = {
          ...blocks[block.id],
          completedAt: new Date().toISOString(),
          skippedAt: undefined,
        };
      }
      return { ...current, blocks };
    });
    if (wasCompleted) {
      notify("Bloque desmarcado");
    } else {
      setUndoState({ dateKey, blockId: block.id, previous: previousRecord ? { ...previousRecord } : undefined });
      notify("Bloque completado", true);
      if (data.settings.vibration && "vibrate" in navigator) navigator.vibrate(12);
    }
  }, [data, notify, updateDailyRecord]);

  const undoLastAction = useCallback(() => {
    if (!undoState) return;
    updateDailyRecord(undoState.dateKey, (current) => {
      const blocks = { ...current.blocks };
      if (undoState.previous) blocks[undoState.blockId] = undoState.previous;
      else delete blocks[undoState.blockId];
      return { ...current, blocks };
    });
    setUndoState(null);
    setToast(null);
  }, [undoState, updateDailyRecord]);

  const saveDetails = useCallback((dateKey: string, blockId: string, partial: Partial<CompletionRecord>) => {
    updateDailyRecord(dateKey, (current) => {
      const next = { ...(current.blocks[blockId] ?? {}), ...partial };
      for (const key of Object.keys(next) as Array<keyof CompletionRecord>) if (next[key] === undefined || next[key] === "") delete next[key];
      const blocks = { ...current.blocks };
      if (isEmptyCompletion(next)) delete blocks[blockId];
      else blocks[blockId] = next;
      return { ...current, blocks };
    });
    notify("Detalles guardados");
  }, [notify, updateDailyRecord]);

  const skipBlock = useCallback((dateKey: string, blockId: string) => {
    updateDailyRecord(dateKey, (current) => ({
      ...current,
      blocks: {
        ...current.blocks,
        [blockId]: { ...current.blocks[blockId], completedAt: undefined, skippedAt: new Date().toISOString() },
      },
    }));
    setModal(null);
    notify("Bloque registrado como omitido");
  }, [notify, updateDailyRecord]);

  const saveOverride = useCallback((dateKey: string, blockId: string, override: BlockOverride) => {
    if (!isValidTime(override.start ?? "") || !isValidTime(override.end ?? "")) {
      notify("Usa horas válidas en formato HH:MM");
      return;
    }
    updateDailyRecord(dateKey, (current) => ({ ...current, overrides: { ...current.overrides, [blockId]: override } }));
    setModal(null);
    notify("Ajuste temporal guardado");
  }, [notify, updateDailyRecord]);

  const resetDay = useCallback(() => {
    if (!window.confirm("¿Reiniciar solo el progreso de hoy? El historial anterior se conserva.")) return;
    setData((previous) => ({ ...previous, dailyRecords: { ...previous.dailyRecords, [todayKey]: createEmptyDailyRecord(todayKey) } }));
    notify("Progreso de hoy reiniciado");
  }, [notify, todayKey]);

  const exportData = useCallback(() => {
    const blob = new Blob([serializeBackup(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `routine-os-respaldo-${todayKey}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Respaldo exportado");
  }, [data, notify, todayKey]);

  const importData = useCallback(async (file: File) => {
    try {
      const imported = parseBackup(await file.text());
      setData(imported);
      notify("Respaldo importado");
    } catch {
      notify("No se pudo leer ese respaldo JSON");
    }
  }, [notify]);

  const installApp = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt]);

  const openDetails = useCallback((block: RoutineBlock, dateKey = todayKey) => {
    setModal({ kind: "details", block, dateKey });
  }, [todayKey]);

  const openEditor = useCallback((block: RoutineBlock) => {
    setModal({ kind: "editor", block, dateKey: todayKey });
  }, [todayKey]);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    setData((previous) => ({ ...previous, settings: { ...previous.settings, ...settings, updatedAt: new Date().toISOString() } }));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return;
    setAuthError(undefined);
    setAuthNotice(undefined);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    else setAuthNotice("Sesión iniciada. Tus datos se sincronizarán en segundo plano.");
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return;
    setAuthError(undefined);
    setAuthNotice(undefined);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
    });
    if (error) setAuthError(error.message);
    else setAuthNotice(signUpData.session ? "Cuenta creada." : "Cuenta creada. Revisa tu correo para confirmar el acceso.");
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    setAuthError(undefined);
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error.message);
  }, []);

  const renderView = () => {
    if (activeView === "today") {
      return <TodayView now={now} day={todayDay} record={todayRecord} blocks={todayBlocks} progress={todayProgress} context={currentContext} focusMode={data.settings.focusMode} onToggle={(block) => toggleBlock(todayKey, block)} onDetails={(block) => openDetails(block)} />;
    }
    if (activeView === "week") {
      return <WeekView data={data} dates={weekDates} currentDateKey={todayKey} streak={streak} onPrevious={() => setWeekOffset((value) => value - 1)} onNext={() => setWeekOffset((value) => value + 1)} onCurrent={() => setWeekOffset(0)} />;
    }
    if (activeView === "routine") {
      return <RoutineView selectedWeekday={routineWeekday} onSelectWeekday={setRoutineWeekday} onDetails={(block) => openDetails(block, routineDateKey)} />;
    }
    return <SettingsView settings={data.settings} todayBlocks={todayBlocks} dateLabel={todayDay?.label ?? "Fin de semana"} canInstall={Boolean(installPrompt)} authConfigured={isSupabaseConfigured} authLoading={authLoading} userEmail={session?.user.email ?? null} authError={authError} authNotice={authNotice} syncStatus={syncInfo.status} pendingCount={syncInfo.pendingCount} lastSyncedAt={syncInfo.lastSyncedAt} onLogin={signIn} onSignUp={signUp} onLogout={signOut} onSyncNow={runSync} onSettingsChange={updateSettings} onExport={exportData} onImport={importData} onResetDay={resetDay} onEditBlock={openEditor} onInstall={installApp} />;
  };

  const modalRecord = modal?.kind === "details" ? getRecord(data, modal.dateKey).blocks[modal.block.id] ?? {} : null;

  return (
    <div className="app-shell">
      <main className={`app-main app-main--${activeView}`}>{renderView()}</main>
      <Navigation activeView={activeView} onChange={setActiveView} />

      {modal?.kind === "details" && modalRecord ? <BlockDetailsModal block={modal.block} record={modalRecord} onClose={() => setModal(null)} onToggle={() => { toggleBlock(modal.dateKey, modal.block); setModal(null); }} onSkip={() => skipBlock(modal.dateKey, modal.block.id)} onSave={(partial) => saveDetails(modal.dateKey, modal.block.id, partial)} /> : null}
      {modal?.kind === "editor" ? <BlockEditorModal block={modal.block} onClose={() => setModal(null)} onSave={(override) => saveOverride(modal.dateKey, modal.block.id, override)} /> : null}

      {!navigator.onLine ? <div className="offline-badge"><CloudOff size={14} /> Offline · datos locales</div> : null}
      {toast ? <div className="toast" role="status" aria-live="polite"><CheckCircle2 size={17} aria-hidden="true" /><span>{toast.message}</span>{toast.canUndo && undoState ? <button type="button" onClick={undoLastAction}><Undo2 size={15} /> Deshacer</button> : null}</div> : null}
    </div>
  );
}

export default App;

