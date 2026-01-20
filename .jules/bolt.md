## 2024-05-23 - RPC Overhead in Event Handlers
**Learning:** Frequent events like `ModeChanged` can trigger expensive RPC calls if not optimized. Caching values like screen dimensions and updating them on relevant events (like `VimResized`) significantly reduces IPC traffic.
**Action:** When handling frequent events in denops, always look for opportunities to cache state derived from RPC calls, using other events to invalidate or update the cache.

## 2024-05-24 - Batching and Optimistic RPC
**Learning:** Sequential RPC calls like `setwinvar` and "check-then-act" patterns (like `is_valid` -> `close`) kill performance in Denops plugins due to latency.
**Action:** Use `denops.batch` for sequential calls and try/catch blocks for optimistic actions instead of validity checks.
