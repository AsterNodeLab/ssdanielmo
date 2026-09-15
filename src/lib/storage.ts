import type { AppData, AppSettings, BlockOverride, CompletionRecord, DailyRecord } from "../types";

export const STORAGE_KEY = "routine-os-data-v1";
export const ACTIVE_USER_KEY = "routine-os-active-user-v1";
const USER_STORAGE_PREFIX = "routine-os-data-v1-user-";

const defaultSettings: AppSettings = {
  theme: "light",
  vibration: true,
  focusMode: false,
  updatedAt: new Date().toISOString(),
};

export function createEmptyDailyRecord(dateKey: string): DailyRecord {
  return { dateKey, blocks: {}, overrides: {}, updatedAt: new Date().toISOString() };
}

export function createInitialData(): AppData {
  return {
    version: 1,
    dailyRecords: {},
    settings: { ...defaultSettings },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validTimestamp(value: unknown, fallback: string): string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : fallback;
}

function cleanCompletion(value: unknown): CompletionRecord {
  if (!isRecord(value)) return {};
  return {
    completedAt: typeof value.completedAt === "string" ? value.completedAt : undefined,
    skippedAt: typeof value.skippedAt === "string" ? value.skippedAt : undefined,
    unamSubject: typeof value.unamSubject === "string" ? value.unamSubject : undefined,
    activeRecall: typeof value.activeRecall === "boolean" ? value.activeRecall : undefined,
    eduvoOutput: typeof value.eduvoOutput === "string" ? value.eduvoOutput.slice(0, 160) : undefined,
  };
}

function cleanOverride(value: unknown): BlockOverride | null {
  if (!isRecord(value)) return null;
  return {
    title: typeof value.title === "string" ? value.title.slice(0, 100) : undefined,
    description: typeof value.description === "string" ? value.description.slice(0, 180) : undefined,
    start: typeof value.start === "string" ? value.start : undefined,
    end: typeof value.end === "string" ? value.end : undefined,
  };
}

export function sanitizeDailyRecord(dateKey: string, value: unknown, fallbackUpdatedAt = new Date().toISOString()): DailyRecord {
  const rawRecord = isRecord(value) ? value : {};
  const rawBlocks = isRecord(rawRecord.blocks) ? rawRecord.blocks : {};
  const blocks: DailyRecord["blocks"] = {};
  for (const [blockId, rawCompletion] of Object.entries(rawBlocks)) blocks[blockId] = cleanCompletion(rawCompletion);

  const rawOverrides = isRecord(rawRecord.overrides) ? rawRecord.overrides : {};
  const overrides: DailyRecord["overrides"] = {};
  for (const [blockId, rawOverride] of Object.entries(rawOverrides)) {
    const override = cleanOverride(rawOverride);
    if (override) overrides[blockId] = override;
  }

  return {
    dateKey,
    blocks,
    overrides,
    updatedAt: validTimestamp(rawRecord.updatedAt, fallbackUpdatedAt),
  };
}

export function sanitizeSettings(value: unknown, fallbackUpdatedAt = new Date().toISOString()): AppSettings {
  const rawSettings = isRecord(value) ? value : {};
  return {
    theme: rawSettings.theme === "dark" ? "dark" : "light",
    vibration: rawSettings.vibration !== false,
    focusMode: rawSettings.focusMode === true,
    updatedAt: validTimestamp(rawSettings.updatedAt, fallbackUpdatedAt),
  };
}

function cleanData(value: unknown): AppData {
  const initial = createInitialData();
  if (!isRecord(value)) return initial;

  const legacyUpdatedAt = new Date().toISOString();
  const rawRecords = isRecord(value.dailyRecords) ? value.dailyRecords : {};
  const dailyRecords: AppData["dailyRecords"] = {};
  for (const [dateKey, rawRecord] of Object.entries(rawRecords)) {
    dailyRecords[dateKey] = sanitizeDailyRecord(dateKey, rawRecord, legacyUpdatedAt);
  }

  return {
    version: 1,
    dailyRecords,
    settings: sanitizeSettings(value.settings, legacyUpdatedAt),
  };
}

function userStorageKey(userId: string): string {
  return `${USER_STORAGE_PREFIX}${userId}`;
}

function readData(key: string): AppData | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? cleanData(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeData(key: string, data: AppData): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage can be unavailable in a private browser context; the UI still works for the session.
  }
}

export function loadAppData(): AppData {
  return readData(STORAGE_KEY) ?? createInitialData();
}

export function saveAppData(data: AppData): void {
  writeData(STORAGE_KEY, data);
}

export function loadAppDataForUser(userId: string): AppData | null {
  return readData(userStorageKey(userId));
}

export function saveAppDataForUser(userId: string, data: AppData): void {
  writeData(userStorageKey(userId), data);
}

/**
 * Isolates local caches by authenticated user. The first login can adopt the
 * existing anonymous cache; later accounts receive their own empty/cache data.
 */
export function prepareAppDataForUser(userId: string, anonymousData: AppData): AppData {
  const existing = loadAppDataForUser(userId);
  if (existing) {
    localStorage.setItem(ACTIVE_USER_KEY, userId);
    return existing;
  }

  const previousOwner = localStorage.getItem(ACTIVE_USER_KEY);
  const data = !previousOwner || previousOwner === userId ? anonymousData : createInitialData();
  saveAppDataForUser(userId, data);
  localStorage.setItem(ACTIVE_USER_KEY, userId);
  return data;
}

export function parseBackup(raw: string): AppData {
  return cleanData(JSON.parse(raw));
}

export function serializeBackup(data: AppData): string {
  return JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2);
}

