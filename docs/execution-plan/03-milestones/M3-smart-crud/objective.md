# Objective — M3 Smart CRUD Builder

## Goal
Implement configuration for quickly creating list + form views from mock Entity Designer
metadata. Auto-generate list columns and form fields from entity selection.

## P0 Feature Covered
Smart CRUD Builder

## Build Scope
- SmartCrudPanel, SmartCrudEntitySelector, SmartCrudAutoGenerateButton
- SmartCrudColumnList, SmartCrudFormFieldList
- Auto-generate columns and form fields from MockEntityDefinition
- Manual add/remove/reorder of fields
- Smart CRUD preview panel
- Store generated columns/fields in ViewArtifact metadata

## Out of Scope
- Backend CRUD, real data save, advanced behaviors

## Hard Constraints
- Frontend only. Mock data only. Named exports only.

## Requirement IDs

P0-03 — Smart CRUD Builder: CRUD-001 through CRUD-020 (total 20 requirements)

## Acceptance Criteria (from spec)

- Admin can auto-generate a base CRUD view for any entity with one click
- Generated view includes list surface and create/edit form surface with sensible defaults
- Admin can modify the generated scaffold
- List and form views are linked

## Edge Cases (from spec)

- Entity with no published fields
- Entity with 100+ fields (smart selection of top N)
