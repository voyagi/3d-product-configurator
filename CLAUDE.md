# 3D Product Configurator

## Project Overview

Interactive 3D product configurator demo showcasing real-time color/material customization, size selection, and Shopify-ready cart integration. Built as a portfolio piece demonstrating React Three Fiber expertise.

## Stack

- **3D Engine**: React Three Fiber + @react-three/drei
- **State**: Zustand
- **Styling**: Tailwind CSS v4
- **Build**: Vite 6 + TypeScript
- **Testing**: Vitest + Playwright
- **Linting**: Biome

## Architecture

```
Standalone Vite app (designed as Shopify-embeddable widget)
  ├── R3F Canvas (3D viewer, GLB models)
  ├── Config UI (color swatches, size selector, cart button)
  └── Zustand store (shared state)
```

## Build & Dev

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run test             # Run tests
npm run lint             # Lint with Biome
```

## Writing Rules
- Never use em dashes. Use comma or hyphen.
- Never use semicolons. Split into two sentences or use comma.

## Media Files (GIF/Video)
When a prompt references a .gif, .mp4, or other video file by path, run
`/frames` on it first. Use the surrounding prompt context to determine
which frames to extract (e.g. if discussing color changes, extract frames
showing different color states; if discussing size switching, extract frames
showing each size). Then proceed with the task using the extracted frames
as visual reference.

## Design Skills (MANDATORY)
When working on UI, styling, or visual changes, invoke the installed
design plugins instead of making changes manually:
- `/impeccable:critique` - before starting any redesign or major visual rework
- `/impeccable:polish` - after completing visual changes (pre-ship pass)
- `/impeccable:audit` - for accessibility, performance, and responsive checks

# currentDate
Today's date is 2026-03-13.
