## 2024-05-22 - Highlight Configuration in TUI
**Learning:** Hardcoding 'Normal' highlight in floating windows limits accessibility (contrast) and theming flexibility.
**Action:** Always expose a 'highlight' option in floating window components to allow users to use semantic groups like 'ModeMsg' or 'Pmenu'.

## 2024-05-24 - Vim Popup Borders
**Learning:** Vim's `popup_create` defaults to a generic border even if `border` is set, leading to user confusion when "rounded" is selected but not shown.
**Action:** Implement `borderchars` mapping in TUI plugins to ensure Vim users get the same visual fidelity as Neovim users.
