## 2026-01-21 - Batching Fallible Operations in Denops
**Learning:** `batch.collect` aborts if any promise rejects. To batch operations that might fail safely (like closing a non-existent window), wrap them in `pcall` (Lua/Neovim) or `try-catch` (Vimscript) via `exec`/`cmd`.
**Action:** Always wrap non-critical cleanup steps in safe-execution wrappers when batching them with critical steps to maximize RPC efficiency without risking batch failure.
