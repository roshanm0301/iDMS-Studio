# Validations — M13

## Build Checks
- [ ] npm run test passes
- [ ] npm run typecheck:ui-studio passes
- [ ] npm run lint:ui-studio passes
- [ ] npx vite build passes

## Functional Checks
- [ ] Customer change event configurable with refresh_lookup action
- [ ] Branch change event configurable with refresh_lookup + filter action
- [ ] PaymentType change event can be configured to show/hide Financer
- [ ] All 7 action types selectable in action builder
- [ ] Event configuration stored in ViewArtifact metadata
- [ ] MockEventSimulator demonstrates event execution in preview

## Code Quality Checks
- [ ] Named exports only. No console.log. No unapproved deps.
