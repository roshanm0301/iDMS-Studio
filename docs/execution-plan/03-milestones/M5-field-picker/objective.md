# Objective — M5 Field Picker from Entity Designer

## Goal
Create a reusable field picker that consumes mock Entity Designer metadata and supports
safe field selection across all builders.

## P0 Feature Covered
Field Picker from Entity Designer

## Build Scope
- EntitySelector (dropdown)
- FieldPicker (search, type badges, multi/single select)
- FieldMetadataBadge (type, required, read-only, computed indicators)
- FieldCompatibilityWarning (incompatible field choices disabled/warned)
- Field compatibility filtering based on target use

## Out of Scope
- Editing entity fields, creating new entity fields

## Hard Constraints
- Frontend only. Mock data only. Named exports only.

## Requirement IDs

P0-05 — Field Picker: FPK-001 through FPK-020 (total 20 requirements)

## Acceptance Criteria (from spec)

- Admin can browse and search entity fields in a picker panel
- Picker shows field name, type, label, required status
- Selecting a field adds it to the active layout section
- Picker filters out fields already placed in the current surface

## Edge Cases (from spec)

- Entity has no fields
- Field removed from entity schema after being added to view (show warning)
