# UI Studio Frontend Architecture

## Module Boundaries

UI Studio is a self-contained module within the same frontend repository as Entity Designer.
It does not modify Entity Designer internals and communicates through public interfaces only.

## Folder Structure

```
studio/src/
  pages/ui-studio/          — Page-level components (routes)
  components/ui-studio/     — UI Studio-specific components
    shell/                  — Page chrome, breadcrumbs
    builder/                — Editor panel orchestration
    palette/                — Component palette
    inspector/              — Right inspector panel
    canvas/                 — Preview canvas
    smart-crud/             — M3 Smart CRUD builder
    transaction/            — M4 Transaction workspace builder
    behavior/               — M12–M14 behavior/event builders
    data-binding/           — M11 data source configuration
    preview/                — M18 preview context panel
    validation/             — M19 publish validation
    common/                 — Shared within UI Studio
  hooks/ui-studio/          — Zustand stores + TanStack Query hooks
  types/ui-studio/          — All type definitions
  lib/ui-studio/            — Validation engine, runtime renderer logic
  mocks/ui-studio/          — Mock data and repository
  __tests__/ui-studio/      — All tests (mirroring above structure)
```

## State Architecture

- **Server/async state**: TanStack Query hooks (useViewListQuery, useViewQuery, etc.)
- **Editor/client state**: Zustand store (useUIStudioEditorStore)
- **Global scope context**: Reads from existing useStudioStore (read-only; no mutation)

## Data Flow

```
UI Components
  ↓ reads
TanStack Query hooks
  ↓ calls
UIStudioViewRepository interface
  ↓ implemented by
mockViewRepository (in-memory + localStorage)
  ↑ future: realViewRepository (API calls)
```

## Routes

```
/admin/ui-studio/               → UIStudioListPage
/admin/ui-studio/new            → UIStudioNewViewPage
/admin/ui-studio/editor/:viewId → UIStudioEditorPage
/admin/ui-studio/preview/:viewId → UIStudioRuntimePreviewPage
```
