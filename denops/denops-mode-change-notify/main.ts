import type { Entrypoint } from "jsr:@denops/std";
import * as autocmd from "jsr:@denops/std/autocmd";
import * as nvim from "jsr:@denops/std/function/nvim";
import * as vars from "jsr:@denops/std/variable";

import { assert, is } from "jsr:@core/unknownutil";

const asciiArtOutline: Record<string, string[]> = {
  "Normal": [
    " _   _ ",
    "| \\ | |",
    "|  \\| |",
    "| . ` |",
    "| |\\  |",
    "|_| \\_|",
  ],
  "Insert": [
    " _____ ",
    "|_   _|",
    "  | |  ",
    "  | |  ",
    " _| |_ ",
    "|_____|",
  ],
  "Visual": [
    "__     __",
    "\\ \\   / /",
    " \\ \\ / / ",
    "  \\ V /  ",
    "   \\ /   ",
    "    V    ",
  ],
};

const asciiArtFilled: Record<string, string[]> = {
  "Normal": [
    "███╗   ██╗",
    "████╗  ██║",
    "██╔██╗ ██║",
    "██║╚██╗██║",
    "██║ ╚████║",
    "╚═╝  ╚═══╝",
  ],
  "Insert": [
    "██╗",
    "██║",
    "██║",
    "██║",
    "██║",
    "╚═╝",
  ],
  "Visual": [
    "██╗   ██╗",
    "██║   ██║",
    "██║   ██║",
    "╚██╗ ██╔╝",
    " ╚████╔╝ ",
    "  ╚═══╝  ",
  ],
};

export const main: Entrypoint = (denops) => {
  autocmd.group(denops, "mode-change-notify", (helper) => {
    ["Insert", "Normal", "Visual"].forEach((mode) => {
      const initial = mode.slice(0, 1).toLowerCase();
      helper.define(
        "ModeChanged",
        `*:${initial}`,
        `call denops#request('${denops.name}', 'showToast', ['${mode}', 500])`,
      );
    });
  });
  denops.dispatcher = {
    async showToast(message: unknown, timeout: unknown): Promise<void> {
      assert(message, is.String);
      assert(timeout, is.Number);

      const style = await vars.g.get(
        denops,
        "mode_change_notify_style",
        "text",
      );
      assert(style, is.String);

      const buf = await nvim.nvim_create_buf(denops, false, true);
      assert(buf, is.Number);

      let content: string[] = [];
      let windowWidth: number;
      let windowHeight: number;

      switch (style) {
        case "ascii_outline":
        case "ascii_filled": {
          const artSet = style === "ascii_outline"
            ? asciiArtOutline
            : asciiArtFilled;
          const art = artSet[message];
          if (!art) return;

          const artHeight = art.length;
          const artWidth = Math.max(...art.map((l) => l.length));

          const paddedArt = art.map((line) => {
            const padding = " ".repeat(artWidth - line.length);
            return ` ${line}${padding} `;
          });

          content = ["", ...paddedArt, ""];
          windowWidth = artWidth + 2;
          windowHeight = artHeight + 2;
          break;
        }
        default: // "text"
          content = ["", ` ${message} `, ""];
          windowWidth = message.length + 4;
          windowHeight = 3;
          break;
      }

      await nvim.nvim_buf_set_lines(denops, buf, 0, -1, false, content);

      const width = await nvim.nvim_get_option_value(denops, "columns", {});
      assert(width, is.Number);
      const height = await nvim.nvim_get_option_value(denops, "lines", {});
      assert(height, is.Number);

      const border = await vars.g.get(
        denops,
        "mode_change_notify_border_style",
        "rounded",
      );
      assert(border, is.String);

      const win = await nvim.nvim_open_win(denops, buf, false, {
        relative: "editor",
        width: windowWidth,
        height: windowHeight,
        row: Math.floor((height - windowHeight) / 2),
        col: Math.floor((width - windowWidth) / 2),
        style: "minimal",
        border,
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
      }, timeout);
    },
  };
};
