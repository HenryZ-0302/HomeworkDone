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
    }),
    {
      name: "gemini-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ geminiKey: state.geminiKey }),
      version: 1,
    },
  ),
);

export const useHasGeminiKey = () =>
  useGeminiStore((s) => Boolean(s.geminiKey));
