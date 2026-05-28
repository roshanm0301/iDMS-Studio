# iDMS Rule and Workflow Platform PRD Pack - Phase 3

## Phase 3 Scope

This pack covers the native iDMS Workflow and Approval capabilities. It assumes iDMS will build its own workflow and approval platform rather than buying or embedding an external workflow product.

Phase 3 depends on the earlier packs:

- Phase 0: Product context, glossary, boundaries, traceability
- Phase 1: Rule platform foundation, expression engine, validation engine, calculation engine
- Phase 2: Charge, tax, accounting, and financial rule orchestration

## Files Included

| File | Purpose |
|---|---|
| `08_Native_Workflow_Engine_PRD.md` | Native workflow engine requirements: process definitions, process instances, tasks, service steps, timers, retries, escalations, versioning, and runtime execution. |
| `09_Approval_Engine_PRD.md` | Approval policy and approval runtime requirements: approval types, approver resolution, maker-checker, send-back, reject, SLA, delegation, external approvals, audit. |
| `09A_Workflow_Approval_Builder_UX_PRD.md` | Admin Studio drag-and-drop builder requirements for workflow and approval configuration. |
| `09B_Workflow_Approval_Runtime_Orchestration_PRD.md` | Runtime orchestration requirements across transaction services, workflow engine, approval engine, rule engines, notifications, audit, and integrations. |
| `09C_Workflow_Approval_Testing_and_Simulation_PRD.md` | Workflow and approval simulation requirements: path testing, approver testing, SLA testing, error scenarios, regression packs. |

## Core Product Principle

Many backend capabilities may exist behind the curtain, but Admin Studio must expose a unified, business-friendly configuration experience.

Business users should configure:

- Workflow policies
- Approval policies
- Approval paths
- SLA and escalation rules
- Delegation and fallback rules
- Simulation and publish flow

They should not be forced to think in terms of engine internals.

## Native iDMS Build Decision

All requirements in this pack assume:

- iDMS builds the workflow engine natively.
- iDMS builds the approval engine natively.
- BPMN and DMN concepts may be used as modeling guidance, but there is no dependency on external BPM/workflow products.
- Drag-and-drop configuration is required where it improves clarity, especially workflows, approvals, decision gateways, and escalation paths.

## AI Developer Agent Instructions

1. Do not infer behavior not explicitly described in these PRDs.
2. Do not let workflow mutate transaction records directly.
3. Workflow may call transaction services through approved actions or events only.
4. Do not embed tax, charge, or accounting calculations inside workflow nodes.
5. Use published workflow and approval versions at runtime.
6. Every workflow instance and approval action must be auditable.
7. Duplicate actions must be idempotent.
8. API/import/automation must follow the same workflow and approval rules as UI actions.
