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
