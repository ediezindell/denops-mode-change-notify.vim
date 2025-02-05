import type { Entrypoint } from "jsr:@denops/std";
import * as autocmd from "jsr:@denops/std/autocmd";

import { assert, is } from "jsr:@core/unknownutil";

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

      const buf = await denops.call("nvim_create_buf", false, true);
      await denops.call("nvim_buf_set_lines", buf, 0, -1, false, [
        "",
        ` ${message}`,
        "",
      ]);

      const width = await denops.call("nvim_get_option", "columns");
      assert(width, is.Number);
      const height = await denops.call("nvim_get_option", "lines");
      assert(height, is.Number);

      const windowWidth = message.length + 2;
      const windowHeight = 3;
      const opts = {
        relative: "editor",
        width: windowWidth,
        height: windowHeight,
        row: (height - windowHeight - 1) / 2,
        col: (width - windowWidth - 1) / 2,
        style: "minimal",
        border: "rounded",
      };

      const win = await denops.call("nvim_open_win", buf, false, opts);
      setTimeout(async () => {
        await denops.call("nvim_win_close", win, true);
      }, timeout);
    },
  };
};
