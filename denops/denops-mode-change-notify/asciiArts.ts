import { ModeCategory } from "./ModeCategory.ts";

// Performance: Pre-compute ASCII art dimensions to avoid recalculating on every mode change
// This prevents expensive Math.max(...art.map()) operations in the hot ModeChanged event path
const computeAsciiDimensions = (art: string[]): { width: number; height: number } => {
  const width = Math.max(...art.map((line) => line.length));
  const height = art.length;
  return { width, height };
};

export const asciiArtOutline: Record<ModeCategory, string[]> = {
  n: [
    "  _   _  ",
    " | \\ | | ",
    " |  \\| | ",
    " | . ` | ",
    " | |\\  | ",
    " |_| \\_| ",
    "         ",
  ],
  i: [
    "  _____  ",
    " |_   _| ",
    "   | |   ",
    "   | |   ",
    "  _| |_  ",
    " |_____| ",
    "         ",
  ],
  v: [
    "__     __",
    "\\ \\   / /",
    " \\ \\ / / ",
    "  \\ V /  ",
    "   \\ /   ",
    "    V    ",
    "         ",
  ],
  c: [
    "   ____  ",
    "  / ___| ",
    " | |     ",
    " | |     ",
    " | |___  ",
    "  \\____| ",
    "         ",
  ],
  t: [
    "_________",
    "|__   __|",
    "   | |   ",
    "   | |   ",
    "   | |   ",
    "   |_|   ",
    "         ",
  ],
  r: [
    "  ____   ",
    " |  _ \\  ",
    " | |_) | ",
    " |  _ <  ",
    " | | \\ \\ ",
    " |_|  \\_\\",
    "         ",
  ],
};

// Performance: Pre-computed dimensions for outline ASCII art
export const asciiArtOutlineDimensions: Record<ModeCategory, { width: number; height: number }> = {
  n: computeAsciiDimensions(asciiArtOutline.n),
  i: computeAsciiDimensions(asciiArtOutline.i),
  v: computeAsciiDimensions(asciiArtOutline.v),
  c: computeAsciiDimensions(asciiArtOutline.c),
  t: computeAsciiDimensions(asciiArtOutline.t),
  r: computeAsciiDimensions(asciiArtOutline.r),
};

export const asciiArtFilled: Record<ModeCategory, string[]> = {
  n: [
    " ███╗  ██╗",
    " ████╗ ██║",
    " ██╔██╗██║",
    " ██║╚████║",
    " ██║ ╚███║",
    " ╚═╝  ╚══╝",
  ],
  i: [
    "   ████╗  ",
    "   ╚██╔╝  ",
    "    ██║   ",
    "    ██║   ",
    "   ████╗  ",
    "   ╚═══╝  ",
  ],
  v: [
    " ██╗   ██╗",
    " ██║   ██║",
    " ██║   ██║",
    " ╚██╗ ██╔╝",
    "  ╚████╔╝ ",
    "   ╚═══╝  ",
  ],
  c: [
    "  ██████╗ ",
    " ██╔════╝ ",
    " ██║      ",
    " ██║      ",
    " ╚██████╗ ",
    "  ╚═════╝ ",
  ],
  t: [
    " ████████╗",
    " ╚══██╔══╝",
    "    ██║   ",
    "    ██║   ",
    "    ██║   ",
    "    ╚═╝   ",
  ],
  r: [
    " ███████╗ ",
    " ██╔═══██╗",
    " ███████╔╝",
    " ██╔═══██╗",
    " ██║   ██║",
    " ╚═╝   ╚═╝",
  ],
};

// Performance: Pre-computed dimensions for filled ASCII art
export const asciiArtFilledDimensions: Record<ModeCategory, { width: number; height: number }> = {
  n: computeAsciiDimensions(asciiArtFilled.n),
  i: computeAsciiDimensions(asciiArtFilled.i),
  v: computeAsciiDimensions(asciiArtFilled.v),
  c: computeAsciiDimensions(asciiArtFilled.c),
  t: computeAsciiDimensions(asciiArtFilled.t),
  r: computeAsciiDimensions(asciiArtFilled.r),
};
