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
