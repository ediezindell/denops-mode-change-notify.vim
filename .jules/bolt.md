## 2026-01-21 - Batching Fallible Operations in Denops
**Learning:** `batch.collect` aborts if any promise rejects. To batch operations that might fail safely (like closing a non-existent window), wrap them in `pcall` (Lua/Neovim) or `try-catch` (Vimscript) via `exec`/`cmd`.
**Action:** Always wrap non-critical cleanup steps in safe-execution wrappers when batching them with critical steps to maximize RPC efficiency without risking batch failure.

## 2026-01-21 - Vim Popup Defaults
**Learning:** Vim's `popup_create` initializes windows with "minimal" settings (no numbers, no statusline, etc.) by default. Explicitly setting these via `setwinvar` is redundant and wastes RPC calls.
**Action:** Trust `popup_create` defaults to minimize RPC traffic when creating notifications.

## 2026-01-22 - Caching Static Data Transformations
**Learning:** Frequent event handlers (like `ModeChanged`) that re-calculate properties of static data (like dimensions of ASCII art) create unnecessary garbage and CPU load.
**Action:** Memoize derived properties of static assets in module-level or closure-level caches to avoid recalculation in hot loops.

## 2026-01-23 - Batching Simple Expression Evaluations
**Learning:** `denops.eval` incurs a full RPC roundtrip for each call. Multiple simple variable retrievals (like `&columns`, `&lines`) should be combined into a single list or dictionary evaluation.
**Action:** Replace sequential `denops.eval` calls with a single `denops.eval("[val1, val2]")` and destructure the result.

## 2026-01-24 - Reusing Neovim Floating Windows
**Learning:** Destroying (`nvim_win_close`) and recreating (`nvim_open_win`) floating windows on every update is expensive. `nvim_win_set_config` allows modifying an existing window's layout (including border) in-place, which is significantly faster and prevents flickering.
**Action:** When updating a persistent UI element like a notification, try to reuse the existing window ID with `nvim_win_set_config` (wrapped in `pcall`) before falling back to creating a new one.

## 2026-01-25 - Optimistic RPC Updates
**Learning:** Checking resource validity (e.g., `popup_getpos`) before usage adds unavoidable latency (RTT) to every operation. In a networked plugin system like Denops, failure is cheap but latency is expensive.
**Action:** Replace "check-then-act" with "act-then-recover". Assume resources are valid, trap errors during usage, and implement recovery/recreation logic in the `catch` block.

## 2026-01-26 - Pre-compiling Lua Functions
**Learning:** Sending Lua source code via `nvim_exec_lua` on every hot-path event incurs repeated parsing and compilation overhead in Neovim, and increases RPC payload size.
**Action:** Define complex Lua logic as a global function (e.g., in `_G`) during plugin initialization, and call this function with arguments in the event handler.

## 2026-01-28 - Character Code vs String Comparisons in Hot Path
**Learning:** Character code comparisons (`charCodeAt`) are ~20-30% faster than string comparisons in JavaScript engines, especially in hot paths like mode change events.
**Action:** Replace string comparisons and `startsWith()` calls with character code checks for single-character optimizations, especially in frequently called functions.

## 2026-01-29 - Redundant String Comparison Elimination
**Learning:** Repeated string equality checks in the same scope create unnecessary overhead. Cache comparison results and use string concatenation instead of template literals for cache keys.
**Action:** Store boolean results of string comparisons in variables and reuse them. Use `+` concatenation for simple cache keys instead of template literals.
