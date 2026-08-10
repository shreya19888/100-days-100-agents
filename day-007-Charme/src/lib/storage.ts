const STORAGE_KEY = "charme.state.v1";

import type { PersistedCharmeState } from "@/types";

export function loadCharmeState(): PersistedCharmeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedCharmeState;
  } catch {
    return null;
  }
}

export function saveCharmeState(state: PersistedCharmeState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearCharmeState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function upsertState(patch: Partial<PersistedCharmeState>): PersistedCharmeState {
  const current = loadCharmeState() || { version: 1 as const, checkIns: [] };
  const next: PersistedCharmeState = {
    ...current,
    ...patch,
    version: 1,
    checkIns: patch.checkIns ?? current.checkIns ?? [],
  };
  saveCharmeState(next);
  return next;
}
