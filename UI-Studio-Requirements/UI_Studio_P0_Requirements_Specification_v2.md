# UI Studio P0 Requirements Specification — Version 2

**Product:** IDMS v3 UI Studio  
**Document type:** Detailed requirements specification for P0 feature sets  
**Version:** v2.0  
**Prepared for:** Product, Solution Consulting, UX, Engineering, Architecture, QA  
**Status:** Regenerated draft for team review — benchmark-validated  
**Scope:** P0 / Must-Have UI Studio capabilities only; External URL View & Open URL Action accepted as P1 and referenced only for extensibility alignment  


**Version 2 correction note:** This version supersedes v1.0. The earlier draft was structurally strong but did not explicitly show Salesforce benchmark validation in the document body. Version 2 adds explicit Salesforce, SAP, and Microsoft benchmark validation while preserving the agreed P0 scope and avoiding implementation-phase language.


---

## 1. Purpose

This document converts the agreed UI Studio **P0 feature-set catalogue** into detailed, testable requirements.

It is intentionally different from the earlier feature-set alignment document:

- The earlier document answered **"what feature sets belong in UI Studio?"**
- This document answers **"what must each P0 feature do, what must it not do, and how do we know it is complete?"**

This document does **not** define sprint sequencing, technical architecture diagrams, API implementation, database tables, effort estimates, or release phases.


---

## 2. Benchmark validation model added in Version 2

### 2.1 Why benchmark validation is included

The P0 requirements are not intended to copy Salesforce, SAP, or Microsoft Dynamics. The benchmark validation is used to prevent two opposite mistakes:

1. **Underbuilding the platform** by missing enterprise capabilities already proven in mature platforms.
2. **Overcopying generic CRM/ERP tools** and losing IDMS-specific differentiation for dealer, distributor, service, stock, tax, approval, and header-line transaction scenarios.

The practical stance of this document is:

> Use Salesforce for metadata-driven UI/admin patterns. Use SAP for enterprise transaction discipline. Use Microsoft Dynamics / Power Platform for model-driven app separation and ALM discipline. Then design IDMS UI Studio around the realities of DMS and enterprise distribution workflows.

### 2.2 Primary benchmark: Salesforce

Salesforce is the primary conceptual benchmark for UI Studio because it has mature patterns for page composition, field/component placement, component metadata, dynamic visibility, action placement, and metadata-driven administration.

| Salesforce concept | Requirement implication for UI Studio P0 |
|---|---|
| Lightning App Builder / Lightning pages | UI Studio must treat views as governed metadata artifacts, not hardcoded screens. |
| Record pages / App pages / Home pages | UI Studio must support typed view surfaces with explicit runtime context. |
| Page layouts and Dynamic Forms | UI Studio must separate entity schema from field placement, sectioning, read-only/editable behavior, and conditional rendering. |
| Dynamic Actions | UI Studio must support action placement and conditional availability without embedding business process truth in UI metadata. |
| LWC component metadata (`js-meta.xml`) | UI Studio components must declare allowed surfaces, editable properties, events, supported form factors, and governance metadata. |
| Component visibility rules | UI Studio must support deterministic show/hide and enable/disable behavior with preview and validation. |
| Metadata API / package-oriented delivery | UI Studio view artifacts must be versioned, validated, publishable, rollbackable, and migration-ready. |
| Permission Sets / Field-Level Security / sharing | UI Studio must consume authorization results; hidden UI must never be treated as data security. |

**Salesforce design lesson adopted:** metadata-driven page composition, declarative field/action visibility, and component metadata contracts.

**Salesforce design lesson avoided:** page duplication, profile/page-assignment sprawl, hidden-security assumptions, mixed field-rendering models, and fragile visibility rules.

### 2.3 Secondary benchmark: SAP

SAP is the enterprise transaction benchmark. SAP-style enterprise applications are strong at business document integrity, stateful transaction lifecycles, enterprise localization, and consistent UX patterns for operational users.

| SAP-inspired principle | Requirement implication for UI Studio P0 |
|---|---|
| Transaction documents are controlled business objects | Header-Line Transaction Workspace must be native, not a generic form with a child grid. |
| Master-detail/object-page discipline | Record pages and transaction workspaces must show header, line, related, status, and audit context coherently. |
| Fiscal and localization rigor | Tax, totals, charge, and status rendering must not be casual UI formulas when they affect downstream business truth. |
| Consistent enterprise UX | Layout Builder must enforce regions, sections, patterns, and guardrails rather than freeform pixel chaos. |
| Process-state seriousness | Workflow UX must render lifecycle state clearly while Workflow/Rules own the transition logic. |

**SAP design lesson adopted:** transaction correctness, state visibility, document integrity, and localization seriousness.

**SAP design lesson avoided:** consultant-heavy configuration, fragmented tool experience, and excessive complexity for functional admins.

### 2.4 Secondary benchmark: Microsoft Dynamics / Power Platform

Microsoft Dynamics and Power Platform are strong references for model-driven apps, Dataverse-style separation of data/UI/logic/visualization, forms, views, dashboards, business rules, and solution-based ALM.

| Microsoft concept | Requirement implication for UI Studio P0 |
|---|---|
| Dataverse tables, columns, relationships | Entity Designer remains the source of schema; UI Studio consumes metadata. |
| Forms and views | Smart CRUD, form field configuration, and list/grid configuration must be first-class. |
| Business rules and process flows | UI Studio may render and respond to rules/workflow, but Rules Engine and Workflow own the truth. |
| App designer and sitemap | UI Studio views must be attachable to navigation, but full menu hierarchy remains outside core UI Studio. |
| Solutions and ALM | Save, publish, rollback, and validation must support enterprise lifecycle governance. |
| Responsive model-driven UX | P0 metadata must be device-aware and previewable even if mobile-specific variants are not P0. |

**Microsoft design lesson adopted:** data/UI/logic/visualization separation and lifecycle discipline.

**Microsoft design lesson avoided:** becoming too generic; IDMS must stay more transaction-native and DMS-specific than a generic model-driven app platform.

### 2.5 Benchmark-to-P0 traceability matrix

| P0 Feature | Salesforce benchmark | SAP benchmark | Microsoft benchmark | IDMS-specific differentiation |
|---|---|---|---|---|
| P0-01 View Registry & View Management | Lightning Page metadata | App/catalog registration discipline | App/page component registration | ViewCode-ready artifact management for DMS process views |
| P0-02 Typed View Surface Designer | Record/App/Home page targets | Object page / list report discipline | Model-driven pages/forms/views | Adds native Transaction Workspace surface |
| P0-03 Smart CRUD Builder | Page layouts + list views | Master maintenance screens | Forms/views over Dataverse tables | Faster DMS master screen generation |
| P0-04 Header-Line Transaction Workspace Builder | Record page + related list approximation | Strong transaction document pattern | Form + subgrid approximation | Native header + line + totals + workflow + tax surface |
| P0-05 Field Picker from Entity Designer | Object fields in builders | Business object fields | Table columns in form/view designers | DMS-aware grouping: header, line, audit, computed, relationship fields |
| P0-06 Layout Builder | Lightning page regions | Fiori layout/floorplan discipline | Model-driven forms and sections | Governed region-slot layout, not pixel canvas |
| P0-07 List/Grid Configuration | List views | Worklists/list reports | Views | Operational catalogue grids with bulk/preview readiness |
| P0-08 Form Field Configuration | Dynamic Forms/Page Layout fields | Object page/form sections | Forms | Explicit separation of schema requiredness and UI requiredness |
| P0-09 Line Grid Configuration | Related lists/inline edit approximation | Line-item table discipline | Subgrids | Native editable line grid for sale/purchase/service documents |
| P0-10 Lookup / Entity Picker Configuration | Lookup fields | Value help/search helps | Lookup columns | Branch, customer, stock, product, finance, tax dependent pickers |
| P0-11 Data Source & Filter Override | Dynamic picklists/filtering | Contextual value helps | Filtered views/lookups | Same field behaves differently by ViewCode/process |
| P0-12 Basic Dynamic Behavior Builder | Component visibility/Dynamic Forms | State-aware UI behavior | Business rules | Declarative role/record/workflow/context behavior |
| P0-13 Field Change Event Configuration | Dynamic Interactions/Flow-like behavior | Process-dependent forms | Business rules/events | Header field changes recalc/filter/clear grids |
| P0-14 Grid Cell Change Event Configuration | Custom component event equivalent | Line-item recalculation | Subgrid/business rule patterns | Product/UOM/rate/tax/stock/amount line behavior |
| P0-15 Action Placement Configuration | Dynamic Actions/Quick Actions | Toolbar/action discipline | Command bar/actions | Workflow, print, navigation, modal, URL-extensible actions |
| P0-16 Workflow UX Integration | Flow/Approval UI | Business document lifecycle | Business process flows | Renders status/action/SLA without owning workflow logic |
| P0-17 Save / Publish / Rollback | Metadata/package lifecycle | Transport/release discipline | Solutions/ALM | Draft-safe admin publishing with rollback |
| P0-18 Preview with Context Simulation | Page preview/activation preview | Role/process simulation need | App preview/test environment | Preview by persona, branch/node, workflow state, device, sample record |
| P0-19 Publish Validation | Builder validation | Transport checks | Solution dependency checks | Blocks broken/brittle enterprise screens before live use |
| P0-20 Runtime Renderer Contract | Lightning runtime/component contract | Enterprise runtime contract | Model-driven rendering | Deterministic metadata-to-runtime execution for DMS views |

### 2.6 P1 note: External URL View & Open URL Action

The team-approved **External URL View & Open URL Action** remains classified as **P1**, not P0. P0 action placement and runtime renderer requirements must remain extensible enough to support a future `open_url` action type and `external_url` typed view, but P0 delivery must not absorb its full security, allowlist, URL parameterization, and embed-mode requirements.

---

## 3. Approved product boundary

UI Studio is a **governed, metadata-driven view and transaction experience builder** for enterprise business applications.

UI Studio owns:

| Ownership area | UI Studio responsibility |
|---|---|
| View composition | Defining screen/view types and how views are structured. |
| Field and component presentation | Deciding which entity fields/components appear, where they appear, and how they render. |
| Layout and responsive structure | Tabs, sections, cards, panels, grids, regions, drawers, split views, and device-aware layout rules. |
| Data binding for UI components | Binding components to approved entity queries, relationship data, lookup sources, composite sources, or approved external sources. |
| Interaction behavior | Show/hide, enable/disable, required/read-only behavior, event responses, warnings, confirmations, and UI-level validation feedback. |
| Governed publishing | Draft, preview, validate, publish, rollback, version history, and runtime renderer contract for UI artifacts. |

UI Studio does **not** own:

| Capability | Owner | Boundary rule |
|---|---|---|
| Entity schema, fields, relationships, data types, indexes | Entity Designer | UI Studio consumes schema metadata but cannot create or mutate entity schema. |
| Business validation truth | Rules Engine / backend services | UI Studio can surface validation feedback but cannot be the authority for business correctness. |
| Workflow and approval logic | Workflow / Approval Studio | UI Studio renders workflow state and allowed commands but cannot define state transitions or approval routing. |
| Permission and data security | Permission Matrix / Authorization Service | UI hiding is not security. Server-side authorization must enforce CRUD, field, row, action, and masking rules. |
| Theme and branding | Theme / Design System Studio | UI Studio consumes tokens and theme contracts. |
| Print/output templates | Print / Output Studio | UI Studio can place print actions but does not own document output layout or fiscal print rules. |
| Navigation/menu hierarchy | App/Menu Builder | UI Studio can expose views for navigation but does not own the full menu tree. |
| Expression engine | Shared Expression Studio / Rules Workbench | UI Studio can use expressions; the engine, testing, and reusable library are shared. |
| Integration connector administration | Integration Studio / API Gateway | UI Studio can bind to approved external sources but cannot store credentials or define connectors. |

---

## 4. P0 feature-set index

| ID | P0 Feature Set |
|---|---|
| P0-01 | View Registry & View Management |
| P0-02 | Typed View Surface Designer |
| P0-03 | Smart CRUD Builder |
| P0-04 | Header-Line Transaction Workspace Builder |
| P0-05 | Field Picker from Entity Designer |
| P0-06 | Layout Builder |
| P0-07 | List/Grid Configuration |
| P0-08 | Form Field Configuration |
| P0-09 | Line Grid Configuration |
| P0-10 | Lookup / Entity Picker Configuration |
| P0-11 | Data Source & Filter Override |
| P0-12 | Basic Dynamic Behavior Builder |
| P0-13 | Field Change Event Configuration |
| P0-14 | Grid Cell Change Event Configuration |
| P0-15 | Action Placement Configuration |
| P0-16 | Workflow UX Integration |
| P0-17 | Save / Publish / Rollback |
| P0-18 | Preview with Context Simulation |
| P0-19 | Publish Validation |
| P0-20 | Runtime Renderer Contract |

**Important note on the newly suggested Open URL capability:**  
`External URL View & Open URL Action` has been accepted as a valid feature set, but it is classified as **P1**, not P0. This P0 requirements document only ensures that P0 Action Placement and Runtime Renderer contracts do not block future support for Open URL. Detailed Open URL requirements should be captured in the P1 requirements document.

---

## 5. Requirement language

| Term | Meaning |
|---|---|
| **Must / Shall** | Mandatory requirement for P0 scope. |
| **Should** | Strong recommendation, but not mandatory unless promoted during review. |
| **May** | Optional behavior or supported extension point. |
| **Out of scope** | Explicitly excluded from this P0 requirement set. |

---

## 6. Cross-cutting requirements for all P0 features

These requirements apply to every P0 feature unless a feature section explicitly narrows the rule.

| Req ID | Requirement |
|---|---|
| X-P0-001 | UI Studio must persist every configured view as versioned metadata, not as hard-coded application code. |
| X-P0-002 | UI Studio must consume published Entity Designer schema metadata for fields, field types, labels, enum options, reference targets, relationships, required flags, read-only flags, system fields, and computed-field markers. |
| X-P0-003 | UI Studio must not create, rename, delete, or change entity fields, relationships, indexes, lifecycle policies, privacy classifications, or computed-field formulas. |
| X-P0-004 | UI Studio must maintain a clear separation between design-time metadata, preview-time simulated context, and runtime-rendered active metadata. |
| X-P0-005 | UI Studio must not rely on hidden UI as a security mechanism. The runtime must consume permission-pruned data and metadata from authorization services. |
| X-P0-006 | Any rule, action, data source, field binding, relationship binding, or component reference must be validated before publish. |
| X-P0-007 | P0 UI Studio must support non-developer configuration through visual controls. JSON/manual mode may exist for debugging, but it must not be the only path for P0 configuration. |
| X-P0-008 | Every user-facing label configured in UI Studio must support localization keys or a localization-ready metadata structure. Hardcoded labels may be permitted only as draft warnings, not as final enterprise quality. |
| X-P0-009 | Every configured artifact must capture created by, created at, updated by, updated at, current status, and version lineage. |
| X-P0-010 | Every P0 feature must expose clear validation errors in admin language, not only technical JSON/schema errors. |
| X-P0-011 | UI Studio must provide deterministic behavior: the same published view, same user context, same record context, and same permissions must resolve to the same runtime UI. |
| X-P0-012 | UI Studio must handle missing, deleted, renamed, or type-changed fields gracefully in draft/preview with clear errors and must block publish where required. |
| X-P0-013 | UI Studio must make it visually clear whether the admin is editing a draft, viewing an active version, previewing a simulated runtime, or inspecting a previous version. |
| X-P0-014 | UI Studio must support enterprise naming conventions for view keys and component keys to prevent ambiguous, duplicate, or fragile identifiers. |
| X-P0-015 | UI Studio must not allow arbitrary custom JavaScript or ungoverned scripts in P0 behavior, event, data source, or validation configuration. |
| X-P0-016 | Runtime errors must fail safely: one broken optional component should not crash the full app shell if the view can still render safely; broken required root contracts must show a controlled error page. |
| X-P0-017 | UI Studio must preserve tenant/node/context isolation where applicable. A view configured for one tenant or scope must not leak data or metadata into another unauthorized scope. |
| X-P0-018 | P0 features must be auditable at least at metadata lifecycle level: create, update draft, publish, rollback, archive. Detailed audit-trail analytics may be expanded in P1. |
| X-P0-019 | UI Studio must provide structured metadata outputs that are readable enough for review and migration; opaque blobs are not acceptable for enterprise governance. |
| X-P0-020 | Every feature must have clear non-goals to prevent UI Studio from absorbing Entity Designer, Rules, Workflow, Permissions, Theme, Print, Navigation, or Integration ownership. |
| X-P0-021 | P0 requirements must be benchmark-validated primarily against Salesforce metadata-driven UI patterns and secondarily against SAP transaction rigor and Microsoft model-driven app separation. |
| X-P0-022 | Any component, view, or action configuration must declare its allowed surface context before it can be published. |
| X-P0-023 | UI Studio must not introduce a second security model; authorization must be resolved by platform security before rendering. |
| X-P0-024 | Transaction workspace behavior must treat tax, totals, stock, credit, approval, and pricing outputs as domain-owned values unless explicitly declared as display-only. |
| X-P0-025 | Builder rules must be deterministic, previewable, and auditable; arbitrary client-side scripting is not permitted in P0. |
| X-P0-026 | P0 metadata must be structured enough for semantic diff, validation, and future migration even if full ALM packaging is beyond P0. |
| X-P0-027 | P0 components must expose admin-friendly labels, descriptions, defaults, required flags, and compatible field types wherever configuration is allowed. |
| X-P0-028 | P0 layouts must avoid absolute positioning and must use governed regions, slots, sections, columns, tabs, accordions, cards, panels, or grids. |
| X-P0-029 | P0 preview must show resolved behavior under selected context, not merely static component placement. |
| X-P0-030 | External URL support must remain a future extension point only in P0; full external URL governance belongs to P1 requirements. |

---

---

# P0-01. View Registry & View Management

## Purpose

Provide a central control plane for all UI Studio view artifacts so enterprise teams can discover, create, classify, inspect, govern, and manage views safely.

## In scope

- View listing, searching, filtering, and sorting.
- View creation and cloning from approved templates or blank surface selection.
- Core metadata: view key, display name, description, surface type, primary entity, optional context entity, owner, tags, status, route, scope, version pointers.
- Draft/active/archived visibility and status indicators.
- High-level dependency visibility such as primary entity, line entity, relationships, data sources, actions, and workflow context.
- Ownership and edit responsibility metadata.

## Out of scope

- Full application menu tree ownership.
- Environment promotion/CI/CD implementation.
- Entity schema creation.
- Business rule or workflow definition.
- User provisioning or permissions administration.

## Key dependencies

Entity Designer, View Metadata Store, Authorization Service, Versioning Service, Runtime Renderer.

## Benchmark validation applied in Version 2

Validated against Salesforce Lightning page metadata, Microsoft app/page component concepts, and SAP transport-style governance. Requirement focus: view artifacts must be uniquely identifiable, versionable, publishable, and rollbackable.

## Functional requirements

| Req ID | Requirement |
|---|---|
| REG-001 | UI Studio shall provide a registry page that lists all UI Studio views accessible to the current admin user. |
| REG-002 | Each registry row shall show at minimum: view name, view key, surface type, primary entity, status, active version, draft version if present, owner, last modified date, and last modified by. |
| REG-003 | The registry shall support filtering by surface type, primary entity, status, owner, tag, scope, and presence of draft changes. |
| REG-004 | The registry shall support keyword search across view name, view key, description, tags, and primary entity label. |
| REG-005 | A new view shall require a unique view key before it can be saved as a draft. |
| REG-006 | The view key shall follow a governed naming rule: lowercase snake_case for internal key unless a different platform-wide standard is approved. |
| REG-007 | The system shall prevent two active views in the same scope from using the same route key. |
| REG-008 | The registry shall distinguish draft, published, archived, and invalid states visually. |
| REG-009 | The registry shall allow admins to open a view in builder mode, preview mode, version history mode, or read-only inspect mode depending on their authorization. |
| REG-010 | The registry shall allow authorized users to duplicate a view into a new draft with a new view key and clear clone lineage. |
| REG-011 | The registry shall allow authorized users to archive a view only when no active runtime route depends on it, or after explicit confirmation of impact. |
| REG-012 | The registry shall show whether a view has unresolved publish validation errors. |
| REG-013 | The registry shall expose a view metadata summary without requiring the admin to open JSON mode. |
| REG-014 | The registry shall store view owner and functional owner separately if both are provided. |
| REG-015 | The registry shall support tag management for classification such as master, transaction, finance, service, sales, admin, or experimental. |
| REG-016 | The registry shall display whether the active version and draft version differ. |
| REG-017 | The registry shall provide a controlled delete policy. Published versions shall not be hard-deleted through normal admin action. |
| REG-018 | The registry shall record view creation, draft update, publish, rollback, archive, and restore-from-archive events. |
| REG-019 | View metadata shall include a human-readable description explaining business purpose. |
| REG-020 | The registry shall not show views the admin is not authorized to administer or inspect. |

## Validation and governance requirements

- Block save if view key is missing, duplicate within scope, or invalid format.
- Warn if description, owner, or tags are missing.
- Block publish if primary entity/surface type required by the view is missing.
- Warn before archive if the view is attached to navigation, route, workflow action, or another view reference.

## Acceptance criteria

- An admin can find every draft and published UI Studio view without opening raw metadata.
- Creating a view produces a draft artifact with a stable identifier and version lineage.
- A duplicate view cannot accidentally overwrite or share the same view key as the source.
- Archiving a view does not delete historical published versions.

## Edge cases to handle

- Entity referenced by a view is deleted or unpublished.
- User opens a view whose active version is valid but draft is invalid.
- Two admins attempt to create the same view key concurrently.
- Archived view is still referenced by a menu item or action.

---

# P0-02. Typed View Surface Designer

## Purpose

Ensure every view is created against an explicit surface type with a known context contract, allowed components, default layout assumptions, and validation rules.

## In scope

- Surface selection during view creation.
- Surface-specific builder panels and defaults.
- Surface-to-component compatibility rules.
- Runtime context contracts for list, record, create/edit, related records, transaction workspace, dashboard/summary placeholder, and custom workspace classification.
- Preview and validation behavior based on surface type.

## Out of scope

- Full dashboard builder depth, which remains P2.
- Full wizard builder depth, which remains P2.
- Portal/external experience builder, which remains P3 or adjacent.
- Freeform pixel-based page design without guardrails.

## Key dependencies

View Registry, Component Registry, Runtime Renderer, Layout Builder, Publish Validation.

## Benchmark validation applied in Version 2

Validated against Salesforce page targets and Microsoft model-driven app pages. Requirement focus: use typed surfaces with explicit runtime context; do not allow arbitrary screens to bypass surface rules.

## Functional requirements

| Req ID | Requirement |
|---|---|
| SUR-001 | Every view shall have exactly one primary surface type. |
| SUR-002 | The surface type shall be selected at view creation and stored as immutable for published versions. |
| SUR-003 | Changing a draft surface type after configuration shall require explicit confirmation and shall run compatibility validation. |
| SUR-004 | The system shall define at least these surface types in P0 metadata: list, record_detail, create_edit, related_records, transaction_workspace, dashboard_summary, custom_workspace. |
| SUR-005 | The system shall treat full dashboard design and full wizard design as non-P0 even if their surface types exist in the taxonomy. |
| SUR-006 | Each surface type shall declare required runtime context parameters. Example: record_detail requires entity and record identity; list requires entity/query context; transaction_workspace requires header entity and at least one line relationship. |
| SUR-007 | Each surface type shall declare legal component categories and illegal component categories. |
| SUR-008 | The builder shall prevent admins from placing components that are structurally incompatible with the selected surface. |
| SUR-009 | Surface templates shall provide default regions and required slots for common surfaces. |
| SUR-010 | The selected surface type shall determine required publish validation checks. |
| SUR-011 | Preview shall request context inputs based on the selected surface type. |
| SUR-012 | A list surface shall support list/grid configuration as its primary experience. |
| SUR-013 | A record_detail surface shall support read-focused field sections, highlights, actions, and related panels. |
| SUR-014 | A create_edit surface shall support editable form composition, save actions, and validation display. |
| SUR-015 | A related_records surface shall require a parent context and a relationship binding. |
| SUR-016 | A transaction_workspace surface shall require header-line metadata and transaction-safe save behavior. |
| SUR-017 | A custom_workspace surface shall still use governed regions/components and shall not behave as a fully unbounded canvas. |
| SUR-018 | Surface type names displayed to admins shall use business-friendly labels. |
| SUR-019 | The system shall expose surface descriptions and recommended use cases in the builder. |
| SUR-020 | Surface type metadata shall be versioned so future changes do not break already published views without compatibility handling. |

## Validation and governance requirements

- Block publish when required context contract fields are missing.
- Block incompatible component placement.
- Warn when a custom workspace is being used for a pattern that has a typed surface available.
- Warn when a dashboard_summary surface uses advanced components outside P0 scope.

## Acceptance criteria

- Admin can clearly choose the correct type of view before configuring components.
- Runtime receives predictable context for each view surface.
- Publish validation uses surface-specific rules.
- Unsupported component/surface combinations are blocked or clearly flagged.

## Edge cases to handle

- Admin changes surface after adding components.
- Published view uses a surface whose compatibility rules changed in a later platform version.
- Custom workspace starts accumulating transaction behavior that belongs in transaction_workspace.

---

# P0-03. Smart CRUD Builder

## Purpose

Enable rapid, safe creation of standard entity-backed list and form experiences without forcing admins into low-level component design.

## In scope

- Primary entity selection.
- List column selection and configuration.
- Create/edit form field selection and sectioning.
- Widget recommendation from entity field type.
- Basic sorting, filtering, pagination, row click behavior, and create/edit/delete action placement.
- Generated draft view artifact from entity metadata.

## Out of scope

- Complex header-line transaction documents.
- Business process orchestration.
- Advanced dashboarding.
- Complex approval workflow definition.
- Changing entity fields or relationships.

## Key dependencies

Entity Designer, Field Picker, List/Grid Configuration, Form Field Configuration, Layout Builder, Save/Publish.

## Benchmark validation applied in Version 2

Validated against Salesforce Page Layout/List View patterns and Microsoft forms/views. Requirement focus: fast entity-bound screens with controlled field and column selection.

## Functional requirements

| Req ID | Requirement |
|---|---|
| CRUD-001 | Smart CRUD shall require selection of a primary entity before list or form configuration can be saved. |
| CRUD-002 | Smart CRUD shall retrieve available fields from the published Entity Designer schema. |
| CRUD-003 | Smart CRUD shall offer recommended list columns based on entity metadata such as display ID, name/code, status, date, owner, amount, and updated date when available. |
| CRUD-004 | Smart CRUD shall allow admins to select, reorder, hide, and configure list columns. |
| CRUD-005 | Smart CRUD shall allow admins to select, reorder, and group form fields into sections. |
| CRUD-006 | Smart CRUD shall recommend widget types based on field type, reference metadata, enum metadata, and read-only/computed flags. |
| CRUD-007 | Smart CRUD shall exclude system fields from editable form recommendations by default. |
| CRUD-008 | Smart CRUD shall allow system fields to be displayed read-only where permitted by the platform. |
| CRUD-009 | Smart CRUD shall support create form, edit form, detail display, and list grid contracts for the selected entity. |
| CRUD-010 | Smart CRUD shall allow admins to configure row click behavior: open detail, open edit, open preview, or no action, subject to allowed surface support. |
| CRUD-011 | Smart CRUD shall support basic list actions: new, view, edit, delete/archive where authorized and enabled. |
| CRUD-012 | Smart CRUD shall support default sort field and sort direction. |
| CRUD-013 | Smart CRUD shall support basic filters for status, date, owner, reference fields, and enum fields where applicable. |
| CRUD-014 | Smart CRUD shall clearly show which selected fields are required by schema and which are UI-required overrides. |
| CRUD-015 | Smart CRUD shall not automatically add newly created entity fields into already published views. |
| CRUD-016 | Smart CRUD shall identify removed or renamed entity fields referenced by the view and show them as broken bindings. |
| CRUD-017 | Smart CRUD shall generate a valid component tree behind the scenes; the admin shall not need to edit JSON for normal CRUD creation. |
| CRUD-018 | Smart CRUD shall support preview of list and form output before publish. |
| CRUD-019 | Smart CRUD shall prevent publish if an editable form omits a schema-required field that has no default, no hidden authorized value, and no server-side derivation. |
| CRUD-020 | Smart CRUD shall label itself as suitable for master/simple entities and shall guide admins to transaction workspace for header-line documents. |

## Validation and governance requirements

- Block save if primary entity is not selected.
- Block publish if selected fields no longer exist.
- Block publish if widget is incompatible with field type.
- Warn if a form contains too many fields without sections.
- Warn if a schema-required field is hidden or excluded without safe handling.

## Acceptance criteria

- Admin can create a working master-data screen from an entity without JSON edits.
- Generated view has list, create/edit form, and detail behavior aligned with selected fields.
- Schema-required fields are either included or safely handled.
- Broken field references are caught before publish.

## Edge cases to handle

- Entity has no human-readable display field.
- Entity has only system fields.
- Entity has many reference fields requiring lookup configuration.
- Admin attempts to use Smart CRUD for Sale Order with multiple line entities.

---

# P0-04. Header-Line Transaction Workspace Builder

## Purpose

Provide a first-class UI surface for enterprise transaction documents that require header fields, one or more line grids, document actions, workflow status, validation feedback, and atomic save behavior.

## In scope

- Header entity selection.
- Line entity relationship binding.
- Header form layout.
- Editable line grid layout.
- Basic summary/totals placeholder and footer summaries.
- Document action areas.
- Workflow/status rendering hooks.
- Header and line save orchestration metadata.
- Validation display for header and line errors.

## Out of scope

- Accounting, tax, inventory, pricing, credit, or workflow logic truth.
- Defining line entity schema.
- Defining approval routing.
- Print template design.
- Advanced dynamic tax/charge columns beyond basic structural support, which are P1.

## Key dependencies

Entity Designer relationships, Line Grid Configuration, Form Field Configuration, Data Source Override, Workflow UX Integration, Runtime Renderer, Rules Engine.

## Benchmark validation applied in Version 2

Validated most strongly against SAP transaction-document rigor and the Form Designer header-grid expectations. Requirement focus: native header + line + totals + workflow context, not generic parent-child CRUD.

## Functional requirements

| Req ID | Requirement |
|---|---|
| TXN-001 | The transaction workspace shall require a primary header entity. |
| TXN-002 | The transaction workspace shall require at least one line entity binding through an Entity Designer relationship or approved relationship metadata. |
| TXN-003 | The builder shall display available line relationships for the selected header entity. |
| TXN-004 | The builder shall prevent binding a line grid to an unrelated entity unless a valid relationship or approved explicit binding exists. |
| TXN-005 | The header area shall support form field configuration using fields from the header entity. |
| TXN-006 | The line area shall support line grid configuration using fields from the line entity. |
| TXN-007 | The workspace shall support at least one editable line grid in create/edit mode. |
| TXN-008 | The workspace shall support read-only line grid rendering in detail/review mode. |
| TXN-009 | The workspace shall support document-level action placement such as save draft, submit, cancel, approve, reject, or custom registered actions, subject to authorization and workflow availability. |
| TXN-010 | The workspace shall support header-level validation display, line-level validation display, and overall document validation summary. |
| TXN-011 | The workspace shall support draft row identity for new unsaved line items. |
| TXN-012 | The workspace shall support add row and delete row behavior for line items when allowed. |
| TXN-013 | The workspace shall support tracking dirty state separately for header and line grid changes. |
| TXN-014 | The workspace shall support a controlled save contract where header and line records are submitted together or through an approved transaction endpoint. |
| TXN-015 | The workspace shall not save only header data when line changes fail unless the domain endpoint explicitly supports partial save and returns clear state. |
| TXN-016 | The workspace shall expose workflow state and command areas but shall not define workflow state transitions. |
| TXN-017 | The workspace shall allow admins to configure header field change events and grid cell change events using the P0 event features. |
| TXN-018 | The workspace shall support a line footer summary for simple aggregations such as count, quantity sum, or amount sum when line fields support summary metadata. |
| TXN-019 | The workspace shall support a reserved summary/totals region for future P1 transaction totals panel. |
| TXN-020 | The workspace shall support attachments/notes placeholders only as component slots if available; storage behavior is outside P0. |
| TXN-021 | The workspace shall show clear unsaved changes warnings before navigation away. |
| TXN-022 | The workspace shall support transaction-specific view naming without requiring duplicate header entities. |
| TXN-023 | The workspace shall allow separate layout grouping for header sections and line-grid sections. |
| TXN-024 | The workspace shall allow line grid refresh when header context changes if configured through events. |
| TXN-025 | The workspace shall block publish if the selected line entity does not have a valid relationship to the header entity. |

## Validation and governance requirements

- Block publish when no line entity binding exists.
- Block publish when line grid columns reference non-line-entity fields unless explicitly supported as display-only related fields.
- Warn if transaction workspace has no workflow/status/action area.
- Block publish when editable line grid has no create/update capability in the underlying endpoint.
- Warn if header required fields or line required fields are hidden without safe handling.

## Acceptance criteria

- Admin can build a Sale Order-like screen with header fields and line items without creating separate entities for each process variant.
- Line grid columns derive from the line entity.
- Header and line errors are displayed separately and together.
- Save behavior cannot silently corrupt header-line consistency.

## Edge cases to handle

- Header record saves but one line fails validation.
- Admin changes branch in header after line items exist.
- Line entity relationship is renamed or removed.
- User deletes a persisted line row versus an unsaved draft row.
- Concurrent edit changes line item totals while another user opens the transaction.

---

# P0-05. Field Picker from Entity Designer

## Purpose

Provide a metadata-aware, non-technical field selection experience that prevents admins from manually typing fragile field keys and helps them select compatible fields for the current view/component.

## In scope

- Entity field browsing and searching.
- Type, required, read-only, computed, reference, enum, PII/masking indicators where permitted.
- Entity sections and relationship groupings.
- Compatibility hints for selected component or surface.
- Drag/drop or select-to-insert into list columns, form sections, grids, filters, and rules.

## Out of scope

- Creating/changing fields.
- Editing enum options or reference relationships.
- Changing field-level security.
- Exposing hidden security metadata to unauthorized admins.

## Key dependencies

Entity Designer schema service, Authorization Service, Component Registry, Layout Builder, Rule Builder.

## Benchmark validation applied in Version 2

Validated against Salesforce object-field pickers and Microsoft table column designers. Requirement focus: fields must be selected from Entity Designer metadata, not manually typed.

## Functional requirements

| Req ID | Requirement |
|---|---|
| FPK-001 | The field picker shall display fields from the selected entity using Entity Designer metadata. |
| FPK-002 | The field picker shall support search by field label, API key, description, type, section, and reference target. |
| FPK-003 | The field picker shall show field type badges for string, number, decimal, boolean, date, datetime, text, email, phone, enum, reference, and computed. |
| FPK-004 | The field picker shall indicate schema-required fields. |
| FPK-005 | The field picker shall indicate read-only fields. |
| FPK-006 | The field picker shall indicate computed fields and prevent them from being added as editable inputs. |
| FPK-007 | The field picker shall indicate reference fields and show target entity where the admin is authorized to see it. |
| FPK-008 | The field picker shall indicate enum fields and expose option source information where permitted. |
| FPK-009 | The field picker shall hide system fields from default editable selection but allow authorized read-only display selection. |
| FPK-010 | The field picker shall group fields by Entity Designer section when section metadata exists. |
| FPK-011 | The field picker shall provide an unassigned/general group for fields not assigned to an entity section. |
| FPK-012 | The field picker shall show compatibility status for the current target, such as list column, form input, line grid column, lookup display column, filter, or rule condition. |
| FPK-013 | The field picker shall prevent insertion of incompatible fields where the incompatibility is absolute. |
| FPK-014 | The field picker shall warn but allow insertion where compatibility is possible with configuration changes. |
| FPK-015 | The field picker shall support relationship-aware selection for line entity fields when configuring line grids. |
| FPK-016 | The field picker shall allow admins to insert a selected field into the active layout position without typing the field key. |
| FPK-017 | The field picker shall refresh metadata when the selected entity changes. |
| FPK-018 | The field picker shall show stale/broken indicators for fields previously selected but no longer present in the current schema. |
| FPK-019 | The field picker shall not expose fields that the current admin is not authorized to configure or inspect. |
| FPK-020 | The field picker shall provide a direct link or reference path to Entity Designer for users who have rights to modify schema, without modifying schema inside UI Studio. |

## Validation and governance requirements

- Block insertion of computed field as editable input.
- Block insertion of header entity field into a line grid as an editable line column unless relationship display-only mode is selected.
- Warn when selected field has PII/masking sensitivity and is being added to a broad audience view.
- Warn when selected field is schema-required but configured as hidden in a form.

## Acceptance criteria

- Admin can add fields to list, form, and line grid without knowing API keys.
- Field picker accurately reflects current published entity schema.
- Incompatible field/component combinations are prevented before publish.

## Edge cases to handle

- Field label duplicates across fields.
- Field exists in entity but admin lacks rights to see it.
- Entity schema is updated while builder is open.
- Relationship target entity is unpublished.

---

# P0-06. Layout Builder

## Purpose

Enable admins to arrange fields and components into governed, responsive, enterprise-friendly layouts without creating inconsistent pixel-perfect screens.

## In scope

- Regions, slots, sections, tabs, cards, panels, accordions, columns, sticky areas, split regions.
- Drag/reorder with constraints.
- Responsive layout hints.
- Layout preview by form factor.
- Container-level labels, collapse state, and visibility hooks.

## Out of scope

- Unrestricted absolute positioning.
- Full theme design.
- Print layout design.
- Advanced mobile-specific layout builder, which is P3.

## Key dependencies

Component Registry, Typed Surface Designer, Field Picker, Runtime Renderer, Design System tokens.

## Benchmark validation applied in Version 2

Validated against Salesforce region-based Lightning pages and SAP/Fiori layout discipline. Requirement focus: governed regions and slots, not pixel-perfect chaos.

## Functional requirements

| Req ID | Requirement |
|---|---|
| LAY-001 | The layout builder shall use a structured region/slot/container model. |
| LAY-002 | The layout builder shall support sections for grouping fields and components. |
| LAY-003 | The layout builder shall support tabs for organizing larger views. |
| LAY-004 | The layout builder shall support accordions or collapsible sections. |
| LAY-005 | The layout builder shall support card or panel containers. |
| LAY-006 | The layout builder shall support configurable columns per section within governed limits. |
| LAY-007 | The layout builder shall support drag-and-drop reordering of fields/components within allowed containers. |
| LAY-008 | The layout builder shall support moving fields/components across compatible sections or tabs. |
| LAY-009 | The layout builder shall prevent dropping a component into an incompatible region or surface. |
| LAY-010 | The layout builder shall support a visual outline/tree view of the layout hierarchy. |
| LAY-011 | The layout builder shall show the selected component/container in the inspector panel. |
| LAY-012 | The layout builder shall support container labels, descriptions/help text, default expanded/collapsed state, and visibility hooks. |
| LAY-013 | The layout builder shall allow admins to configure sticky regions such as action footer or header summary where supported by the surface. |
| LAY-014 | The layout builder shall support responsive behavior rules such as stack columns on small width and collapse side panel into drawer where supported. |
| LAY-015 | The layout builder shall not expose pixel-level absolute positioning as a P0 capability. |
| LAY-016 | The layout builder shall provide safe defaults for spacing, density, labels, and alignment from the design system. |
| LAY-017 | The layout builder shall allow empty containers in draft but shall warn before publish. |
| LAY-018 | The layout builder shall support undo/redo for common layout operations if the editor has a command stack. |
| LAY-019 | The layout builder shall preserve component identifiers when reordering so bindings and rules do not break. |
| LAY-020 | The layout builder shall support keyboard-accessible reordering alternatives or property-panel ordering controls. |

## Validation and governance requirements

- Block publish if required root region is empty.
- Warn if a tab/section is empty.
- Warn if nesting depth exceeds governed limits.
- Block incompatible component placement.
- Warn if responsive behavior is not defined for a view marked mobile-supported.

## Acceptance criteria

- Admin can construct a complex form using sections/tabs/cards without JSON edits.
- Layout remains governed and responsive.
- Reordering does not break bindings or behavior rules.
- Publish validation catches empty or incompatible layout structures.

## Edge cases to handle

- All components in a section become hidden by behavior at runtime.
- Admin deletes a container containing bound fields.
- Nested tabs inside tabs are attempted.
- Layout must render with very long localized labels.

---

# P0-07. List/Grid Configuration

## Purpose

Configure operational list and grid experiences for entity records and query-backed datasets, with enough power for daily work but without turning the list builder into a reporting engine.

## In scope

- Column selection, order, width, sorting, basic filters, pagination, badges, density, row selection, row actions, row click behavior.
- Basic export/selection hooks where already available through platform components.
- Permission-aware display.

## Out of scope

- Advanced reporting semantic model.
- Complex dashboard analytics.
- Backend query optimizer or index design.
- Full saved-view management, which is P1.
- Advanced filter builder, which is P1.

## Key dependencies

Entity/query data services, Authorization Service, Component Registry, Field Picker, Data Source Override.

## Benchmark validation applied in Version 2

Validated against Salesforce List Views, SAP worklists/list reports, and Microsoft views. Requirement focus: operational grids with columns, filters, sorting, pagination, row actions, and bulk-readiness.

## Functional requirements

| Req ID | Requirement |
|---|---|
| LST-001 | A list/grid configuration shall have a primary data source. |
| LST-002 | The builder shall allow admins to select columns from the bound entity or approved query result schema. |
| LST-003 | The builder shall allow column reorder without JSON editing. |
| LST-004 | The builder shall allow column width configuration using governed units such as auto, fixed, or proportional width. |
| LST-005 | The builder shall allow admins to set column labels or use field labels by default. |
| LST-006 | The builder shall recommend column renderer based on field type. |
| LST-007 | The builder shall support at minimum text, number, currency/decimal, date, datetime, boolean, enum/status badge, and reference display renderers. |
| LST-008 | The builder shall allow admins to mark columns sortable only if backend/query source supports sorting on that field. |
| LST-009 | The builder shall allow default sort field and direction. |
| LST-010 | The builder shall support basic filters for fields that are filter-compatible. |
| LST-011 | The builder shall support pagination configuration including default page size within governed limits. |
| LST-012 | The builder shall support row click behavior where compatible with the surface. |
| LST-013 | The builder shall support row actions from the configured action set. |
| LST-014 | The builder shall support bulk selection toggle where the underlying action model supports selected rows. |
| LST-015 | The builder shall support list density choices if the CommonDataGrid/runtime component supports them. |
| LST-016 | The runtime grid shall display loading, empty, error, and unauthorized states distinctly. |
| LST-017 | The runtime grid shall not request unauthorized fields. |
| LST-018 | The runtime grid shall handle server-side pagination and sorting when configured. |
| LST-019 | The runtime grid shall preserve row identity using stable record identifiers. |
| LST-020 | The builder shall warn if a grid contains too many default visible columns for the selected surface/form factor. |
| LST-021 | The list/grid shall support status badge configuration for enum/status fields. |
| LST-022 | The list/grid shall support reference field display using configured display field, not raw foreign key, where authorized. |
| LST-023 | The list/grid shall allow read-only computed fields as columns. |
| LST-024 | The list/grid shall not allow editable inline behavior unless the entity/field/action contract supports it. |

## Validation and governance requirements

- Block publish if a selected column does not exist in the query/entity schema.
- Block sortable flag on unsupported data source sort fields.
- Warn if too many columns are visible by default.
- Block row action references that are invalid or unauthorized by contract.

## Acceptance criteria

- Admin can create a usable entity list with configured columns, sorting, pagination, and actions.
- Runtime list respects authorization and field visibility.
- Grid gracefully handles empty and error states.

## Edge cases to handle

- Column field removed from entity.
- Data source returns more columns than configured.
- Reference display field is unavailable or unauthorized.
- Sort field contains null values.

---

# P0-08. Form Field Configuration

## Purpose

Configure how entity fields appear and behave inside forms and detail sections while keeping schema truth and business validation outside UI Studio.

## In scope

- Widget type, label override, placeholder, help text, formatting, section placement, required/read-only/display-only behavior, default presentation, validation message placement, visibility hooks.

## Out of scope

- Changing database type or canonical requiredness.
- Defining server-side validation rules.
- Defining computed field formulas.
- Defining field-level security or PII masking.

## Key dependencies

Entity Designer, Field Picker, Layout Builder, Basic Dynamic Behavior Builder, Rules Engine.

## Benchmark validation applied in Version 2

Validated against Salesforce Dynamic Forms/Page Layout fields and Microsoft forms. Requirement focus: configure presentation behavior without mutating schema truth.

## Functional requirements

| Req ID | Requirement |
|---|---|
| FRM-001 | The builder shall allow admins to add entity fields to form sections using the field picker. |
| FRM-002 | Each configured form field shall bind to exactly one entity field unless it is an approved display-only composite component. |
| FRM-003 | The builder shall recommend default widget type based on entity field type. |
| FRM-004 | The builder shall allow widget override only among compatible widgets. |
| FRM-005 | The builder shall support label override while retaining the original entity field label for reference. |
| FRM-006 | The builder shall support help text and placeholder text configuration. |
| FRM-007 | The builder shall support display formatting for dates, datetimes, numbers, currency/decimal, boolean, enum, and reference fields. |
| FRM-008 | The builder shall show schema-required status separately from UI-required override status. |
| FRM-009 | The builder shall support UI-required behavior that is stricter than schema only when runtime validation can enforce it before save. |
| FRM-010 | The builder shall not allow UI-required behavior to weaken schema-required fields at persistence time. |
| FRM-011 | The builder shall support read-only, editable, hidden, and display-only modes where compatible with field metadata. |
| FRM-012 | Computed fields shall be display-only by default and shall not be editable. |
| FRM-013 | Read-only fields from Entity Designer shall not be made editable in UI Studio. |
| FRM-014 | System fields shall be excluded from editable forms by default. |
| FRM-015 | Reference fields shall use Lookup/Entity Picker configuration unless explicitly rendered as display-only reference text. |
| FRM-016 | Enum fields shall render using dropdown/radio/badge-compatible widgets depending on mode and allowed widget set. |
| FRM-017 | The form shall support field-level validation message rendering. |
| FRM-018 | The form shall support section-level error indicators for hidden/collapsed sections that contain errors. |
| FRM-019 | The form shall support form-level error summary for submit failure. |
| FRM-020 | The builder shall allow admins to configure field order within a section. |
| FRM-021 | The builder shall allow admins to move fields between sections/tabs where compatible. |
| FRM-022 | The builder shall preserve field-specific behavior rules when the field is moved. |
| FRM-023 | The runtime shall avoid submitting display-only fields as user edits unless explicitly required by endpoint contract. |
| FRM-024 | The form shall distinguish user-edited values from server-derived/computed values. |
| FRM-025 | The builder shall warn when sensitive fields are added to broad views if sensitivity metadata is available. |

## Validation and governance requirements

- Block incompatible widget selection.
- Block editable computed/read-only/system field configuration.
- Warn on hidden schema-required fields without default or server derivation.
- Block duplicate field placement within the same form if duplicates would cause ambiguous editing.

## Acceptance criteria

- Admin can configure form fields without changing entity schema.
- Required/read-only/computed/system field semantics are respected.
- Errors are visible at field, section, and form levels.

## Edge cases to handle

- Schema required field hidden by dynamic rule.
- Field appears in two tabs with conflicting editable state.
- Long text field placed in three-column compact section.
- PII field displayed in preview for unauthorized role.

---

# P0-09. Line Grid Configuration

## Purpose

Configure spreadsheet-like editable child-line experiences for transaction documents while preserving line entity integrity.

## In scope

- Line entity binding, columns from line entity fields, editable/read-only state, add/delete row, row actions, cell widgets, inline errors, footer summaries, row identity.

## Out of scope

- Independent data source per grid column as default model.
- Tax/charge engine.
- Inventory or pricing calculation truth.
- Complex pivot grids or analytics grids.

## Key dependencies

Header-Line Workspace, Entity relationships, Field Picker, Grid Cell Change Events, Rules Engine, Runtime Renderer.

## Benchmark validation applied in Version 2

Validated against SAP line-item transaction tables and Salesforce related-list approximations. Requirement focus: line grids are bound to line entities and support transactional editing semantics.

## Functional requirements

| Req ID | Requirement |
|---|---|
| LINE-001 | A line grid shall be bound to exactly one line entity or approved line-like child query. |
| LINE-002 | Line grid columns shall be selected from the bound line entity by default. |
| LINE-003 | The builder shall not treat each line column as an unrelated independent data source by default. |
| LINE-004 | The builder shall allow column selection, order, width, label, widget, editable state, and display mode. |
| LINE-005 | The builder shall identify required line fields from Entity Designer metadata. |
| LINE-006 | The builder shall allow editable cells only for fields that are writable by schema and permission contract. |
| LINE-007 | The line grid shall support adding a new unsaved row when allowed by the view/action state. |
| LINE-008 | The line grid shall support deleting an unsaved row locally. |
| LINE-009 | The line grid shall support marking persisted rows for deletion or invoking delete action according to backend contract. |
| LINE-010 | The line grid shall preserve stable row identity for persisted and draft rows. |
| LINE-011 | The line grid shall support row-level validation messages. |
| LINE-012 | The line grid shall support cell-level validation messages. |
| LINE-013 | The line grid shall support grid-level validation summary. |
| LINE-014 | The line grid shall support footer summaries for configured numeric columns where summary type is supported. |
| LINE-015 | The line grid shall support row actions such as duplicate, delete, open detail, or custom registered row action where configured. |
| LINE-016 | The line grid shall support keyboard navigation appropriate for high-volume line entry. |
| LINE-017 | The line grid shall support paste/input handling within governed limits if runtime grid supports it; unsupported paste must fail safely. |
| LINE-018 | The line grid shall support cell widgets for text, number, currency/decimal, date, enum, boolean, and reference fields. |
| LINE-019 | Reference cells in line grids shall use entity picker behavior compatible with row context and header context. |
| LINE-020 | The line grid shall support refreshing dependent cell values through Grid Cell Change Event Configuration. |
| LINE-021 | The line grid shall distinguish calculated/display-only columns from user-editable columns. |
| LINE-022 | The line grid shall support empty-state text and first-row creation affordance. |
| LINE-023 | The line grid shall prevent publish if no visible columns are configured. |
| LINE-024 | The line grid shall not allow an editable line grid if the line entity lacks create/update capability for the current view contract. |

## Validation and governance requirements

- Block publish if bound line entity does not exist.
- Block publish if required line fields are neither visible/editable nor safely defaulted/derived.
- Block unrelated editable column binding.
- Warn when too many columns are visible by default.
- Detect circular dependencies among grid cell events.

## Acceptance criteria

- Admin can configure editable SaleOrderLine-like grid using the line entity.
- Line rows can be added, edited, deleted, and validated.
- Line grid save contract preserves header-line consistency.

## Edge cases to handle

- Row deleted after being modified.
- User changes product causing dependent fields to recalculate.
- Line entity required field is not visible due to role visibility.
- Partial save conflict when another user edits same transaction.

---

# P0-10. Lookup / Entity Picker Configuration

## Purpose

Configure efficient, secure, and context-aware selection of referenced records across forms, grids, filters, and actions.

## In scope

- Searchable picker, display/value fields, search columns, preview columns, filters, default sort, pagination, empty state, recent selections, dependency behavior.

## Out of scope

- Defining reference relationship itself.
- Bypassing record-level security.
- External connector credential setup.
- Advanced cascading lookup builder beyond P0 event/filter capabilities.

## Key dependencies

Entity Designer reference metadata, Data Source Override, Field Change Events, Authorization Service.

## Benchmark validation applied in Version 2

Validated against Salesforce lookup fields and Microsoft lookup columns. Requirement focus: searchable, permission-aware, filterable entity pickers with configurable display columns.

## Functional requirements

| Req ID | Requirement |
|---|---|
| LOOK-001 | Reference fields shall default to an entity picker widget in editable contexts. |
| LOOK-002 | The picker shall store the configured value field and display the configured display field. |
| LOOK-003 | The picker shall support server-side search for large reference datasets. |
| LOOK-004 | The picker shall support configurable search columns where allowed by the referenced entity metadata. |
| LOOK-005 | The picker shall support configurable preview/display columns. |
| LOOK-006 | The picker shall support default sort field and direction. |
| LOOK-007 | The picker shall support static and dynamic filters from Data Source & Filter Override. |
| LOOK-008 | The picker shall support dependency on form/header/row context where configured. |
| LOOK-009 | The picker shall refresh options when dependent context changes according to event configuration. |
| LOOK-010 | The picker shall show loading, no results, minimum characters required, error, and unauthorized states. |
| LOOK-011 | The picker shall not return records the user is not authorized to access. |
| LOOK-012 | The picker shall not display fields the user is not authorized to see. |
| LOOK-013 | The picker shall support clear selection where the field is optional. |
| LOOK-014 | The picker shall prevent clear selection where the field is required unless replaced before save. |
| LOOK-015 | The picker shall support recent selections if permitted by privacy/security policy. |
| LOOK-016 | The picker shall support keyboard navigation and accessible labeling. |
| LOOK-017 | The picker shall allow display template configuration only using authorized fields. |
| LOOK-018 | The picker shall support reference validation on submit to ensure selected ID still exists and is allowed. |
| LOOK-019 | The picker shall display selected record label even after reload using value-to-display resolution. |
| LOOK-020 | The builder shall warn if the referenced entity has no suitable display field. |

## Validation and governance requirements

- Block publish if picker references nonexistent entity or display field.
- Block publish if value field is not stable or not permitted.
- Warn if search columns are not indexed/search-compatible.
- Warn if recent selections are enabled for sensitive referenced data.

## Acceptance criteria

- User can search/select customer/product/branch/warehouse/financer efficiently.
- Picker respects role and record-level authorization.
- Dependent lookup refresh works when parent field changes.

## Edge cases to handle

- Selected referenced record becomes inactive/deleted.
- Display field becomes unauthorized for user.
- Dependency field is cleared after selection.
- Large result sets require pagination.

---

# P0-11. Data Source & Filter Override

## Purpose

Allow view-specific or component-specific narrowing of default entity data sources and lookups while keeping the configuration declarative, typed, safe, and reviewable.

## In scope

- Form-level filters, component-level query settings, lookup filters, relationship filters, static options, approved external source references, sort/page-size overrides.
- Context variable use for tenant, user, node, header fields, record fields, workflow state, and selected row where valid.

## Out of scope

- Arbitrary scripts inside data source filters.
- Connector/credential administration.
- Business rule truth.
- Unauthorized data access.

## Key dependencies

Entity/query services, Integration registry, Field Picker, Expression Service, Authorization Service.

## Benchmark validation applied in Version 2

Validated against dynamic picklist/filter patterns and DMS-specific process variants. Requirement focus: allow view-level filtering/override without changing entity-level defaults.

## Functional requirements

| Req ID | Requirement |
|---|---|
| DSO-001 | UI Studio shall use Entity Designer default data source/lookup metadata when no override is configured. |
| DSO-002 | The builder shall allow admins to define view-level data source overrides. |
| DSO-003 | The builder shall allow component-level data source overrides where the component supports a data source. |
| DSO-004 | The builder shall allow field/lookup-level filter overrides for reference and enum datasource fields. |
| DSO-005 | Overrides shall be declarative and stored as metadata, not arbitrary executable scripts. |
| DSO-006 | Overrides shall support equality, inequality, contains/search, range, in-list, and logical AND/OR operators where supported by the backend query contract. |
| DSO-007 | Overrides shall support context variables from approved namespaces such as user, tenant, node, view, record, form, row, workflow, and selection. |
| DSO-008 | The builder shall validate that context variables used by an override exist for the selected surface type. |
| DSO-009 | The builder shall allow default sort and page size override within governed limits. |
| DSO-010 | The builder shall support static option lists for simple dropdowns where entity source is not needed. |
| DSO-011 | The builder shall support approved external source references only if the source is already registered and authorized outside UI Studio. |
| DSO-012 | The runtime shall apply authorization after data source filter resolution and before data reaches UI components. |
| DSO-013 | The runtime shall not use UI filters as security filters. |
| DSO-014 | The builder shall provide a preview/test result for data source filters using simulated context. |
| DSO-015 | The builder shall show generated business-readable filter summary. |
| DSO-016 | The builder shall detect fields referenced in filters that no longer exist. |
| DSO-017 | The builder shall prevent filters on fields that the query source does not expose. |
| DSO-018 | The builder shall prevent or warn about filters that are not supported by the underlying source. |
| DSO-019 | The builder shall allow override inheritance rules: entity default, view override, component override, field override, with clear precedence. |
| DSO-020 | The builder shall show final resolved data source configuration for the selected component/field. |

## Validation and governance requirements

- Block publish if override references missing fields, invalid context variables, or unapproved external source.
- Warn if filter may return very large result set.
- Warn if filter uses sensitive fields in a way that may leak data through labels or URLs.
- Block unsupported operators for selected source.

## Acceptance criteria

- Admin can configure Product picker differently for Vehicle Booking versus Parts Sale without changing Product entity.
- Overrides are readable and testable.
- Runtime respects data security independently of UI filters.

## Edge cases to handle

- Header context required by filter is blank.
- External source is temporarily unavailable.
- Filter creates zero lookup results.
- Entity field used in filter is renamed.

---

# P0-12. Basic Dynamic Behavior Builder

## Purpose

Enable no-code dynamic UI reactions for common enterprise scenarios while preventing UI Studio from becoming a scripting platform.

## In scope

- Show/hide, enable/disable, required/optional, read-only/editable, state changes for fields/components/actions based on role, permission, field value, record value, workflow state, device/context, and simple expressions.

## Out of scope

- Complex business rule truth.
- Unbounded scripting.
- Workflow transition definition.
- Server-side validation authority.

## Key dependencies

Expression Service, Authorization Service, Rules Engine, Workflow Engine, Runtime Renderer, Publish Validation.

## Benchmark validation applied in Version 2

Validated against Salesforce Dynamic Forms/visibility and Microsoft business rules. Requirement focus: deterministic show/hide, enable/disable, required/read-only behavior with preview.

## Functional requirements

| Req ID | Requirement |
|---|---|
| BEH-001 | The behavior builder shall support show/hide behavior for fields, sections, components, and action containers. |
| BEH-002 | The behavior builder shall support enable/disable behavior for fields, buttons, and supported components. |
| BEH-003 | The behavior builder shall support required/optional UI behavior for editable fields. |
| BEH-004 | The behavior builder shall support read-only/editable behavior for editable-capable fields. |
| BEH-005 | Behavior conditions shall support user role, permission flag, record field value, form field value, workflow state, entity state, device/form factor, tenant/node context, and view mode where available. |
| BEH-006 | The behavior builder shall provide a guided rule interface for non-technical admins. |
| BEH-007 | The behavior builder shall store rules as typed metadata. |
| BEH-008 | The behavior builder shall not allow arbitrary JavaScript. |
| BEH-009 | The behavior builder shall support simple AND/OR grouping. |
| BEH-010 | The behavior builder shall support null-safe evaluation. |
| BEH-011 | The builder shall show which runtime contexts are available for each surface type. |
| BEH-012 | The builder shall support rule priority/order where two rules target the same property. |
| BEH-013 | The builder shall detect conflicting rules where possible, such as same target made both required and hidden under same condition. |
| BEH-014 | The runtime shall evaluate behavior rules deterministically. |
| BEH-015 | The runtime shall not evaluate behavior rules using unauthorized data. |
| BEH-016 | The runtime shall re-evaluate dependent rules when referenced field/context values change. |
| BEH-017 | The builder shall allow admins to preview behavior results for simulated role, record values, workflow state, and device. |
| BEH-018 | The builder shall show a rule impact list: target field/component/action and affected state. |
| BEH-019 | The builder shall prevent behavior rules from making schema read-only or computed fields editable. |
| BEH-020 | The builder shall prevent UI rules from bypassing backend requiredness or validation. |
| BEH-021 | The system shall provide standard handling for hidden required fields: block, default, derive, or conditionally not applicable based on explicit configuration. |
| BEH-022 | The builder shall provide readable rule descriptions generated from metadata. |

## Validation and governance requirements

- Block publish for invalid rule syntax or missing target.
- Block publish for rules targeting nonexistent fields/components/actions.
- Block making read-only/computed fields editable.
- Warn on conflicting rules.
- Warn on hidden required fields without safe handling.

## Acceptance criteria

- Admin can configure Payment Type = Finance to show and require Financer field.
- Admin can configure status Submitted to make header fields read-only.
- Preview reveals which components are visible for a selected role/workflow state.

## Edge cases to handle

- Rule references a field hidden by permissions.
- Two rules conflict on same target.
- Condition field is null.
- Rule depends on async lookup result.

---

# P0-13. Field Change Event Configuration

## Purpose

Allow admins to declare safe UI reactions when a header/form field changes, such as clearing dependent fields, refreshing lookups, revalidating, showing messages, or triggering approved recalculations.

## In scope

- Field change triggers in forms/header sections.
- Actions: clear field, set allowed value, refresh data source/lookup, revalidate, recalculate display, enable/disable target, show warning/info, call approved rule/service action if registered.
- Dependency tracking and circular dependency detection.

## Out of scope

- Arbitrary scripts.
- Business logic truth for pricing, tax, credit, inventory, or approval.
- Direct database writes outside form save contract.

## Key dependencies

Behavior Builder, Data Source Override, Lookup Picker, Rules Engine, Runtime Renderer.

## Benchmark validation applied in Version 2

Validated against Salesforce Dynamic Interactions and enterprise form behavior. Requirement focus: header-field changes must safely refresh dependent fields, grids, lookups, and calculations.

## Functional requirements

| Req ID | Requirement |
|---|---|
| FCE-001 | The builder shall allow admins to define an event triggered when a configured form/header field value changes. |
| FCE-002 | A field change event shall declare source field, trigger condition, target action, and target field/component/data source. |
| FCE-003 | Supported P0 target actions shall include clear value, set static/default value, refresh lookup/data source, revalidate field/form, show message, change UI state, and invoke approved calculation/rule endpoint where registered. |
| FCE-004 | The builder shall require target selection from valid fields/components/data sources. |
| FCE-005 | The builder shall prevent event actions from modifying fields that are read-only, computed, or unauthorized. |
| FCE-006 | The builder shall allow refresh of dependent lookup filters when a parent field changes. |
| FCE-007 | The builder shall allow clearing dependent field values when parent context changes. |
| FCE-008 | The builder shall allow admins to choose whether dependent fields are always cleared or only cleared when current value is no longer valid. |
| FCE-009 | The builder shall allow event messages with severity info, warning, or error. |
| FCE-010 | The builder shall support debounce or delayed execution for high-frequency fields where runtime supports it. |
| FCE-011 | The runtime shall execute event actions in a deterministic configured order. |
| FCE-012 | The runtime shall prevent infinite loops caused by field A changing field B and field B changing field A. |
| FCE-013 | The builder shall detect obvious circular dependencies before publish. |
| FCE-014 | The runtime shall show controlled errors if an event action fails. |
| FCE-015 | Event execution shall not persist data until the user saves/submits unless the configured action explicitly calls an approved external command. |
| FCE-016 | The builder shall show a dependency graph or dependency list for field change events. |
| FCE-017 | The builder shall allow admins to disable an event without deleting it. |
| FCE-018 | Field change events shall be included in preview simulation. |
| FCE-019 | Field change events shall be included in publish validation. |
| FCE-020 | Event definitions shall be reusable only if explicitly saved as reusable behavior presets; otherwise they belong to the current view. |

## Validation and governance requirements

- Block invalid source/target fields.
- Block unauthorized/read-only target mutations.
- Block circular dependencies that are detectable statically.
- Warn if event invokes a slow/remote source synchronously.
- Warn if clearing field may discard user-entered values.

## Acceptance criteria

- Changing Branch can refresh Product lookup and optionally clear selected Product.
- Changing Customer can refresh Price List/Credit contextual components if configured.
- Changing Payment Type to Finance can show and require Financer field through behavior/event combination.

## Edge cases to handle

- Field changes before dependent lookup has loaded.
- User changes parent field after selecting child field.
- Event action fails due to network/service error.
- Multiple events listen to the same source field.

---

# P0-14. Grid Cell Change Event Configuration

## Purpose

Allow safe, declarative reactions when line-grid cells change, supporting transaction line entry patterns such as product-driven defaults, amount recalculation display, dependent lookup refresh, warnings, and validation prompts.

## In scope

- Cell change triggers in line grids.
- Row-context actions: set/clear cell, refresh row lookup, revalidate row/grid, show message, update display-only calculated value, invoke approved service/rule endpoint.
- Dependency and circular event validation.

## Out of scope

- Pricing/tax/inventory truth.
- Uncontrolled scripts per cell.
- Direct persistence outside save/submit contract.
- Advanced dynamic tax/charge column engine, which is P1.

## Key dependencies

Line Grid Configuration, Header-Line Workspace, Rules Engine, Data Source Override, Runtime Renderer.

## Benchmark validation applied in Version 2

Validated against SAP line-item behavior and custom component event models. Requirement focus: grid cell changes must update dependent line values without becoming ungoverned scripting.

## Functional requirements

| Req ID | Requirement |
|---|---|
| GCE-001 | The builder shall allow admins to define an event triggered when a configured grid column/cell value changes. |
| GCE-002 | A grid cell event shall declare grid, source column, trigger condition, target action, and row/header context usage. |
| GCE-003 | Supported P0 target actions shall include set row field, clear row field, refresh row-level lookup/data source, revalidate cell/row/grid, show message, change UI state, and invoke approved calculation/rule endpoint where registered. |
| GCE-004 | The builder shall allow event actions to reference current row values. |
| GCE-005 | The builder shall allow event actions to reference header/form values where the transaction workspace exposes them. |
| GCE-006 | The builder shall prevent event actions from updating read-only, computed, unauthorized, or display-only columns. |
| GCE-007 | The builder shall support clearing dependent row fields when a source cell changes. |
| GCE-008 | The builder shall support refreshing row-specific lookup filters after source cell or header context changes. |
| GCE-009 | The builder shall support row-level warning or error messages. |
| GCE-010 | The builder shall support confirmation prompt hook only if the standard confirmation component/action is available; advanced popup configuration is P1. |
| GCE-011 | The runtime shall execute grid cell event actions in deterministic order. |
| GCE-012 | The runtime shall prevent infinite loops among cell updates. |
| GCE-013 | The builder shall detect static circular dependencies among grid cell events. |
| GCE-014 | Grid cell events shall not persist data until document save/submit unless invoking an approved command that explicitly persists. |
| GCE-015 | The runtime shall handle event execution for newly added unsaved rows. |
| GCE-016 | The runtime shall handle event execution for copied/duplicated rows if row duplication is enabled. |
| GCE-017 | The builder shall include grid cell event definitions in preview simulation using sample row data. |
| GCE-018 | The builder shall show a dependency list for grid column events. |
| GCE-019 | The runtime shall show controlled row/cell error if an event service fails. |
| GCE-020 | The builder shall allow disabling a grid cell event without deleting it. |
| GCE-021 | The builder shall require explicit admin choice for whether event-calculated fields overwrite existing user-entered values. |
| GCE-022 | The runtime shall distinguish system-filled values from user-overridden values where supported by metadata. |

## Validation and governance requirements

- Block invalid source/target columns.
- Block unauthorized/read-only target updates.
- Block detectable circular dependencies.
- Warn if event overwrites user-entered values.
- Warn if event invokes remote checks for every keystroke without debounce/change trigger control.

## Acceptance criteria

- When Product changes, UOM/rate/tax category/display fields can be refreshed through approved actions.
- When Quantity or Rate changes, amount display can be recalculated or refreshed.
- Warnings appear at row/cell level without corrupting saved data.

## Edge cases to handle

- Product selected before branch is selected.
- Header context changes after line values exist.
- Remote stock check returns delayed result.
- Multiple row events update the same target field.

---

# P0-15. Action Placement Configuration

## Purpose

Allow admins to place approved actions in predictable UI locations while ensuring action execution remains governed by action contracts, permissions, workflow state, and runtime validation.

## In scope

- Action placement in toolbar, form footer, section, grid toolbar, row action, detail header, transaction action area.
- Action labels/icons/order/visual style.
- Bindings to registered action types: save, cancel, navigate, open record, create related, execute command, workflow command, and future extension actions.
- Visibility/enablement hooks through behavior and workflow context.

## Out of scope

- Defining workflow logic.
- Defining connector credentials.
- Building full modal/drawer pages, which is P1.
- Detailed Open URL configuration, which is P1.

## Key dependencies

Component Registry, Action Registry, Workflow Engine, Authorization Service, Behavior Builder, Runtime Renderer.

## Benchmark validation applied in Version 2

Validated against Salesforce Dynamic Actions/Quick Actions and Microsoft command/action surfaces. Requirement focus: actions must be placed consistently and controlled by workflow/security/rules.

## Functional requirements

| Req ID | Requirement |
|---|---|
| ACT-001 | The builder shall allow admins to place registered actions in supported placement zones for the selected surface. |
| ACT-002 | Supported P0 placement zones shall include page toolbar, form footer, record header, grid toolbar, grid row action menu, section action area, and transaction workspace action area where supported. |
| ACT-003 | Each action placement shall reference a registered action definition or standard system action. |
| ACT-004 | Action placement shall include label, optional icon, order, visual style, and placement zone. |
| ACT-005 | The builder shall prevent unsupported action placements for a surface/component. |
| ACT-006 | The builder shall support standard actions such as save draft, save, cancel, delete/archive, view, edit, create, and navigate where applicable. |
| ACT-007 | The builder shall support workflow command actions only as commands provided by Workflow Engine or action registry. |
| ACT-008 | The builder shall support action visibility and enablement hooks through Basic Dynamic Behavior Builder. |
| ACT-009 | The runtime shall evaluate permissions before showing or enabling actions. |
| ACT-010 | The runtime shall re-check authorization at action execution time. |
| ACT-011 | The builder shall allow confirmation-required flag for standard destructive or workflow actions where supported by the action contract. |
| ACT-012 | The builder shall allow disabled-state reason text where the action is disabled but visible. |
| ACT-013 | The builder shall support action grouping and overflow behavior where the placement zone supports it. |
| ACT-014 | The builder shall allow row actions to receive row context. |
| ACT-015 | The builder shall allow grid toolbar actions to receive selection context when selection is enabled. |
| ACT-016 | The builder shall prevent actions from referencing fields/data not available to the action context. |
| ACT-017 | Action configuration shall not store secrets, credentials, or unreviewed external endpoints. |
| ACT-018 | The builder shall show action contract inputs and required context in business-readable form. |
| ACT-019 | The runtime shall show controlled success, warning, and error feedback after action execution. |
| ACT-020 | Action placement metadata shall preserve stable action IDs so behavior rules can reference them. |
| ACT-021 | The P0 action model shall be extensible enough to support P1 Open URL Action later without changing existing placement semantics. |

## Validation and governance requirements

- Block publish if referenced action does not exist.
- Block unsupported placement for selected action/surface.
- Block action with missing required context.
- Warn if destructive action lacks confirmation.
- Warn if too many primary actions are placed in the same area.

## Acceptance criteria

- Admin can place Save/Submit/Approve/Edit actions in correct areas without defining workflow logic.
- Unauthorized actions are not exposed at runtime.
- Action feedback is visible and consistent.

## Edge cases to handle

- Workflow command exists for some statuses but not current status.
- Selected row action used when no row selected.
- Action becomes invalid after workflow/action registry changes.
- Multiple actions have same order/label.

---

# P0-16. Workflow UX Integration

## Purpose

Render workflow state, allowed commands, and workflow-driven UI cues from Workflow/Approval services without making UI Studio the owner of workflow logic.

## In scope

- Status badges, available workflow commands, command buttons, disabled reasons, comments prompt hook, SLA/status indicators if provided, workflow-state-aware UI behavior.

## Out of scope

- Defining workflow states/transitions.
- Defining approval routing or escalation.
- Changing record status directly outside workflow command.
- Business process automation triggered by transitions.

## Key dependencies

Workflow Engine, Authorization Service, Action Placement, Behavior Builder, Runtime Renderer.

## Benchmark validation applied in Version 2

Validated against Salesforce Flow/Approval UI, SAP document lifecycle, and Microsoft business process flows. Requirement focus: render workflow truth without defining workflow truth.

## Functional requirements

| Req ID | Requirement |
|---|---|
| WFU-001 | UI Studio shall allow views to declare that they consume workflow context for a bound entity. |
| WFU-002 | The runtime shall retrieve current workflow state from the workflow/domain service, not from UI configuration alone. |
| WFU-003 | The runtime shall render workflow status using a standard status display component where configured. |
| WFU-004 | The runtime shall render available workflow commands based on Workflow Engine output and user authorization. |
| WFU-005 | UI Studio shall allow admins to choose placement zones for workflow command actions using Action Placement Configuration. |
| WFU-006 | UI Studio shall not allow admins to create workflow transitions inside UI Studio. |
| WFU-007 | The runtime shall show disabled command state only when the workflow/action service returns a disabled command with reason or policy permits disabled display. |
| WFU-008 | The runtime shall hide commands that are not available or not authorized unless configured to show disabled with reason. |
| WFU-009 | The runtime shall re-check workflow command availability immediately before command execution. |
| WFU-010 | The runtime shall support comment-required prompts if the workflow command contract requires comments. |
| WFU-011 | The runtime shall support confirmation prompts if the workflow command contract requires confirmation. |
| WFU-012 | The runtime shall refresh record/workflow state after successful workflow command execution. |
| WFU-013 | The runtime shall show controlled errors when workflow command execution fails. |
| WFU-014 | The behavior builder shall allow workflow state as a condition input for visibility, requiredness, read-only, and enablement. |
| WFU-015 | The builder shall expose available workflow states from Entity/Workflow metadata for rule configuration where available. |
| WFU-016 | The builder shall detect references to workflow states that no longer exist. |
| WFU-017 | The runtime shall not allow UI-only state changes to replace workflow service state. |
| WFU-018 | The builder shall allow status badge label/color mapping only as display configuration, not as state definition. |
| WFU-019 | The runtime shall support SLA/status indicators only if supplied by workflow/domain service or approved metadata. |
| WFU-020 | Workflow UX components shall be optional for non-workflow entities but required/strongly recommended for transaction workspace entities with status workflows. |

## Validation and governance requirements

- Block publish if configured workflow state references are invalid.
- Block UI action that attempts to mutate workflow state without registered command.
- Warn if transaction workspace bound to workflow entity has no status/command display.
- Warn if workflow command is placed in unsupported area.

## Acceptance criteria

- Users see only allowed workflow commands for their role and current state.
- Workflow transitions execute through workflow service, not UI-only status update.
- After command execution, the view refreshes to show new state and actions.

## Edge cases to handle

- Workflow metadata changes after view is published.
- Command requires comment but UI placement has no prompt support.
- User loses permission while page is open.
- Workflow service unavailable.

---

# P0-17. Save / Publish / Rollback

## Purpose

Provide enterprise-safe change control for UI metadata so admins can edit drafts without affecting users, publish only valid versions, and recover quickly from bad publishes.

## In scope

- Draft save, explicit publish, active version, immutable published versions, previous version retention, rollback, validation before publish, dirty-state handling.

## Out of scope

- Full Dev/QA/Prod environment promotion pipeline.
- Git/source-control implementation.
- Multi-approver release governance, unless separately defined.

## Key dependencies

View Registry, Publish Validation, Metadata Store, Runtime Renderer.

## Benchmark validation applied in Version 2

Validated against Salesforce metadata/versioning concepts, SAP transport discipline, and Microsoft solution ALM. Requirement focus: draft safety, explicit publish, immutable active versions, rollback.

## Functional requirements

| Req ID | Requirement |
|---|---|
| PUB-001 | Saving a view in the builder shall create or update a draft version, not the active runtime version. |
| PUB-002 | Publishing shall create an immutable published version. |
| PUB-003 | Only one version of a view shall be active for a given scope/route at a time. |
| PUB-004 | Publishing a new version shall not mutate previously published versions. |
| PUB-005 | Rollback shall reactivate a previously published version or create a new version copied from it according to the platform versioning policy. |
| PUB-006 | End users shall see only active published versions, not drafts. |
| PUB-007 | Authorized UI Studio editors shall be able to preview drafts before publish. |
| PUB-008 | The builder shall clearly show draft saved state, unsaved changes, active version, and last published version. |
| PUB-009 | The system shall block publish until Publish Validation passes all blocking checks. |
| PUB-010 | The system shall allow draft save even when publish validation errors exist, provided metadata is syntactically storable. |
| PUB-011 | The system shall record who saved, who published, publish timestamp, previous active version, and new active version. |
| PUB-012 | The system shall support version history view with at least version number, status, author, published by, published at, rollback availability, and summary. |
| PUB-013 | The system shall prevent concurrent draft overwrites or clearly detect edit conflicts. |
| PUB-014 | The system shall warn when opening a view that another admin is editing if locking/collaboration metadata exists. |
| PUB-015 | The system shall require explicit confirmation before publish. |
| PUB-016 | The system shall require explicit confirmation before rollback. |
| PUB-017 | Rollback shall be blocked if the previous version is incompatible with current required platform/runtime contracts, unless a safe compatibility mode exists. |
| PUB-018 | The runtime shall cache or load active versions by immutable identifier to avoid half-published states. |
| PUB-019 | Publish operation shall be atomic from runtime perspective: users must not see partially updated metadata. |
| PUB-020 | If publish fails, the previous active version shall remain active. |
| PUB-021 | The builder shall support archive/deactivate separate from rollback. |
| PUB-022 | The system shall show publish validation details before and after publish attempt. |

## Validation and governance requirements

- Block publish on blocking validation errors.
- Block rollback to incompatible version unless migration path exists.
- Warn on stale draft based on older active version.
- Warn if draft has unresolved schema drift.

## Acceptance criteria

- Draft changes do not affect end users until publish.
- Published versions are immutable and recoverable.
- A failed publish cannot break the active view.
- Rollback can restore a known-good view quickly.

## Edge cases to handle

- Two admins edit same draft.
- Entity schema changes between save and publish.
- Runtime cache has old version during publish.
- Rollback target references deleted component type.

---

# P0-18. Preview with Context Simulation

## Purpose

Allow admins to see how a draft or published view resolves for realistic runtime contexts before publishing, reducing production surprises.

## In scope

- Preview by surface, sample record, user role/persona, permissions, workflow state, device size, tenant/node context, sample data, behavior rules, action availability.

## Out of scope

- Full QA automation.
- Load/performance testing.
- Actual production write operations.
- Bypassing authorization checks.

## Key dependencies

Runtime Renderer, Authorization Service, Workflow Service, Entity/Data Services, Behavior Builder, Publish Validation.

## Benchmark validation applied in Version 2

Validated against page preview practices and enterprise policy simulation needs. Requirement focus: preview must resolve role, record, workflow, device, tenant/node, and sample data context.

## Functional requirements

| Req ID | Requirement |
|---|---|
| PRE-001 | The preview system shall support previewing draft metadata without publishing it. |
| PRE-002 | The preview system shall support previewing active published metadata for comparison where authorized. |
| PRE-003 | Preview shall allow selecting or simulating a user role/persona context. |
| PRE-004 | Preview shall allow selecting device/form-factor context at minimum desktop and compact/mobile viewport simulation. |
| PRE-005 | Preview shall allow selecting workflow state for workflow-enabled views where simulation is safe. |
| PRE-006 | Preview shall allow selecting sample record data for record/detail/edit/transaction surfaces. |
| PRE-007 | Preview shall allow creating synthetic sample data when no real record is selected, with clear synthetic-data indicator. |
| PRE-008 | Preview shall not persist create/edit/save/action changes to production data. |
| PRE-009 | Preview shall clearly display a preview banner or mode indicator. |
| PRE-010 | Preview shall evaluate visibility, enablement, read-only, requiredness, and event-driven UI state using the selected context. |
| PRE-011 | Preview shall show resolved action availability for the selected context. |
| PRE-012 | Preview shall show permission-pruned fields/actions using simulated or selected user context. |
| PRE-013 | Preview shall show unresolved bindings, broken rules, and invalid components in an issue panel. |
| PRE-014 | Preview shall support transaction workspace preview with header sample data and line sample rows. |
| PRE-015 | Preview shall support list/grid preview with sample or query-backed records subject to permissions. |
| PRE-016 | Preview shall support data source filter testing with the selected context. |
| PRE-017 | Preview shall support behavior/event simulation without committing changes. |
| PRE-018 | Preview shall show what context values are simulated versus real. |
| PRE-019 | Preview shall fail safely if a service needed for preview is unavailable. |
| PRE-020 | Preview shall not be treated as successful publish validation unless publish validation also passes. |
| PRE-021 | Preview shall expose layout responsiveness issues such as overflow where detectable. |
| PRE-022 | Preview shall allow admins to switch back to edit mode without losing unsaved draft changes. |

## Validation and governance requirements

- Block real save/submit/delete/workflow side effects in preview unless explicitly using a safe sandbox/test mode.
- Warn when preview uses synthetic data and may not reflect all runtime behavior.
- Warn when selected simulated context lacks required permissions.
- Show errors for missing sample context required by surface.

## Acceptance criteria

- Admin can preview a draft as Sales Executive, Finance Manager, or Service Manager before publish.
- Admin can see which fields/actions disappear due to permissions or workflow state.
- Preview cannot accidentally create/update/delete production records.

## Edge cases to handle

- No sample record exists.
- Permission service unavailable.
- Workflow state simulation conflicts with record status.
- Data source filter returns no records in preview.

---

# P0-19. Publish Validation

## Purpose

Protect the runtime by preventing structurally invalid, unsafe, or incompatible UI metadata from becoming active.

## In scope

- Blocking validation, warnings, issue categorization, surface-specific checks, binding checks, component checks, rule checks, action checks, data source checks, publish-readiness summary.

## Out of scope

- Guaranteeing business outcome correctness.
- Full performance benchmarking.
- Full security audit of external systems.
- Automatic repair of invalid configuration unless explicitly requested and reviewed.

## Key dependencies

View Registry, Component Registry, Entity Designer, Rules/Expression Service, Workflow Service, Action Registry, Runtime Renderer.

## Benchmark validation applied in Version 2

Validated against metadata deployment checks, solution dependency checks, and enterprise transport gates. Requirement focus: block broken, unsafe, inaccessible, or inconsistent views before publish.

## Functional requirements

| Req ID | Requirement |
|---|---|
| VAL-001 | Publish validation shall run before every publish attempt. |
| VAL-002 | Publish validation shall produce blocking errors, warnings, and informational messages. |
| VAL-003 | Blocking errors shall prevent publish. |
| VAL-004 | Warnings shall not prevent publish unless platform policy marks the warning as blocking for a tenant/environment. |
| VAL-005 | Validation shall check that view key exists and follows naming rules. |
| VAL-006 | Validation shall check that route key is unique within applicable scope. |
| VAL-007 | Validation shall check that required surface type is selected. |
| VAL-008 | Validation shall check that required primary entity exists and is published. |
| VAL-009 | Validation shall check that selected fields exist in the current entity/query schema. |
| VAL-010 | Validation shall check that widget types are compatible with field types and modes. |
| VAL-011 | Validation shall check that required root layout/container structure exists. |
| VAL-012 | Validation shall check that required surface context contract fields are configured. |
| VAL-013 | Validation shall check that component IDs are unique within the view. |
| VAL-014 | Validation shall check that component types exist in the component registry and support the selected surface/form factor. |
| VAL-015 | Validation shall check that data source references exist and are approved. |
| VAL-016 | Validation shall check that filters reference valid fields and context variables. |
| VAL-017 | Validation shall check that behavior rules reference valid targets and valid context. |
| VAL-018 | Validation shall check that action placements reference valid registered actions. |
| VAL-019 | Validation shall check that workflow state/action references exist where workflow metadata is available. |
| VAL-020 | Validation shall check line grid bindings for valid header-line relationship. |
| VAL-021 | Validation shall check hidden or omitted schema-required fields for safe handling. |
| VAL-022 | Validation shall detect obvious circular dependencies in field/grid events. |
| VAL-023 | Validation shall flag empty containers, empty tabs, or empty sections as warnings or errors according to severity policy. |
| VAL-024 | Validation shall check that published metadata can be compiled into the Runtime Renderer Contract. |
| VAL-025 | Validation shall display issues with exact location: view, surface, component, field, rule, action, or data source. |
| VAL-026 | Validation shall provide business-readable remediation guidance. |
| VAL-027 | Validation shall be executable on demand before publish. |
| VAL-028 | Validation shall store validation result summary with publish attempt audit. |

## Validation and governance requirements

- Block publish for missing primary entity on entity-bound surface.
- Block publish for missing/broken fields, data sources, actions, rules, and components.
- Block publish for invalid transaction header-line relationship.
- Warn on too many fields/columns/components according to configured complexity policy.
- Warn on localization/accessibility/performance issues if checks exist in P0; deep checks may be P2.

## Acceptance criteria

- No broken view can be published due to missing core metadata.
- Admins see exactly what must be fixed before publish.
- Validation can be run before publish to reduce wasted attempts.

## Edge cases to handle

- Field exists in draft but removed before publish.
- Component registry deprecates a component type.
- Behavior rule targets component deleted from layout.
- Workflow command renamed or removed.

---

# P0-20. Runtime Renderer Contract

## Purpose

Define the formal contract by which published UI Studio metadata is compiled, resolved, authorized, and rendered consistently at runtime.

## In scope

- Compiled view schema, component registry contract, data binding resolution, permission pruning, rule evaluation order, action execution contract, error handling, version compatibility, rendering modes.

## Out of scope

- Frontend framework implementation details.
- Database schema implementation.
- Business service internals.
- Rules/workflow/authorization engine internals.

## Key dependencies

All P0 features, Runtime Renderer, Metadata Store, Entity Schema Service, Authorization Service, Workflow Service, Data Services, Component Registry.

## Benchmark validation applied in Version 2

Validated against Salesforce runtime component contracts and Microsoft model-driven rendering. Requirement focus: deterministic renderer inputs/outputs, authorization pruning, and stable execution behavior.

## Functional requirements

| Req ID | Requirement |
|---|---|
| RTC-001 | Published UI metadata shall be compiled into a runtime-ready artifact before or during publish according to platform policy. |
| RTC-002 | The runtime artifact shall include view identity, version, surface type, context contract, layout tree, component tree, bindings, rules, actions, and data source references. |
| RTC-003 | The renderer shall load only active published view versions for end users. |
| RTC-004 | The renderer shall resolve entity schema metadata for entity-bound views. |
| RTC-005 | The renderer shall apply permission pruning before rendering fields/actions/components that depend on protected data. |
| RTC-006 | The renderer shall not expose unauthorized field values to client components. |
| RTC-007 | The renderer shall resolve data bindings according to declared data source precedence. |
| RTC-008 | The renderer shall evaluate behavior rules in a documented deterministic order. |
| RTC-009 | The renderer shall process event handlers using the configured dependency order and loop protection. |
| RTC-010 | The renderer shall enforce component/surface compatibility from the component registry. |
| RTC-011 | The renderer shall provide standard runtime states: loading, ready, empty, unauthorized, invalid configuration, recoverable component error, and fatal view error. |
| RTC-012 | The renderer shall isolate component failure where possible so an optional component failure does not crash the entire view. |
| RTC-013 | The renderer shall show a controlled fatal error when root view metadata is invalid or cannot be loaded. |
| RTC-014 | The renderer shall support create, edit, detail, list, related, and transaction workspace modes according to surface contract. |
| RTC-015 | The renderer shall pass correct context to actions: view, user, tenant/node, record, row, selection, workflow state, and form state as applicable. |
| RTC-016 | The renderer shall re-check authorization for action execution. |
| RTC-017 | The renderer shall prevent preview-only metadata from being used by end-user runtime routes. |
| RTC-018 | The renderer shall support version compatibility checks to prevent old metadata from breaking after platform upgrades. |
| RTC-019 | The renderer shall emit structured errors that can be used by admins/support to identify broken view/component/rule/binding. |
| RTC-020 | The renderer shall support telemetry hooks for load errors, render errors, action failures, and validation failures even if advanced analytics is P2. |
| RTC-021 | The renderer shall support localization lookup for labels, help text, messages, and action labels. |
| RTC-022 | The renderer shall respect design system tokens without allowing view metadata to hard-code arbitrary global theme behavior. |
| RTC-023 | The renderer shall support cache invalidation when a new active view version is published. |
| RTC-024 | The renderer shall guarantee that partially published metadata is never served as active runtime metadata. |
| RTC-025 | The renderer contract shall be documented enough for engineering, QA, and future component SDK work. |

## Validation and governance requirements

- Block activation of metadata that cannot compile into runtime contract.
- Fail safely on missing component type.
- Fail safely on unauthorized field/action.
- Warn/telemetry when optional component fails.

## Acceptance criteria

- Published views render consistently for end users.
- Runtime respects permissions and does not leak data.
- Errors are diagnosable and controlled.
- Future components can target a stable renderer contract.

## Edge cases to handle

- Active view version references deprecated component.
- Authorization service returns partial field access.
- Data source times out.
- Behavior rule evaluation fails.
- New version published while user has old view open.

---



# 7. Version 2 benchmark review checklist

## 7.1 Salesforce review

| Salesforce lesson | V2 treatment |
|---|---|
| Page composition must be metadata-driven | Reflected in View Registry, Typed View Surface Designer, Layout Builder, and Runtime Renderer Contract. |
| Component properties must be exposed safely to builders | Reflected in component/property requirements across Layout, Field, Grid, Action, and Renderer features. |
| Field visibility and action visibility must be declarative | Reflected in Basic Dynamic Behavior, Field/Grid Events, and Action Placement. |
| Page variants can become unmanageable | P0 requires typed surfaces, context simulation, validation, and avoids cloned variants as a default pattern. |
| UI hiding is not security | Explicitly enforced in cross-cutting requirements, Workflow UX, Publish Validation, and Renderer Contract. |
| Metadata needs lifecycle governance | Reflected in Save/Publish/Rollback and Publish Validation. |

## 7.2 SAP review

| SAP lesson | V2 treatment |
|---|---|
| Transaction screens are business documents, not simple forms | Reflected in Header-Line Transaction Workspace and Line Grid Configuration. |
| Header, line, totals, status, and audit context must stay coherent | Reflected in Header-Line, Line Grid, Workflow UX, and Runtime Renderer Contract. |
| Localization/tax/fiscal behavior must not be casual UI logic | Reflected in boundary rules that keep tax, totals, pricing, and stock truth outside UI Studio. |
| Enterprise UI must be consistent and governed | Reflected in Layout Builder, Publish Validation, Preview, and Runtime Renderer. |

## 7.3 Microsoft Dynamics / Power Platform review

| Microsoft lesson | V2 treatment |
|---|---|
| Separate data, UI, logic, and visualization | Reflected in product boundaries and feature ownership rules. |
| Forms and views are core model-driven app assets | Reflected in Smart CRUD, Form Field Configuration, and List/Grid Configuration. |
| Relationships drive navigation and UI composition | Reflected in Field Picker, Lookup/Entity Picker, Data Source Override, and Line Grid Configuration. |
| ALM requires solutions/dependency awareness | Reflected in Save/Publish/Rollback, Publish Validation, and Renderer Contract. |

## 7.4 Completeness review after regeneration

The Version 2 regeneration was checked against the approved P0 list and confirms that all 20 P0 feature sets remain present:

1. View Registry & View Management
2. Typed View Surface Designer
3. Smart CRUD Builder
4. Header-Line Transaction Workspace Builder
5. Field Picker from Entity Designer
6. Layout Builder
7. List/Grid Configuration
8. Form Field Configuration
9. Line Grid Configuration
10. Lookup / Entity Picker Configuration
11. Data Source & Filter Override
12. Basic Dynamic Behavior Builder
13. Field Change Event Configuration
14. Grid Cell Change Event Configuration
15. Action Placement Configuration
16. Workflow UX Integration
17. Save / Publish / Rollback
18. Preview with Context Simulation
19. Publish Validation
20. Runtime Renderer Contract

No P0 feature was removed. No P1/P2/P3 feature was promoted into P0. External URL View & Open URL Action remains P1.


# 8. P0 Review Checklist

This section verifies that no P0 feature has been missed and that the requirements do not create ownership conflicts.

## 8.1 Feature coverage checklist

| P0 Feature | Requirement section present? | Notes |
|---|---:|---|
| View Registry & View Management | Yes | Covered in P0-01. |
| Typed View Surface Designer | Yes | Covered in P0-02. |
| Smart CRUD Builder | Yes | Covered in P0-03. |
| Header-Line Transaction Workspace Builder | Yes | Covered in P0-04. |
| Field Picker from Entity Designer | Yes | Covered in P0-05. |
| Layout Builder | Yes | Covered in P0-06. |
| List/Grid Configuration | Yes | Covered in P0-07. |
| Form Field Configuration | Yes | Covered in P0-08. |
| Line Grid Configuration | Yes | Covered in P0-09. |
| Lookup / Entity Picker Configuration | Yes | Covered in P0-10. |
| Data Source & Filter Override | Yes | Covered in P0-11. |
| Basic Dynamic Behavior Builder | Yes | Covered in P0-12. |
| Field Change Event Configuration | Yes | Covered in P0-13. |
| Grid Cell Change Event Configuration | Yes | Covered in P0-14. |
| Action Placement Configuration | Yes | Covered in P0-15. |
| Workflow UX Integration | Yes | Covered in P0-16. |
| Save / Publish / Rollback | Yes | Covered in P0-17. |
| Preview with Context Simulation | Yes | Covered in P0-18. |
| Publish Validation | Yes | Covered in P0-19. |
| Runtime Renderer Contract | Yes | Covered in P0-20. |

## 8.2 Boundary conflict review

| Boundary area | Requirement decision | Conflict status |
|---|---|---|
| Entity schema | UI Studio consumes schema, cannot mutate it. | No conflict. |
| Business validation | UI Studio shows validation feedback; Rules/backend enforce truth. | No conflict. |
| Workflow | UI Studio renders status/actions; Workflow owns transitions/routing. | No conflict. |
| Permissions | UI Studio consumes permission-pruned metadata/data; authorization service enforces access. | No conflict. |
| Print | UI Studio may place print action; Print Builder owns output templates. | No conflict. |
| Theme | UI Studio consumes tokens; Theme Studio owns branding. | No conflict. |
| Navigation | UI Studio exposes views/routes; Menu Builder owns menu hierarchy. | No conflict. |
| Integration | UI Studio binds to approved sources; Integration Studio owns connectors and credentials. | No conflict. |
| Open URL | Accepted as P1; P0 only leaves action contract extensible. | No conflict. |

## 8.3 Ambiguity removal decisions

| Topic | Final requirement decision |
|---|---|
| Is UI Studio a form builder? | No. It is a governed view and transaction experience builder. |
| Can UI Studio create fields? | No. Entity Designer owns schema. |
| Can UI hidden fields be considered secure? | No. Backend authorization is mandatory. |
| Can field/grid events run arbitrary scripts? | No. P0 supports declarative event actions only. |
| Can Smart CRUD handle all transaction screens? | No. Header-line transaction workspace is separate and first-class. |
| Can dashboard surface exist in P0 while Dashboard Builder is P2? | Yes. P0 defines the surface taxonomy/contract; full dashboard authoring remains P2. |
| Can Open URL be part of P0? | No. It is accepted as P1; P0 Action Placement must remain extensible for it. |
| Can published metadata be edited in place? | No. Published versions are immutable; edits create/update drafts. |

## 8.4 Minimum P0 success definition

P0 UI Studio is complete only when all of the following are true:

1. An admin can create, manage, preview, publish, and rollback UI views from a registry.
2. Every view has a typed surface and valid runtime context contract.
3. An admin can build standard CRUD screens from Entity Designer metadata without JSON editing.
4. An admin can build a header-line transaction workspace using a header entity and line entity relationship.
5. Admins can add fields using metadata-aware field pickers, not manual field-key typing.
6. Admins can configure layouts using governed sections, tabs, grids, panels, and responsive containers.
7. Admins can configure list/grid, form field, line grid, and lookup behavior with validation.
8. Admins can configure basic dynamic behavior and field/grid change events declaratively.
9. Admins can place approved actions without defining workflow/security/business logic inside UI Studio.
10. Workflow status and commands render from Workflow Engine output.
11. Publish validation blocks broken metadata.
12. Runtime Renderer consumes published metadata deterministically, securely, and safely.

## 8.5 Requirements count summary

| Area | Count |
|---|---:|
| Cross-cutting requirements | 30 |
| P0 feature sections | 20 |
| Feature-level functional requirements | 442 |
| Validation/governance checklist items | 90+ |
| Acceptance criteria groups | 20 |
| Edge case groups | 20 |

---

# 9. Source basis

This Version 2 document is grounded in the following source set.

## 9.1 Internal IDMS source documents

| Source | How it was used |
|---|---|
| `requirements-ui-studio.md` | Existing UI Studio concepts, view types, component library, Smart CRUD, data binding, behavior, workflow integration, save/publish model, and current limitations. |
| `requirements-entity-designer.md` | Entity Designer boundaries, field metadata, relationships, workflow state machine, entity actions, permission matrix, audit, privacy, and schema ownership. |
| `Form Designer Requirements Document 1.docx` | Header-grid structure, ViewCode, line entity binding, form-level data source override, header field change events, grid cell change events, dynamic columns, popups, workflow integration, and save behavior. |
| `ui-ux-features-complete(1).md` | Existing application shell, catalogue/list/grid system, transaction forms, form layout builder, menu builder, theme builder, print builder, localization, and common UX patterns. |
| `deep-research-report (1).md` | Salesforce-inspired metadata model, typed surface taxonomy, component contracts, dynamic behavior, governance, performance, accessibility, localization, and enterprise pitfalls. |

## 9.2 Official and external benchmark references used for V2 validation

| Benchmark | Source reference | Used for |
|---|---|---|
| Salesforce | Lightning Web Components XML configuration file elements — `js-meta.xml`, `isExposed`, `targets`, design configuration | Component metadata, target/surface compatibility, builder-safe properties. |
| Salesforce | `lightning__RecordPage` target documentation | Record-page component configuration, object restrictions, builder-settable properties, supported form factors. |
| Salesforce | `lightning__AppPage` target documentation | App-page components, property contracts, events/Dynamic Interactions, supported form factors. |
| Salesforce | Metadata/API/package concepts from the deep research source set | Versioned metadata, deployment discipline, rollback, and governance inspiration. |
| SAP | SAP Fiori / object-page / enterprise UI principles from the benchmark research | Header-line transaction rigor, document state, object-page discipline, consistent enterprise UX. |
| Microsoft | Model-driven app overview | Component-focused no-code apps, tables, forms, views, charts, dashboards, relationships, responsive UX, solutions/ALM. |
| Microsoft | Model-driven app components | Separation of data, UI, logic, and visualization; forms, views, business rules, process flows, charts, dashboards. |
| Microsoft | Power Platform solution concepts | ALM discipline, managed/unmanaged solution thinking, dependency awareness. |

## 9.3 Explicit V2 correction from v1

The v1 file was not wrong in its P0 feature coverage, but it under-documented benchmark validation. Version 2 corrects that by making Salesforce the primary benchmark and SAP/Microsoft secondary validation references. The requirements remain IDMS-first and do not copy any vendor literally.

# 10. Final recommendation for team review

The P0 requirements are intentionally strict. They define the **minimum credible enterprise UI Studio**, not a lightweight form editor.

The riskiest P0 areas are:

1. Header-Line Transaction Workspace Builder.
2. Basic Dynamic Behavior Builder.
3. Field Change Event Configuration.
4. Grid Cell Change Event Configuration.
5. Runtime Renderer Contract.
6. Publish Validation.

These six areas must receive architecture-level scrutiny before detailed UX and engineering design begins.

If the team weakens these six areas, UI Studio will appear configurable but will fail under real dealer/distributor transaction complexity.

