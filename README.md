# denops-mode-change-notify

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

### vim-plug

```vim
Plug 'vim-denops/denops.vim'
Plug 'ediezindell/denops-mode-change-notify'
```

### packer.nvim

```lua
use {
    'ediezindell/denops-mode-change-notify',
    requires = { 'vim-denops/denops.vim' },
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
