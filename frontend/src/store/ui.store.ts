import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateSessionId } from '@/lib/utils';

export interface HistoryEntry {
  id: string;
  calculatorId: string;
  calculatorName: string;
  inputs: Record<string, unknown>;
  outputs: Array<Record<string, unknown>>;
  units?: Record<string, string>;
  calculatedAt: string;
  summary: string;
}

interface UIState {
  sessionId: string;
  recentCalculators: string[];
  history: HistoryEntry[];
  lastPage: string | null;
  lastFormData: Record<string, Record<string, unknown>>;
  addToRecent: (calcId: string) => void;
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id'>) => void;
  removeHistoryEntry: (id: string) => void;
  clearHistory: () => void;
  setLastPage: (path: string | null) => void;
  setFormData: (calcId: string, data: Record<string, unknown>) => void;
  getFormData: (calcId: string) => Record<string, unknown> | undefined;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sessionId: generateSessionId(),
      recentCalculators: [],
      history: [],
      lastPage: null,
      lastFormData: {},

      addToRecent: (calcId) => set((state) => {
        const filtered = state.recentCalculators.filter((id) => id !== calcId);
        return { recentCalculators: [calcId, ...filtered].slice(0, 5) };
      }),

      /**
       * Records a calculation, collapsing a run of edits into one entry.
       *
       * The calculator page calls this for every result a form emits, and forms
       * emit on each keystroke: typing a creatinine of "1.25" filed three entries
       * ("1", "1.2", "1.25"). Two of those were never a patient's value, and the
       * 100-entry cap then evicted other calculators' results about three times
       * faster than intended, so the summary under a home-screen slot vanished
       * early.
       *
       * Consecutive entries for the same calculator are the same calculation being
       * refined, so the newest replaces it in place, keeping its id. Only the most
       * recent entry per calculator is read today (the home screen looks it up with
       * history.find), so nothing observable is lost. Revisit this if a history
       * list is ever shown and two back-to-back runs of one calculator both matter.
       */
      addHistoryEntry: (entry) => set((state) => {
        const [newest, ...older] = state.history;
        const refinesNewest = newest?.calculatorId === entry.calculatorId;
        const next: HistoryEntry = {
          ...entry,
          id: refinesNewest ? newest.id : generateSessionId(),
        };
        return {
          history: [next, ...(refinesNewest ? older : state.history)].slice(0, 100),
        };
      }),

      removeHistoryEntry: (id) => set((state) => ({
        history: state.history.filter((e) => e.id !== id),
      })),

      clearHistory: () => set({ history: [] }),

      setLastPage: (path) => set({ lastPage: path }),

      setFormData: (calcId, data) => set((state) => ({
        lastFormData: { ...state.lastFormData, [calcId]: data },
      })),

      getFormData: (calcId) => get().lastFormData[calcId],
    }),
    {
      name: 'medcalc-ui-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
