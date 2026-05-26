# Validations — M20

## Build Checks
- [ ] npm run test passes
- [ ] npm run typecheck:ui-studio passes
- [ ] npm run lint:ui-studio passes
- [ ] npx vite build passes

## Functional Checks — Exit Criteria
- [ ] Published "Customer List" artifact renders as functional list page at /admin/ui-studio/preview/view-customer-list
- [ ] Published "Sale Order Entry" artifact renders as functional transaction workspace at /admin/ui-studio/preview/view-sale-order-entry
- [ ] All 6 surface type renderers implemented and smoke-tested
- [ ] Role switching in PreviewContext (M18) shows/hides components correctly
- [ ] Device switching changes layout width
- [ ] Invalid/unpublished artifact shows graceful error (no crash)
- [ ] RuntimeRenderer imports nothing from builder components or editor stores

## Code Quality Checks
- [ ] Named exports only. No console.log. No unapproved deps.
- [ ] RuntimeRenderer is decoupled from builder — verified by import graph inspection
- [ ] All surface renderers have at least one smoke test
