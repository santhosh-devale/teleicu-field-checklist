import type { ResponsesMap, SignaturesState, VisitMeta } from '../types';

const KEY = 'teleicu-field-visit-draft-v1';

export interface DraftState {
  meta: VisitMeta;
  responses: ResponsesMap;
  signatures: SignaturesState;
  currentStep: number;
  savedAt: string;
}

export function saveDraft(state: Omit<DraftState, 'savedAt'>) {
  try {
    const payload: DraftState = { ...state, savedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // storage unavailable (private mode / quota) - fail silently, data stays in memory
  }
}

export function loadDraft(): DraftState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftState;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
