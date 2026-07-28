// localStorage progress tracking, namespaced by schema version + instrument so a
// future instrument or data-shape change never collides with existing data.

export interface ModeStats {
  correct: number;
  attempted: number;
}

type ProgressStore = Record<string, ModeStats>;

function storageKey(instrumentId: string): string {
  return `mnt.v1.${instrumentId}.progress`;
}

function load(instrumentId: string): ProgressStore {
  try {
    const raw = localStorage.getItem(storageKey(instrumentId));
    return raw ? (JSON.parse(raw) as ProgressStore) : {};
  } catch {
    return {};
  }
}

function save(instrumentId: string, store: ProgressStore): void {
  try {
    localStorage.setItem(storageKey(instrumentId), JSON.stringify(store));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — progress just won't persist.
  }
}

export function recordAttempt(instrumentId: string, modeId: string, correct: boolean): ModeStats {
  const store = load(instrumentId);
  const current = store[modeId] ?? { correct: 0, attempted: 0 };
  const updated: ModeStats = {
    correct: current.correct + (correct ? 1 : 0),
    attempted: current.attempted + 1,
  };
  store[modeId] = updated;
  save(instrumentId, store);
  return updated;
}

export function getStats(instrumentId: string, modeId: string): ModeStats {
  return load(instrumentId)[modeId] ?? { correct: 0, attempted: 0 };
}

export function resetStats(instrumentId: string, modeId: string): ModeStats {
  const store = load(instrumentId);
  const cleared: ModeStats = { correct: 0, attempted: 0 };
  store[modeId] = cleared;
  save(instrumentId, store);
  return cleared;
}

export function getAllStats(instrumentId: string): ProgressStore {
  return load(instrumentId);
}
