# Validations — M12

## Build Checks
- [ ] npm run test passes
- [ ] npm run typecheck:ui-studio passes
- [ ] npm run lint:ui-studio passes
- [ ] npx vite build passes

## Functional Checks
- [ ] Admin can create show/hide rule: PaymentType = Finance → show Financer field
- [ ] Admin can create role-based rule: role = Admin → show Delete action
- [ ] MockRuleEvaluator correctly fires rules given simulation context
- [ ] BehaviorSimulationPanel shows which rules are active/inactive
- [ ] Rules stored in ViewArtifact.behaviorRules
- [ ] Preview reflects rule effects (field shown/hidden, action visible/hidden)

## Code Quality Checks
- [ ] Named exports only. No console.log. No unapproved deps.
- [ ] MockRuleEvaluator is a pure function with unit tests
