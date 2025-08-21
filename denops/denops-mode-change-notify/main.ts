import type { Denops, Entrypoint } from "jsr:@denops/std";
import * as autocmd from "jsr:@denops/std/autocmd";
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
import { normalizeEnabledModes, normalizeModeKey } from "./normalize.ts";

type Options = {
  enabled_modes: ModeCategory[];
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

export const main: Entrypoint = (denops) => {
  const defaultOptions: Options = {
    enabled_modes: [...MODE_CATEGORIES],
    style: "text",
    border: "rounded",
    timeout: 500,
    position: "center",
  };

  let options = defaultOptions;

  const loadOptions = async (): Promise<void> => {
    const userOptions = await vars.g.get(
      denops,
      "mode_change_notify_options",
      {},
    );
    assert(userOptions, is.Record);
    const merged = {
      ...defaultOptions,
      ...userOptions,
    } as Options & { enabled_modes: unknown };

    const normalized = normalizeEnabledModes(
      merged.enabled_modes,
      defaultOptions.enabled_modes,
    );

    options = {
      ...merged,
      enabled_modes: normalized,
    } as Options;
  };

  const setupAutocommands = async () => {
    await loadOptions();

    autocmd.group(denops, "mode-change-notify", (helper) => {
      helper.define(
        "ModeChanged",
        "*",
        `call denops#request('${denops.name}', 'modeChanged', [expand('<amatch>')])`,
      );
    });
  };

  setupAutocommands();

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

    const width = await fn.winwidth(denops, 0);
    assert(width, is.Number);
    const height = await fn.winheight(denops, 0);
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

    if (denops.meta.host === "vim") {
      const border_prop = options.border !== "none"
        ? [1, 1, 1, 1]
        : [0, 0, 0, 0];
      const winid = (await denops.call("popup_create", content, {
        line: row,
        col,
        border: border_prop,
        focusable: false,
      })) as number;
      await fn.setwinvar(denops, winid, "&number", 0);
      await fn.setwinvar(denops, winid, "&relativenumber", 0);
      await fn.setwinvar(denops, winid, "&signcolumn", "no");
      await fn.setwinvar(denops, winid, "&foldcolumn", 0);
      await fn.setwinvar(denops, winid, "&statusline", "");
      await fn.setwinvar(denops, winid, "&cursorline", 0);
      await fn.setwinvar(denops, winid, "&list", 0);
      setTimeout(async () => {
        try {
          await denops.call("popup_close", winid);
        } catch (error) {
          console.warn(`Failed to close window: ${error}`);
        }
      }, options.timeout);
    } else {
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
      });
      setTimeout(async () => {
        try {
          const isValid = await nvim.nvim_win_is_valid(denops, win);
          if (isValid) {
            await nvim.nvim_win_close(denops, win, true);
          }
        } catch (error) {
          console.warn(`Failed to close window: ${error}`);
        }
      }, options.timeout);
    }
  };

  denops.dispatcher = {
    async modeChanged(amatch: unknown): Promise<void> {
      assert(amatch, is.String);
      const newPart = amatch.includes(":") ? amatch.split(":").pop()! : amatch;
      const key = normalizeModeKey(newPart);
      if (!key) return;
      if (!options.enabled_modes.includes(key)) return;
      await showToast(denops, key);
    },
  };
};
