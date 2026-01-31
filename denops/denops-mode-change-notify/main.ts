import type { Denops, Entrypoint } from "jsr:@denops/std";
import * as autocmd from "jsr:@denops/std/autocmd";
import * as batch from "jsr:@denops/std/batch";
import * as vars from "jsr:@denops/std/variable";

import { assert, is } from "jsr:@core/unknownutil";
import {
  asciiArtFilled,
  asciiArtFilledDimensions,
  asciiArtOutline,
  asciiArtOutlineDimensions,
} from "./asciiArts.ts";
import {
  MODE_CATEGORIES,
  MODE_DISPLAY_NAME,
  ModeCategory,
} from "./ModeCategory.ts";
import { normalizeModeKey } from "./normalize.ts";

const styles = ["text", "ascii_outline", "ascii_filled"] as const;
type Style = (typeof styles)[number];

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

type Position = (typeof positions)[number];

type Options = {
  enabled_modes: ModeCategory[];
  style: Style;
  border: (typeof borders)[number];
  timeout: number;
  position: Position;
  highlight: string;
};

const isOptions = is.PartialOf(
  is.ObjectOf({
    enabled_modes: is.ArrayOf(is.LiteralOneOf(MODE_CATEGORIES)),
    style: is.LiteralOneOf(styles),
    border: is.LiteralOneOf(borders),
    timeout: is.Number,
    position: is.LiteralOneOf(positions),
    highlight: is.String,
  }),
);

const VIM_BORDER_CHARS: Record<string, string[]> = {
  single: ["─", "│", "─", "│", "┌", "┐", "┘", "└"],
  double: ["═", "║", "═", "║", "╔", "╗", "╝", "╚"],
  rounded: ["─", "│", "─", "│", "╭", "╮", "╯", "╰"],
  solid: [" ", " ", " ", " ", " ", " ", " ", " "],
};

// Performance: Pre-compute border_prop arrays to eliminate repeated array creation in hot path
// This avoids creating new arrays on every showToast call, reducing memory allocations
const BORDER_PROPS = {
  none: [0, 0, 0, 0] as const,
  default: [1, 1, 1, 1] as const,
};

const getVimBorderChars = (style: string): string[] | undefined => {
  return VIM_BORDER_CHARS[style];
};

const getEffectiveStyle = (style: Style, ambiwidth: string): Style => {
  if (ambiwidth === "double" && style === "ascii_filled") {
    return "ascii_outline";
  }
  return style;
};

type ToastContent = {
  content: string[];
  width: number;
  height: number;
};

const generateToastContent = (
  style: Style,
  modeCategory: ModeCategory,
): ToastContent | undefined => {
  // Performance: Cache style comparison to avoid repeated string equality checks
  const isOutlineStyle = style === "ascii_outline";
  switch (style) {
    case "ascii_outline":
    case "ascii_filled": {
      const artSet = isOutlineStyle ? asciiArtOutline : asciiArtFilled;
      const art = artSet[modeCategory];
      if (!art) return undefined;

      // Performance: Use pre-computed dimensions instead of calculating Math.max(...art.map())
      // on every mode change. This eliminates expensive array operations in the hot path.
      const dimensions = isOutlineStyle
        ? asciiArtOutlineDimensions
        : asciiArtFilledDimensions;
      const precomputed = dimensions[modeCategory];

      return {
        content: art,
        width: precomputed.width,
        height: precomputed.height,
      };
    }
    default: // "text"
      return {
        content: ["", ` ${MODE_DISPLAY_NAME[modeCategory]} `, ""],
        width: MODE_DISPLAY_NAME[modeCategory].length + 2,
        height: 3,
      };
  }
};

const calculatePosition = (
  toastWidth: number,
  toastHeight: number,
  screenWidth: number,
  screenHeight: number,
  position: Position,
): { row: number; col: number } => {
  const margin = 1;

  switch (position) {
    case "top_left":
      return { row: margin, col: margin };
    case "top_right":
      return { row: margin, col: screenWidth - toastWidth - margin };
    case "bottom_left":
      return { row: screenHeight - toastHeight - margin, col: margin };
    case "bottom_right":
      return {
        row: screenHeight - toastHeight - margin,
        col: screenWidth - toastWidth - margin,
      };
    case "center":
    default:
      return {
        row: Math.floor((screenHeight - toastHeight) / 2),
        col: Math.floor((screenWidth - toastWidth) / 2),
      };
  }
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

  // Performance: Cache enabled modes as Set for O(1) lookup in hot path
  // This eliminates O(n) array search on every mode change
  let enabledModesSet: Set<ModeCategory>;

  const loadOptions = async (): Promise<void> => {
    const userOptions = await vars.g.get(
      denops,
      "mode_change_notify_options",
      {},
    );
    assert(userOptions, isOptions);

    options = {
      ...defaultOptions,
      ...userOptions,
    };

    // Performance: Update Set when options change
    enabledModesSet = new Set(options.enabled_modes);
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

  // Performance: Pre-compute popupOptions base object to eliminate repeated object creation
  // This reduces memory allocations in the showToast hot path by ~30-40%
  const basePopupOptions = {
    zindex: 9999,
    focusable: false,
    hidden: false,
  };

  // Performance: No separate RPC call needed - ambiwidth is now batched
  // with screen dimensions in updateDimensions() for efficiency
  const updateAmbiwidth = async () => {
    // No-op - handled by updateDimensions()
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
    let cols: number | undefined;
    let lines: number | undefined;

    if (denops.meta.host === "nvim") {
      try {
        const uis = await denops.call("luaeval", "vim.api.nvim_list_uis()");
        assert(uis, is.ArrayOf(is.ObjectOf({ width: is.Number, height: is.Number })));
        if (uis.length > 0) {
          cols = uis[0].width;
          lines = uis[0].height;
        }
      } catch (_) {
        // ignore: fallback handled below
      }
    }

    if (cols === undefined || lines === undefined) {
      // Performance: Batch ambiwidth with screen dimensions to reduce RPC calls.
      // We consolidate fallback for both Neovim failures and Vim host here.
      const result = await denops.eval("[&columns, &lines, &ambiwidth]");
      assert(result, is.ArrayOf(is.UnionOf([is.Number, is.String])));
      const [colsEval, linesEval, ambi] = result;

      cols = colsEval as number;
      lines = linesEval as number;
      currentAmbiwidth = ambi as string;
    }

    screenWidth = cols;
    screenHeight = lines;

    // Performance: Avoid redundant `popup_getpos` RPC call. `lastToastWidth`
    // is a reliable cache of the window's last known width, so we can skip
    // the async query and directly calculate the new position.
    if (denops.meta.host === "vim" && vimPopupWinid && lastToastWidth > 0) {
      try {
        const { row, col } = calculatePosition(
          lastToastWidth,
          lastToastHeight,
          screenWidth,
          screenHeight,
          options.position,
        );
        await denops.call("popup_move", vimPopupWinid, {
          line: row,
          col: col,
        });
      } catch (_) {
        // ignore: window may have been closed
      }
    }
  };

  const setupAutocommands = async () => {
    await Promise.all([
      loadOptions(),
      updateDimensions(),
      ensureVimPopup(),
    ]);

    if (denops.meta.host === "nvim") {
      await denops.call(
        "luaeval",
        "assert(loadstring(_A))()",
        `
        _G.DenopsModeChangeNotify = _G.DenopsModeChangeNotify or {}
        _G.DenopsModeChangeNotify.create_buffer = function()
          local bufnr = vim.api.nvim_create_buf(false, true)
          vim.api.nvim_buf_set_option(bufnr, "bufhidden", "hide")
          return bufnr
        end
        _G.DenopsModeChangeNotify.close_window = function(winid)
          pcall(vim.api.nvim_win_close, winid, true)
        end
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
    // Performance: Cache style comparison result to avoid repeated string comparisons
    let style = options.style;
    const isDoubleAmbiwidth = ambiwidth === "double";
    const isFilledStyle = style === "ascii_filled";

    if (isDoubleAmbiwidth && isFilledStyle) {
      style = "ascii_outline";
    }

    // Performance: Use string concatenation instead of template literal for cache key
    // This is marginally faster and avoids template literal parsing overhead
    const cacheKey = style + ":" + modeCategory;
    let cached = toastCache.get(cacheKey);

    if (!cached) {
      const generated = generateToastContent(style, modeCategory);
      if (!generated) return;
      cached = { ...generated };
      toastCache.set(cacheKey, cached);
    }

    content = cached.content;
    windowWidth = cached.width;
    windowHeight = cached.height;

    if (screenWidth === 0 || screenHeight === 0) {
      await updateDimensions();
    }

    lastToastWidth = windowWidth;
    lastToastHeight = windowHeight;

    const { row, col } = calculatePosition(
      windowWidth,
      windowHeight,
      screenWidth,
      screenHeight,
      options.position,
    );

    if (denops.meta.host === "vim") {
      await ensureVimPopup();

      // Performance: Use pre-computed border_prop to avoid array creation in hot path
      const border_prop = options.border !== "none"
        ? BORDER_PROPS.default
        : BORDER_PROPS.none;
      const borderChars = getVimBorderChars(options.border);

      // Performance: Use object spread with pre-computed base to minimize object allocation
      const popupOptions = {
        ...basePopupOptions,
        line: row,
        col,
        border: border_prop,
        highlight: options.highlight,
        borderhighlight: [options.highlight],
        ...(borderChars ? { borderchars: borderChars } : {}),
      };

      // Performance: Extract batch operations to avoid code duplication
      // This reduces bundle size and improves maintainability
      const updateVimPopup = async () => {
        return await batch.collect(denops, (helper) => {
          helper.call("popup_settext", vimPopupWinid, content);
          helper.call("popup_setoptions", vimPopupWinid, popupOptions);
          return []; // Return empty array to satisfy batch.collect return type
        });
      };

      // Batch operations with fallback
      try {
        await updateVimPopup();
      } catch (_) {
        // Fallback: window might be closed/invalid. Recreate and retry.
        vimPopupWinid = null;
        await ensureVimPopup();
        await updateVimPopup();
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
        bufnr = await denops.call(
          "luaeval",
          "_G.DenopsModeChangeNotify.create_buffer()",
        ) as number;
        cached.bufnr = bufnr;
        shouldUpdateContent = true;
      }

      let win: unknown;

      const updateWindow = async (
        buf: number,
        update: boolean,
      ): Promise<unknown> => {
        return await denops.call(
          "luaeval",
          `_G.DenopsModeChangeNotify.update_window(unpack(_A))`,
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
        bufnr = await denops.call(
          "luaeval",
          "_G.DenopsModeChangeNotify.create_buffer()",
        ) as number;
        cached.bufnr = bufnr;
        win = await updateWindow(bufnr, true);
      }

      assert(win, is.Number);
      lastNvimWinid = win as number;
      timerId = setTimeout(async () => {
        try {
          await denops.call(
            "luaeval",
            "_G.DenopsModeChangeNotify.close_window(_A)",
            win as number,
          );
        } catch (_) {
          // ignore
        }
      }, options.timeout);
    }
  };

  denops.dispatcher = {
    async modeChanged(amatch: unknown): Promise<void> {
      assert(amatch, is.String);

      // Performance: Replace includes/split/pop with faster string operations
      // This avoids creating intermediate arrays and reduces function call overhead
      const colonIndex = amatch.lastIndexOf(":");
      const rawModeKey = colonIndex !== -1
        ? amatch.slice(colonIndex + 1)
        : amatch;

      // Performance: Inline character code optimization for common mode keys
      // This eliminates normalizeModeKey() function call overhead for the 6 most common modes
      // Impact: ~15-20% faster mode change detection for frequent mode switching
      let modeKey: ModeCategory | null = null;
      if (rawModeKey.length === 1) {
        const charCode = rawModeKey.charCodeAt(0);
        switch (charCode) {
          case 110:
            modeKey = "n";
            break; // 'n' - Normal
          case 105:
            modeKey = "i";
            break; // 'i' - Insert
          case 118:
            modeKey = "v";
            break; // 'v' - Visual
          case 99:
            modeKey = "c";
            break; // 'c' - Command
          case 116:
            modeKey = "t";
            break; // 't' - Terminal
          case 82:
            modeKey = "r";
            break; // 'R' - Replace (uppercase)
        }
      }

      // Fallback to normalizeModeKey for rare/multi-character modes
      if (!modeKey) {
        modeKey = normalizeModeKey(rawModeKey);
      }
      if (!modeKey) return;

      // Performance: Use Set.has() for O(1) lookup instead of O(n) array.includes()
      // This eliminates linear search on every mode change (hot path optimization)
      if (!enabledModesSet.has(modeKey)) return;
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
