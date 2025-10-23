const MODIFIER_ORDER: Array<["ctrlKey" | "shiftKey" | "altKey" | "metaKey", string]> = [
  ["ctrlKey", "ctrl"],
  ["shiftKey", "shift"],
  ["altKey", "alt"],
  ["metaKey", "meta"],
];

const CODE_KEY_OVERRIDES: Record<string, string> = {
  Digit0: "0",
  Digit1: "1",
  Digit2: "2",
  Digit3: "3",
  Digit4: "4",
  Digit5: "5",
  Digit6: "6",
  Digit7: "7",
  Digit8: "8",
  Digit9: "9",
  Numpad0: "0",
  Numpad1: "1",
  Numpad2: "2",
  Numpad3: "3",
  Numpad4: "4",
  Numpad5: "5",
  Numpad6: "6",
  Numpad7: "7",
  Numpad8: "8",
  Numpad9: "9",
  KeyA: "a",
  KeyB: "b",
  KeyC: "c",
  KeyD: "d",
  KeyE: "e",
  KeyF: "f",
  KeyG: "g",
  KeyH: "h",
  KeyI: "i",
  KeyJ: "j",
  KeyK: "k",
  KeyL: "l",
  KeyM: "m",
  KeyN: "n",
  KeyO: "o",
  KeyP: "p",
  KeyQ: "q",
  KeyR: "r",
  KeyS: "s",
  KeyT: "t",
  KeyU: "u",
  KeyV: "v",
  KeyW: "w",
  KeyX: "x",
  KeyY: "y",
  KeyZ: "z",
};

const SPECIAL_KEYS: Record<string, string> = {
  " ": "space",
  escape: "esc",
  arrowup: "up",
  arrowdown: "down",
  arrowleft: "left",
  arrowright: "right",
  enter: "enter",
  tab: "tab",
  backspace: "backspace",
  delete: "delete",
};

const DISPLAY_LABELS_WIN: Record<string, string> = {
  ctrl: "Ctrl",
  shift: "Shift",
  alt: "Alt",
  meta: "Win",
  space: "Space",
  esc: "Esc",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  enter: "Enter",
  tab: "Tab",
  backspace: "Backspace",
  delete: "Delete",
};

const DISPLAY_LABELS_MAC: Record<string, string> = {
  ctrl: "⌃",
  shift: "⇧",
  alt: "⌥",
  meta: "⌘",
  space: "Space",
  esc: "Esc",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  enter: "Return",
  tab: "Tab",
  backspace: "Delete",
  delete: "Del",
};

const isMac =
  typeof window !== "undefined" &&
  typeof navigator !== "undefined" &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform);

const DISPLAY_MAP = isMac ? DISPLAY_LABELS_MAC : DISPLAY_LABELS_WIN;

const MODIFIER_ALIASES: Record<string, string> = {
  ctrl: "ctrl",
  control: "ctrl",
  cmd: "meta",
  command: "meta",
  meta: "meta",
  option: "alt",
  alt: "alt",
  shift: "shift",
  win: "meta",
  super: "meta",
};

const SPECIAL_KEY_ALIASES: Record<string, string> = {
  esc: "esc",
  escape: "esc",
  space: "space",
  enter: "enter",
  return: "enter",
  tab: "tab",
  backspace: "backspace",
  delete: "delete",
  del: "delete",
  up: "up",
  arrowup: "up",
  "arrow-up": "up",
  down: "down",
  arrowdown: "down",
  "arrow-down": "down",
  left: "left",
  arrowleft: "left",
  "arrow-left": "left",
  right: "right",
  arrowright: "right",
  "arrow-right": "right",
};

const isModifier = (token: string) => token in MODIFIER_ALIASES;

export function buildShortcutFromKeyboardEvent(
  event: KeyboardEvent,
): string | null {
  const modifiers: string[] = [];
  for (const [prop, token] of MODIFIER_ORDER) {
    if (event[prop]) {
      modifiers.push(token);
    }
  }

  const rawKey = event.key?.toLowerCase() ?? "";
  const codeKey = event.code ? CODE_KEY_OVERRIDES[event.code] : undefined;

  if (!rawKey && !codeKey) return null;

  let normalizedKey: string | null = null;

  if (rawKey && SPECIAL_KEYS[rawKey]) {
    normalizedKey = SPECIAL_KEYS[rawKey];
  } else if (codeKey) {
    normalizedKey = codeKey;
  } else if (rawKey) {
    normalizedKey = rawKey.length === 1 ? rawKey : rawKey.replace(/\s+/g, "");
  }

  if (!normalizedKey) return null;

  if (
    normalizedKey === "control" ||
    normalizedKey === "shift" ||
    normalizedKey === "alt" ||
    normalizedKey === "meta"
  ) {
    // Ignore standalone modifier presses.
    return modifiers.length ? modifiers.join("+") : null;
  }

  const combo = [...modifiers];
  combo.push(normalizedKey);

  return normalizeShortcutTokens(combo);
}

export function formatShortcutLabel(shortcut?: string | null): string | null {
  if (!shortcut) return null;
  const variants = expandShortcutVariants(shortcut);
  const target = variants.length
    ? variants
        .slice()
        .sort((a, b) => {
          const aLen = a.split("+").filter(Boolean).length;
          const bLen = b.split("+").filter(Boolean).length;
          return aLen === bLen ? a.localeCompare(b) : aLen - bLen;
        })[0]
    : shortcut;

  const parts = target.split("+").filter(Boolean);
  if (parts.length === 0) return null;

  const formatted = parts
    .map((part) => {
      if (DISPLAY_MAP[part]) return DISPLAY_MAP[part];
      if (part.length === 1) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" + ");

  return formatted;
}

export function expandShortcutVariants(shortcut?: string | null): string[] {
  if (!shortcut) return [];

  const normalized = shortcut
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (!normalized.length) return [];

  const modifiers = normalized.slice(0, -1);
  const key = normalized[normalized.length - 1];

  const variants = new Set<string>();
  variants.add(normalized.join("+"));

  const withoutShift = modifiers.filter((part) => part !== "shift");

  if (/^[0-9]$/.test(key)) {
    if (!modifiers.includes("shift")) {
      if (modifiers.length > 0) {
        variants.add([...modifiers, "shift", key].join("+"));
      }
    } else if (withoutShift.length > 0) {
      variants.add([...withoutShift, key].join("+"));
    }
  }

  return Array.from(variants).filter(Boolean);
}

function normalizeShortcutTokens(tokens: string[]): string | null {
  if (!tokens.length) return null;

  const modifiers = new Set<string>();
  const nonModifiers: string[] = [];

  for (const token of tokens) {
    const lower = token.trim().toLowerCase();
    if (!lower) continue;

    if (isModifier(lower)) {
      modifiers.add(MODIFIER_ALIASES[lower]);
      continue;
    }

    const digitMatch = lower.match(/^[0-9]$/);
    if (digitMatch) {
      nonModifiers.push(digitMatch[0]);
      continue;
    }

    if (/^f([1-9]|1[0-2])$/.test(lower)) {
      nonModifiers.push(lower);
      continue;
    }

    if (lower.length === 1) {
      nonModifiers.push(lower);
      continue;
    }

    if (SPECIAL_KEY_ALIASES[lower]) {
      nonModifiers.push(SPECIAL_KEY_ALIASES[lower]);
      continue;
    }

    return null;
  }

  if (nonModifiers.length !== 1) return null;

  const orderedModifiers = MODIFIER_ORDER.map(([, token]) => token).filter((token) =>
    modifiers.has(token),
  );

  return [...orderedModifiers, nonModifiers[0]].join("+");
}

export function parseShortcutString(input?: string | null): string | null {
  if (!input) return null;
  const rawTokens = input
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  return normalizeShortcutTokens(rawTokens);
}
