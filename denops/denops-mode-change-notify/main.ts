import type { Entrypoint } from "jsr:@denops/std";
import * as autocmd from "jsr:@denops/std/autocmd";
import * as nvim from "jsr:@denops/std/function/nvim";

import { assert, is } from "jsr:@core/unknownutil";

export const main: Entrypoint = (denops) => {
  autocmd.group(denops, "mode-change-notify", (helper) => {
    ["Insert", "Normal", "Visual"].forEach((mode) => {
      const initial = mode.slice(0, 1).toLowerCase();
      helper.define(
        "ModeChanged",
        `*:${initial}`,
        `call denops#request('${denops.name}', 'showToast', ['${mode}', 5000])`,
      );
    });
  });
  denops.dispatcher = {
    async showToast(message: unknown, timeout: unknown): Promise<void> {
      assert(message, is.String);
      assert(timeout, is.Number);

      const buf = await nvim.nvim_create_buf(denops, false, true);
      assert(buf, is.Number);

      await nvim.nvim_buf_set_lines(denops, buf, 0, -1, false, [
        "",
        ` ${message}`,
        "",
      ]);

      const width = await nvim.nvim_get_option_value(denops, "columns", {});
      assert(width, is.Number);
      const height = await nvim.nvim_get_option_value(denops, "lines", {});
      assert(height, is.Number);

      const windowWidth = message.length + 2;
      const windowHeight = 3;

      const win = await nvim.nvim_open_win(denops, buf, false, {
        relative: "editor",
        width: windowWidth,
        height: windowHeight,
        row: (height - windowHeight - 1) / 2,
        col: (width - windowWidth - 1) / 2,
        style: "minimal",
        border: "rounded",
        focusable: false,
      });

      setTimeout(async () => {
        await nvim.nvim_win_close(denops, win, true);
      }, timeout);
    },
  };
};
