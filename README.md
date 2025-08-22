# denops-mode-change-notify

A simple Vim/Neovim plugin that shows a small notification when you change modes. Built with denops.

## Features

- Visual feedback on mode changes (Normal, Insert, Visual, Command, Terminal, Replace)
- Multiple content styles: `text`, `ascii_outline`, `ascii_filled`
- Configurable border, position, and timeout
- Simple category-based configuration for modes

## Requirements

- Deno
- denops.vim

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
  init = function()
    vim.g.mode_change_notify_options = {
      enabled_modes = { "n", "i", "v" },
      style = "ascii_filled",
      border = "double",
      timeout = 750,
      position = "bottom_right",
    }
  end,
}
```

## Quick start

Configuration is category-based. Use these 6 categories only:
- `n` (Normal)
- `i` (Insert)
- `v` (Visual family: character/line/block; covers `v`, `V`, `<C-v>`)
- `c` (Command)
- `t` (Terminal)
- `r` (Replace family: covers `R`, `Rv`)

Examples:

Lua (init.lua)
```lua
vim.g.mode_change_notify_options = {
  enabled_modes = { "n", "i", "v" },
  style = "ascii_filled",
  border = "double",
  timeout = 750,
  position = "bottom_right",
}
```

Vimscript (init.vim or .vimrc)
```vim
let g:mode_change_notify_options = {
\ 'enabled_modes': ['n', 'i', 'v'],
\ 'style': 'ascii_filled',
\ 'border': 'double',
\ 'timeout': 750,
\ 'position': 'bottom_right',
\ }
```

Notes
- The `ascii_filled` style requires Nerd Fonts to be installed and used by your terminal.
- For full configuration and details, see: `:help mode-change-notify`

A simple Vim/Neovim plugin that provides highly customizable notifications on mode changes.

## Features

- Visual Feedback: Get a clear, visual notification when you switch modes (Normal, Insert, Visual).
- Multiple Styles: Choose between a simple text display or two different ASCII art styles for the mode initial.
- Highly Customizable:
  - Enable notifications for specific modes (e.g., Normal, Insert, Command).
  - Change the notification content style (`text`, `ascii_outline`, `ascii_filled`).
  - Customize the notification window's border (`rounded`, `single`, `double`, etc.).
  - Adjust the display duration (timeout).
  - Set the notification position on the screen (`center`, `top_left`, `bottom_right`, etc.).

## Requirements

This plugin requires the following:

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
    init = function()
        vim.g.mode_change_notify_options = {
            enabled_modes = { "n", "i" },
            style = "ascii_filled",
            border = "double",
            timeout = 750,
            position = "bottom_right",
        }
    end,
}
```

## Configuration

All options are controlled by a single dictionary variable, `g:mode_change_notify_options`. You only need to specify the values you want to override from the defaults.

For a complete list of available options, their descriptions, and default values, please refer to the help documentation. You can view it by running the following command in Vim/Neovim:

```vim
:help mode-change-notify
```

### Examples

Here are a few examples to get you started.

**Lua (`init.lua`)**

```lua
vim.g.mode_change_notify_options = {
    enabled_modes = { "n", "i" },
    style = "ascii_filled",
    border = "double",
    timeout = 750,
    position = "bottom_right",
}
```

**Vimscript (`init.vim` or `.vimrc`)**

```vim
let g:mode_change_notify_options = {
    \ 'enabled_modes': ['n', 'i'],
    \ 'style': 'ascii_filled',
    \ 'border': 'double',
    \ 'timeout': 750,
    \ 'position': 'bottom_right',
    \ }
```
