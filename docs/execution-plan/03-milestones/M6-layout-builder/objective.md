# Objective — M6 Layout Builder

## Goal
Implement layout configuration for arranging view content into sections, tabs, columns,
cards, accordions, and panels. Canvas preview must reflect metadata.

## P0 Feature Covered
Layout Builder

## Build Scope
- LayoutBuilderPanel, LayoutCanvas
- SectionConfigurator, TabsConfigurator, ColumnConfigurator, AccordionConfigurator
- Add/reorder/remove layout containers
- Assign fields/components to containers
- Canvas preview rendering from LayoutDefinition metadata

## Out of Scope
- Pixel-perfect absolute positioning
- Advanced responsive rules beyond simple device preview switching

## Hard Constraints
- Frontend only. Mock data only. Named exports only.

## Requirement IDs

P0-06 — Layout Builder: LAY-001 through LAY-020 (total 20 requirements)

## Acceptance Criteria (from spec)

- Admin can create sections, tabs, columns, and groups in the layout
- Admin can reorder layout containers via drag-or-move
- Layout changes are reflected in canvas preview
- Nested containers respect depth limits

## Edge Cases (from spec)

- Empty section/tab (warn on publish)
- Circular container reference (blocked)
