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
