# UI Studio Frontend Implementation Methodology

> **Document Type:** Implementation Methodology  
> **Scope:** Frontend-only UI Studio visualisation implementation  
> **Project Context:** Existing separate frontend repository with Entity Designer already implemented  
> **Backend Scope:** Excluded for now; all required backend behaviour must be represented using mock/hardcoded/local demo data  
> **Tech Stack:** React 19, TypeScript 6, Vite 8, Zustand 5, TanStack Query v5, Radix UI, React Hook Form v7, TanStack Table v8  
> **Execution Mode:** AI agents + human review  
> **Implementation Style:** Architecture-first, feature-milestone execution, validation-first, Entity Designer design alignment  
> **Status:** Methodology for implementation planning and execution

---

## 1. Executive Summary

This methodology defines how to implement **UI Studio from scratch** in the existing frontend repository where **Entity Designer is already implemented**.

The implementation goal at this stage is **visualisation and frontend behaviour**, not production backend readiness. Therefore:

- UI Studio must be built as a clean frontend module.
- It must not modify Entity Designer code.
- It must visually and interaction-wise follow the same design principles already used in Entity Designer.
- All backend dependencies must be represented through mock repositories, mock metadata, hardcoded demo data, or local-only simulation layers.
- The implementation must still respect the long-term architecture: metadata-driven views, typed view artifacts, explicit Save/Publish lifecycle, runtime renderer contract, validation rules, and governance checks.

The output of the implementation should be a working frontend UI Studio experience where product managers/admins can visually understand and interact with the P0 capabilities, even though persistence and runtime data are mocked.

---

## 2. Confirmed Implementation Assumptions

| Area | Confirmed Decision |
|---|---|
| Repository model | Separate frontend repository only |
| Backend services | Not required now |
| Tech stack | React, TypeScript, Vite, Zustand, TanStack Query, Radix UI, React Hook Form, TanStack Table |
| Entity Designer API | Not available / mocked for now |
| Existing UI Studio | Not present; build from scratch |
| Implementation team | AI agents + human review |
| Methodology style | Architecture layers first + feature-based milestones |
| Runtime renderer | In scope, frontend-only mock runtime renderer |
| Output format | One Markdown methodology file |
| P1 External URL feature | Accepted separately but not included in P0 implementation milestones |

---

## 3. Core Implementation Principles

| Principle | Rule |
|---|---|
| **Frontend-only for now** | Do not create backend services, real APIs, DB migrations, or server code. |
| **Mock behind interfaces** | Every backend-like dependency must be hidden behind a repository/service abstraction. |
| **No Entity Designer mutation** | UI Studio must consume entity metadata but must not modify Entity Designer implementation. |
| **Design-system alignment** | UI Studio must reuse the same visual language, spacing, typography, shell patterns, colors, and component conventions as Entity Designer. |
| **Metadata-first** | UI Studio must produce and consume metadata objects, not hardcoded business pages. |
| **Typed surfaces over random canvas** | View types must be explicit: list, detail, create/edit, transaction workspace, related records, dashboard, etc. |
| **Runtime renderer is mandatory** | The builder must be paired with a preview/runtime renderer to prove that metadata can render actual UI. |
| **Save/Publish simulated but respected** | Even without backend, the lifecycle must exist: draft, published, version history, rollback simulation. |
| **Validation-first** | A milestone is not complete until functional, type, lint, and visual smoke validations pass. |
| **No uncontrolled scripting** | Dynamic behavior must use typed rule metadata, not arbitrary code snippets. |
| **Agent-safe execution** | Every task must be small, bounded, verifiable, and resumable by another agent. |

---

## 4. Non-Scope for Current Frontend Implementation

These items must not be built in this frontend-only implementation unless explicitly approved later.

| Item | Reason |
|---|---|
| Real backend API implementation | Current stage is frontend visualisation only. |
| Database schema for view artifacts | Backend excluded. |
| Real authentication/authorization | Use mock roles/personas and permission state only. |
| Real workflow engine | Use mock workflow states and commands. |
| Real rules engine | Use lightweight frontend rule evaluator for demo only. |
| Production audit log persistence | Show audit UI/data mock only if needed for preview; no persistence. |
| Theme Builder | Adjacent module, not P0 UI Studio. |
| Print Builder | Adjacent module, not P0 UI Studio. |
| Navigation/Menu Builder | Adjacent module; only view attachment metadata can be simulated. |
| AI view generation | Not P0. |
| Custom Component SDK | P3, not current scope. |
| External URL View/Open URL | Accepted as P1; not part of P0 milestones. |

---

## 5. Required Frontend Architecture

### 5.1 High-Level Module Architecture

```text
src/
  pages/
    admin/
      ui-studio/
        UIStudioListPage.tsx
        UIStudioNewViewPage.tsx
        UIStudioEditorPage.tsx
        UIStudioRuntimePreviewPage.tsx
  components/
    ui-studio/
      shell/
      builder/
      palette/
      inspector/
      canvas/
      smart-crud/
      transaction/
      behavior/
      data-binding/
      preview/
      validation/
      common/
  hooks/
    ui-studio/
  stores/
    ui-studio/
  types/
    ui-studio/
  lib/
    ui-studio/
  mocks/
    ui-studio/
  __tests__/
    ui-studio/
```

### 5.2 Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **Mock Data Layer** | Provides mock entities, fields, relationships, view artifacts, sample records, roles, workflow states. |
| **Repository Layer** | Exposes async methods as if they were real APIs; uses mocks/local memory/localStorage only. |
| **Type Layer** | Defines all view metadata, entity metadata, component metadata, rule metadata, validation result types. |
| **Store Layer** | Zustand stores for editor state, selection, dirty state, view artifact, undo/redo, preview context. |
| **Query Layer** | TanStack Query hooks wrapping repository methods. Even mocks should be accessed via query hooks. |
| **Builder Layer** | UI to configure views, fields, layouts, data bindings, actions, and behavior. |
| **Runtime Renderer Layer** | Renders metadata as an end-user page using mock records and preview context. |
| **Validation Layer** | Validates view metadata before simulated publish. |
| **Design Alignment Layer** | Shared components/styles must follow the existing Entity Designer look and behaviour. |

---

## 6. Mock Data Strategy

### 6.1 Mock Entity Metadata

Create mock metadata that resembles Entity Designer output.

Required mock entities:

| Entity | Purpose |
|---|---|
| `Customer` | Master/detail/list examples, lookup source. |
| `Product` | Lookup source for line grid. |
| `SaleOrder` | Header entity for transaction workspace. |
| `SaleOrderLine` | Line entity for transaction workspace. |
| `Branch` | Cascading lookup / context filter demo. |
| `Salesperson` | Header lookup demo. |
| `Financer` | Conditional field visibility demo. |
| `TaxCharge` | Dynamic/totals conceptual demo. |

Each entity should include:

```ts
interface MockEntityDefinition {
  id: string
  entityCode: string
  label: string
  pluralLabel: string
  description?: string
  fields: MockEntityField[]
  relationships: MockEntityRelationship[]
  capabilityFlags?: {
    isHeaderEntity?: boolean
    isLineEntity?: boolean
    supportsWorkflow?: boolean
    supportsAudit?: boolean
  }
}
```

### 6.2 Mock View Artifacts

Seed the system with at least these sample view artifacts:

| View | Type | Entity |
|---|---|---|
| Customer List | List View / Smart CRUD | Customer |
| Customer Detail | Record Detail | Customer |
| Product Master | Smart CRUD | Product |
| Sale Order Entry | Header-Line Transaction Workspace | SaleOrder + SaleOrderLine |
| Sale Order Dashboard | Summary/Dashboard | SaleOrder |

### 6.3 Mock Persistence

Use a repository abstraction that can later be replaced with APIs.

```ts
export interface UIStudioViewRepository {
  listViews(): Promise<ViewSummary[]>
  getView(viewId: string): Promise<ViewArtifact | null>
  createDraft(input: CreateViewInput): Promise<ViewArtifact>
  saveDraft(viewId: string, artifact: ViewArtifact): Promise<ViewArtifact>
  publish(viewId: string): Promise<PublishResult>
  rollback(viewId: string, versionId: string): Promise<ViewArtifact>
  listVersions(viewId: string): Promise<ViewVersionSummary[]>
}
```

Implementation for now:

```text
mocks/ui-studio/mockViewRepository.ts
```

Allowed storage modes:

1. In-memory default seed data.
2. Optional localStorage persistence for demo continuity.
3. No production claim; must be clearly labelled mock/demo only.

---

## 7. Design-System Alignment Methodology

Before building UI Studio, perform a design audit of Entity Designer.

### 7.1 What to inspect

| Area | What to capture |
|---|---|
| App shell | Header, sidebar, admin layout, page container width, breadcrumbs. |
| Cards | Border radius, padding, shadows, titles, empty states. |
| Forms | Label style, field spacing, required marker, error placement, sectioning. |
| Tables/grids | Header style, row density, actions, pagination, empty state. |
| Tabs | Active tab style, badge style, spacing. |
| Drawers/modals | Overlay, width, footer actions, close behavior. |
| Buttons | Primary/secondary/ghost/destructive variants. |
| Status badges | Color logic and shape. |
| Typography | Title, subtitle, section heading, body, helper text. |
| Icons | Library and sizing conventions. |
| Interaction | Hover, selected state, disabled state, focus state. |

### 7.2 Output of design audit

Create:

```text
docs/execution-plan/00-design-system/entity-designer-design-audit.md
```

Include:

- Existing reusable components to reuse.
- CSS variables/classes to reuse.
- Component patterns to imitate.
- Gaps where UI Studio needs new components.
- Screenshots or notes if possible.

### 7.3 Hard rule

Do not invent a new visual style for UI Studio. It must feel like a native extension of Entity Designer.

---

## 8. P0 Feature Milestone Map

There will be one implementation milestone per P0 feature, plus M0 for setup and design audit.

| Milestone | P0 Feature | Outcome |
|---:|---|---|
| M0 | Setup & Entity Designer Design Audit | Frontend architecture and design alignment foundation. |
| M1 | View Registry & View Management | View list, create draft, edit draft, metadata registry simulation. |
| M2 | Typed View Surface Designer | Explicit view types and surface-specific configuration shell. |
| M3 | Smart CRUD Builder | Entity-bound CRUD screen configuration. |
| M4 | Header-Line Transaction Workspace Builder | Native transaction workspace builder. |
| M5 | Field Picker from Entity Designer | Mock Entity Designer field metadata picker. |
| M6 | Layout Builder | Sections, tabs, cards, columns, accordions, panels. |
| M7 | List/Grid Configuration | Configurable list/grid columns and table preview. |
| M8 | Form Field Configuration | Field widgets, labels, help, required/read-only/display config. |
| M9 | Line Grid Configuration | Editable line-grid configuration tied to line entity. |
| M10 | Lookup / Entity Picker Configuration | Searchable lookup configuration and preview. |
| M11 | Data Source & Filter Override | Mock data source filters and view-level lookup overrides. |
| M12 | Basic Dynamic Behavior Builder | Show/hide, enable/disable, required/read-only rules. |
| M13 | Field Change Event Configuration | Header field change rules and dependent updates. |
| M14 | Grid Cell Change Event Configuration | Line grid cell event rules and recalculation triggers. |
| M15 | Action Placement Configuration | Toolbar, row, footer, section, grid actions. |
| M16 | Workflow UX Integration | Mock workflow status/actions integrated into UI. |
| M17 | Save / Publish / Rollback Model | Simulated lifecycle with versions. |
| M18 | Preview with Context Simulation | Preview by role, device, workflow state, sample record. |
| M19 | Publish Validation | Validation engine and error navigation. |
| M20 | Runtime Renderer Contract | Deterministic metadata-to-UI renderer. |

---

## 9. Milestone Execution Rules

Every milestone must follow this order:

1. Read milestone control files.
2. Confirm design-system reuse points.
3. Define or update types before UI code.
4. Add mock data only through mock repository/services.
5. Build UI components.
6. Wire state through Zustand.
7. Wire async/mock data through TanStack Query.
8. Add validation/smoke tests.
9. Run build/typecheck/lint/tests.
10. Update handoff file.
11. Commit changes.

---

## 10. Control File Structure

Create this structure in the project repository:

```text
docs/execution-plan/
  00-governance/
    implementation-rules.md
    frontend-only-scope.md
    design-system-rules.md
  01-architecture/
    ui-studio-frontend-architecture.md
    mock-data-contract.md
    metadata-contract.md
    runtime-renderer-contract.md
  02-master-plan/
    milestone-map.md
    feature-to-milestone-traceability.md
  03-milestones/
    M0-setup-design-audit/
      objective.md
      tasks.md
      structure.md
      validations.md
      references.md
    M1-view-registry/
      objective.md
      tasks.md
      structure.md
      validations.md
      references.md
    ...
    M20-runtime-renderer-contract/
      objective.md
      tasks.md
      structure.md
      validations.md
      references.md
  HANDOFF.md
```

---

## 11. Standard Milestone Control File Templates

### 11.1 `objective.md`

```markdown
# Objective — M<X> <Milestone Name>

## Goal
<One to three sentences describing what this milestone delivers.>

## P0 Feature Covered
<Feature name from P0 list.>

## Build Scope
- <Scope item 1>
- <Scope item 2>

## Out of Scope
- <Explicit exclusion 1>
- <Explicit exclusion 2>

## Design-System Alignment
- Must reuse Entity Designer page shell/component style.
- Must reuse existing button/table/form patterns where available.

## Hard Constraints
- Frontend only.
- Mock data only.
- No backend APIs.
- No Entity Designer code modification.
- No default exports.
- No `any` except explicit mock boundary.
```

### 11.2 `tasks.md`

```markdown
# Tasks — M<X>

1. Inspect relevant existing Entity Designer components/styles.
2. Create or update TypeScript types required for this milestone.
3. Create or update mock repository/data if required.
4. Create UI components.
5. Wire Zustand state.
6. Wire TanStack Query hooks if async/mock data is involved.
7. Add validation logic where required.
8. Add smoke tests.
9. Run build/typecheck/lint/test.
10. Update HANDOFF.md.
```

### 11.3 `validations.md`

```markdown
# Validations — M<X>

## Build Checks
- [ ] npm run build passes.
- [ ] npm run typecheck passes.
- [ ] npm run lint passes.
- [ ] npm run test passes.

## Functional Checks
- [ ] Feature renders without crash.
- [ ] Feature uses mock data/repository only.
- [ ] Feature follows Entity Designer visual style.
- [ ] Feature state is represented in view metadata.
- [ ] Feature does not mutate Entity Designer metadata.

## Code Quality Checks
- [ ] Named exports only.
- [ ] No default exports.
- [ ] No new unapproved dependencies.
- [ ] No console.log in committed code.
- [ ] No hardcoded business screen outside mock/demo seed data.
```

---

## 12. Detailed Milestone Methodology

## M0 — Setup & Entity Designer Design Audit

### Objective
Prepare the UI Studio implementation foundation and audit the existing Entity Designer design system so UI Studio visually belongs inside the same product.

### Build Scope
- Create UI Studio folder structure.
- Create execution-plan folder structure.
- Create design audit document.
- Create initial types folder.
- Create mock data folder.
- Create placeholder route/page for UI Studio if routing shell exists.

### Out of Scope
- No feature implementation beyond placeholder shell.
- No backend APIs.
- No production persistence.

### Required Deliverables
- `docs/execution-plan/00-design-system/entity-designer-design-audit.md`
- `src/pages/admin/ui-studio/UIStudioListPage.tsx` placeholder
- `src/types/ui-studio/index.ts` placeholder
- `src/mocks/ui-studio/` folder

### Key Tasks
1. Inspect Entity Designer pages and common components.
2. Identify reusable AppShell/admin page patterns.
3. Identify table/card/form/button/badge/tabs patterns.
4. Create UI Studio module folder structure.
5. Add route placeholder if routing pattern is known.
6. Create design audit markdown.
7. Add smoke test for placeholder route/page if test setup exists.

### Exit Criteria
- UI Studio placeholder route/page renders.
- Design audit exists.
- No Entity Designer files are modified except routing/navigation if necessary and approved.
- Build/typecheck/lint pass.

---

## M1 — View Registry & View Management

### Objective
Create the frontend view registry experience where admins can see available UI Studio views, create a draft view, open an existing view, and understand view status.

### Build Scope
- Mock view repository.
- View summary cards/table.
- Search/filter by view name/type/entity/status.
- Create draft view modal/page.
- Edit navigation to builder page.
- View metadata model: id, viewKey, label, viewType, primaryEntity, status, version, updatedAt.

### Out of Scope
- Real backend persistence.
- Advanced publish lifecycle beyond placeholder status.
- Runtime rendering.

### Required Components
- `UIStudioListPage`
- `ViewRegistryToolbar`
- `ViewRegistryTable` or `ViewRegistryCards`
- `CreateViewDraftDialog`
- `ViewStatusBadge`

### Mock Data
Seed at least five view summaries: Customer List, Customer Detail, Product Master, Sale Order Entry, Sale Dashboard.

### Exit Criteria
- View list renders from mock repository through TanStack Query.
- User can create a draft view locally.
- User can open a view editor route.
- View status is visually clear: Draft / Published / Needs Attention.
- No backend calls are made.

---

## M2 — Typed View Surface Designer

### Objective
Implement the surface selection/configuration foundation so every view has an explicit type and only valid configuration options appear for that type.

### Supported P0 Surface Types
- List View
- Record Detail View
- Create/Edit View
- Related Records View
- Header-Line Transaction Workspace
- Dashboard/Summary View

### Build Scope
- View type selector.
- View type metadata registry.
- Surface-specific setup panels.
- Surface compatibility rules.
- Basic validation for required surface context.

### Out of Scope
- Free-form custom page emphasis.
- External URL View (P1).
- Portal/mobile-specific builders.

### Required Types
```ts
export type ViewSurfaceType =
  | 'list'
  | 'record_detail'
  | 'create_edit'
  | 'related_records'
  | 'transaction_workspace'
  | 'dashboard_summary'
```

### Exit Criteria
- New view creation requires view type.
- Editor shows surface-specific setup.
- Invalid configurations are blocked/warned.
- Transaction workspace is visible as a first-class option.

---

## M3 — Smart CRUD Builder

### Objective
Implement the configuration experience for quickly creating list + form views from mock Entity Designer metadata.

### Build Scope
- Select primary entity.
- Auto-generate list columns and form fields from entity metadata.
- Manual selection/removal of fields.
- Column and form-field metadata stored in view artifact.
- Smart CRUD preview panel.

### Out of Scope
- Backend CRUD operations.
- Real data save.
- Advanced behaviors.

### Required Components
- `SmartCrudPanel`
- `SmartCrudEntitySelector`
- `SmartCrudAutoGenerateButton`
- `SmartCrudColumnList`
- `SmartCrudFormFieldList`

### Exit Criteria
- Selecting Customer/Product generates list columns and form fields.
- Admin can remove/reorder fields.
- Generated metadata is visible in JSON preview.
- System fields are excluded from editable forms by default.

---

## M4 — Header-Line Transaction Workspace Builder

### Objective
Implement the native builder pattern for enterprise transaction screens containing header form, editable line grid, totals panel, and action/status areas.

### Build Scope
- Header entity selection.
- Line entity selection.
- Relationship mapping between header and line.
- Header sections.
- Line grid columns.
- Totals panel configuration.
- ViewCode configuration.
- Transaction workspace canvas preview.

### Out of Scope
- Real multi-entity save.
- Real tax calculation engine.
- Real workflow execution.

### Required Mock Scenario
`SaleOrder` header + `SaleOrderLine` lines.

### Exit Criteria
- Sale Order Entry workspace can be configured visually.
- Header and line entities are distinct.
- Line grid binds to line entity fields.
- ViewCode is captured as metadata.
- Workspace preview shows header, line grid, totals, and action area.

---

## M5 — Field Picker from Entity Designer

### Objective
Create a reusable field picker that consumes mock Entity Designer metadata and supports safe selection of entity fields across builders.

### Build Scope
- Entity selector.
- Field search.
- Field type badges.
- Required/read-only/reference/computed indicators.
- Multi-select and single-select modes.
- Field compatibility filtering based on target use.

### Out of Scope
- Editing entity fields.
- Creating new entity fields.

### Required Components
- `EntitySelector`
- `FieldPicker`
- `FieldMetadataBadge`
- `FieldCompatibilityWarning`

### Exit Criteria
- Field picker works across Smart CRUD, form config, grid config, layout config.
- Field metadata is read-only.
- Invalid field choices are disabled or warned.
- UX matches Entity Designer form/table styling.

---

## M6 — Layout Builder

### Objective
Implement layout configuration for arranging view content into sections, tabs, columns, cards, accordions, and panels.

### Build Scope
- Layout tree metadata.
- Add/reorder/remove containers.
- Section configuration.
- Tabs configuration.
- Column count/spans.
- Accordion/collapsible settings.
- Canvas preview rendering.

### Out of Scope
- Pixel-perfect absolute positioning.
- Advanced responsive rules beyond simple preview switching.

### Required Components
- `LayoutBuilderPanel`
- `LayoutCanvas`
- `SectionConfigurator`
- `TabsConfigurator`
- `ColumnConfigurator`
- `AccordionConfigurator`

### Exit Criteria
- Admin can add sections/tabs/cards.
- Fields/components can be assigned to sections.
- Layout metadata is stored in artifact.
- Canvas reflects metadata, not hardcoded layout.

---

## M7 — List/Grid Configuration

### Objective
Implement list/grid configuration for data-heavy enterprise list views.

### Build Scope
- Column picker.
- Column order.
- Column label override.
- Width.
- Sortable/filterable flags.
- Badge renderer selection.
- Row action placeholder configuration.
- Mock table preview.

### Out of Scope
- Real server-side paging.
- Real export.
- Real bulk backend actions.

### Required Components
- `GridConfigurationPanel`
- `GridColumnConfigurator`
- `GridPreview`
- `ColumnRendererSelector`

### Exit Criteria
- Admin can configure list columns for Customer/Product/SaleOrder.
- Preview updates immediately.
- Configuration persists in view metadata.
- Invalid field references are flagged.

---

## M8 — Form Field Configuration

### Objective
Implement field-level form presentation configuration.

### Build Scope
- Widget type selection.
- Label override.
- Placeholder.
- Help text.
- Required override.
- Read-only/display-only/editable behaviour.
- Section placement.
- Field order.

### Out of Scope
- Server-side validation.
- Complex dynamic rules; handled in M12.

### Required Widget Types
- Text input
- Textarea
- Number
- Currency/decimal
- Date
- Date-time
- Toggle/checkbox
- Dropdown
- Entity picker
- Display-only value
- Status badge

### Exit Criteria
- Field configuration is editable and visible in preview.
- Widget type defaults from field type but can be overridden where compatible.
- Incompatible widget choices are blocked/warned.
- Required/read-only indicators render consistently.

---

## M9 — Line Grid Configuration

### Objective
Implement configuration for editable line-item grids bound to a line entity.

### Build Scope
- Select line entity.
- Select line columns.
- Set editable/read-only per column.
- Configure add/delete row availability.
- Configure row-level required fields.
- Configure summary columns.
- Mock editable grid preview.

### Out of Scope
- Real persistence.
- Advanced tax/charge child entities.

### Required Mock Scenario
SaleOrderLine columns: product, quantity, rate, discount, taxPercent, amount.

### Exit Criteria
- Grid is bound to line entity, not independent column data sources.
- Columns come from line entity attributes.
- Preview supports mock add/edit/delete row interactions.
- Row errors can be displayed in demo.

---

## M10 — Lookup / Entity Picker Configuration

### Objective
Implement configuration for reference/lookup fields and searchable entity pickers.

### Build Scope
- Select lookup source entity.
- Display field.
- Value field.
- Picker columns.
- Search fields.
- Default filter expression placeholder.
- Mock lookup preview.

### Out of Scope
- Real server search.
- Real permission-filtered lookup data.

### Required Examples
- Customer lookup on SaleOrder.
- Product lookup on SaleOrderLine.
- Branch lookup on SaleOrder.
- Financer lookup shown conditionally later.

### Exit Criteria
- Entity picker preview opens searchable modal/dropdown.
- Selected value displays configured display field.
- Picker columns are configurable.
- Lookup metadata is stored in artifact.

---

## M11 — Data Source & Filter Override

### Objective
Implement mock data source configuration and view-level filter overrides.

### Build Scope
- Data source registry panel.
- Primary entity source.
- Related entity source.
- Static options source.
- Mock API source placeholder.
- Field-level lookup override.
- Form-level filter override.
- Dependency reference syntax display.

### Out of Scope
- Real API invocation.
- Real query engine.

### Required Examples
- Product field default: all products.
- Vehicle Booking override: vehicle products only.
- Branch change filter placeholder for products.

### Exit Criteria
- Admin can override lookup filters at view/form level.
- Preview data changes according to mock filters.
- Unresolved source references are flagged.
- Source definitions are stored separately from component layout.

---

## M12 — Basic Dynamic Behavior Builder

### Objective
Implement declarative UI rules for show/hide, enable/disable, required/optional, and read-only/editable behaviours.

### Build Scope
- Rule list.
- Rule condition builder.
- Rule target selector.
- Rule effect selector.
- Mock evaluator.
- Simulation panel.

### Supported Conditions
- Role/persona
- Field value
- Workflow state
- Record mode
- Device context

### Supported Effects
- Show/hide
- Enable/disable
- Required/optional
- Read-only/editable

### Out of Scope
- Arbitrary scripting.
- Server rules.

### Exit Criteria
- Admin can create a rule.
- Preview responds to rule simulation.
- Multiple rules can be evaluated deterministically.
- Rule metadata is visible in JSON.

---

## M13 — Field Change Event Configuration

### Objective
Implement builder support for header/form field change reactions.

### Build Scope
- Event trigger: field changed.
- Event actions: clear field, set value, refresh lookup, recalculate, show warning, show confirmation, revalidate.
- Event configuration UI.
- Mock execution in preview.

### Required Examples
- Payment Type = Finance shows and requires Financer.
- Customer change refreshes price list placeholder.
- Branch change refreshes product lookup placeholder.

### Out of Scope
- Real pricing/stock/tax service.

### Exit Criteria
- Field change rules can be configured.
- Preview demonstrates configured reactions.
- Event metadata remains declarative.
- No custom JS scripting is introduced.

---

## M14 — Grid Cell Change Event Configuration

### Objective
Implement builder support for line grid cell change reactions.

### Build Scope
- Trigger: line grid cell changed.
- Conditions on row/cell values.
- Actions: set cell value, recalculate row, refresh lookup, show warning, require confirmation, flag approval required.
- Mock grid event evaluator.

### Required Examples
- Product selection populates UOM/rate/tax category.
- Quantity/rate change recalculates amount.
- Discount above threshold shows approval required warning.

### Out of Scope
- Real stock service.
- Real approval workflow execution.

### Exit Criteria
- Line-grid event can be configured.
- Mock preview applies row recalculation.
- Warnings/confirmations render in preview.
- Event definitions are stored in artifact.

---

## M15 — Action Placement Configuration

### Objective
Implement action placement configuration across view surfaces.

### Build Scope
- Action registry.
- Action placement: toolbar, row, form footer, section, grid, quick action.
- Action types: navigate, save draft, submit, open modal, show confirmation, mock command.
- Action visibility placeholders.
- Action preview.

### Out of Scope
- Real backend commands.
- External URL action; accepted P1, not P0.

### Exit Criteria
- Admin can add/configure actions in supported placements.
- Preview renders actions in correct location.
- Action metadata includes placement and handler type.
- Unsupported placements are blocked by surface type.

---

## M16 — Workflow UX Integration

### Objective
Simulate workflow-aware UI rendering using mock workflow states and commands.

### Build Scope
- Mock workflow states.
- Status badge/strip.
- Workflow action buttons.
- Comment-required flag display.
- Disabled action display.
- Workflow timeline placeholder.

### Required Examples
SaleOrder workflow states:

```text
Draft -> Submitted -> Approved -> Invoiced -> Closed
Rejected / Cancelled as alternate terminal states
```

### Out of Scope
- Workflow engine implementation.
- Approval routing logic.

### Exit Criteria
- Preview can switch workflow state.
- Available actions change by state/role.
- Workflow strip renders in transaction workspace.
- UI does not define workflow truth; it consumes mock workflow metadata.

---

## M17 — Save / Publish / Rollback Model

### Objective
Implement frontend-only simulation of Save, Publish, Version History, and Rollback.

### Build Scope
- Save draft action.
- Publish action.
- Published version snapshot.
- Version history panel.
- Rollback to previous version.
- Dirty state.
- Unsaved changes guard.

### Out of Scope
- Real backend versioning.
- Real audit persistence.

### Exit Criteria
- Save updates mock draft and clears dirty flag.
- Publish creates immutable mock version.
- Rollback restores selected version.
- Active/published version is clearly distinguishable from draft.

---

## M18 — Preview with Context Simulation

### Objective
Implement preview modes so admins can simulate how a view renders for different roles, devices, workflow states, and sample records.

### Build Scope
- Role selector.
- Device selector: desktop/tablet/mobile.
- Workflow state selector.
- Record/sample data selector.
- Preview mode: builder preview vs runtime preview.
- Context panel.

### Out of Scope
- Real device-specific implementation beyond visual simulation.
- Real permission service.

### Exit Criteria
- Preview updates based on selected role/state/device/sample record.
- Dynamic rules from M12 respond to context.
- Workflow actions from M16 respond to state/role.
- Preview clearly labels itself as mock/demo.

---

## M19 — Publish Validation

### Objective
Implement frontend validation checks that block simulated publish when metadata is broken.

### Build Scope
- Validation engine.
- Validation categories: blocking errors, warnings, suggestions.
- Validation panel.
- Click-to-navigate to broken component/rule/binding.
- Publish integration.

### Required Validations
- Missing view key.
- Invalid view type.
- Missing primary entity where required.
- Missing header/line entity for transaction workspace.
- Invalid field reference.
- Invalid relationship reference.
- Orphaned binding.
- Empty layout.
- Invalid action placement.
- Invalid rule target.
- Hidden required field warning.

### Exit Criteria
- Broken view cannot be published.
- Validation errors are readable and actionable.
- Clicking error selects offending item.
- Validation engine is independent from UI components.

---

## M20 — Runtime Renderer Contract

### Objective
Build the deterministic runtime renderer that converts view metadata into an end-user page using mock data.

### Build Scope
- Runtime renderer root.
- Surface renderers for list, record detail, create/edit, related records, transaction workspace, dashboard summary.
- Component resolver.
- Field renderer.
- Grid renderer.
- Action renderer.
- Rule application pipeline.
- Mock permission/context pruning placeholder.

### Out of Scope
- Production renderer optimization.
- Real backend data fetching.

### Exit Criteria
- Published/mock artifact can render as an end-user page.
- Renderer does not depend on builder-only components.
- Renderer respects view type and metadata contract.
- Renderer uses mock data through repository/query layer.
- Runtime preview route works for at least Customer List and Sale Order Entry.

---

## 13. Agent Execution Methodology

### 13.1 Recommended Agent Use

| Agent | Best Use |
|---|---|
| Claude Code | Architecture, state shape, complex interactions, renderer logic, validation model. |
| Codex | Batch files, types, component scaffolding, tests, mock data. |
| GitHub Copilot | Inline edits, styling, small bug fixes, wiring handlers. |

### 13.2 Agent Switching Rules

1. Never switch mid-file if avoidable.
2. Commit before switching.
3. Update `docs/execution-plan/HANDOFF.md` before switching.
4. New agent must read active milestone files and handoff file.
5. If the new agent contradicts previous architecture, stop and ask for review.

### 13.3 Handoff File Template

```markdown
# UI Studio Agent Handoff

## Current State
- Active Milestone:
- Last Completed Task:
- Next Task:
- Branch:
- Last Commit:

## Files Modified
- path — created/modified — reason

## Decisions Made
- Decision:
- Rationale:

## In-Progress Work
- Item:
- Status:

## Known Issues
- Issue:
- Suggested next action:

## Next Agent Instructions
- Read objective.md, tasks.md, validations.md for the active milestone.
- Continue from the next task only.
- Do not modify Entity Designer code.
```

---

## 14. Coding Standards

| Area | Standard |
|---|---|
| React components | Functional components only. |
| TypeScript | Strict types; avoid `any`. |
| Exports | Named exports only. |
| State | Zustand for editor/client state. |
| Async/mock server state | TanStack Query. |
| Forms | React Hook Form. |
| Tables | TanStack Table where rich table behaviour is needed. |
| UI primitives | Radix UI where appropriate. |
| Styling | Existing project CSS/design system; no CSS-in-JS. |
| File naming | PascalCase components, camelCase utilities/hooks. |
| Tests | Vitest/React Testing Library if project uses them. |

---

## 15. Metadata Contract Principles

The frontend must model metadata as if it will later be persisted by backend.

### 15.1 View Artifact Shape

```ts
export interface ViewArtifact {
  id: string
  viewKey: string
  label: string
  description?: string
  surfaceType: ViewSurfaceType
  status: 'draft' | 'published' | 'needs_attention'
  version: number
  primaryEntityId?: string
  viewCode?: string
  layout: LayoutDefinition
  components: ComponentDefinition[]
  dataSources: DataSourceDefinition[]
  bindings: BindingDefinition[]
  actions: ActionDefinition[]
  behaviorRules: BehaviorRuleDefinition[]
  validationState?: ViewValidationSummary
  createdAt: string
  updatedAt: string
}
```

### 15.2 Rule

Do not let UI components become the metadata model. UI components read/write metadata, but metadata remains framework-neutral.

---

## 16. Validation Philosophy

Validation must happen in three places:

| Place | Purpose |
|---|---|
| Builder-time inline validation | Prevent obvious mistakes while configuring. |
| Publish validation | Block broken view from becoming published, even in mock mode. |
| Runtime fallback validation | Prevent renderer crash and show meaningful error if metadata is invalid. |

### 16.1 Severity Levels

| Severity | Meaning |
|---|---|
| Error | Blocks publish. |
| Warning | Allows publish but requires attention. |
| Suggestion | Non-blocking improvement. |

---

## 17. Demo Acceptance Criteria

The frontend-only UI Studio implementation is acceptable when the following are demonstrable:

| Area | Acceptance Criteria |
|---|---|
| View Registry | User can list, create, open, and identify view status. |
| Typed Surfaces | User can create a typed view and see surface-specific setup. |
| Smart CRUD | User can generate list/form config from mock entity. |
| Transaction Workspace | User can configure SaleOrder + SaleOrderLine header-line workspace. |
| Field Picker | User can select fields from mock Entity Designer metadata. |
| Layout | User can organize sections/tabs/columns. |
| Grid | User can configure columns and preview grid. |
| Form | User can configure field widgets and behaviour. |
| Line Grid | User can configure editable line grid. |
| Lookup | User can configure entity picker. |
| Data Source Override | User can configure mock filters/overrides. |
| Dynamic Rules | User can create and simulate show/hide/required/read-only rules. |
| Events | User can configure and preview field/grid cell events. |
| Actions | User can place actions in toolbar/row/footer/grid/section. |
| Workflow UX | User can preview state-based actions/status. |
| Save/Publish/Rollback | User can simulate lifecycle and versions. |
| Preview | User can preview by role/device/state/record. |
| Validation | Broken metadata blocks mock publish with clear errors. |
| Runtime Renderer | Published artifact renders in runtime preview. |
| Design Consistency | UI Studio looks and behaves like an extension of Entity Designer. |

---

## 18. Risk Register

| Risk | Severity | Mitigation |
|---|---:|---|
| Builder becomes hardcoded demo pages | High | Enforce metadata artifact contract from M1 onward. |
| UI Studio diverges visually from Entity Designer | High | M0 design audit and reuse rules are mandatory. |
| Mock data leaks into architecture as permanent design | Medium | Keep all mock data under `mocks/ui-studio` and repository interfaces. |
| Behavior builder becomes script engine | High | Use typed rules only. No arbitrary JS. |
| Header-line workspace becomes generic grid only | High | M4 and M9 must model header entity, line entity, ViewCode, totals, and actions. |
| Too much built before runtime renderer | Medium | M20 must be treated as mandatory before demo sign-off. |
| Agents modify Entity Designer code | High | Hard governance rule; revert immediately unless routing import is approved. |
| LocalStorage treated as production persistence | Medium | Label as mock/demo only. Keep repository abstraction. |
| Requirements creep into P1/P2 | High | P0 only. External URL is P1 and excluded. |

---

## 19. Recommended Branching and Commit Strategy

| Item | Recommendation |
|---|---|
| Main branch | Stable only. |
| Feature branch per milestone | `feature/ui-studio-m<X>-<short-name>` |
| Commit frequency | After each logical task or component cluster. |
| Commit message format | `ui-studio: M<X> <short description>` |
| Merge condition | All milestone validations pass. |

---

## 20. Standard Validation Commands

Use the exact project commands if they differ. Default expected commands:

```bash
npm run build
npm run typecheck
npm run lint
npm run test
```

If one of these commands does not exist, document the project-equivalent command in:

```text
docs/execution-plan/00-governance/project-command-map.md
```

---

## 21. Final Implementation Position

This methodology deliberately treats the current build as a **frontend visualisation implementation**, but not as a throwaway prototype.

The correct mindset is:

> Build the frontend in a way that looks real, behaves coherently, and respects future backend contracts, while keeping all current persistence and backend-like behaviour mocked.

That gives the team the best of both worlds:

- Fast visualisation and stakeholder alignment now.
- Lower rework when backend services are introduced later.
- Clean separation from Entity Designer.
- Strong design consistency with the existing product.
- Milestone-by-milestone execution that AI agents and human reviewers can safely follow.
