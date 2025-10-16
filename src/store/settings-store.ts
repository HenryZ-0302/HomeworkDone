import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SettingsState {
  imageBinarizing: boolean;
  setImageBinarizing: (imagePostprocessing: boolean) => void;

  showDonateBtn: boolean;
  setShowDonateBtn: (showDonateBtn: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      imageBinarizing: true,
      showDonateBtn: true,
      setImageBinarizing: (state) => set({ imageBinarizing: state }),

      setShowDonateBtn: (state) => set({ showDonateBtn: state }),
    }),
    {
      name: "skidhw-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        imagePostprocessing: state.imageBinarizing,
        showDonateBtn: state.showDonateBtn,
      }),
      version: 1,
    },
  ),
);
