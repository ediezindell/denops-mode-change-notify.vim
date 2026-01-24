import type { Denops, Entrypoint } from "jsr:@denops/std";
import * as autocmd from "jsr:@denops/std/autocmd";
import * as batch from "jsr:@denops/std/batch";
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
  highlight: string;
};

const VIM_BORDER_CHARS: Record<string, string[]> = {
  single: ["─", "│", "─", "│", "┌", "┐", "┘", "└"],
  double: ["═", "║", "═", "║", "╔", "╗", "╝", "╚"],
  rounded: ["─", "│", "─", "│", "╭", "╮", "╯", "╰"],
  solid: [" ", " ", " ", " ", " ", " ", " ", " "],
};

const getVimBorderChars = (style: string): string[] | undefined => {
  return VIM_BORDER_CHARS[style];
};

export const main: Entrypoint = (denops) => {
  const defaultOptions: Options = {
    enabled_modes: [...MODE_CATEGORIES],
    style: "text",
    border: "rounded",
    timeout: 500,
    position: "center",
    highlight: "Normal",
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
          highlight: is.String,
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
  // Cache ambiwidth to avoid RPC calls on every mode change
  let currentAmbiwidth = "single";
  // Cache last displayed toast dimensions to avoid RPC calls during resize
  let lastToastWidth = 0;
  let lastToastHeight = 0;

  // Cache ASCII art dimensions to avoid recalculating on every mode change
  const toastCache = new Map<
    string,
    { content: string[]; width: number; height: number; bufnr?: number }
  >();

  const updateAmbiwidth = async () => {
    const val = await denops.eval("&ambiwidth");
    assert(val, is.String);
    currentAmbiwidth = val;
  };

  const calculatePosition = (
    windowWidth: number,
    windowHeight: number,
    width: number,
    height: number,
  ): { row: number; col: number } => {
    const margin = 1;

    if (options.position === "top_left") {
      return { row: margin, col: margin };
    }
    if (options.position === "top_right") {
      return { row: margin, col: width - windowWidth - margin };
    }
    if (options.position === "bottom_left") {
      return { row: height - windowHeight - margin, col: margin };
    }
    if (options.position === "bottom_right") {
      return {
        row: height - windowHeight - margin,
        col: width - windowWidth - margin,
      };
    }

    // Default: center
    return {
      row: Math.floor((height - windowHeight) / 2),
      col: Math.floor((width - windowWidth) / 2),
    };
  };

  let vimPopupWinid: number | null = null;

  const ensureVimPopup = async () => {
    if (denops.meta.host !== "vim") return;
    if (vimPopupWinid) return;
    vimPopupWinid = await denops.call("popup_create", [], {
      hidden: true,
    }) as number;
  };

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
        const result = await denops.eval("[&columns, &lines]");
        assert(result, is.ArrayOf(is.Number));
        const [cols, lines] = result;
        screenWidth = cols;
        screenHeight = lines;
      }
    } else {
      const result = await denops.eval("[&columns, &lines]");
      assert(result, is.ArrayOf(is.Number));
      const [cols, lines] = result;
      screenWidth = cols;
      screenHeight = lines;

      // Update Vim popup position if it exists
      if (vimPopupWinid) {
        try {
          let w = lastToastWidth;
          let h = lastToastHeight;
          if (w === 0 || h === 0) {
            const pos = await denops.call("popup_getpos", vimPopupWinid) as {
              width: number;
              height: number;
            };
            w = pos.width;
            h = pos.height;
          }
          const { row, col } = calculatePosition(
            w,
            h,
            screenWidth,
            screenHeight,
          );
          await denops.call("popup_move", vimPopupWinid, {
            line: row,
            col: col,
          });
        } catch (_) {
          // ignore
        }
      }
    }
  };

  const setupAutocommands = async () => {
    await Promise.all([
      loadOptions(),
      updateDimensions(),
      updateAmbiwidth(),
      ensureVimPopup(),
    ]);

    if (denops.meta.host === "nvim") {
      await nvim.nvim_exec_lua(
        denops,
        `
        _G.DenopsModeChangeNotify = _G.DenopsModeChangeNotify or {}
        _G.DenopsModeChangeNotify.update_window = function(bufnr, update_content, content, width, height, row, col, border, highlight, last_winid)
          if update_content then
            vim.api.nvim_buf_set_lines(bufnr, 0, -1, false, content)
          end
          local win = last_winid
          local reused = false
          if win and win ~= vim.NIL and vim.api.nvim_win_is_valid(win) then
            local success, _ = pcall(vim.api.nvim_win_set_config, win, {
              relative = "editor",
              width = width,
              height = height,
              row = row,
              col = col,
              border = border,
              focusable = false,
            })
            if success then
              reused = true
              if vim.api.nvim_win_get_buf(win) ~= bufnr then
                 vim.api.nvim_win_set_buf(win, bufnr)
              end
            else
              pcall(vim.api.nvim_win_close, win, true)
            end
          end
          if not reused then
            win = vim.api.nvim_open_win(bufnr, false, {
              relative = "editor",
              width = width,
              height = height,
              row = row,
              col = col,
              style = "minimal",
              border = border,
              focusable = false,
              noautocmd = true
            })
          end
          vim.api.nvim_win_set_option(win, "winhighlight", "Normal:" .. highlight)
          return win
        end
      `,
        [],
      );
    }

    autocmd.group(denops, "mode-change-notify", (helper) => {
      helper.define(
        "ModeChanged",
        "*",
        `call denops#notify('${denops.name}', 'modeChanged', [expand('<amatch>')])`,
      );
      helper.define(
        "VimResized",
        "*",
        `call denops#notify('${denops.name}', 'updateDimensions', [])`,
      );
      helper.define(
        "VimLeave",
        "*",
        `call denops#notify('${denops.name}', 'cleanup', [])`,
      );
    });
  };

  setupAutocommands();

  // Keep track of last notification windows to avoid stacking issues (Neovim)
  let lastNvimWinid: number | null = null;

  // Track the timer for closing the window
  let timerId: number | undefined;

  const showToast = async (
    denops: Denops,
    modeCategory: ModeCategory,
  ): Promise<void> => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }

    let content: string[] = [];
    let windowWidth: number;
    let windowHeight: number;

    const ambiwidth = currentAmbiwidth;
    let style = options.style;
    if (ambiwidth === "double" && style === "ascii_filled") {
      style = "ascii_outline";
    }

    const cacheKey = `${style}:${modeCategory}`;
    let cached = toastCache.get(cacheKey);

    if (cached) {
      content = cached.content;
      windowWidth = cached.width;
      windowHeight = cached.height;
    } else {
      switch (style) {
        case "ascii_outline":
        case "ascii_filled": {
          const artSet = style === "ascii_outline"
            ? asciiArtOutline
            : asciiArtFilled;
          const art = artSet[modeCategory];
          if (!art) return;

          content = art;
          const artWidth = Math.max(...art.map((l) => l.length));
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
      cached = {
        content,
        width: windowWidth,
        height: windowHeight,
      };
      toastCache.set(cacheKey, cached);
    }

    if (screenWidth === 0 || screenHeight === 0) {
      await updateDimensions();
    }
    const width = screenWidth;
    const height = screenHeight;

    lastToastWidth = windowWidth;
    lastToastHeight = windowHeight;

    const { row, col } = calculatePosition(
      windowWidth,
      windowHeight,
      width,
      height,
    );

    if (denops.meta.host === "vim") {
      await ensureVimPopup();

      const border_prop = options.border !== "none"
        ? [1, 1, 1, 1]
        : [0, 0, 0, 0];
      const borderChars = getVimBorderChars(options.border);
      const popupOptions = {
        line: row,
        col,
        border: border_prop,
        zindex: 9999,
        focusable: false,
        highlight: options.highlight,
        borderhighlight: [options.highlight],
        hidden: false,
        ...(borderChars ? { borderchars: borderChars } : {}),
      };

      // Batch operations
      try {
        await batch.collect(denops, (helper) => {
          helper.call("popup_settext", vimPopupWinid, content);
          helper.call("popup_setoptions", vimPopupWinid, popupOptions);
        });
      } catch (_) {
        // Fallback: window might be closed/invalid. Recreate and retry.
        vimPopupWinid = null;
        await ensureVimPopup();
        await batch.collect(denops, (helper) => {
          helper.call("popup_settext", vimPopupWinid, content);
          helper.call("popup_setoptions", vimPopupWinid, popupOptions);
        });
      }

      timerId = setTimeout(async () => {
        try {
          // Hide instead of close
          await denops.call("popup_setoptions", vimPopupWinid, {
            hidden: true,
          });
        } catch (error) {
          console.warn(`Failed to hide window: ${error}`);
        }
      }, options.timeout);
    } else {
      let bufnr = cached.bufnr;
      let shouldUpdateContent = false;

      // Create buffer if missing
      if (!bufnr) {
        bufnr = await nvim.nvim_create_buf(denops, false, true);
        await nvim.nvim_buf_set_option(denops, bufnr, "bufhidden", "hide");
        cached.bufnr = bufnr;
        shouldUpdateContent = true;
      }

      let win: unknown;

      const updateWindow = async (
        buf: number,
        update: boolean,
      ): Promise<unknown> => {
        return await nvim.nvim_exec_lua(
          denops,
          `return _G.DenopsModeChangeNotify.update_window(...)`,
          [
            buf,
            update,
            update ? content : null,
            windowWidth,
            windowHeight,
            row,
            col,
            options.border,
            options.highlight,
            lastNvimWinid ?? null,
          ],
        );
      };

      try {
        win = await updateWindow(bufnr, shouldUpdateContent);
      } catch (_) {
        // Fallback: Buffer might be invalid. Create new one.
        bufnr = await nvim.nvim_create_buf(denops, false, true);
        await nvim.nvim_buf_set_option(denops, bufnr, "bufhidden", "hide");
        cached.bufnr = bufnr;
        win = await updateWindow(bufnr, true);
      }

      assert(win, is.Number);
      lastNvimWinid = win as number;
      timerId = setTimeout(async () => {
        try {
          await nvim.nvim_win_close(denops, win as number, true);
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

    async cleanup(): Promise<void> {
      if (denops.meta.host === "vim" && vimPopupWinid) {
        try {
          await denops.call("popup_close", vimPopupWinid);
        } catch (_) {
          // ignore
        }
        vimPopupWinid = null;
      }
    },
  };
};
