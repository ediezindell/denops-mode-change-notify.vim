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
