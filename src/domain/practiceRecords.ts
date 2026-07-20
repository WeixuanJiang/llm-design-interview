// Per-question practice outcomes, persisted in localStorage so badges, chapter
// mastery, and the "Review missed" filter survive reloads. Pure functions only;
// React components own the state and persistence wiring.

export const PRACTICE_RECORDS_STORAGE_KEY = "ai-system-design-gym.practice-records.v1";

export interface PracticeRecord {
  attempts: number;
  correct: number;
  lastAttemptAt: string;
}

export type PracticeRecordMap = Record<string, PracticeRecord>;

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

function isPracticeRecord(value: unknown): value is PracticeRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.attempts === "number" && Number.isFinite(record.attempts) && record.attempts >= 0 &&
    typeof record.correct === "number" && Number.isFinite(record.correct) && record.correct >= 0 &&
    typeof record.lastAttemptAt === "string"
  );
}

export function loadPracticeRecords(storage: StorageReader = localStorage): PracticeRecordMap {
  try {
    const raw = storage.getItem(PRACTICE_RECORDS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const records: PracticeRecordMap = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (isPracticeRecord(value)) {
        records[id] = { attempts: value.attempts, correct: value.correct, lastAttemptAt: value.lastAttemptAt };
      }
    }
    return records;
  } catch {
    return {};
  }
}

export function savePracticeRecords(records: PracticeRecordMap, storage: StorageWriter = localStorage): PracticeRecordMap {
  storage.setItem(PRACTICE_RECORDS_STORAGE_KEY, JSON.stringify(records));
  return records;
}

// Returns a new map so callers can use it directly in a React state update.
export function recordPracticeAttempt(records: PracticeRecordMap, id: string, correct: boolean, at: string = new Date().toISOString()): PracticeRecordMap {
  const previous = records[id];
  return {
    ...records,
    [id]: {
      attempts: (previous?.attempts ?? 0) + 1,
      correct: (previous?.correct ?? 0) + (correct ? 1 : 0),
      lastAttemptAt: at,
    },
  };
}

export function isPracticeMastered(record: PracticeRecord | undefined): boolean {
  return Boolean(record && record.correct > 0);
}

export function isPracticeMissed(record: PracticeRecord | undefined): boolean {
  return Boolean(record && record.attempts > 0 && record.correct === 0);
}

export function practiceMastery(records: PracticeRecordMap, ids: string[]): { mastered: number; total: number } {
  return { mastered: ids.filter((id) => isPracticeMastered(records[id])).length, total: ids.length };
}
