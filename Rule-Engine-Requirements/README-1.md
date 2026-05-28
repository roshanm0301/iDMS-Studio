# iDMS Native Rule and Workflow Platform - PRD Pack Phase 0 and Phase 1

## Package Purpose

This package starts the product requirement documentation for the native iDMS Rule and Workflow Platform. It is written for handoff to an AI Developer Agent, engineering leads, QA, product owners, implementation consultants, and enterprise architects.

This package follows the agreed Option B approach: create the foundation documents first, then continue phase-wise into Charge Rules, Tax Rules, Accounting Rules, Workflow, Approval, Simulation, Audit, and Document Packs.

## Important Product Position

The platform is to be built natively inside iDMS. The requirements must not assume buying or embedding third-party workflow, BPM, rule, or tax platforms. External standards such as BPMN and DMN may be used as design references, but iDMS remains the product runtime and system of record.

## Files in This Pack

| File | Purpose |
|---|---|
| 00_Product_Context_and_Glossary.md | Defines product vision, personas, core terms, Admin Studio mental model, and non-negotiable principles. |
| 00A_Architecture_Boundaries.md | Defines boundaries between Rule Platform, Validation, Calculation, Charge, Tax, Accounting, Workflow, Approval, Transaction Service, and Audit. |
| 00B_Requirement_Traceability_Matrix.md | Maps source material and feature areas to PRD files and requirement coverage. |
| 01_Rule_Platform_Foundation_PRD.md | Requirements for rule registry, lifecycle, versioning, scope, publish, rollback, and common governance. |
| 02_Expression_Condition_Engine_PRD.md | Requirements for condition builder, expression engine, formula support, field binding, validation, and safe execution. |
| 03_Validation_Engine_PRD.md | Requirements for backend validation, save-time checks, source rules, quantity rules, stale-data controls, and API parity. |
| 04_Calculation_Engine_PRD.md | Requirements for derived values, quantity formulas, calculation sequencing, precision, rounding, recalculation, and snapshots. |

## How AI Developer Agent Should Use This Pack

1. Read files in numeric order.
2. Do not implement later phases from assumptions. If a feature belongs to Charge, Tax, Accounting, Workflow, Approval, Simulation, or Audit, implement only the foundation hooks defined in this pack.
3. Treat each requirement ID as independently testable.
4. Do not infer behavior that is not explicitly written.
5. Respect all out-of-scope sections.
6. Backend rules must be authoritative. UI behavior must never be the only enforcement point.
7. All published configurations must be immutable and traceable.
8. All runtime execution must generate enough trace data for audit and support diagnosis.

## Phase 0 and Phase 1 Scope

### Included

- Product context and glossary.
- Architecture boundaries.
- Traceability matrix.
- Rule platform foundation.
- Expression and condition engine.
- Validation engine.
- Calculation engine.
- Admin Studio principles, including where drag-and-drop is required or useful.
- AI Developer Agent constraints.

### Not Included Yet

These will be separate PRD files in later phases:

- Charge Rule Engine detailed PRD.
- Tax Rule Engine detailed PRD.
- Accounting Rule Engine detailed PRD.
- Native Workflow Engine detailed PRD.
- Approval Engine detailed PRD.
- Simulation Workbench detailed PRD.
- Audit and Traceability detailed PRD.
- API/Event Contracts detailed PRD.
- Sales, Procurement, Inventory, and Stock Transfer document integration packs.

## Requirement Writing Standard

| Keyword | Meaning |
|---|---|
| shall | Mandatory requirement. |
| should | Recommended behavior; may be deferred with product approval. |
| may | Optional capability. |
| must not | Explicitly prohibited behavior. |
| system-controlled | User cannot edit directly. |
| configuration-controlled | Admin can configure within allowed rules. |
| non-overridable | Core control cannot be weakened by derived document types, tenants, branches, or roles. |

## Foundation Principle

Many backend engines may exist behind the curtain. Admin users should experience one coherent Admin Studio with business-friendly configuration areas.

Architecture underneath must be separated. User experience on top must be unified.
