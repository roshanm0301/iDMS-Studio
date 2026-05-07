# 10 — Critical Review

## 1. Overall Verdict

The chosen product direction is strong and differentiated.

A unified, artifact-first, overlay-aware Admin Studio is the right choice for IDMS because the platform's power comes from relationships between entities, rules, workflows, permissions, overlays, and compiled runtime behavior.

However, the design will fail if it becomes visually impressive but operationally unclear. The user must always understand:

1. Which layer they are editing
2. What delta they are creating
3. What runtime will execute
4. What breaks downstream
5. Whether the change is active or only drafted

## 2. Biggest Product Risks

| Risk | Severity | Why It Matters | Correction |
|---|---|---|---|
| Too much complexity on first screen | High | Users may feel overwhelmed | Use Overview tab and progressive disclosure |
| Overlay concept misunderstood | High | Users may edit wrong layer | Always show scope bar and edit confirmation |
| Rule Builder drifts from actual DSL | High | UI creates rules runtime cannot execute | Use only supported operators/actions |
| Workflow becomes generic flow builder | Medium | IDMS runtime is state-machine based | Keep state/transition model central |
| Save mistaken as activation | High | Dangerous production behavior | Keep release package mandatory |
| Permission/rule interaction hidden | High | Users may not understand why rule does not fire | Show command pipeline in simulation |
| Attribute catalog ignored | Medium | Duplicate fields and poor governance | Make catalog primary add-field path |
| Right Impact Panel noisy | Medium | Users may ignore warnings | Prioritize warnings by severity |
| JSON preview overused | Medium | Non-technical users may disengage | Keep JSON as preview, not primary |
| AI added too early | Medium | Can create false confidence | Keep AI out of first version |

## 3. Architectural Alignment Review

| Area | Alignment | Notes |
|---|---|---|
| Overlay | Strong | Hybrid model fits delta-only architecture |
| Compilation | Strong | Release validation includes compile preview |
| Runtime | Strong | Simulation mirrors command pipeline concept |
| Rule Engine | Strong if exact DSL is preserved | Avoid unsupported operators |
| Workflow | Strong | State machine with guard rules is correct |
| Permissions | Strong | Field and row access included |
| Multi-tenancy | Strong | Scope bar and layer trace are mandatory |
| Governance | Strong | Change set model is appropriate |
| Backend scope | Clean | UI can be mocked first without backend changes |

## 4. Corrections Made in This Blueprint

### Correction 1 — Rule Actions

Some early admin UI notes mention simple actions such as `allow`, `deny`, or `require-field`. The actual Rule Engine DSL supports:

`BLOCK`, `WARN`, `SET_FIELD`, `ROUTE`, `START_WORKFLOW`, `NOTIFY`

The Rule Builder spec uses the actual DSL.

### Correction 2 — Unsupported Operators

Some early UI notes mention `between`. The actual DSL does not list `BETWEEN`.

The blueprint uses `GTE` and `LTE` combinations instead.

### Correction 3 — Workflow Is Not Generic Automation

The workflow spec avoids a free-form flow clone. It defines a state-machine canvas with transition policy gates.

### Correction 4 — Overlay Is Not a Separate Afterthought

Overlay is embedded in every designer through badges, trace, and delta preview.

### Correction 5 — AI Is Removed

AI/NLP is explicitly out of scope for this version.

## 5. First Implementation Sequence

Recommended build order:

| Sequence | Build |
|---:|---|
| 1 | Mock data loader and Studio shell |
| 2 | Artifact Navigator and Artifact Cockpit |
| 3 | Entity Designer read-only resolved view |
| 4 | Overlay badges and layer trace |
| 5 | Rule list and rule detail read-only |
| 6 | Rule Builder condition tree |
| 7 | Workflow canvas read-only |
| 8 | Transition inspector and simulation |
| 9 | Permission Matrix |
| 10 | Impact Panel |
| 11 | Release Package screen |
| 12 | Draft edit flows and local-state save |

Do not start with the workflow canvas. Start with the artifact cockpit and seed data rendering.

## 6. UX Red Flags to Watch During Implementation

| Red Flag | What It Means |
|---|---|
| User cannot tell current layer | Scope bar is not strong enough |
| User edits resolved artifact directly | Delta model is hidden |
| Warnings appear only at publish time | Impact panel is too weak |
| JSON is required for normal work | UI is too technical |
| Canvas dominates workflow | State-machine semantics are lost |
| Rules lack business intent | Governance/audit value is weak |
| Permission UI ignores fields/rows | Enterprise access model is incomplete |
| Release package feels optional | Platform is unsafe for production |
| Mock seed data is hardcoded into components | Architecture will not scale |

## 7. Non-Negotiable Implementation Guardrails

1. No backend implementation in this phase.
2. No external rule/workflow engine.
3. No ORM assumptions.
4. No Salesforce terminology as IDMS truth.
5. No AI assistant in first version.
6. No editing active compiled artifacts directly.
7. No overlay replacement model.
8. No raw UUID or artifact-key typing where a selector can be used.
9. No hidden production activation on save.
10. No unsupported rule DSL operators/actions.

## 8. Final Recommendation

Proceed with this blueprint.

The most important implementation decision is to make the **right-side Impact Panel real from the beginning**, even if its findings are mock-derived. Without that panel, the Studio becomes a nice admin CRUD UI. With it, the Studio becomes a serious enterprise configuration control room.
