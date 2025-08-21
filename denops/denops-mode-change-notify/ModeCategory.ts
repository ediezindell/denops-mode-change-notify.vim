export const MODE_CATEGORIES = ["n", "i", "v", "c", "t", "r"] as const;
export type ModeCategory = (typeof MODE_CATEGORIES)[number];
export const MODE_DISPLAY_NAME: Record<ModeCategory, string> = {
  n: "Normal",
  i: "Insert",
  v: "Visual",
  c: "Command",
  t: "Terminal",
  r: "Replace",
};
