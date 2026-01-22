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
