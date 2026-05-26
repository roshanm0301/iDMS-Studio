# Objective — M8 Form Field Configuration

## Goal
Implement field-level form presentation configuration: widget type, label, placeholder,
help text, required, read-only, display-only, section placement, and field order.

## P0 Feature Covered
Form Field Configuration

## Widget Types
Text input, Textarea, Number, Currency, Date, DateTime, Toggle, Dropdown, Entity Picker,
Display-only, Status badge

## Out of Scope
- Server-side validation
- Complex dynamic rules (M12)

## Hard Constraints
- Frontend only. Mock data only. Named exports only.

## Requirement IDs

P0-08 — Form Field Configuration: FRM-001 through FRM-025 (total 25 requirements)

## Acceptance Criteria (from spec)

- Admin can configure each field in a form: widget type, label override, placeholder, help text, requiredness, read-only
- Widget type list is filtered by field data type
- Required flag override is respected in runtime form validation
- Help text appears beside field at runtime

## Edge Cases (from spec)

- Widget type incompatible with field type (blocked)
- Required field hidden by behavior rule (warn)
