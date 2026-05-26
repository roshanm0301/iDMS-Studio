# Objective — M13 Field Change Event Configuration

## Goal
Implement configuration for field-change-triggered actions on form fields. When a field
value changes, one or more actions execute: clear another field, set a value, refresh a
lookup, recalculate a computed field, show a warning, or require confirmation.

## P0 Feature Covered
Field Change Event Configuration

## Build Scope
- FieldChangeEventListPanel (list all field-change events for the view)
- FieldChangeTriggerSelector (which field triggers the event)
- FieldChangeActionBuilder (action type + action target + optional value)
- Action types: clear / set / refresh_lookup / recalculate / warn / confirm / revalidate
- MockEventSimulator (simulate event in preview)

## Primary Demo Scenarios
- PaymentType = Finance → show Financer field (behavior rule, but triggered by change)
- Customer change → refresh price list lookup
- Branch change → refresh product lookup (filter by branch)

## Out of Scope
- Real event bus, real server-side triggers

## Hard Constraints
- Frontend only. Mock data only. Named exports only.

## Requirement IDs

P0-13 — Field Change Events: FCE-001 through FCE-020 (total 20 requirements)

## Acceptance Criteria (from spec)

- Admin can configure on-change event handlers on form fields
- Supported event actions: set-field-value, clear-field, recalculate, trigger-lookup-refresh, show-message
- Event handlers are declarative (no custom scripts)
- Event execution order is deterministic

## Edge Cases (from spec)

- Event target field removed from layout (blocked on publish)
- Infinite loop in field change chain (blocked/capped)
