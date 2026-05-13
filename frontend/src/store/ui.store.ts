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

      addHistoryEntry: (entry) => set((state) => ({
        history: [
          { ...entry, id: generateSessionId() },
          ...state.history,
        ].slice(0, 100),
      })),

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
