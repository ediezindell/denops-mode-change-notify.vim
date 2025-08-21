import type { Entrypoint } from "jsr:@denops/std";
import * as autocmd from "jsr:@denops/std/autocmd";
import * as nvim from "jsr:@denops/std/function/nvim";
import * as vars from "jsr:@denops/std/variable";

import { assert, is } from "jsr:@core/unknownutil";

const asciiArtOutline: Record<string, string[]> = {
  Normal: [
    "  _   _  ",
    " | \\ | | ",
    " |  \\| | ",
    " | . ` | ",
    " | |\\  | ",
    " |_| \\_| ",
    "         ",
  ],
  Insert: [
    "  _____  ",
    " |_   _| ",
    "   | |   ",
    "   | |   ",
    "  _| |_  ",
    " |_____| ",
    "         ",
  ],
  Visual: [
    "__     __",
    "\\ \\   / /",
    " \\ \\ / / ",
    "  \\ V /  ",
    "   \\ /   ",
    "    V    ",
    "         ",
  ],
  Command: [
    "   ____  ",
    "  / ___| ",
    " | |     ",
    " | |     ",
    " | |___  ",
    "  \\____| ",
    "         ",
  ],
  Terminal: [
    "_________",
    "|__   __|",
    "   | |   ",
    "   | |   ",
    "   | |   ",
    "   |_|   ",
    "         ",
  ],
  Replace: [
    "  ____   ",
    " |  _ \\  ",
    " | |_) | ",
    " |  _ <  ",
    " | | \\ \\ ",
    " |_|  \\_\\",
    "         ",
  ],
};

const asciiArtFilled: Record<string, string[]> = {
  Normal: [
    " ███╗  ██╗",
    " ████╗ ██║",
    " ██╔██╗██║",
    " ██║╚████║",
    " ██║ ╚███║",
    " ╚═╝  ╚══╝",
  ],
  Insert: [
    "   ████╗  ",
    "   ╚██╔╝  ",
    "    ██║   ",
    "    ██║   ",
    "   ████╗  ",
    "   ╚═══╝  ",
  ],
  Visual: [
    " ██╗   ██╗",
    " ██║   ██║",
    " ██║   ██║",
    " ╚██╗ ██╔╝",
    "  ╚████╔╝ ",
    "   ╚═══╝  ",
  ],
  Command: [
    "  ██████╗ ",
    " ██╔════╝ ",
    " ██║      ",
    " ██║      ",
    " ╚██████╗ ",
    "  ╚═════╝ ",
  ],
  Terminal: [
    " ████████╗",
    " ╚══██╔══╝",
    "    ██║   ",
    "    ██║   ",
    "    ██║   ",
    "    ╚═╝   ",
  ],
  Replace: [
    " ███████╗ ",
    " ██╔═══██╗",
    " ███████╔╝",
    " ██╔═══██╗",
    " ██║   ██║",
    " ╚═╝   ╚═╝",
  ],
};

const modeNameMap = {
  n: "Normal",
  i: "Insert",
  v: "Visual",
  c: "Command",
  t: "Terminal",
  r: "Replace",
} as const;

type ModeInitial = keyof typeof modeNameMap;
// type ModeName = (typeof modeNameMap)[ModeInitial];
type Options = {
  enabled_modes: ModeInitial[];
  style: "text" | "ascii_outline" | "ascii_filled";
  border: "none" | "single" | "double" | "rounded" | "solid" | "shadow";
  timeout: number;
  position:
    | "center"
    | "top_left"
    | "top_right"
    | "bottom_left"
    | "bottom_right";
};

const getOptions = (userOptions: Record<PropertyKey, unknown>): Options => {
  const defaultOptions: Options = {
    enabled_modes: Object.keys(modeNameMap) as ModeInitial[],
    style: "text",
    border: "rounded",
    timeout: 500,
    position: "center",
  };
  return {
    ...defaultOptions,
    ...userOptions,
  };
};

export const main: Entrypoint = (denops) => {
  const setupAutocommands = async () => {
    const userOptions = await vars.g.get(
      denops,
      "mode_change_notify_options",
      {},
    );
    assert(userOptions, is.Record);

    const options = getOptions(userOptions);

    autocmd.group(denops, "mode-change-notify", (helper) => {
      options.enabled_modes.forEach((initial) => {
        const modeName = modeNameMap[initial];
        if (!modeName) {
          console.warn(`Unknown mode initial: ${initial}`);
          return;
        }
        helper.define(
          "ModeChanged",
          `*:${initial}`,
          `call denops#request('${denops.name}', 'showToast', ['${modeName}'])`,
        );
      });
    });
  };

  setupAutocommands();

  denops.dispatcher = {
    async showToast(message: unknown): Promise<void> {
      assert(message, is.String);

      const userOptions = await vars.g.get(
        denops,
        "mode_change_notify_options",
        {},
      );
      assert(userOptions, is.Record);

      const options = getOptions(userOptions);

      const buf = await nvim.nvim_create_buf(denops, false, true);
      assert(buf, is.Number);

      let content: string[] = [];
      let windowWidth: number;
      let windowHeight: number;

      switch (options.style) {
        case "ascii_outline":
        case "ascii_filled": {
          const artSet = options.style === "ascii_outline"
            ? asciiArtOutline
            : asciiArtFilled;
          const art = artSet[message];
          if (!art) return;

          const artWidth = Math.max(...art.map((l) => l.length));

          content = art;
          windowWidth = artWidth;
          windowHeight = content.length;
          break;
        }
        default: // "text"
          content = ["", ` ${message} `, ""];
          windowWidth = message.length + 2;
          windowHeight = 3;
          break;
      }

      await nvim.nvim_buf_set_lines(denops, buf, 0, -1, false, content);

      const width = await nvim.nvim_get_option_value(denops, "columns", {});
      assert(width, is.Number);
      const height = await nvim.nvim_get_option_value(denops, "lines", {});
      assert(height, is.Number);

      let row: number;
      let col: number;
      const margin = 1;

      switch (options.position) {
        case "top_left":
          row = margin;
          col = margin;
          break;
        case "top_right":
          row = margin;
          col = width - windowWidth - margin;
          break;
        case "bottom_left":
          row = height - windowHeight - margin;
          col = margin;
          break;
        case "bottom_right":
          row = height - windowHeight - margin;
          col = width - windowWidth - margin;
          break;
        default: // center
          row = Math.floor((height - windowHeight) / 2);
          col = Math.floor((width - windowWidth) / 2);
          break;
      }

      const win = await nvim.nvim_open_win(denops, buf, false, {
        relative: "editor",
        width: windowWidth,
        height: windowHeight,
        row,
        col,
        style: "minimal",
        border: options.border,
        focusable: false,
      });

      setTimeout(async () => {
        try {
          const isValid = await nvim.nvim_win_is_valid(denops, win);
          assert(isValid, is.Boolean);
          if (isValid) {
            await nvim.nvim_win_close(denops, win, true);
          }
        } catch (error) {
          console.warn(`Failed to close window: ${error}`);
        }
      }, options.timeout);
    },
    reload: setupAutocommands,
  };
};
