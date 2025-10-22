import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";
export type LanguagePreference = "en" | "zh";

const DEFAULT_LANGUAGE: LanguagePreference =
  typeof window !== "undefined" && window.navigator.language.startsWith("zh")
    ? "zh"
    : "en";

export interface SettingsState {
  imageBinarizing: boolean;
  setImageBinarizing: (imagePostprocessing: boolean) => void;

  showDonateBtn: boolean;
  setShowDonateBtn: (showDonateBtn: boolean) => void;

  theme: ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;

  language: LanguagePreference;
  setLanguage: (language: LanguagePreference) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      imageBinarizing: true,
      showDonateBtn: true,
      theme: "system",
      language: DEFAULT_LANGUAGE,

      setImageBinarizing: (state) => set({ imageBinarizing: state }),
      setShowDonateBtn: (state) => set({ showDonateBtn: state }),
      setThemePreference: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "skidhw-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        imagePostprocessing: state.imageBinarizing,
        showDonateBtn: state.showDonateBtn,
        theme: state.theme,
        language: state.language,
      }),
      version: 2,
    },
  ),
);
