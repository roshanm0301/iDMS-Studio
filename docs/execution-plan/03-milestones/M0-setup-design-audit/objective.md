# Objective — M0 Setup & Entity Designer Design Audit

## Goal
Prepare the UI Studio implementation foundation: create all source folder structure,
configure the test framework, audit Entity Designer design patterns, define core types,
add routing and sidebar navigation, and create placeholder pages.

## P0 Feature Covered
Infrastructure setup — no P0 feature delivered; this is the foundation.

## Build Scope
- Vitest + React Testing Library test setup
- UI Studio folder structure (pages, components, hooks, types, mocks, tests, docs)
- Core type definitions (ViewArtifact, ViewSurfaceType, MockEntityDefinition, UIStudioViewRepository)
- Mock entity metadata (8 entities) and mock view repository (5 seeded views)
- Placeholder pages for all 4 routes
- Zustand editor store and TanStack Query hooks (skeleton)
- Route at /admin/ui-studio in App.tsx
- UI Studio nav item in Sidebar.tsx
- Entity Designer design audit document
- docs/execution-plan/ control files for M0–M20

## Out of Scope
- No feature implementation beyond placeholders
- No builder UI
- No real views

## Design-System Alignment
- Placeholder pages use existing .page-head, .page-title, .page-sub, .btn, .empty classes
- Icons from lucide-react

## Hard Constraints
- Frontend only
- Mock data only
- No backend APIs
- No Entity Designer code modification (except App.tsx routing + Sidebar.tsx nav)
- Named exports only for UI Studio code
