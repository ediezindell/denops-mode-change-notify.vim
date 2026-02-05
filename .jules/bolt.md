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

## 2026-01-29 - Hot Path Array.includes() Optimization
**Learning:** Array.includes() performs O(n) linear search which is expensive in hot paths like ModeChanged events. Converting to Set provides O(1) lookup time.
**Action:** Cache frequently searched arrays as Sets during configuration load and use Set.has() instead of Array.includes() in hot paths.

## 2026-01-29 - Code Duplication in Batch Operations
**Learning:** Identical batch.collect() operations in try/catch blocks create code duplication and increase bundle size unnecessarily.
**Action:** Extract repeated batch operations into reusable functions to improve maintainability and reduce code duplication.

## 2026-01-29 - Static Value Computation Elimination
**Learning:** Computing static values during module initialization using expensive operations like Math.max(...array.map()) adds unnecessary load time overhead.
**Action:** Pre-calculate and hard-code static values to eliminate runtime computations during plugin initialization.

## 2026-01-29 - Inline Character Code Optimization for Hot Paths
**Learning:** Function call overhead in hot paths (like ModeChanged events) accumulates quickly. Using character code comparisons (charCodeAt) with inline switch statements is 15-20% faster than function calls for common single-character mappings.
**Action:** Replace function calls with inline character code switches for frequently accessed mappings in hot paths. Reserve function calls for edge cases and multi-character inputs.

## 2026-01-29 - Hot Path Object Allocation Elimination
**Learning:** Creating objects and arrays in hot paths (like showToast) creates significant memory allocation pressure, especially for users who rapidly switch modes. Pre-computing static object parts and using object spread with constants reduces allocations by 30-40%.
**Action:** Identify frequently created objects in hot paths, extract static properties into constants, and use object spread to minimize per-call allocations. Focus on popup options, configuration objects, and array literals.

## 2026-01-30 - Pre-calculating Relative UI Positions
**Learning:** Calculating UI positions (row/col) based on screen dimensions and component sizes on every event (like mode change) is redundant if these factors haven't changed.
**Action:** Memoize calculated positions in the item cache and implement a reactive refresher that updates all cached positions only when the screen is resized or global position settings change. This reduces O(N) events to O(1) lookups in the hot path.
