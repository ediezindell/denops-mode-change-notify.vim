# denops-mode-change-notify

A simple Neovim plugin that provides highly customizable notifications on mode changes.

## Features

-   **Visual Feedback**: Get a clear, visual notification when you switch modes (Normal, Insert, Visual).
-   **Multiple Styles**: Choose between a simple text display or two different ASCII art styles for the mode initial.
-   **Highly Customizable**:
    -   Enable notifications for specific modes (e.g., Normal, Insert, Command).
    -   Change the notification content style (`text`, `ascii_outline`, `ascii_filled`).
    -   Customize the notification window's border (`rounded`, `single`, `double`, etc.).
    -   Adjust the display duration (timeout).
    -   Set the notification position on the screen (`center`, `top_left`, `bottom_right`, etc.).

## Installation

### [vim-plug](https://github.com/junegunn/vim-plug)

```vim
Plug 'Omochice/denops-mode-change-notify'
```

### [packer.nvim](https://github.com/wbthomason/packer.nvim)

```lua
use 'Omochice/denops-mode-change-notify'
```

## Configuration

You can customize the notification behavior by setting the following global variables in your `init.vim` or `init.lua`.

### Enabled Modes

Controls which modes will trigger a notification. You provide a list of mode initials.

-   **Variable**: `g:mode_change_notify_enabled_modes`
-   **Type**: `List` of `String`
-   **Default**: `['n', 'i', 'v']`
-   **Common values**:
    -   `'n'`: Normal
    -   `'i'`: Insert
    -   `'v'`: Visual
    -   `'c'`: Command
    -   `'t'`: Terminal
    -   `'R'`: Replace

**Example (`init.vim`):**
```vim
" Show notifications for Normal, Insert, Visual, and Command modes
let g:mode_change_notify_enabled_modes = ['n', 'i', 'v', 'c']
```

### Notification Style

Controls the content of the notification.

-   **Variable**: `g:mode_change_notify_style`
-   **Type**: `String`
-   **Default**: `'text'`
-   **Available values**:
    -   `'text'`: Simple text (e.g., "Normal").
    -   `'ascii_outline'`: ASCII art with an outline style.
    -   `'ascii_filled'`: ASCII art with a filled style.

**Example (`init.vim`):**
```vim
let g:mode_change_notify_style = 'ascii_outline'
```

### Border Style

Controls the style of the notification window's border. Accepts any value supported by `nvim_open_win()`.

-   **Variable**: `g:mode_change_notify_border_style`
-   **Type**: `String`
-   **Default**: `'rounded'`
-   **Examples**: `'none'`, `'single'`, `'double'`, `'solid'`

**Example (`init.vim`):**
```vim
let g:mode_change_notify_border_style = 'single'
```

### Display Timeout

Controls how long the notification is visible, in milliseconds.

-   **Variable**: `g:mode_change_notify_timeout`
-   **Type**: `Number`
-   **Default**: `500`

**Example (`init.vim`):**
```vim
" Display for 1 second
let g:mode_change_notify_timeout = 1000
```

### Display Position

Controls where the notification appears on the screen.

-   **Variable**: `g:mode_change_notify_position`
-   **Type**: `String`
-   **Default**: `'center'`
-   **Available values**:
    -   `'center'`
    -   `'top_left'`
    -   `'top_right'`
    -   `'bottom_left'`
    -   `'bottom_right'`

**Example (`init.vim`):**
```vim
let g:mode_change_notify_position = 'bottom_right'
```
