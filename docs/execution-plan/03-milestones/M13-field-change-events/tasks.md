# Tasks — M13

1. Create FieldChangeEventListPanel with add/remove events
2. Create FieldChangeTriggerSelector (field dropdown from view's primary entity)
3. Create FieldChangeActionBuilder (action type selector + target selector + value input)
4. Implement all 7 action types as metadata (clear, set, refresh_lookup, recalculate, warn, confirm, revalidate)
5. Create MockEventSimulator (simulates trigger and executes mock actions in preview)
6. Wire demo scenario: Customer field change → refresh price list
7. Wire demo scenario: Branch field change → refresh product lookup
8. Store events in ViewArtifact as behaviorRules with trigger=field_change category or separate fieldEvents
9. Add tests for event configuration and MockEventSimulator
10. Run milestone gate checks and update HANDOFF.md
