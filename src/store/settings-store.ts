import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SettingsState {
  imageBinarizing: boolean;
  setImageBinarizing: (imagePostprocessing: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      imageBinarizing: true,
      setImageBinarizing: (imagePostprocessing) =>
        set({ imageBinarizing: imagePostprocessing }),
    }),
    {
      name: "skidhw-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        imagePostprocessing: state.imageBinarizing,
      }),
      version: 1,
    },
  ),
);
