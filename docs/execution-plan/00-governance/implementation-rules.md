# Implementation Rules — UI Studio

## Hard Rules (never violate)

1. **No Entity Designer mutation** — Do not modify any file under src/components/entity-designer/, src/components/cockpit/, src/pages/SchemaBuilderPage.tsx, src/pages/EntityListPage.tsx, src/pages/CreateEntityPage.tsx, or src/hooks/useEntityDesignerStore.ts. Permitted exceptions: App.tsx (routing) and Sidebar.tsx (navigation).
2. **Frontend only** — No backend APIs, database schemas, server code, or real authentication.
3. **Mock behind interfaces** — All backend-like operations must go through UIStudioViewRepository or similar repository interface.
4. **Metadata first** — UI Studio produces and consumes ViewArtifact metadata, not hardcoded business pages.
5. **Named exports** — All UI Studio source files use named exports only.
6. **No `any`** — No TypeScript `any` except at explicit mock data boundaries (typed as `unknown` where possible).
7. **No console.log** — No console.log in committed code.
8. **No unapproved dependencies** — No new npm packages without explicit approval.

## Milestone Gate (all must pass before commit)

- `npm run test` — all tests pass
- `npm run typecheck:ui-studio` — no UI Studio TypeScript errors
- `npm run lint:ui-studio` — no UI Studio lint errors
- `npx vite build` — Vite bundle succeeds

## Commit format

```
ui-studio: M<X> <short description>
```
