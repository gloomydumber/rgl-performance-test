# RGL Performance Test

Controlled A/B benchmark comparing **react-grid-layout v1.4.4** (class-based) vs **v2.2.2** (hooks-based) resize performance.

Created to investigate resize lag observed in [wts-frontend](../wts-frontend) when using RGL v2.

## Results (2026-02-15)

Programmatic resize benchmark: 120 frames, 300px diagonal, `requestAnimationFrame`-synchronized. 3 runs per widget count, averaged. Both apps identical except RGL version — no MUI, no state library, plain colored divs.

| Widgets | V1 Avg (ms) | V2 Avg (ms) | V2 overhead | V2 Jank % |
|---------|-------------|-------------|-------------|-----------|
| 4 | 6.97 | 6.97 | 0% | 0% |
| 8 | 6.95 | 7.39 | +6% | 0% |
| 12 | 7.09 | 8.29 | +17% | 0% |
| 16 | 7.17 | 8.59 | +20% | 0% |
| 24 | 7.31 | 10.99 | +50% | 1.8% |
| 32 | 8.04 | 13.51 | +68% | 14.9–21.1% |

### Conclusion

V2's hooks-based rewrite has **O(n) per-widget overhead** during resize that V1 does not. V1 stays flat (~7ms) regardless of widget count. V2 scales linearly — each additional widget adds ~0.2ms per frame. At 10+ widgets the overhead is perceptible. At 32 widgets, V2 drops 15–21% of frames.

**Recommendation:** Stay on v1.4.4 for apps with 8+ resizable widgets. Re-benchmark after RGL v2 patch releases.

## Setup

```bash
npm install
```

## Run

```bash
# v1 on port 5181
npm run dev:v1

# v2 on port 5182
npm run dev:v2
```

## How to Benchmark

### Built-in programmatic benchmark (recommended)

1. Open http://localhost:5181 (v1) or http://localhost:5182 (v2)
2. Select widget count from the dropdown (4, 8, 12, 16, 24, 32)
3. Click **Run Benchmark** — programmatically resizes Widget 1 by 300px diagonally over 120 rAF frames
4. Repeat 3–5 times for statistical reliability
5. Click **Copy** to copy results as formatted text
6. Compare v1 vs v2 results at the same widget count

### Chrome DevTools (manual)

1. Open either app in Chrome
2. F12 → Performance tab → check "Screenshots"
3. Click Record → manually resize a widget for ~3 seconds → Stop
4. Compare frame durations in the Frames row

### Metrics

| Metric | Good | Bad |
|--------|------|-----|
| Avg frame time | <16.67ms (60fps) | >16.67ms (jank) |
| P95 frame time | <16.67ms | >20ms (tail latency) |
| Jank % | 0% | >5% (visible stuttering) |

## Structure

```
rgl-performance-test/
├── packages/
│   ├── v1/                    # react-grid-layout@1.4.4
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx        # Widget count selector
│   │   │   ├── Grid.tsx       # RGL v1 API (WidthProvider, draggableHandle, useCSSTransforms)
│   │   │   ├── Benchmark.tsx  # Programmatic resize + frame time measurement
│   │   │   └── ResizeHandle.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts     # port 5181
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── v2/                    # react-grid-layout@2.2.2
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── Grid.tsx       # RGL v2 API (useContainerWidth, dragConfig, resizeConfig, absoluteStrategy)
│       │   ├── Benchmark.tsx
│       │   └── ResizeHandle.tsx
│       ├── index.html
│       ├── vite.config.ts     # port 5182
│       ├── tsconfig.json
│       └── package.json
├── package.json               # npm workspaces root
└── README.md
```

## Design Decisions

- **npm workspaces** — each package has its own RGL version, shared React
- **No MUI, no Jotai, no state library** — isolates RGL performance from app overhead
- **Identical widget content** — simple colored divs with drag handle
- **Same grid config** — breakpoints, cols, rowHeight match [wts-frontend](../wts-frontend)
- **Configurable widget count** — 4 to 32, to measure scaling behavior

### V1 vs V2 API differences

| | V1 (1.4.4) | V2 (2.2.2) |
|---|---|---|
| Width | `WidthProvider(Responsive)` HOC | `useContainerWidth()` hook |
| Drag | `draggableHandle=".drag-handle"` | `dragConfig={{ handle: '.drag-handle', enabled: true }}` |
| Resize | `resizeHandle={<ResizeHandle />}` | `resizeConfig={{ enabled: true, handleComponent: <ResizeHandle /> }}` |
| Positioning | `useCSSTransforms={false}` | `positionStrategy={absoluteStrategy}` |
| Types | `@types/react-grid-layout` | Built-in (`Layout`, `LayoutItem`, `ResponsiveLayouts`) |

## Re-benchmarking

When a new RGL v2 release drops:

1. Update `packages/v2/package.json` with the new version
2. `npm install`
3. Run the benchmark at 4, 16, and 32 widgets
4. Compare against the baseline results above
5. If V2 matches V1, consider upgrading wts-frontend
