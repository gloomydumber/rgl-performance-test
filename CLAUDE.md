# RGL Performance Test

A/B benchmark comparing react-grid-layout v1.4.4 vs v2.2.2 resize performance.

## Build & Dev

- `npm run dev:v1` — v1 app on port 5181
- `npm run dev:v2` — v2 app on port 5182
- `npm run build` — Build both packages

## Structure

- npm workspaces monorepo: `packages/v1` and `packages/v2`
- Each package is an independent Vite + React + TypeScript app
- No MUI, no state library — pure RGL isolation
- Shared React version, different RGL versions

## Benchmark

- Built-in programmatic resize via synthetic mouse/pointer events
- 120 rAF frames, 300px diagonal, configurable widget count (4–32)
- Measures: avg/P95/max frame time, jank count/percentage
- Copy button exports formatted text table

## Key Finding

V2 has O(n) per-widget overhead during resize. V1 stays flat (~7ms). At 32 widgets, V2 is 68% slower with 15–21% jank. See README.md for full data.

## Re-benchmarking

When a new RGL v2 release drops: update `packages/v2/package.json`, `npm install`, run benchmark at 4/16/32 widgets, compare against README.md baseline.
