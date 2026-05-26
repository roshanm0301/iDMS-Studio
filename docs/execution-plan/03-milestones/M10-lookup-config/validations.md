# Validations — M10

## Build Checks
- [ ] npm run test passes
- [ ] npm run typecheck:ui-studio passes
- [ ] npm run lint:ui-studio passes
- [ ] npx vite build passes

## Functional Checks
- [ ] Customer lookup on SaleOrder configurable (display: name, value: id)
- [ ] Product lookup on SaleOrderLine configurable (display: productName, value: id)
- [ ] Picker columns selectable from target entity fields
- [ ] Search fields selectable
- [ ] Default filter expression captured in metadata
- [ ] MockLookupPreview shows simulated picker dialog
- [ ] Configuration stored in ViewArtifact metadata

## Code Quality Checks
- [ ] Named exports only. No console.log. No unapproved deps.
