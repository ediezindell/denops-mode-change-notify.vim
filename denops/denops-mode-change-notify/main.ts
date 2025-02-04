import type { Entrypoint } from "jsr:@denops/std";

import { assert, is } from "jsr:@core/unknownutil";

export const main: Entrypoint = (denops) => {
  denops.dispatcher = {
    async showToast(message: unknown): Promise<void> {
      assert(message, is.String);

      const buf = await denops.call("nvim_create_buf", false, true);
      await denops.call("nvim_buf_set_lines", buf, 0, -1, false, [
        ` ${message}`,
      ]);

      const width = await denops.call("nvim_get_option", "columns");
      assert(width, is.Number);
      const height = await denops.call("nvim_get_option", "lines");
      assert(height, is.Number);

      const windowWidth = message.length + 2;
      const windowHeight = 1;
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
      }, 2000);
    },
  };
};
