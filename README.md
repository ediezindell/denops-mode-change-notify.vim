# denops-mode-change-notify

A simple Neovim plugin that provides highly customizable notifications on mode changes.

## Features

- Visual Feedback: Get a clear, visual notification when you switch modes (Normal, Insert, Visual).
- Multiple Styles: Choose between a simple text display or two different ASCII art styles for the mode initial.
- Highly Customizable:
  - Enable notifications for specific modes (e.g., Normal, Insert, Command).
  - Change the notification content style (`text`, `ascii_outline`, `ascii_filled`).
  - Customize the notification window's border (`rounded`, `single`, `double`, etc.).
  - Adjust the display duration (timeout).
  - Set the notification position on the screen (`center`, `top_left`, `bottom_right`, etc.).

## Installation

### lazy.nvim

```lua
{
    "ediezindell/denops-mode-change-notify.vim",
    dependencies = {
        "vim-denops/denops.vim",
    },
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

All options are controlled by a single dictionary variable, `g:mode_change_notify_options`. You only need to specify the values you want to override.

Example (`init.vim`):

```lua
vim.g.mode_change_notify_options = {
    enabled_modes = { "n", "i" },
    style = "ascii_filled",
    border = "double",
    timeout = 750,
    position = "bottom_right",
}
```

### Available Options

- `enabled_modes`: Controls which modes will trigger a notification.

  - Type: `List` of `String`
  - Default: `['n', 'i', 'v']`
  - Common initials: `'n'` (Normal), `'i'` (Insert), `'v'` (Visual), `'c'` (Command), `'t'` (Terminal), `'R'` (Replace).

- `style`: Controls the content of the notification.

  - Type: `String`
  - Default: `'text'`
  - Values: `'text'`, `'ascii_outline'`, `'ascii_filled'`.

- `border`: Controls the style of the notification window's border.

  - Type: `String`
  - Default: `'rounded'`
  - Values: Any style supported by `nvim_open_win()` (e.g., `'none'`, `'single'`, `'double'`).

- `timeout`: Controls how long the notification is visible, in milliseconds.

  - Type: `Number`
  - Default: `500`

- `position`: Controls where the notification appears on the screen.
  - Type: `String`
  - Default: `'center'`
  - Values: `'center'`, `'top_left'`, `'top_right'`, `'bottom_left'`, `'bottom_right'`.
