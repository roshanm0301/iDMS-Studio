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
