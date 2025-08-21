import { MODE_DISPLAY_NAME, ModeCategory } from "./ModeCategory.ts";

const VISUAL_VARIANTS = new Set<string>(["v", "V", "\x16", "^V", "<C-v>"]); // raw mode strings indicating Visual family

export function normalizeModeKey(raw: unknown): ModeCategory | null {
  const m0 = String(raw ?? "");
  if (!m0) return null;
  // Replace family
  if (m0.startsWith("R")) {
    return "r";
  }
  // Visual family
  if (VISUAL_VARIANTS.has(m0)) {
    return "v"; // consolidate to Visual category
  }
  // Single-letter prefixes for major groups
  const h = m0[0];
  switch (h) {
    case "n":
    case "i":
    case "c":
    case "t":
    case "r":
      return h;
  }
  return null;
}

export function normalizeEnabledModes(
  raw: unknown,
  fallback: ModeCategory[],
): ModeCategory[] {
  if (!Array.isArray(raw)) return fallback;
  const mapped = raw
    .map((x) => normalizeModeKey(x))
    .filter(
      (x): x is ModeCategory =>
        Boolean(x) && (x as ModeCategory) in MODE_DISPLAY_NAME,
    );
  const uniq = Array.from(new Set(mapped));
  return uniq.length > 0 ? uniq : fallback;
}
