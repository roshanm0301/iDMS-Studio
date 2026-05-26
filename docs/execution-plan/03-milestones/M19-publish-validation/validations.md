# Validations — M19

## Build Checks
- [ ] npm run test passes
- [ ] npm run typecheck:ui-studio passes
- [ ] npm run lint:ui-studio passes
- [ ] npx vite build passes

## Functional Checks
- [ ] All 11 validation checks implemented and tested
- [ ] ValidationPanel shows errors (red), warnings (amber), suggestions (blue)
- [ ] Clicking validation item navigates editor to relevant section
- [ ] Publish is blocked when blocking errors exist
- [ ] Publish proceeds when only warnings/suggestions remain
- [ ] Valid view (5 seeded views) passes validation without blocking errors
- [ ] ValidationEngine is a pure function (no side effects, testable)

## Code Quality Checks
- [ ] Named exports only. No console.log. No unapproved deps.
- [ ] All 11 validation checks have unit tests
