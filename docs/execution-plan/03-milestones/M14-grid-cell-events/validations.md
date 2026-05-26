# Validations — M14

## Build Checks
- [ ] npm run test passes
- [ ] npm run typecheck:ui-studio passes
- [ ] npm run lint:ui-studio passes
- [ ] npx vite build passes

## Functional Checks
- [ ] Product cell change event configures UOM/Rate/Tax population
- [ ] Qty/Rate change event configures Amount recalculation
- [ ] Discount threshold event configures warning at > 30%
- [ ] High-value amount event configures approval flag
- [ ] All 6 action types selectable in action builder
- [ ] MockCellEventSimulator demonstrates effects in line grid preview
- [ ] Events stored in ViewArtifact metadata

## Code Quality Checks
- [ ] Named exports only. No console.log. No unapproved deps.
