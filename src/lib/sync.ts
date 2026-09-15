import type { AppData, AppSettings, DailyRecord } from "../types";
import { sanitizeDailyRecord, sanitizeSettings } from "./storage";
import { isSupabaseConfigured, supabase } from "./supabase";

export type SyncStatus = "local" | "synced" | "offline" | "syncing" | "pending" | "error";

export interface SyncResult {
  data: AppData;
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt: string | null;
  error?: string;
}

type SyncChangeKind = "daily_record" | "settings";
type SyncData = DailyRecord | AppSettings;

interface PendingChange {
  id: string;
  userId: string;
  kind: SyncChangeKind;
  dateKey?: string;
  data: SyncData;
  updatedAt: string;
}

interface SyncMeta {
  initialMigrationByUser: Record<string, string>;
  lastSyncedAtByUser: Record<string, string>;
}

interface RemoteDailyRow {
  date_key: string;
  data: unknown;
  updated_at: string;
}

interface RemoteSettingsRow {
  data: unknown;
  updated_at: string;
}

interface RemoteSnapshot {
  dailyRecords: Map<string, DailyRecord>;
  settings: AppSettings | null;
}

interface UploadCandidate {
  kind: SyncChangeKind;
  dateKey?: string;
  data: SyncData;
  updatedAt: string;
}

const QUEUE_KEY = "routine-os-sync-queue-v1";
const META_KEY = "routine-os-sync-meta-v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function timestamp(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function compareUpdatedAt(left: string | undefined, right: string | undefined): number {
  return timestamp(left) - timestamp(right);
}

function samePayload(left: SyncData, right: SyncData): boolean {
  const leftCopy = { ...left } as Record<string, unknown>;
  const rightCopy = { ...right } as Record<string, unknown>;
  delete leftCopy.updatedAt;
  delete rightCopy.updatedAt;
  return JSON.stringify(leftCopy) === JSON.stringify(rightCopy);
}

function isPendingChange(value: unknown): value is PendingChange {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || typeof value.userId !== "string") return false;
  if (value.kind !== "daily_record" && value.kind !== "settings") return false;
  if (!isRecord(value.data) || typeof value.updatedAt !== "string") return false;
  if (value.kind === "daily_record" && typeof value.dateKey !== "string") return false;
  return true;
}

function readQueue(): PendingChange[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPendingChange) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingChange[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // If storage is unavailable, the current React session still remains usable.
  }
}

function readMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!isRecord(parsed)) throw new Error("Invalid sync metadata");
    return {
      initialMigrationByUser: isRecord(parsed.initialMigrationByUser) ? parsed.initialMigrationByUser as Record<string, string> : {},
      lastSyncedAtByUser: isRecord(parsed.lastSyncedAtByUser) ? parsed.lastSyncedAtByUser as Record<string, string> : {},
    };
  } catch {
    return { initialMigrationByUser: {}, lastSyncedAtByUser: {} };
  }
}

function writeMeta(meta: SyncMeta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // Metadata is an optimization; a failed write must not block local work.
  }
}

function queueChange(userId: string, candidate: UploadCandidate): void {
  const queue = readQueue();
  const existingIndex = queue.findIndex((item) => item.userId === userId && item.kind === candidate.kind && item.dateKey === candidate.dateKey);
  const existing = existingIndex >= 0 ? queue[existingIndex] : undefined;
  if (existing && compareUpdatedAt(existing.updatedAt, candidate.updatedAt) > 0) return;

  const change: PendingChange = {
    id: existing?.id ?? randomId(),
    userId,
    kind: candidate.kind,
    dateKey: candidate.dateKey,
    data: candidate.data,
    updatedAt: candidate.updatedAt,
  };
  if (existingIndex >= 0) queue[existingIndex] = change;
  else queue.push(change);
  writeQueue(queue);
}

export function getPendingCount(userId?: string): number {
  const queue = readQueue();
  return userId ? queue.filter((item) => item.userId === userId).length : queue.length;
}

export function getLastSyncedAt(userId: string): string | null {
  return readMeta().lastSyncedAtByUser[userId] ?? null;
}

export function queueDataChanges(userId: string, previous: AppData, next: AppData): void {
  const dateKeys = new Set([...Object.keys(previous.dailyRecords), ...Object.keys(next.dailyRecords)]);
  for (const dateKey of dateKeys) {
    const previousRecord = previous.dailyRecords[dateKey];
    const nextRecord = next.dailyRecords[dateKey];
    if (!nextRecord || JSON.stringify(previousRecord) === JSON.stringify(nextRecord)) continue;
    const updatedAt = nextRecord.updatedAt ?? nowIso();
    queueChange(userId, { kind: "daily_record", dateKey, data: { ...nextRecord, updatedAt }, updatedAt });
  }

  if (JSON.stringify(previous.settings) !== JSON.stringify(next.settings)) {
    const updatedAt = next.settings.updatedAt ?? nowIso();
    queueChange(userId, { kind: "settings", data: { ...next.settings, updatedAt }, updatedAt });
  }
}

export function queueAllLocalData(userId: string, data: AppData): void {
  for (const [dateKey, record] of Object.entries(data.dailyRecords)) {
    const updatedAt = record.updatedAt ?? nowIso();
    queueChange(userId, { kind: "daily_record", dateKey, data: { ...record, updatedAt }, updatedAt });
  }
  const updatedAt = data.settings.updatedAt ?? nowIso();
  queueChange(userId, { kind: "settings", data: { ...data.settings, updatedAt }, updatedAt });
}

function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine;
}

async function fetchRemoteData(userId: string): Promise<RemoteSnapshot> {
  if (!supabase) throw new Error("Supabase no está configurado");

  const dailyResponse = await supabase
    .from("daily_records")
    .select("date_key,data,updated_at")
    .eq("user_id", userId);
  if (dailyResponse.error) throw new Error(dailyResponse.error.message);

  const settingsResponse = await supabase
    .from("user_settings")
    .select("data,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (settingsResponse.error) throw new Error(settingsResponse.error.message);

  const dailyRecords = new Map<string, DailyRecord>();
  for (const row of (dailyResponse.data ?? []) as unknown as RemoteDailyRow[]) {
    if (!row.date_key || !row.updated_at) continue;
    dailyRecords.set(row.date_key, sanitizeDailyRecord(row.date_key, row.data, row.updated_at));
  }

  const settingsRow = settingsResponse.data as unknown as RemoteSettingsRow | null;
  return {
    dailyRecords,
    settings: settingsRow?.updated_at ? sanitizeSettings(settingsRow.data, settingsRow.updated_at) : null,
  };
}

function mergeLocalAndRemote(local: AppData, remote: RemoteSnapshot): { data: AppData; uploads: UploadCandidate[] } {
  const data: AppData = {
    ...local,
    dailyRecords: { ...local.dailyRecords },
    settings: { ...local.settings },
  };
  const uploads: UploadCandidate[] = [];

  for (const [dateKey, remoteRecord] of remote.dailyRecords) {
    const localRecord = local.dailyRecords[dateKey];
    if (!localRecord) {
      data.dailyRecords[dateKey] = remoteRecord;
      continue;
    }

    const comparison = compareUpdatedAt(localRecord.updatedAt, remoteRecord.updatedAt);
    if (comparison > 0 || (comparison === 0 && !samePayload(localRecord, remoteRecord))) {
      const updatedAt = localRecord.updatedAt ?? nowIso();
      uploads.push({ kind: "daily_record", dateKey, data: { ...localRecord, updatedAt }, updatedAt });
    } else if (comparison < 0) {
      data.dailyRecords[dateKey] = remoteRecord;
    }
  }

  for (const [dateKey, localRecord] of Object.entries(local.dailyRecords)) {
    if (remote.dailyRecords.has(dateKey)) continue;
    const updatedAt = localRecord.updatedAt ?? nowIso();
    uploads.push({ kind: "daily_record", dateKey, data: { ...localRecord, updatedAt }, updatedAt });
  }

  if (!remote.settings) {
    const updatedAt = local.settings.updatedAt ?? nowIso();
    uploads.push({ kind: "settings", data: { ...local.settings, updatedAt }, updatedAt });
  } else {
    const comparison = compareUpdatedAt(local.settings.updatedAt, remote.settings.updatedAt);
    if (comparison > 0 || (comparison === 0 && !samePayload(local.settings, remote.settings))) {
      const updatedAt = local.settings.updatedAt ?? nowIso();
      uploads.push({ kind: "settings", data: { ...local.settings, updatedAt }, updatedAt });
    } else if (comparison < 0) {
      data.settings = remote.settings;
    }
  }

  return { data, uploads };
}

function remoteTimestamp(remote: RemoteSnapshot, change: PendingChange): string | undefined {
  if (change.kind === "settings") return remote.settings?.updatedAt;
  return change.dateKey ? remote.dailyRecords.get(change.dateKey)?.updatedAt : undefined;
}

async function flushPendingChanges(userId: string, remote: RemoteSnapshot): Promise<void> {
  if (!supabase) throw new Error("Supabase no está configurado");
  let queue = readQueue();
  const userChanges = queue.filter((item) => item.userId === userId);

  for (const change of userChanges) {
    if (compareUpdatedAt(remoteTimestamp(remote, change), change.updatedAt) > 0) {
      queue = queue.filter((item) => item.id !== change.id);
      continue;
    }

    if (change.kind === "settings") {
      const response = await supabase.from("user_settings").upsert(
        { user_id: userId, data: change.data, updated_at: change.updatedAt },
        { onConflict: "user_id" },
      );
      if (response.error) throw new Error(response.error.message);
    } else {
      if (!change.dateKey) continue;
      const response = await supabase.from("daily_records").upsert(
        { user_id: userId, date_key: change.dateKey, data: change.data, updated_at: change.updatedAt },
        { onConflict: "user_id,date_key" },
      );
      if (response.error) throw new Error(response.error.message);
    }
    queue = queue.filter((item) => item.id !== change.id);
  }

  writeQueue(queue);
}

function baseResult(data: AppData, userId: string, status: SyncStatus, error?: string): SyncResult {
  return {
    data,
    status,
    pendingCount: getPendingCount(userId),
    lastSyncedAt: getLastSyncedAt(userId),
    error,
  };
}

export async function syncAppData(userId: string, localData: AppData): Promise<SyncResult> {
  if (!isSupabaseConfigured || !supabase) return baseResult(localData, userId, "local");

  if (!isOnline()) {
    const meta = readMeta();
    if (!meta.initialMigrationByUser[userId]) queueAllLocalData(userId, localData);
    return baseResult(localData, userId, getPendingCount(userId) ? "pending" : "offline");
  }

  try {
    const remote = await fetchRemoteData(userId);
    const merged = mergeLocalAndRemote(localData, remote);
    for (const upload of merged.uploads) queueChange(userId, upload);
    await flushPendingChanges(userId, remote);

    const pendingCount = getPendingCount(userId);
    const syncedAt = nowIso();
    const meta = readMeta();
    if (pendingCount === 0) {
      meta.initialMigrationByUser[userId] = meta.initialMigrationByUser[userId] ?? syncedAt;
      meta.lastSyncedAtByUser[userId] = syncedAt;
      writeMeta(meta);
    }

    return {
      data: merged.data,
      status: pendingCount ? "pending" : "synced",
      pendingCount,
      lastSyncedAt: pendingCount ? getLastSyncedAt(userId) : syncedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo sincronizar";
    return baseResult(localData, userId, getPendingCount(userId) ? "pending" : "error", message);
  }
}

