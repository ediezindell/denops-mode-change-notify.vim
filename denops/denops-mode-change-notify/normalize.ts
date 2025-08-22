import { ModeCategory } from "./ModeCategory.ts";

const isVisualVariant = (x: string): boolean => {
  const VISUAL_VARIANTS = new Set<string>(["v", "V", "\x16", "^V", "<C-v>"]); // raw mode strings indicating Visual family
  const lower = x.toLowerCase();
  return VISUAL_VARIANTS.has(x) || lower === "<c-v>" || x === "^V";
};
const isReplaceVariant = (x: string): boolean => {
  return x.startsWith("R");
};

export function normalizeModeKey(rawModeKey: string): ModeCategory | null {
  if (!rawModeKey) return null;
  if (isVisualVariant(rawModeKey)) {
    return "v";
  }
  if (isReplaceVariant(rawModeKey)) {
    return "r";
  }

  // Single-letter prefixes for major groups
  const h = rawModeKey[0];
  switch (h) {
    case "n":
    case "i":
    case "c":
    case "t":
      return h;
  }
  return null;
}
