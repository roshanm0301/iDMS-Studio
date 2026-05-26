# Objective — M7 List/Grid Configuration

## Goal
Implement list/grid column configuration and live preview for data-heavy list views.

## P0 Feature Covered
List/Grid Configuration

## Build Scope
- GridConfigurationPanel, GridColumnConfigurator, GridPreview
- ColumnRendererSelector (badge, text, currency, date, boolean renderers)
- Column order, label override, width, sortable/filterable flags
- Row action placeholder configuration
- Mock table preview using TanStack Table

## Out of Scope
- Real server-side paging, real export, real bulk actions

## Hard Constraints
- Frontend only. Mock data only. Named exports only.

## Requirement IDs

P0-07 — List/Grid Configuration: LST-001 through LST-024 (total 24 requirements)

## Acceptance Criteria (from spec)

- Admin can configure which columns appear in list surface
- Admin can set sort default, column width, and header label
- Admin can enable/disable row selection, bulk actions, pagination
- Column count and type compatibility validated on publish

## Edge Cases (from spec)

- Zero columns configured (blocked on publish)
- Column references deleted field (blocked on publish)
