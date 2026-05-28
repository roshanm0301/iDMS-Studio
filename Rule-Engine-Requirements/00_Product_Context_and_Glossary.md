# 00 - Product Context and Glossary

## 1. Document Purpose

This document defines the product context, glossary, personas, operating principles, and Admin Studio mental model for the native iDMS Rule and Workflow Platform.

It exists to prevent ambiguity before feature-level PRDs are implemented.

## 2. Product Vision

The iDMS Rule and Workflow Platform shall allow business administrators to configure, test, approve, publish, and audit business logic for enterprise transactions without requiring code changes for routine policy changes.

The platform shall support:

- Document validation rules.
- Derived calculation rules.
- Charge and discount rules.
- Tax determination and tax calculation rules.
- Accounting posting determination rules.
- Approval policies.
- Native workflow orchestration.
- Simulation and regression testing.
- Governance, versioning, rollback, and traceability.

## 3. Native Build Decision

PRD-CONTEXT-001: The system shall be designed as a native iDMS platform capability.

PRD-CONTEXT-002: The system must not require buying, embedding, or depending on a third-party BPM, workflow, tax, accounting, or generic rule platform for core runtime execution.

PRD-CONTEXT-003: The system may use external standards and concepts such as BPMN, DMN, decision tables, expression languages, and workflow patterns as design references.

PRD-CONTEXT-004: The system may use open-source UI concepts or libraries for diagramming only if separately approved, but executable truth shall remain in iDMS-controlled metadata and runtime services.

## 4. Product Boundary

### 4.1 In Scope

- Native Admin Studio experience for rule and workflow configuration.
- Rule metadata registry.
- Rule versioning and lifecycle.
- Expression and condition evaluation.
- Validation rule execution.
- Calculation rule execution.
- Domain engine foundation for Charge, Tax, Accounting, Approval, and Workflow.
- Backend runtime orchestration.
- Simulation hooks.
- Audit hooks.
- API/import parity principles.

### 4.2 Out of Scope for Phase 0 and Phase 1

- Full Charge Rule Engine implementation.
- Full Tax Rule Engine implementation.
- Full Accounting Rule Engine implementation.
- Full Workflow Engine implementation.
- Full Approval Studio implementation.
- Visual BPMN-grade workflow designer implementation.
- AI-assisted rule generation.
- External marketplace for rules.
- Low-code app builder beyond approved iDMS Admin Studio capabilities.

## 5. Admin Studio Mental Model

Admin users shall not be exposed to a confusing list of backend engines. They should work in business-friendly configuration areas.

### 5.1 Recommended Admin Studio Areas

| Admin Area | User Intent | Backend Capabilities Used |
|---|---|---|
| Document Configuration | Configure fields, source rules, validation, lifecycle, output. | Rule foundation, validation, calculation, document metadata, transaction service. |
| Commercial Rules | Configure charges, discounts, round-off, formula behavior. | Charge engine, expression engine, calculation engine. |
| Tax Configuration | Configure tax rules, rates, groups, HSN/SAC, place of supply. | Tax engine, expression engine, calculation engine. |
| Accounting Configuration | Configure posting rules, debit/credit mapping, sub-ledger. | Accounting engine, expression engine, simulation. |
| Workflow and Approval | Configure approval flows, tasks, timers, escalations. | Workflow engine, approval engine, decision rules. |
| Simulation Workbench | Test rules and workflows before publish. | Simulation, rule runtime, workflow simulation, trace. |
| Governance | Review drafts, approve changes, publish, retire, rollback. | Versioning, lifecycle, audit. |
| Audit and Diagnostics | Inspect runtime trace and failures. | Audit, trace, payload viewer, diagnostic APIs. |

### 5.2 Design Principle

PRD-CONTEXT-005: The Admin Studio shall use business-friendly labels and workflows while routing configuration to the correct backend capability.

PRD-CONTEXT-006: Advanced diagnostic screens may expose engine names, runtime payloads, matched rules, skipped rules, and execution order to authorized technical users.

## 6. Personas

| Persona | Primary Goal | Access Level |
|---|---|---|
| Entity Studio Admin | Configure document types, fields, views, source behavior, lifecycle rules. | High configuration access. |
| Finance Admin | Configure accounting posting rules and financial controls. | Accounting configuration access. |
| Tax Admin | Configure tax logic, rates, groups, jurisdiction behavior. | Tax configuration access. |
| Commercial Admin | Configure charges, discounts, deviation limits, formulas. | Commercial rule access. |
| Process Admin | Configure workflow and approval flows. | Workflow/approval configuration access. |
| Business Reviewer | Review and approve configuration changes. | Review/publish access. |
| Auditor | Inspect execution trace and configuration history. | Read-only audit access. |
| Support Engineer | Diagnose failed runtime evaluation. | Diagnostic access. |
| AI Developer Agent | Implements requirements and tests behavior. | Development role, not runtime user. |

## 7. Glossary

| Term | Definition |
|---|---|
| Rule | A configured unit of business logic evaluated against input data to produce a result, decision, validation outcome, or calculated value. |
| Rule Definition | The metadata record representing a rule, including name, scope, conditions, outputs, lifecycle, version, and owner. |
| Rule Version | Immutable published snapshot of a rule definition. |
| Rule Scope | The tenant, organization, branch, role, document type, entity, effective date, or other boundary that controls applicability. |
| Condition | A boolean predicate evaluated against transaction data or configuration data. |
| Condition Group | A set of conditions combined with AND/OR logic. |
| Expression | A safe formula or predicate using approved fields, operators, functions, and literals. |
| Field Binding | Mapping between an expression reference and a valid field in an entity schema or runtime payload. |
| Validation Rule | A rule that allows, blocks, warns, or requires correction before an action can proceed. |
| Calculation Rule | A rule that derives a value from inputs, such as pending quantity, taxable amount, total, or round-off. |
| Decision Rule | A rule that returns a decision output, such as applicable tax group, approval path, or posting template. |
| Workflow | A process model representing tasks, decisions, timers, events, escalations, and state transitions. |
| Workflow Definition | Versioned configuration of a workflow. |
| Workflow Instance | A runtime execution of a workflow definition for a specific transaction. |
| Approval Policy | Configuration that defines who approves, under what condition, in what order, and with what SLA or escalation. |
| Transaction Service | The service that owns atomic save, parent updates, inventory updates, document number persistence, and committed transaction state. |
| Audit Trace | Immutable record of what happened, which version ran, what inputs were used, and what output was generated. |
| Simulation | Running rules or workflows against test payloads without side effects. |
| Regression Pack | Saved set of simulation tests and expected outputs used to validate configuration changes. |
| Publish | Governance action that makes an approved configuration version eligible for runtime use. |
| Retire | Governance action that stops a version from being selected for future runtime use while preserving history. |
| Rollback | Governance action that reactivates a previous valid version for future use. |
| Non-overridable Control | A mandatory system control that cannot be weakened by tenant, branch, role, or derived document configuration. |

## 8. Non-Negotiable Product Principles

PRD-CONTEXT-007: Rules may decide or calculate; transaction services shall commit.

PRD-CONTEXT-008: Workflow may orchestrate long-running work; workflow must not directly mutate core transaction data outside approved service contracts.

PRD-CONTEXT-009: UI configuration must not be the only enforcement point for a business rule.

PRD-CONTEXT-010: API/import paths shall enforce the same validation and rule behavior as UI paths.

PRD-CONTEXT-011: Published rule versions shall be immutable.

PRD-CONTEXT-012: Runtime execution shall store enough trace information to identify the rule version, workflow version, inputs, outputs, actor, timestamp, and failure reason.

PRD-CONTEXT-013: Business users shall be given safe guided configuration, not unrestricted code execution.

PRD-CONTEXT-014: Configuration must support simulation before production publish.

PRD-CONTEXT-015: Configuration must support tenant, organization, branch, role, document type, and effective-date scoping where applicable.

## 9. Drag-and-Drop Configuration Principle

PRD-CONTEXT-016: Drag-and-drop shall be used only where visual ordering, relationships, grouping, or flow design materially improves the user experience.

PRD-CONTEXT-017: Drag-and-drop configuration must always generate structured executable metadata.

PRD-CONTEXT-018: Visual layout metadata shall be stored separately from executable metadata.

PRD-CONTEXT-019: The system must not treat visual layout alone as runtime truth.

### 9.1 Recommended Drag-and-Drop Areas

| Area | Requirement Level | Notes |
|---|---|---|
| Workflow Designer | Required in Workflow phase | Human tasks, service tasks, timers, gateways, escalation paths. |
| Approval Flow Builder | Required in Approval phase | Sequential, parallel, conditional, fallback, send-back paths. |
| Condition Builder | Useful in Phase 1 | Drag schema fields into condition groups. |
| Formula Builder | Useful in Phase 1 | Drag fields, functions, charge codes, tax components into formulas. |
| Tax Rule Tree Builder | Required in Tax phase | Jurisdiction and tax group branching. |
| Charge Sequence Builder | Useful in Charge phase | Pre-tax, post-tax, apportionment, and priority ordering. |
| Document Layout Designer | Optional if part of Entity Studio | Sections, tabs, fields, grids, panels. |

### 9.2 Areas Where Drag-and-Drop Should Not Be Forced

| Area | Preferred UI |
|---|---|
| Tax rate maintenance | Grid/table. |
| GL account mapping | Structured form/grid. |
| RBAC permission matrix | Matrix/grid. |
| Simple mandatory validations | Form/grid. |
| Large decision tables | Spreadsheet-like grid. |
| Audit search | Filter/search UI. |

## 10. AI Developer Agent Instructions

AI-DEV-CONTEXT-001: Do not infer third-party platform dependency.

AI-DEV-CONTEXT-002: Do not merge workflow, rules, validation, calculation, tax, charge, accounting, and transaction commit into one service.

AI-DEV-CONTEXT-003: Do not expose backend engine complexity directly to standard admin users.

AI-DEV-CONTEXT-004: Do not bypass backend validation for UI convenience.

AI-DEV-CONTEXT-005: Do not allow published versions to be edited in place.

AI-DEV-CONTEXT-006: Do not implement direct ledger posting, inventory posting, or parent updates inside generic rule evaluation.

AI-DEV-CONTEXT-007: All examples in later PRDs are normative unless explicitly marked illustrative.
