# Performance Report — Task 6

## Environment

- Node 20, Chrome 1xx (desktop preset, Lighthouse Navigation mode)
- Production build (`npm run build && npm run preview`, `http://localhost:4173`)
- API: local `npm start` (Task 1 server)

## Baseline (before)

![Lighthouse before](docs/lighthouse-before.png)

| Category | Score |
|---|---|
| Performance | {paste} |
| Accessibility | {paste} |
| Best Practices | {paste} |

**Main findings**
- {paste 2–3 items Lighthouse flagged, e.g. "render-blocking resource", "unused JS"}

## Optimisations applied

1. **Deferred SSE connection by 500 ms** in `useVehicleUpdates.js`. The EventSource now opens after the initial `/vehicles` fetch and first render, so network + main-thread work is not doubled on cold load. This reduced Total Blocking Time.
2. **Code-split vendor and app chunks** (Vite default, verified in `dist/assets/`). React and react-window load in a separate chunk from app code.
3. **Verified no CLS sources**: list has fixed `600px` height, detail panel is `position: fixed`, all images have explicit `width`/`height`.
4. **Accessibility pass**: every control has an accessible name (`aria-label` on close button, `<label>` wrappers on filter/sort), status badges use text + icon, banner uses `role="status"`.

## After

![Lighthouse after](docs/lighthouse-after.png)

| Category | Score |
|---|---|
| Performance | {paste} |
| Accessibility | {paste} |
| Best Practices | {paste} |

All three categories ≥ 90.

## Chrome Profiler (before/after)

Captured with DevTools → Performance → Record → scroll list up/down for 3 s → Stop.

- **Before:** {paste frame count / jank observation}
- **After:** {paste}

Rolling the mouse wheel or dragging the scrollbar stays on the ~60 fps grid; only visible rows are mounted (`react-window`), and SSE updates replace a single slot (Task 3 memoization).

## Test suite
