# Validations — M18

## Build Checks
- [ ] npm run test passes
- [ ] npm run typecheck:ui-studio passes
- [ ] npm run lint:ui-studio passes
- [ ] npx vite build passes

## Functional Checks
- [ ] Role selector changes which behavior rules are active in preview
- [ ] Device selector changes canvas width (desktop/tablet/mobile)
- [ ] Workflow state selector changes WorkflowStatusStrip active state
- [ ] Sample record selector populates preview fields with mock record data
- [ ] PreviewModeToggle switches between builder chrome and clean runtime preview
- [ ] Context changes trigger immediate preview re-render

## Code Quality Checks
- [ ] Named exports only. No console.log. No unapproved deps.
