# denops-mode-change-notify

A simple Vim/Neovim plugin that shows a small notification when you change modes. Built with denops.

## Features

- Visual feedback on mode changes (Normal, Insert, Visual, Command, Terminal, Replace)
- Multiple content styles: `text`, `ascii_outline`, `ascii_filled`
- Configurable border, position, and timeout
- Simple category-based configuration for modes

## Requirements

- [Deno](https://deno.land/)
- [denops.vim](https://github.com/vim-denops/denops.vim)

## Installation

Use your favorite plugin manager.

### vim-plug

```vim
Plug 'vim-denops/denops.vim'
Plug 'ediezindell/denops-mode-change-notify'
```

### lazy.nvim

```lua
{
  "ediezindell/denops-mode-change-notify",
  dependencies = { "vim-denops/denops.vim" },
  event = "BufEnter",
}
```

## Configuration

Configuration is done via the `g:mode_change_notify_options` dictionary. You can place this in your `init.vim` / `.vimrc` or within your plugin manager's setup, as shown in the `lazy.nvim` example above.

**Example (Vimscript):**
```vim
let g:mode_change_notify_options = {
\ 'enabled_modes': ['n', 'i', 'v'],
\ 'style': 'ascii_filled',
\ 'border': 'double',
\ 'timeout': 750,
\ 'position': 'bottom_right',
\ 'highlight': {
\   'n': 'DenopsModeNotifyNormal',
\   'i': 'DenopsModeNotifyInsert',
\   'v': 'DenopsModeNotifyVisual',
\  },
\ }
```

**Example (Lua):**
```lua
vim.g.mode_change_notify_options = {
  enabled_modes = { "n", "i", "v" },
  style = "ascii_filled",
  border = "double",
  timeout = 750,
  position = "bottom_right",
  highlight = {
    n = "DenopsModeNotifyNormal",
    i = "DenopsModeNotifyInsert",
    v = "DenopsModeNotifyVisual",
  },
}
```

**Note:** The `ascii_filled` style requires a [Nerd Font](https://www.nerdfonts.com/).

### Default Highlights

The plugin provides default highlight groups that are linked to standard Vim groups. You can override these links or provide your own highlight groups in the configuration.

| Mode | Default Plugin Highlight | Default Link |
| --- | --- | --- |
| Normal (`n`) | `DenopsModeNotifyNormal` | `ModeMsg` |
| Insert (`i`) | `DenopsModeNotifyInsert` | `Type` |
| Visual (`v`) | `DenopsModeNotifyVisual` | `Statement` |
| Command (`c`) | `DenopsModeNotifyCommand` | `Constant` |
| Terminal (`t`) | `DenopsModeNotifyTerminal` | `Constant` |
| Replace (`r`) | `DenopsModeNotifyReplace` | `Special` |

## Mappings

The plugin provides `<Plug>` mappings for manual notification triggering, useful for testing or custom integrations:

- `<Plug>(mode-change-notify-n)`
- `<Plug>(mode-change-notify-i)`
- `<Plug>(mode-change-notify-v)`
- `<Plug>(mode-change-notify-c)`
- `<Plug>(mode-change-notify-t)`
- `<Plug>(mode-change-notify-r)`

These mappings respect your `enabled_modes` configuration.

For a full list of all options and their descriptions, please see the help file:
```vim
:help mode-change-notify
```
