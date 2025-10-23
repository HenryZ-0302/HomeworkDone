import { Kbd } from "./ui/kbd";
import { formatShortcutLabel } from "@/utils/shortcuts";

export interface ShortcutHintProps {
  shortcut?: string | null;
}

export function ShortcutHint({ shortcut }: ShortcutHintProps) {
  const label = formatShortcutLabel(shortcut);
  if (!shortcut || !label) return null;
  return <Kbd>{label}</Kbd>;
}
