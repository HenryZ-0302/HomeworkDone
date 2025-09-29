import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface GeminiState {
  geminiBaseUrl?: string;
  setGeminiBaseUrl: (url: string) => void;
  clearGeminiBaseUrl: () => void;

  geminiKey: string | null;
  setGeminiKey: (key: string) => void;
  clearGeminiKey: () => void;
  hasKey: () => boolean;

  geminiModel: string;
  setGeminiModel: (model: string) => void;

  traits?: string;
  setTraits: (traits: string) => void;
  clearTraits: () => void;

  thinkingBudget: number;
  setThinkingBudget: (thinkBudget: number) => void;
}

export const useGeminiStore = create<GeminiState>()(
  persist(
    (set, get) => ({
      geminiBaseUrl: "https://generativelanguage.googleapis.com",
      setGeminiBaseUrl: (url) => set({ geminiBaseUrl: url }),
      clearGeminiBaseUrl: () => set({ geminiBaseUrl: undefined }),

      geminiKey: null,
      setGeminiKey: (key) => set({ geminiKey: key.trim() || null }),
      clearGeminiKey: () => set({ geminiKey: null }),
      hasKey: () => Boolean(get().geminiKey),

      geminiModel: "gemini-2.5-pro",
      setGeminiModel: (model) => set({ geminiModel: model }),

      traits: undefined,
      setTraits: (traits) => set({ traits }),
      clearTraits: () => set({ traits: undefined }),

      thinkingBudget: 8192,
      setThinkingBudget: (thinkingBudget) => set({ thinkingBudget }),
    }),
    {
      name: "gemini-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        geminiKey: state.geminiKey,
        geminiBaseUrl: state.geminiBaseUrl,
        geminiModel: state.geminiModel,
        traits: state.traits,
        thinkingBudget: state.thinkingBudget,
      }),
      version: 1,
    },
  ),
);

export const useHasGeminiKey = () =>
  useGeminiStore((s) => Boolean(s.geminiKey));
