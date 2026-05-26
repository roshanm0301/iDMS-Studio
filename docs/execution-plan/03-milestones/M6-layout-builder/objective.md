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
