import { ModeCategory } from "./ModeCategory.ts";

const VISUAL_VARIANTS = new Set<string>(["v", "V", "\x16", "^V", "<C-v>"]); // raw mode strings indicating Visual family

// Performance: Fast character code check for most common visual variants before Set lookup
const isVisualVariant = (x: string): boolean => {
  // Fast path: check single character variants using character codes
  if (x.length === 1) {
    const charCode = x.charCodeAt(0);
    return charCode === 118 || charCode === 86 || charCode === 22; // 'v', 'V', '\x16'
  }
  // Fallback for multi-character variants
  const lower = x.toLowerCase();
  return VISUAL_VARIANTS.has(x) || lower === "<c-v>" || x === "^V";
};

// Performance: Use character code instead of string.startsWith for hot path
const isReplaceVariant = (x: string): boolean => {
  return x.charCodeAt(0) === 82; // 'R'
};

export function normalizeModeKey(rawModeKey: string): ModeCategory | null {
  if (!rawModeKey) return null;
  if (isVisualVariant(rawModeKey)) {
    return "v";
  }
  if (isReplaceVariant(rawModeKey)) {
    return "r";
  }

  // Performance: Use character codes instead of string comparisons for hot path mode detection
  // Character code comparisons are faster than string comparisons in JavaScript engines
  const charCode = rawModeKey.charCodeAt(0);
  switch (charCode) {
    case 110: // 'n'
      return "n";
    case 105: // 'i'
      return "i";
    case 99:  // 'c'
      return "c";
    case 116: // 't'
      return "t";
  }
  return null;
}
