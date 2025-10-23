import { useHotkeys } from "react-hotkeys-hook";
import { useMemo } from "react";
import {
  type ShortcutAction,
  useSettingsStore,
} from "@/store/settings-store";
import { expandShortcutVariants } from "@/utils/shortcuts";

const NOOP_COMBO = "__disabled__";

export function useShortcut(
  action: ShortcutAction,
  handler: (event: KeyboardEvent) => void,
  deps: unknown[] = [],
) {
  const combo = useSettingsStore((state) => state.keybindings[action]);

  const combos = useMemo(() => expandShortcutVariants(combo), [combo]);
  const hotkeysInput = combos.length ? combos : [NOOP_COMBO];

  useHotkeys(hotkeysInput, handler, {
    enabled: combos.length > 0,
    preventDefault: true,
  }, deps);

  return combo;
}
