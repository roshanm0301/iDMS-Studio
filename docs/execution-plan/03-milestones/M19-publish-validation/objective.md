# Objective — M19 Publish Validation

## Goal
Implement a validation engine that checks a ViewArtifact for errors before publishing.
Validation results appear in a panel with blocking errors, warnings, and suggestions.
Clicking an issue navigates the editor to the relevant component or section.

## P0 Feature Covered
Publish Validation

## Build Scope
- ValidationEngine (pure function: ViewArtifact → ViewValidationSummary)
- ValidationPanel (collapsible panel, shows errors/warnings/suggestions)
- ValidationResultItem (icon, category, message, click-to-navigate)
- PublishGuard (blocks publish if blocking errors exist)
- Integration with PublishAction (M17)

## Required Validations
- Missing viewKey
- Missing surface type
- Missing primary entity
- Missing header entity (transaction_workspace surface)
- Missing line entity (transaction_workspace surface)
- Invalid field reference (field ID not found in entity)
- Orphaned binding (binding references deleted component)
- Empty layout (no sections/containers defined)
- Invalid action placement (action placement incompatible with surface type)
- Invalid rule target (behavior rule targets field not in view)
- Hidden required field (field marked required but hidden by rule in all contexts)

## Out of Scope
- Real backend validation, cross-view validation

## Hard Constraints
- Frontend only. Named exports only. ValidationEngine must be a pure function.
