# IDMS v3 Admin Studio Blueprint Pack

**Date:** 2026-04-28  
**Purpose:** Implementation-ready UI blueprint for a world-class, overlay-aware Admin Studio for IDMS v3.  
**Backend scope:** No backend implementation required in this pack. The seed data file is designed for mock-driven frontend development.

## Contents

| File | Purpose |
|---|---|
| `00-executive-product-blueprint.md` | North star, locked decisions, critical product positioning |
| `01-information-architecture-and-routes.md` | Route map, navigation, artifact-first cockpit structure |
| `02-studio-shell-and-interaction-model.md` | Split workspace, panels, common interactions, design rules |
| `03-entity-designer-blueprint.md` | Entity cockpit UX, schema, layout, attribute catalog, dependencies |
| `04-rule-builder-blueprint.md` | Three-mode Rule Builder: guided policy, condition tree, JSON preview |
| `05-workflow-designer-blueprint.md` | State-machine canvas with transition policy gates |
| `06-overlay-studio-blueprint.md` | Layer trace, delta editor, resolved preview, protected controls |
| `07-permission-matrix-blueprint.md` | Action matrix, field visibility, row filters |
| `08-release-governance-and-simulation.md` | Change sets, impact panel, simulation, promotion, rollback |
| `09-automotive-seed-data-guide.md` | How to use the automotive mock seed data |
| `10-critical-review.md` | Brutally honest review, risks, corrections, implementation guardrails |
| `seed/idms_admin_studio_automotive_seed.json` | Automotive-domain mock data for Claude Code UI implementation |

## Core Product Decision

Build a **Unified Admin Studio** with an **artifact-first cockpit**, a **split workspace**, visible **Overlay lineage**, always-on **Impact Panel**, and governed **Release Packages**.

The UI should not be a Salesforce clone. Salesforce is useful inspiration for discoverability and visual automation, but IDMS must lead with capabilities Salesforce-style admin screens do not expose clearly enough by default:

1. Layered overlay lineage
2. Resolved runtime preview
3. Compiled artifact awareness
4. Cross-artifact dependency and impact analysis
5. Governed release packages

## Recommended Implementation Method for Claude Code

Use the seed JSON as a local mock source first.

Suggested frontend-only approach:

1. Load `seed/idms_admin_studio_automotive_seed.json` from a mock service.
2. Build the Studio shell and Artifact Cockpit first.
3. Render entity/rule/workflow/overlay/permission modules from seed data.
4. Wire all actions to local state only.
5. Add visual validation and simulation using deterministic mock functions.
6. Keep backend API names as adapter placeholders, but do not implement backend in this phase.

## Explicitly Out of Scope

- AI / NLP assistant
- Backend code
- New database schema
- External rule/workflow engines
- ORM
- Replacing IDMS runtime architecture
- Runtime execution beyond mock simulation

## Success Bar

A functional prototype should allow an architect or functional consultant to select `Vehicle Order`, inspect fields, rules, workflow, permissions, overlay deltas, simulate a submit/approve command, add changes to a release package, and see compile/promotion readiness.
