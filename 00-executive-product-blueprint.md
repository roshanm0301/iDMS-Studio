# 00 — Executive Product Blueprint

## 1. Product North Star

The IDMS Admin Studio is the **governed design environment** for metadata-driven enterprise applications.

Its job is not merely to let admins add fields, rules, or workflows. Its job is to make platform behavior visible, editable, explainable, simulatable, and safely promotable.

The product promise:

> A business architect can configure an enterprise process without code, see exactly which layer contributed each behavior, understand what runtime will execute, test the impact, and promote the change safely.

## 2. Locked Product Decisions

| Area | Decision |
|---|---|
| Top-level experience | Unified Admin Studio |
| Primary context | Artifact-first |
| Workspace model | Split workspace |
| Overlay UX | Resolved artifact + layer badges + delta preview |
| Entity Designer | Hybrid entity cockpit |
| Rule Builder | Guided Policy + Condition Tree + JSON Preview |
| Workflow Designer | Visual state machine + transition policy panel |
| Publishing | Governed release package model |
| Simulation | Always-on impact panel + full pre-promotion validation |
| AI assistant | Out of scope for first version |

## 3. Why Not a Salesforce Clone

Salesforce is strong inspiration because it has made object setup, validation, layouts, flow automation, and change deployment accessible to admins. However, IDMS has a different and stronger architectural idea: **Overlay + Compilation + Runtime**.

A Salesforce-style clone would underplay the differentiator. IDMS should instead expose:

| IDMS Differentiator | UI Implication |
|---|---|
| Overlay layers | Every item shows source layer and override status |
| Delta-only customization | Users edit deltas, not copied full artifacts |
| Protected nodes | UI must clearly show lock state and non-overridable behavior |
| Compilation | Users see pre-compile warnings and post-compile preview |
| Runtime-only compiled artifacts | UI distinguishes draft design from active runtime |
| Cross-artifact behavior | Entity, rule, workflow, permission, and overlay dependencies are visible together |

## 4. Product Metaphor

The Admin Studio is an **air traffic control tower**, not a spreadsheet editor.

A controller does not simply move one aircraft. They see traffic, routes, constraints, warnings, and consequences. Similarly, an IDMS configurator must see fields, rules, workflows, permissions, overlays, dependencies, and release state.

## 5. Core UX Principles

| Principle | Meaning |
|---|---|
| Artifact-first | Start with the business object, such as Vehicle Order |
| Layer-aware | Always show Platform, Vertical, Tenant, Node, Role contribution |
| Impact-first | Never hide downstream effects |
| Simulation-first | Test behavior before activation |
| Governance-first | Save does not mean runtime active |
| Outcome-driven | Rules and workflows must show business outcome, not just technical condition |
| No silent magic | Every generated delta, override, or compilation result must be visible |
| Progressive disclosure | Keep first view simple, but make advanced traceability available |

## 6. Core Studio Objects

| Object | Description |
|---|---|
| Artifact | Configurable unit, such as entity schema, rule set, workflow, permission matrix, layout, theme |
| Layer | Platform, Vertical, Tenant, Node, or Role |
| Delta | A partial overlay change document |
| Resolved Artifact | Final merged artifact after overlays are applied |
| Compiled Artifact | Locked runtime artifact consumed by application runtime |
| Change Set | Governed package of draft changes prepared for promotion |
| Impact Finding | Warning, conflict, dependency, or validation result caused by a draft change |
| Simulation Case | Test payload and session context used to verify behavior |

## 7. MVP Boundary

The first UI version should support:

1. Artifact navigator
2. Artifact cockpit
3. Entity Designer
4. Rule Builder
5. Workflow Designer
6. Overlay Studio
7. Permission Matrix
8. Impact Panel
9. Mock simulation
10. Release Package screen
11. Automotive mock seed data

Do not include AI, backend implementation, code generation, or external engine recommendations.

## 8. Product Outcome

The final experience should make this easy:

> "Show me Vehicle Order for Bajaj Auto Pune Branch as Sales Executive. Which fields are visible? Which rules fire on submit? Who can approve? Which layer changed GSTIN? What breaks if I remove Dealer Code? Can I test and promote this safely?"

That is the product standard.
