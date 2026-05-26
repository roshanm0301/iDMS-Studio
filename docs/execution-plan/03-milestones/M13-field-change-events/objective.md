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
