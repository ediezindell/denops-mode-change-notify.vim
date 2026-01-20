import type { Denops, Entrypoint } from "jsr:@denops/std";
import * as autocmd from "jsr:@denops/std/autocmd";
import * as batch from "jsr:@denops/std/batch";
import * as fn from "jsr:@denops/std/function";
import * as nvim from "jsr:@denops/std/function/nvim";
import * as vars from "jsr:@denops/std/variable";

import { assert, is } from "jsr:@core/unknownutil";
import { asciiArtFilled, asciiArtOutline } from "./asciiArts.ts";
import {
  MODE_CATEGORIES,
  MODE_DISPLAY_NAME,
  ModeCategory,
} from "./ModeCategory.ts";
import { normalizeModeKey } from "./normalize.ts";

const styles = ["text", "ascii_outline", "ascii_filled"] as const;
const borders = [
  "none",
  "single",
  "double",
  "rounded",
  "solid",
  "shadow",
] as const;
const positions = [
  "top_left",
  "top_right",
  "bottom_left",
  "bottom_right",
  "center",
] as const;

type Options = {
  enabled_modes: ModeCategory[];
  style: (typeof styles)[number];
  border: (typeof borders)[number];
  timeout: number;
  position: (typeof positions)[number];
};

export const main: Entrypoint = (denops) => {
  const defaultOptions: Options = {
    enabled_modes: [...MODE_CATEGORIES],
    style: "text",
    border: "rounded",
    timeout: 500,
    position: "center",
  };
  let options: Options = { ...defaultOptions };

  const loadOptions = async (): Promise<void> => {
    const userOptions = await vars.g.get(
      denops,
      "mode_change_notify_options",
      {},
    );
    assert(
      userOptions,
      is.PartialOf(
        is.ObjectOf({
          enabled_modes: is.ArrayOf(is.LiteralOneOf(MODE_CATEGORIES)),
          style: is.LiteralOneOf(styles),
          border: is.LiteralOneOf(borders),
          timeout: is.Number,
          position: is.LiteralOneOf(positions),
        }),
      ),
    );

    options = {
      ...defaultOptions,
      ...userOptions,
    };
  };

  // Cache screen dimensions to avoid RPC calls on every mode change
  let screenWidth = 0;
  let screenHeight = 0;

  const updateDimensions = async () => {
    if (denops.meta.host === "nvim") {
      try {
        const uis = await nvim.nvim_list_uis(denops);
        assert(
          uis,
          is.ArrayOf(
            is.ObjectOf({
              width: is.Number,
              height: is.Number,
            }),
          ),
        );
        if (uis.length > 0) {
          screenWidth = uis[0].width;
          screenHeight = uis[0].height;
        }
      } catch (_) {
        const [cols, lines] = await Promise.all([
          denops.eval("&columns"),
          denops.eval("&lines"),
        ]);
        assert(cols, is.Number);
        assert(lines, is.Number);
        screenWidth = cols;
        screenHeight = lines;
      }
    } else {
      const [cols, lines] = await Promise.all([
        denops.eval("&columns"),
        denops.eval("&lines"),
      ]);
      assert(cols, is.Number);
      assert(lines, is.Number);
      screenWidth = cols;
      screenHeight = lines;
    }
  };

  const setupAutocommands = async () => {
    await loadOptions();
    await updateDimensions();

    autocmd.group(denops, "mode-change-notify", (helper) => {
      helper.define(
        "ModeChanged",
        "*",
        `call denops#request('${denops.name}', 'modeChanged', [expand('<amatch>')])`,
      );
      helper.define(
        "VimResized",
        "*",
        `call denops#request('${denops.name}', 'updateDimensions', [])`,
      );
    });
  };

  setupAutocommands();

  // Keep track of last notification windows to avoid stacking issues
  let lastVimPopupWinid: number | null = null;
  let lastNvimWinid: number | null = null;

  const showToast = async (
    denops: Denops,
    modeCategory: ModeCategory,
  ): Promise<void> => {
    let content: string[] = [];
    let windowWidth: number;
    let windowHeight: number;

    switch (options.style) {
      case "ascii_outline":
      case "ascii_filled": {
        const artSet = options.style === "ascii_outline"
          ? asciiArtOutline
          : asciiArtFilled;
        const art = artSet[modeCategory];
        if (!art) return;

        const artWidth = Math.max(...art.map((l) => l.length));
        content = art;
        windowWidth = artWidth;
        windowHeight = content.length;
        break;
      }
      default: // "text"
        content = ["", ` ${MODE_DISPLAY_NAME[modeCategory]} `, ""];
        windowWidth = MODE_DISPLAY_NAME[modeCategory].length + 2;
        windowHeight = 3;
        break;
    }

    if (screenWidth === 0 || screenHeight === 0) {
      await updateDimensions();
    }
    const width = screenWidth;
    const height = screenHeight;

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

    if (denops.meta.host === "vim") {
      // Close previous popup first to ensure new one is visible on top
      if (lastVimPopupWinid) {
        try {
          await denops.call("popup_close", lastVimPopupWinid);
        } catch (_) {
          // ignore
        }
        lastVimPopupWinid = null;
      }
      const border_prop = options.border !== "none"
        ? [1, 1, 1, 1]
        : [0, 0, 0, 0];
      const winid = (await denops.call("popup_create", content, {
        line: row,
        col,
        border: border_prop,
        zindex: 9999,
        focusable: false,
        // Use Normal highlight so background matches editor
        highlight: "Normal",
        // Make border use Normal as well to avoid odd contrast
        borderhighlight: ["Normal"],
      })) as number;
      await batch.batch(denops, async (denops) => {
        await fn.setwinvar(denops, winid, "&number", 0);
        await fn.setwinvar(denops, winid, "&relativenumber", 0);
        await fn.setwinvar(denops, winid, "&signcolumn", "no");
        await fn.setwinvar(denops, winid, "&foldcolumn", 0);
        await fn.setwinvar(denops, winid, "&statusline", "");
        await fn.setwinvar(denops, winid, "&cursorline", 0);
        await fn.setwinvar(denops, winid, "&list", 0);
      });
      lastVimPopupWinid = winid;
      setTimeout(async () => {
        try {
          await denops.call("popup_close", winid);
        } catch (error) {
          console.warn(`Failed to close window: ${error}`);
        }
      }, options.timeout);
    } else {
      // Close previous floating window first to ensure top-most
      if (lastNvimWinid) {
        try {
          await nvim.nvim_win_close(denops, lastNvimWinid, true);
        } catch (_) {
          // ignore
        }
        lastNvimWinid = null;
      }
      const buf = await nvim.nvim_create_buf(denops, false, true);
      await nvim.nvim_buf_set_lines(denops, buf, 0, -1, false, content);

      assert(buf, is.Number);

      const win = await nvim.nvim_open_win(denops, buf, false, {
        relative: "editor",
        width: windowWidth,
        height: windowHeight,
        row,
        col,
        style: "minimal",
        border: options.border,
        focusable: false,
        noautocmd: true,
      });
      setTimeout(async () => {
        try {
          await nvim.nvim_win_close(denops, win, true);
        } catch (_) {
          // ignore
        }
      }, options.timeout);
    }
  };

  denops.dispatcher = {
    async modeChanged(amatch: unknown): Promise<void> {
      assert(amatch, is.String);

      const rawModeKey = amatch.includes(":")
        ? amatch.split(":").pop()!
        : amatch;
      const modeKey = normalizeModeKey(rawModeKey);
      if (!modeKey) return;
      if (!options.enabled_modes.includes(modeKey)) return;
      await showToast(denops, modeKey);
    },

    async updateDimensions(): Promise<void> {
      await updateDimensions();
    },
  };
};
