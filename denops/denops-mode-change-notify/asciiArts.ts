import { ModeCategory } from "./ModeCategory.ts";

// Performance: Hard-coded ASCII art dimensions to eliminate computation during module initialization
// This removes Math.max(...art.map()) operations and prevents creating intermediate arrays
// Impact: Eliminates ~12 array iterations and 6 Math.max calls during plugin load

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

// Performance: Hard-coded dimensions for outline ASCII art
// Eliminates computeAsciiDimensions() calls during module initialization
export const asciiArtOutlineDimensions: Record<ModeCategory, { width: number; height: number }> = {
  n: { width: 9, height: 7 },
  i: { width: 9, height: 7 },
  v: { width: 9, height: 7 },
  c: { width: 9, height: 7 },
  t: { width: 9, height: 7 },
  r: { width: 9, height: 7 },
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

// Performance: Hard-coded dimensions for filled ASCII art
// Eliminates computeAsciiDimensions() calls during module initialization
export const asciiArtFilledDimensions: Record<ModeCategory, { width: number; height: number }> = {
  n: { width: 11, height: 6 },
  i: { width: 11, height: 6 },
  v: { width: 11, height: 6 },
  c: { width: 11, height: 6 },
  t: { width: 11, height: 6 },
  r: { width: 11, height: 6 },
};
