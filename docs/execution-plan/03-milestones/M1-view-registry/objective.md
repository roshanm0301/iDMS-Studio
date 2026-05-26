# Objective — M1 View Registry & View Management

## Goal
Build the view registry experience: list all views, create a draft, open a view for editing,
and clearly show view status. All data flows through TanStack Query and mockViewRepository.

## P0 Feature Covered
View Registry & View Management

## Build Scope
- UIStudioListPage — full implementation replacing placeholder
- ViewRegistryToolbar (search input, filter by type/entity/status)
- ViewRegistryTable or ViewRegistryCards (shows 5 seeded views)
- ViewStatusBadge (Draft / Published / Needs Attention)
- CreateViewDraftDialog (modal form, calls useCreateViewMutation)
- Navigation to /admin/ui-studio/editor/:viewId on row/card click
- View metadata: id, viewKey, label, viewType, primaryEntity, status, version, updatedAt

## Out of Scope
- Real backend persistence
- Advanced publish lifecycle
- Runtime rendering
- Builder panels

## Design-System Alignment
- Must reuse Entity Designer page shell/component style
- Must reuse existing button/table/form patterns where available

## Hard Constraints
- Frontend only. Mock data only. No backend APIs. No Entity Designer code modification.
- Named exports only. No `any` except explicit mock boundary.

## Requirement IDs

P0-01 — View Registry & View Management: REG-001 through REG-020 (total 20 requirements)

## Acceptance Criteria (from spec)

- Admin can list all views in the registry, filter by surface type, entity, and status, and sort by label/status/date
- Admin can create a draft view with unique key, surface type, entity, and label — without publishing it
- Draft views are not visible to end users until published
- Registry shows view status (draft/published/needs_attention) visually
- Clicking a view opens the editor

## Edge Cases (from spec)

- Registry is empty (show empty state with create CTA)
- Duplicate view key on create (show inline error)
- View key with spaces or invalid characters (show format error)
- Registry with 100+ views (should remain performant via client-side filter/sort)
