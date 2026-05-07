# IDMS v3 Admin Studio — Complete Blueprint

This consolidated Markdown combines all blueprint documents in the pack.

---



---

<!-- Source: README.md -->

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



---

<!-- Source: 00-executive-product-blueprint.md -->

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



---

<!-- Source: 01-information-architecture-and-routes.md -->

# 01 — Information Architecture and Routes

## 1. Top-Level Navigation

The Admin Studio should appear as one major workspace in the application shell.

```text
Admin Studio
  ├── Artifacts
  ├── Release Packages
  ├── Attribute Catalog
  ├── Roles & Permissions
  └── Studio Settings
```

The existing admin modules should become specialized views inside the Artifact Cockpit rather than isolated pages.

## 2. Route Map

| Route | Screen | Purpose |
|---|---|---|
| `/admin/studio` | Studio Home | Recently edited artifacts, warnings, draft changes |
| `/admin/studio/artifacts` | Artifact Registry | Search and select configurable artifacts |
| `/admin/studio/artifacts/:artifactKey` | Artifact Cockpit | Unified workspace for one artifact |
| `/admin/studio/artifacts/:artifactKey/entity` | Entity Designer tab | Schema, layout, catalog, dependencies |
| `/admin/studio/artifacts/:artifactKey/rules` | Rule Builder tab | Rules linked to selected artifact |
| `/admin/studio/artifacts/:artifactKey/workflow` | Workflow Designer tab | State machine and transition gates |
| `/admin/studio/artifacts/:artifactKey/permissions` | Permission Matrix tab | Action, field, and row access |
| `/admin/studio/artifacts/:artifactKey/overlays` | Overlay tab | Layer stack, deltas, resolved preview |
| `/admin/studio/artifacts/:artifactKey/simulation` | Simulation tab | Command-level test bench |
| `/admin/studio/artifacts/:artifactKey/versions` | Versions tab | Draft, active, deprecated, rollback views |
| `/admin/studio/releases` | Release Packages list | Change set dashboard |
| `/admin/studio/releases/:releaseId` | Release Package detail | Validation, approval, promotion |
| `/admin/studio/attributes` | Attribute Catalog | Governed reusable field definitions |

## 3. Artifact-First Cockpit

When the user selects an artifact, the page should become the main workspace.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Header: Admin Studio / Artifacts / Vehicle Order                           │
├──────────────┬────────────────────────────────────────┬────────────────────┤
│ Artifact     │ Designer Workspace                     │ Impact Panel       │
│ Navigator    │                                        │                    │
│              │ Tabs:                                  │ Dependency graph   │
│ Search       │ Overview | Entity | Rules | Workflow   │ Overlay trace      │
│ Filters      │ Permissions | Overlay | Simulation     │ Compile warnings   │
│ Favorites    │ Versions                               │ Release readiness  │
└──────────────┴────────────────────────────────────────┴────────────────────┘
```

## 4. Left Panel — Artifact Navigator

### Required Capabilities

| Capability | Behavior |
|---|---|
| Search | Search by label, artifact key, module, entity type |
| Filter by type | Entity, Rule Set, Workflow, Permission, Theme, Layout |
| Filter by layer impact | Has Tenant overlay, Has Role overlay, Has conflicts |
| Filter by status | Draft, Active, Deprecated, Compile Error |
| Favorites | Pin commonly edited artifacts |
| Recent | Recently opened artifacts |
| Warning badges | Show unresolved warnings and pending draft changes |

### Artifact Card Fields

| Field | Example |
|---|---|
| Label | Vehicle Order |
| Artifact Key | `entity.vehicle_order` |
| Type | Entity Schema |
| Status | Active + Draft Delta |
| Layers | Platform, Vertical, Tenant, Role |
| Warnings | 2 |
| Last Modified | 2026-04-28 |

## 5. Center Panel — Designer Workspace

The center panel uses tabs, but the user stays inside the same artifact context.

| Tab | Primary User Question |
|---|---|
| Overview | What is this artifact and what affects it? |
| Entity | What fields and layout define this business object? |
| Rules | What policies validate or change this object? |
| Workflow | What lifecycle states and transitions exist? |
| Permissions | Who can see or do what? |
| Overlay | Which layers contribute what? |
| Simulation | What happens at runtime for a command? |
| Versions | What changed across versions? |

## 6. Right Panel — Impact Panel

The right panel must be persistent and contextual.

### Modes

| Mode | Trigger |
|---|---|
| Summary | No selection |
| Field Impact | Field selected |
| Rule Impact | Rule selected |
| Transition Impact | Workflow transition selected |
| Overlay Impact | Delta selected |
| Release Readiness | Change set selected |

### Content Blocks

1. Current scope
2. Layer trace
3. Dependencies
4. Compile warnings
5. Simulation shortcuts
6. Release package status

## 7. Scope Bar

The scope bar must be visible at the top of the cockpit.

```text
Artifact: Vehicle Order
Environment: Dev
Layer Context: Tenant — Bajaj Auto
Node: Pune Central
Role Preview: Sales Executive
Runtime Preview: Resolved + Compiled
```

### Scope Bar Controls

| Control | Purpose |
|---|---|
| Environment | Dev, UAT, Production |
| Layer Context | Platform, Vertical, Tenant, Node, Role |
| Tenant | Select tenant |
| Node | Select org node |
| Role Preview | Preview artifact as a role |
| Runtime Mode | Draft, Resolved, Compiled |

## 8. Role-Based Visibility

| Role | Studio Access |
|---|---|
| OEM_ADMIN | Full platform, vertical, tenant, node, role layers |
| PLATFORM_ARCHITECT | Platform and vertical design |
| TENANT_ADMIN | Tenant, node, role overlays |
| DEALER_PRINCIPAL | Tenant and node configuration, limited approval |
| FUNCTIONAL_CONSULTANT | Draft and simulation, submit for approval |
| SALES_MANAGER | Read-only design and workflow simulation |
| SALES_EXECUTIVE | No Studio access unless explicitly granted |

## 9. Empty States

| Scenario | Empty State |
|---|---|
| No artifact selected | "Select an artifact to inspect runtime behavior." |
| No rules | "No policies defined yet. Add a rule or inherit from lower layers." |
| No workflow | "No workflow attached. This entity behaves as a basic record." |
| No overlays | "This artifact currently uses base definition only." |
| No release package | "Create a release package to promote draft changes safely." |

## 10. Navigation Rule

The user should never be forced to remember internal artifact keys. All artifact keys must be selected through searchable dropdowns or registry lists.



---

<!-- Source: 02-studio-shell-and-interaction-model.md -->

# 02 — Studio Shell and Interaction Model

## 1. Shell Objective

The Studio Shell provides one consistent frame for all configuration work. It should make the following always visible:

1. What artifact is being edited
2. Which environment and layer are in scope
3. Whether the user is editing a draft or viewing active runtime
4. Which dependencies and warnings exist
5. Whether the change is ready for release

## 2. Layout

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Floating App Header                                                        │
├────────────────────────────────────────────────────────────────────────────┤
│ Scope Bar                                                                  │
├──────────────┬────────────────────────────────────────┬────────────────────┤
│ Artifact     │ Designer Workspace                     │ Impact Panel       │
│ Navigator    │                                        │                    │
└──────────────┴────────────────────────────────────────┴────────────────────┘
```

## 3. Panel Sizing

| Panel | Default Width | Resize |
|---|---:|---|
| Artifact Navigator | 280px | Collapsible to 56px |
| Designer Workspace | Flexible | Main work area |
| Impact Panel | 360px | Collapsible to warning rail |

## 4. Visual Language

Use the existing IDMS UI platform direction:

| Item | Rule |
|---|---|
| Background | Warm neutral page background |
| Cards | White or surface cards, rounded, soft shadow |
| Brand color | Tenant theme token, not hardcoded |
| Text | Clear hierarchy: title, section heading, body, label |
| JSON views | Monospace, syntax-style formatting |
| Dark mode | Token-driven via CSS variables |
| Badge colors | Semantic, not decorative |

## 5. Common Component Inventory

| Component | Used For |
|---|---|
| `StudioShell` | Whole Studio workspace |
| `ScopeBar` | Environment, layer, tenant, node, role preview |
| `ArtifactNavigator` | Search and select artifacts |
| `ArtifactCockpit` | Main artifact page |
| `DesignerTabs` | Entity, Rules, Workflow, Permissions, Overlay, Simulation |
| `ImpactPanel` | Dependencies, warnings, compile readiness |
| `LayerBadge` | Platform, Vertical, Tenant, Node, Role |
| `ProtectedBadge` | Non-overridable controls |
| `DeltaBadge` | Draft overlay changes |
| `ResolvedPreview` | Runtime merged artifact |
| `JsonPreviewPanel` | Read-only JSON preview |
| `SimulationPanel` | Test payloads and results |
| `ReleasePackageDrawer` | Add draft change to change set |
| `ValidationSummary` | Compile and governance warnings |

## 6. Universal Item States

Every editable configuration item should support these states.

| State | Meaning | UI Treatment |
|---|---|---|
| Inherited | Comes from lower-priority layer | Muted layer badge |
| Local | Defined at selected layer | Strong layer badge |
| Overridden | Higher layer has changed same stable ID | Split badge / conflict icon |
| Protected | Cannot be overridden downstream | Lock icon |
| Disabled | Inherited but marked inactive | Strikethrough or disabled tone |
| Draft | Unsaved or unreleased change | Draft chip |
| Compile Error | Invalid after merge | Error chip |
| Runtime Active | Compiled and active | Active chip |

## 7. Interaction Rules

### Rule 1 — Editing Always Creates a Draft Delta

When a user edits an inherited item, the UI must not mutate the base object. It should say:

> You are creating a Tenant overlay delta for `vehicle_order.gstin`.

### Rule 2 — Protected Items Are Read-Only

Protected nodes must show the lock reason.

Example:

```text
customer_id
Platform · Protected
Reason: Required audit and referential integrity field.
```

### Rule 3 — Scope Changes Re-render Preview

Changing tenant, node, or role should refresh:

1. Resolved preview
2. Layer trace
3. Impact panel
4. Field visibility
5. Workflow transition availability

### Rule 4 — Save Is Not Activation

Saving creates or updates a draft. It does not activate runtime behavior.

Runtime activation happens through release governance.

### Rule 5 — Every Risk Has a Next Action

Impact warnings should not be passive.

| Warning | Suggested Action |
|---|---|
| Field used by active rule | Open affected rule |
| Workflow transition has no actor role | Add role constraint |
| Rule action blocks all approvers | Simulate with manager role |
| Overlay conflicts with protected node | Remove delta |
| Field hidden but required | Change rule, permission, or requiredness |

## 8. Keyboard and Productivity Features

| Feature | Behavior |
|---|---|
| Global command menu | Search artifact, rule, workflow, field |
| `Ctrl/Cmd + S` | Save draft only |
| `Ctrl/Cmd + Enter` | Run simulation |
| `Ctrl/Cmd + Shift + P` | Add current draft to release package |
| Quick switcher | Jump between entity, rules, workflow |
| Inline search | Search fields, rules, transitions |

## 9. Accessibility

| Requirement | Rule |
|---|---|
| Color dependency | Do not rely only on color for layer or warning state |
| Keyboard | All tabs, table rows, dialogs, canvas items keyboard reachable |
| Screen reader | Layer and lock status read as text |
| Contrast | Meet WCAG AA for text and controls |
| Error messages | Clear, contextual, and next-action oriented |

## 10. Responsiveness

The full Studio is desktop-first. On smaller screens:

| Breakpoint | Behavior |
|---|---|
| < 1200px | Impact panel collapses to right rail |
| < 1024px | Artifact navigator collapses |
| < 768px | Studio becomes read-only / inspection-first; editing complex artifacts is discouraged |

Do not over-optimize complex workflow canvas editing for mobile.



---

<!-- Source: 03-entity-designer-blueprint.md -->

# 03 — Entity Designer Blueprint

## 1. Purpose

The Entity Designer is the source-of-truth cockpit for a business object.

It should answer:

> What is this business object, how is it captured, which layer changed it, and what downstream behavior depends on it?

## 2. Primary Users

| User | Needs |
|---|---|
| Platform Architect | Define protected core model and reusable structures |
| Functional Consultant | Configure tenant-specific fields and layout |
| Tenant Admin | Add tenant-required fields and labels |
| Role Admin | Hide or restrict fields for roles |
| QA / Release Reviewer | Validate impact before promotion |

## 3. Entity Designer Layout

```text
Entity Designer: Vehicle Order

┌────────────────────────────────────────────────────────────────────────────┐
│ Toolbar: Add Field | Add From Catalog | Reorder | Preview Role | Save Draft │
├──────────────────────────────────────────────┬─────────────────────────────┤
│ Main Panel                                    │ Inspector                  │
│ Tabs: Schema | Form Layout | Catalog |        │ Selected field details     │
│ Dependencies | Resolved Preview               │ Layer trace                │
│                                                │ Rules using field          │
└──────────────────────────────────────────────┴─────────────────────────────┘
```

## 4. Tabs

| Tab | Purpose |
|---|---|
| Schema | Data model fields, types, validations, source layer |
| Form Layout | Sections, groups, ordering, visibility, UI hints |
| Attribute Catalog | Reusable governed attributes |
| Dependencies | Rules, workflows, permissions, reports using fields |
| Resolved Preview | Final merged entity schema for selected scope |
| Versions | Historical versions and rollback comparison |

## 5. Schema Table Columns

| Column | Example | Notes |
|---|---|---|
| Field | `gstin` | Stable technical name |
| Label | GSTIN | User-facing label |
| Type | text | Must match supported field types |
| Required | Yes | Can be inherited or constrained |
| Source Layer | Tenant | Use layer badge |
| Override Status | Added / Inherited / Overridden | Must be visible |
| Protected | Yes / No | Locked if protected |
| Used By | 2 rules, 1 layout | Click to inspect dependencies |
| Runtime Visibility | Visible / Hidden | Role preview dependent |

## 6. Field Inspector

When a field is selected, show:

| Section | Content |
|---|---|
| Identity | Stable ID, field name, label, description |
| Type | Data type, format, max length, precision |
| Validation | Required, min/max, allowed values, pattern |
| UI Behavior | Section, order, placeholder, help text |
| Overlay Trace | Which layer created or modified it |
| Dependencies | Rules, workflows, permission masks |
| Runtime Preview | Value display under selected role |
| Edit Controls | Create delta, constrain, decorate, disable where permitted |

## 7. Attribute Catalog Panel

The catalog prevents duplicate fields and inconsistent naming.

### Catalog Card

| Field | Example |
|---|---|
| Attribute Code | `vehicle_model` |
| Label | Vehicle Model |
| Domain | Automotive |
| Type | select |
| Owner Layer | Vertical |
| Reusable | Yes |
| Used In | Vehicle Order, Vehicle Booking, Service Job |

### Catalog Actions

| Action | Behavior |
|---|---|
| Add to entity | Creates `extend` delta with stable field ID |
| View usage | Shows all entities using attribute |
| Request new attribute | Draft catalog entry, not active |
| Compare similar | Warns against duplicate fields like `gst_no`, `gstin`, `gst_number` |

## 8. Form Layout Designer

The layout designer should not be confused with the data model. It controls presentation.

### Layout Objects

| Object | Description |
|---|---|
| Section | Group of fields |
| Field Placement | Field position and UI width |
| Tab | Logical grouping |
| Grid | Line item table |
| Visibility Rule | Role or condition-based display behavior |
| Help Text | User guidance |
| Badge / Token | Visual hint only |

## 9. Required UX Safeguards

| Risk | UI Safeguard |
|---|---|
| Removing a field used by rules | Block removal and show dependency list |
| Hiding a required field | Warn and require resolution |
| Changing data type | Show migration/runtime risk warning |
| Editing protected field | Disable edit and show lock reason |
| Creating duplicate field | Suggest catalog attribute |
| Role overlay hiding audit field | Block if protected |
| Tenant narrowing platform enum | Allow only if values are subset |

## 10. Entity Operations

| Operation | Allowed? | Notes |
|---|---|---|
| Add field from catalog | Yes | Preferred path |
| Add local tenant field | Yes | Requires naming validation |
| Rename label | Yes | Use `decorate` delta |
| Rename technical field | No for active field | Must create new field and deprecate old |
| Change field type | Restricted | Draft-only, requires no active dependencies |
| Disable inherited field | Conditional | Not allowed for protected fields |
| Remove field | Rare | Only if policy permits and no dependencies |
| Constrain enum values | Yes | Must narrow, not expand, at downstream layers |
| Hide field by role | Use permission/field mask, not schema deletion |

## 11. Entity Designer Acceptance Criteria

1. User can select `Vehicle Order` and view resolved fields.
2. Every field displays source layer and override status.
3. User can add `GSTIN` from catalog as a tenant field.
4. User cannot edit protected `customer_id`.
5. User can preview as `SALES_EXECUTIVE` and see `cost_price` hidden.
6. User can inspect which rules use `discount_pct`.
7. Removing a field used by a rule is blocked.
8. Saving creates draft delta, not active runtime.
9. Draft change can be added to a release package.
10. Resolved preview changes when tenant/node/role preview changes.



---

<!-- Source: 04-rule-builder-blueprint.md -->

# 04 — Rule Builder Blueprint

## 1. Purpose

The Rule Builder is a governed policy authoring tool.

It should answer:

> What policy is being enforced, what risk does it mitigate, when does it fire, and what happens when the condition is true?

## 2. Rule Builder Modes

The Rule Builder has three synchronized modes.

| Mode | User | Purpose |
|---|---|---|
| Guided Policy Mode | Functional consultant | Business-friendly rule creation |
| Condition Tree Mode | Architect / advanced admin | Precise nested logic |
| JSON Preview Mode | Architect / reviewer | Exact DSL inspection |

JSON Preview should be read-only by default. Expert editing can be allowed later, but must be permission-gated.

## 3. Rule Required Fields

Every rule editor must capture:

| Field | Required | Notes |
|---|---|---|
| Business Intent | Yes | One sentence |
| Risk Mitigated | Yes | What can go wrong without rule |
| Rule Name | Yes | Human-readable |
| Rule ID | Yes | Stable ID |
| Entity Type | Yes | Example: `vehicle_order` |
| Trigger | Yes | Must use supported lifecycle trigger |
| Layer | Yes | Platform, Vertical, Tenant, Node, Role |
| Priority | Yes | Lower number runs first |
| Enabled | Yes | Draft/active state handled separately |
| Condition | Yes | DSL condition tree |
| Action | Yes | Explicit outcome |
| Message | Conditional | Required for BLOCK/WARN/NOTIFY |
| Simulation Cases | Strongly recommended | At least one positive and one negative case |

## 4. Supported Triggers

Use only the platform-supported triggers:

| Trigger | Typical Use |
|---|---|
| `BEFORE_CREATE` | Mandatory fields/defaulting before create |
| `BEFORE_UPDATE` | Update validation |
| `BEFORE_SUBMIT` | Submission gate |
| `BEFORE_APPROVE` | Approval gate |
| `BEFORE_CANCEL` | Cancellation gate |
| `BEFORE_DELETE` | Soft-delete gate |
| `AFTER_CREATE` | Notification or secondary process |
| `AFTER_SUBMIT` | Post-submit notification/routing |
| `AFTER_APPROVE` | Post-approval action |
| `ON_FIELD_CHANGE` | Field-level UI/defaulting behavior |

## 5. Supported Condition Operators

### Comparison

`EQ`, `NEQ`, `GT`, `GTE`, `LT`, `LTE`, `IN`, `NOT_IN`, `CONTAINS`, `IS_NULL`, `IS_NOT_NULL`

### Logical

`AND`, `OR`, `NOT`

Do not introduce unsupported operators such as `BETWEEN` unless the backend DSL is extended first.

## 6. Supported Action Types

Use only supported action types:

| Action | UI Meaning |
|---|---|
| `BLOCK` | Hard stop; command fails |
| `WARN` | Yellow warning; command can continue |
| `SET_FIELD` | Mutates payload before persist |
| `ROUTE` | Overrides workflow transition target |
| `START_WORKFLOW` | Starts secondary workflow |
| `NOTIFY` | Queues notification via outbox |

Avoid generic labels like `allow`, `deny`, or `require-field` in the rule JSON unless they are mapped explicitly to supported action types.

## 7. Guided Policy Mode

Guided mode uses policy templates.

### Template Examples

| Template | Generates |
|---|---|
| Required before submit | `IS_NULL` + `BLOCK` |
| Amount threshold approval | `GT` + `ROUTE` or `BLOCK` |
| Role approval limit | `AND(session.role, amount)` + `BLOCK` |
| High discount warning | `GT(discount_pct)` + `WARN` |
| Auto-set value | condition + `SET_FIELD` |
| Notify on approval | trigger + `NOTIFY` |

### Guided Policy Flow

1. Select policy template.
2. Select entity field.
3. Select trigger.
4. Define threshold or value.
5. Select action.
6. Write business intent and risk mitigated.
7. Preview rule sentence.
8. Run simulation.
9. Save draft.

## 8. Condition Tree Mode

Visual tree structure:

```text
AND
 ├── GT(vehicle_order.total_amount, 500000)
 └── EQ(session.role, SALES_EXECUTIVE)
ACTION: BLOCK
```

### Condition Node Controls

| Control | Behavior |
|---|---|
| Add condition | Adds comparison node |
| Add group | Adds AND / OR group |
| Negate | Wraps selected condition with NOT |
| Field selector | Uses entity schema and related references |
| Operator selector | Shows only valid operators by field type |
| Value input | Type-aware literal editor |
| Path preview | Shows exact DSL path |
| Evaluate node | Tests selected condition against payload |

## 9. JSON Preview Mode

Display exact DSL JSON.

### Requirements

| Requirement | Behavior |
|---|---|
| Read-only by default | Prevent accidental invalid JSON |
| Syntax highlighting | Use monospace code panel |
| Copy button | Allows copying DSL |
| Validation status | Shows valid/invalid with error location |
| Diff view | Compare inherited vs drafted rule |
| Layer trace | Show source layer and overrides |

## 10. Simulation Panel

Simulation is always available.

### Inputs

| Input | Example |
|---|---|
| Entity Type | `vehicle_order` |
| Trigger | `BEFORE_APPROVE` |
| Payload | Vehicle order JSON |
| Session | Role, tenant, node |
| Related Data | Customer credit limit, inventory state |

### Outputs

| Output | Example |
|---|---|
| Matched? | Yes |
| Action | BLOCK |
| Message | Sales Executive cannot approve orders above ₹5L |
| Rules Evaluated | Ordered by priority |
| Short-circuit | Yes / No |
| Warnings | List |
| SET_FIELD mutations | Before/after |
| Workflow impact | Transition allowed / blocked / rerouted |

## 11. Rule List Table

When listing multiple rules, use this format.

| Rule Name | Entity Type | Trigger | Action Type | Layer | Priority |
|---|---|---|---|---|---|
| Minimum Line Items Required | vehicle_order | BEFORE_SUBMIT | BLOCK | Platform | 5 |
| Automotive Vehicle Model Required | vehicle_order | BEFORE_SUBMIT | BLOCK | Vertical | 10 |
| Bajaj Dealer Code Required | vehicle_order | BEFORE_SUBMIT | BLOCK | Tenant | 20 |
| Sales Executive Approval Limit | vehicle_order | BEFORE_APPROVE | BLOCK | Role | 5 |

## 12. Rule Builder Acceptance Criteria

1. User can create a rule through Guided Policy Mode.
2. User can inspect the generated condition tree.
3. JSON preview uses supported DSL operators and actions only.
4. User must enter business intent and risk mitigated.
5. Rule layer is explicit before save.
6. Rule save creates draft, not active runtime.
7. Simulation shows ordered rule evaluation.
8. BLOCK short-circuit is shown.
9. WARN accumulates without blocking.
10. Rule can be added to release package after validation.



---

<!-- Source: 05-workflow-designer-blueprint.md -->

# 05 — Workflow Designer Blueprint

## 1. Purpose

The Workflow Designer models the lifecycle of a business artifact.

It should answer:

> Who can move this entity from one state to another, under what conditions, and what rules must pass before runtime allows it?

## 2. Design Philosophy

Workflow Designer is not a generic automation canvas. It is a **visual state machine with policy gates**.

The canvas should show states and transitions. The side panel should show transition policy.

## 3. Layout

```text
Workflow Designer: Vehicle Order

┌────────────────────────────────────────────────────────────────────────────┐
│ Toolbar: Add State | Add Transition | Validate Paths | Simulate Command     │
├──────────────────────────────────────┬─────────────────────────────────────┤
│ Canvas                               │ Transition Inspector                │
│ DRAFT → SUBMITTED → APPROVED         │ From / To                           │
│        ↘ REJECTED                    │ Command                             │
│                                      │ Allowed Roles                       │
│                                      │ Guard Rules                         │
│                                      │ Before / After Hooks                │
└──────────────────────────────────────┴─────────────────────────────────────┘
```

## 4. Workflow Objects

| Object | Description |
|---|---|
| State | Lifecycle status such as DRAFT, SUBMITTED, APPROVED |
| Transition | Allowed movement from one state to another |
| Command | User/runtime action such as SUBMIT, APPROVE, REJECT |
| Actor Constraint | Role or permission requirement |
| Guard Rule | Rule that must pass for transition |
| Lifecycle Hook | BEFORE_SUBMIT, AFTER_APPROVE, etc. |
| Failure Outcome | Block, warn, reroute, or reject command |
| Side Effect | Notify, start workflow, set field |

## 5. State Node Design

Each state node should show:

| Item | Example |
|---|---|
| State Code | `SUBMITTED` |
| Label | Submitted |
| Type | Normal / Terminal / Exception |
| Incoming count | 2 |
| Outgoing count | 3 |
| Active overlays | Tenant, Role |
| Warning badge | Dead-end, no approver, unguarded |

## 6. Transition Inspector

When a transition is selected, show:

| Section | Fields |
|---|---|
| Identity | Transition ID, label |
| Movement | From state, to state |
| Command | SUBMIT / APPROVE / REJECT / CANCEL |
| Actors | Allowed roles |
| Permissions | Required permission action |
| Guard Rules | Rule references that must pass |
| Before Hook | Rules fired before command |
| After Hook | Notifications or secondary workflow |
| Failure Behavior | Block message or alternative route |
| Overlay Trace | Which layer added or changed transition |
| Simulation | Test this transition with payload/session |

## 7. Workflow Validation

### Structural Checks

| Check | Severity |
|---|---|
| No initial state | Error |
| State unreachable from initial state | Error |
| Non-terminal dead-end state | Warning or error |
| Transition missing command | Error |
| Transition missing allowed role | Warning |
| Duplicate transition command from same state | Warning |
| Transition points to disabled state | Error |

### Policy Checks

| Check | Severity |
|---|---|
| Approval transition has no guard rules | Warning |
| Guard rule action is not compatible with transition | Error |
| Role cannot see required approval fields | Error |
| Rule references missing field | Error |
| Transition blocked for all roles | Error |
| Protected transition disabled by downstream layer | Error |

## 8. Workflow Simulation

### Simulation Inputs

| Input | Example |
|---|---|
| Current State | DRAFT |
| Command | SUBMIT |
| Actor Role | SALES_EXECUTIVE |
| Node | Pune Central |
| Payload | Vehicle order JSON |

### Simulation Output

```text
1. Permission check: ALLOW submit on vehicle_order
2. Field mask applied: cost_price stripped for SALES_EXECUTIVE
3. BEFORE_SUBMIT rules evaluated
4. Rule result: Bajaj Dealer Code Required — PASS
5. Workflow transition DRAFT → SUBMITTED allowed
6. Persist simulation: OK
7. Audit/outbox preview: order_submitted event
```

## 9. Canvas UX

| Feature | Behavior |
|---|---|
| Auto-layout | Default layout should be readable without manual positioning |
| Manual drag | Allow drag to improve readability |
| Edge labels | Show command name |
| Error badges | Display validation errors on state/transition |
| Minimap | Useful for large workflows |
| Zoom | Fit, zoom in/out |
| Filter | Show only transitions for selected role |
| Layer coloring | Optional subtle layer indicator |

## 10. Difference from Salesforce-Style Flow

Do not model every automation as a free-form flow. In IDMS:

- States are explicit.
- Transitions are governed.
- Rules fire at lifecycle hooks.
- Permissions and field masks apply before rules.
- Runtime uses compiled artifacts.

The visual model must reflect this sequence.

## 11. Workflow Designer Acceptance Criteria

1. User can view Vehicle Order lifecycle as a canvas.
2. User can select transition `DRAFT → SUBMITTED`.
3. Inspector shows allowed roles, command, guard rules, and hooks.
4. User can add a new state as draft.
5. User can add a transition as draft.
6. Validation detects unreachable state.
7. Simulation evaluates permission, field mask, rules, and transition.
8. Overlay trace shows which layer added a transition.
9. Protected transitions cannot be disabled downstream.
10. Workflow changes can be added to a release package.



---

<!-- Source: 06-overlay-studio-blueprint.md -->

# 06 — Overlay Studio Blueprint

## 1. Purpose

Overlay Studio makes the IDMS customization architecture visible and safe.

It should answer:

> Which layer contributed this behavior, what delta changed it, what is protected, and what will runtime see after compilation?

## 2. Design Philosophy

Overlay must not be hidden. It also must not dominate the user's mental model.

Use a hybrid approach:

1. Designers show resolved artifacts.
2. Every item shows layer and override status.
3. Overlay Studio provides detailed trace, delta editing, and merge preview.

## 3. Overlay Layers

| Priority | Layer | Example |
|---:|---|---|
| 1 | Platform | customer_id, amount, audit fields |
| 2 | Vertical | vehicle_model for Automotive |
| 3 | Tenant | Bajaj dealer code and GSTIN |
| 4 | Node | Pune branch regional tax field |
| 5 | Role | SALES_EXECUTIVE hides cost_price |

Higher-priority layers can add or narrow behavior. They should not replace whole artifacts.

## 4. Overlay Studio Layout

```text
Overlay Studio: Vehicle Order

┌────────────────────────────────────────────────────────────────────────────┐
│ Artifact Picker | Layer Context | Operation | Save Draft Delta              │
├───────────────────────┬──────────────────────────────┬─────────────────────┤
│ Layer Stack           │ Delta Editor                 │ Resolved Preview    │
│ Platform              │ Operation: constrain          │ Final merged JSON    │
│ Vertical              │ Path: fields.discount_pct     │ Diff view            │
│ Tenant                │ Value: max = 7                │ Compile warnings     │
│ Node                  │                              │                     │
│ Role                  │                              │                     │
└───────────────────────┴──────────────────────────────┴─────────────────────┘
```

## 5. Layer Stack View

Each layer should show:

| Field | Example |
|---|---|
| Layer | Tenant |
| Scope | Bajaj Auto |
| Delta Count | 4 |
| Last Changed | 2026-04-28 |
| Status | Draft / Active / Compile Error |
| Author | Functional Consultant |
| Protected Conflicts | 0 |

Clicking a layer shows its deltas.

## 6. Delta Operations

Use the platform operation vocabulary.

| Operation | What It Does | UI Example |
|---|---|---|
| `extend` | Adds field, section, transition, policy | Add GSTIN field |
| `replace` | Replaces named property | Change field label |
| `disable` | Marks inherited node inactive | Disable optional notes field |
| `remove` | Physically removes where permitted | Remove tenant-only field |
| `constrain` | Narrows values, states, limits | Max discount 7% |
| `decorate` | Adds labels, hints, visual tokens | Add help text |
| `append` | Ordered insertion after inherited items | Add section after Pricing |
| `prepend` | Ordered insertion before inherited items | Add warning section before Submit |

## 7. Delta Editor Fields

| Field | Required | Notes |
|---|---|---|
| Artifact Key | Yes | Selected from registry, not free text |
| Layer | Yes | Current edit layer |
| Scope ID | Yes | Tenant/node/role specific |
| Operation | Yes | One of supported operations |
| Target Path | Yes | Stable-ID path |
| Value | Conditional | JSON value or form fields |
| Reason | Yes | Governance note |
| Risk Classification | Yes | Low, Medium, High |
| Protected Override Check | Automatic | Blocks invalid changes |

## 8. Resolved Preview

The resolved preview should show:

1. Final merged JSON
2. Human-readable summary
3. Diff from active compiled artifact
4. Source layer per node
5. Protected node warnings
6. Compile readiness

## 9. Trace Example

```text
vehicle_order.fields.gstin
  Platform: not present
  Vertical: not present
  Tenant: extended field, required = true
  Node: no change
  Role: visible
Result: Visible and required for Bajaj users
```

## 10. Conflict Types

| Conflict | Example | Outcome |
|---|---|---|
| Protected override | Role tries to hide audit field | Block |
| Type conflict | Tenant changes number to text | Block or high-risk |
| Constraint widening | Node expands tenant enum | Block |
| Duplicate stable ID | Two deltas add same field ID | Error |
| Broken reference | Rule references removed field | Error |
| Order conflict | Append after missing field | Error |
| Permission contradiction | Field required but hidden | Error |

## 11. Overlay UX Rules

1. Never ask users to type artifact keys manually.
2. Always show resolved preview before save.
3. Always show which layer the draft delta belongs to.
4. Always require reason for high-impact delta.
5. Never allow downstream layer to override protected node.
6. Prefer `decorate` for label/help changes.
7. Prefer `constrain` for narrowing allowed values.
8. Use `disable` instead of destructive delete when inherited.
9. Keep raw JSON available but not mandatory.
10. Every delta must be auditable.

## 12. Overlay Studio Acceptance Criteria

1. User can select `entity.vehicle_order` from dropdown.
2. User can see Platform, Vertical, Tenant, Node, Role stack.
3. User can inspect all deltas contributing to GSTIN.
4. User can create a tenant `extend` delta.
5. User can create a node `constrain` delta.
6. UI blocks override of protected `customer_id`.
7. Resolved preview updates after draft delta.
8. Diff shows before/after at property level.
9. Compile warnings appear before release.
10. Draft deltas can be added to release package.



---

<!-- Source: 07-permission-matrix-blueprint.md -->

# 07 — Permission Matrix Blueprint

## 1. Purpose

The Permission Matrix controls who can perform which actions, which fields they can see, and which rows they can access.

It should answer:

> For this artifact and role, what can the user do, what can they see, and which records are in scope?

## 2. Permission Tabs

| Tab | Purpose |
|---|---|
| Action Access | Role × resource × action matrix |
| Field Visibility | Role × field visibility matrix |
| Row Filters | Role-based record scope rules |
| Effective Preview | Runtime permission result for selected role |
| Change Impact | What behavior changes if permission is modified |

## 3. Action Access Matrix

Rows are roles. Columns are resources/actions.

Example:

| Role | Create | Read | Update | Submit | Approve | Reject | Delete |
|---|---|---|---|---|---|---|---|
| SALES_EXECUTIVE | Allow | Allow | Allow Own | Allow | Deny | Deny | Deny |
| SALES_MANAGER | Allow | Allow | Allow | Allow | Allow <= ₹10L | Allow | Deny |
| DEALER_PRINCIPAL | Allow | Allow | Allow | Allow | Allow | Allow | Deny |
| OEM_ADMIN | Allow | Allow | Allow | Allow | Allow | Allow | Allow |

## 4. Field Visibility Matrix

Field-level access should use the existing convention:

```text
resource_ref = entity artifact name
action_ref   = field:{fieldName}
effect       = ALLOW | DENY
role_ref     = role name
```

Example:

| Field | SALES_EXECUTIVE | SALES_MANAGER | DEALER_PRINCIPAL | OEM_ADMIN |
|---|---|---|---|---|
| customer_id | Allow | Allow | Allow | Allow |
| total_amount | Allow | Allow | Allow | Allow |
| cost_price | Deny | Allow | Allow | Allow |
| margin_pct | Deny | Allow | Allow | Allow |
| gstin | Allow | Allow | Allow | Allow |

## 5. Row Filters

Row-level filters should use the convention:

```text
resource_ref = entity artifact name
action_ref   = row_filter
effect       = ALLOW
role_ref     = role name
conditions   = expression string
```

Example:

| Role | Resource | Condition | Meaning |
|---|---|---|---|
| SALES_EXECUTIVE | Vehicle Order | `created_by = {actor.user_id}` | Own records only |
| SALES_MANAGER | Vehicle Order | `node_id = {actor.node_id}` | Branch records |
| DEALER_PRINCIPAL | Vehicle Order | `tenant_id = {actor.tenant_id}` | Tenant records |
| OEM_ADMIN | Vehicle Order | `true` | Full access |

## 6. Effective Preview

The user should be able to select:

```text
Role: SALES_EXECUTIVE
Node: Pune Central
Entity: Vehicle Order
Command: APPROVE
Record: VO-1001
```

The preview should show:

```text
Action access: DENY approve
Field mask: cost_price hidden, margin_pct hidden
Row filter: created_by = current user
Result: User cannot approve this order
```

## 7. Permission + Rule Interaction

Permissions are checked before rules in the command pipeline. The UI must expose this.

Example:

If SALES_EXECUTIVE cannot approve Vehicle Order, then a BEFORE_APPROVE rule for SALES_EXECUTIVE approval limit may never run for that user because permission fails first.

Impact Panel should say:

> This role is denied APPROVE. Related approval rules may not execute for this role.

## 8. Permission UX Safeguards

| Risk | Safeguard |
|---|---|
| Required field hidden | Show error |
| Approval allowed but approver cannot see approval fields | Show error |
| Row filter too broad | Show warning |
| Row filter invalid syntax | Block save |
| All roles denied submit | Show workflow-breaking error |
| Field mask hides protected audit field | Block |
| Tenant admin grants OEM-only action | Block by permission boundary |

## 9. Permission Editing Rules

1. Roles must load dynamically.
2. Resources must include entity artifacts dynamically.
3. Field list must come from resolved entity schema.
4. Permission changes create draft artifacts/deltas.
5. Effective preview must include layer context.
6. Deny should be explicit and visible.
7. No role should silently inherit dangerous access.
8. Every high-risk permission change requires reason.

## 10. Permission Matrix Acceptance Criteria

1. User can select Vehicle Order resource.
2. Roles are listed dynamically from seed/API.
3. Actions show Allow/Deny/Conditional states.
4. Field Visibility tab shows fields from resolved schema.
5. Row Filters tab allows adding a condition per role.
6. Effective preview shows action, field, and row access.
7. UI blocks hidden required field conflict.
8. UI warns when approve is denied but workflow expects role.
9. Changes are saved as draft.
10. Draft can be added to release package.



---

<!-- Source: 08-release-governance-and-simulation.md -->

# 08 — Release Governance and Simulation

## 1. Purpose

Release Governance ensures configuration changes are treated with the same discipline as code changes.

It should answer:

> What changes are being promoted, what do they affect, have they been simulated, have they compiled, who approved them, and how can they be rolled back?

## 2. Core Principle

Save is not activation.

Configuration changes move through this flow:

```text
Edit Draft → Simulate → Validate Compile → Add to Release Package
→ Submit Approval → Promote to UAT → Promote to Production → Activate → Monitor
```

## 3. Change Set / Release Package

A release package groups related metadata changes.

### Package Can Include

| Artifact Type | Example |
|---|---|
| Entity delta | Add GSTIN field to Vehicle Order |
| Rule change | Block submit if GSTIN missing |
| Workflow change | Add Sales Manager Review state |
| Permission change | Hide cost_price from SALES_EXECUTIVE |
| Overlay delta | Node-level discount constraint |
| Theme change | Tenant color update |

## 4. Release Package Header

| Field | Example |
|---|---|
| Release ID | `rel.bajaj.vehicle-order-governance.v1` |
| Name | Bajaj Vehicle Order Governance v1 |
| Environment | Dev |
| Target Environment | UAT |
| Status | Draft |
| Owner | Functional Consultant |
| Risk | Medium |
| Approval Required | Yes |
| Created At | 2026-04-28 |

## 5. Release Package Items

| Item | Artifact | Layer | Type | Risk | Status |
|---|---|---|---|---|---|
| Add GSTIN | entity.vehicle_order | Tenant | Entity Delta | Medium | Validated |
| Dealer Code Rule | rule.vehicle_order.bajaj_dealer_code_required | Tenant | Rule | High | Simulated |
| Cost Price Field Mask | permission.vehicle_order.sales_executive | Role | Permission | Medium | Validated |
| Sales Manager Review | workflow.vehicle_order | Tenant | Workflow | Medium | Needs Simulation |

## 6. Always-On Impact Panel

During editing, show lightweight impact continuously.

### Impact Categories

| Category | Example |
|---|---|
| Field dependencies | `discount_pct` used by 2 rules |
| Workflow dependencies | `BEFORE_APPROVE` rules guard APPROVE transition |
| Permission impact | `cost_price` hidden for SALES_EXECUTIVE |
| Overlay conflicts | Node delta narrows tenant value |
| Compile warnings | Missing field reference |
| Release readiness | 3 of 5 checks passed |

## 7. Full Pre-Promotion Validation

Before promotion, run full validation.

### Validation Pipeline

```text
1. Artifact schema validation
2. Overlay merge validation
3. Protected node validation
4. Entity dependency validation
5. Rule DSL validation
6. Rule simulation validation
7. Workflow path validation
8. Permission consistency validation
9. Compiled preview generation
10. Approval readiness check
```

## 8. Validation Results

| Result Type | Meaning | Promotion Impact |
|---|---|---|
| Pass | No issue | Can promote |
| Warning | Risk exists but allowed | Requires acknowledgement |
| Error | Invalid or unsafe | Blocks promotion |
| Approval Required | High-risk change | Requires approver |
| Simulation Missing | No test case | Blocks or warns based on policy |

## 9. Simulation Suite

A release package should contain simulation cases.

### Simulation Case Fields

| Field | Example |
|---|---|
| Case ID | `sim.vehicle_order.submit.missing_gstin` |
| Entity Type | `vehicle_order` |
| Trigger / Command | `SUBMIT` |
| Payload | Vehicle order JSON |
| Session | Sales Executive at Pune |
| Expected Result | BLOCK |
| Expected Message | GSTIN is required |
| Status | Pass / Fail / Not Run |

### Required Simulation Cases

For each high-risk rule or transition, include:

1. Positive case where command succeeds
2. Negative case where command blocks
3. Role boundary case
4. Node/tenant overlay case
5. Field mask case if permissions are involved

## 10. Approval Model

| Release Risk | Approval |
|---|---|
| Low | Functional lead approval |
| Medium | Tenant admin approval |
| High | Platform/OEM admin approval |
| Protected area touched | Platform architect approval |
| Production promotion | Explicit approval required |

## 11. Promotion States

| State | Meaning |
|---|---|
| Draft | Package being assembled |
| Validating | Checks running |
| Validation Failed | Blocking issue |
| Ready for Approval | All checks pass or acknowledged |
| Approved | Approved for target environment |
| Promoted to UAT | Available for UAT testing |
| Promoted to Production | Available for production activation |
| Active | Runtime is using compiled artifacts |
| Rolled Back | Previous compiled version restored |
| Deprecated | Package closed and superseded |

## 12. Rollback

Rollback should restore the previous compiled artifact set for the affected scope.

UI must show:

1. Current active package
2. Previous active package
3. Artifacts affected
4. Rollback risk
5. Required approval
6. Post-rollback simulation cases

## 13. Release Governance Acceptance Criteria

1. User can create a release package.
2. User can add entity, rule, workflow, permission, and overlay changes.
3. Validation shows pass/warning/error results.
4. Blocking errors prevent promotion.
5. Simulation cases can be run from package.
6. Package shows compile preview.
7. Approval status is visible.
8. Promotion to UAT and Production are separate steps.
9. Activation is separate from save.
10. Rollback path is visible for active package.



---

<!-- Source: 09-automotive-seed-data-guide.md -->

# 09 — Automotive Seed Data Guide

## 1. Purpose

The seed data file provides a realistic Automotive DMS mock configuration for building the Admin Studio UI without backend dependencies.

File:

```text
seed/idms_admin_studio_automotive_seed.json
```

## 2. Domain Scenario

Tenant: **Bajaj Auto Demo**  
Vertical: **Automotive DMS**  
Node: **Pune Central Branch**  
Primary Artifact: **Vehicle Order**

The scenario demonstrates:

1. Platform fields inherited by all order-like entities
2. Automotive vertical fields such as vehicle model and registration number
3. Bajaj tenant fields such as GSTIN and dealer code
4. Role-level field masking for Sales Executive
5. Rules at Platform, Vertical, Tenant, Node, and Role layers
6. Workflow transition gates
7. Permission matrix with action, field, and row access
8. Overlay deltas and resolved preview
9. Release package with simulations and validation findings

## 3. Main Mock Entities

| Entity | Purpose |
|---|---|
| `vehicle_order` | Main sales/order process for vehicle purchase |
| `vehicle_booking` | Booking before order conversion |
| `service_job` | After-sales service job card |
| `parts_inventory` | Spare parts stock tracking |
| `customer` | Customer master |
| `vehicle_master` | Vehicle catalog/master data |

## 4. Main Roles

| Role | Purpose |
|---|---|
| `OEM_ADMIN` | Full platform and tenant administration |
| `DEALER_PRINCIPAL` | Dealer-level governance and approvals |
| `SALES_MANAGER` | Branch sales approval |
| `SALES_EXECUTIVE` | Creates and submits vehicle orders |
| `SERVICE_MANAGER` | Service job management |
| `PARTS_MANAGER` | Parts inventory management |

## 5. Layers Demonstrated

| Layer | Example |
|---|---|
| Platform | `customer_id`, `total_amount`, minimum line items rule |
| Vertical | `vehicle_model`, `registration_no`, vehicle model required rule |
| Tenant | `gstin`, `bajaj_dealer_code`, Bajaj dealer code rule |
| Node | Pune discount constraint |
| Role | Hide `cost_price` and block high-value approval for Sales Executive |

## 6. Suggested Mock Service Shape

Your frontend mock service can expose:

| Function | Reads From |
|---|---|
| `listArtifacts()` | `artifact_registry` |
| `getEntitySchema(artifactKey)` | `entity_schemas` |
| `listRules(entityType)` | `rules` |
| `getWorkflow(entityType)` | `workflows` |
| `getOverlayTrace(artifactKey)` | `overlay_deltas` |
| `getPermissions(resourceRef)` | `permission_rules` |
| `getReleasePackages()` | `release_packages` |
| `runSimulation(caseId)` | `simulation_cases` and deterministic mock evaluator |

## 7. Recommended Demo Flow

1. Open `/admin/studio`.
2. Select `Vehicle Order`.
3. Preview as `SALES_EXECUTIVE`.
4. Notice `cost_price` hidden by role overlay.
5. Open Rules tab.
6. Inspect `Sales Executive Approval Limit`.
7. Open Workflow tab.
8. Select `SUBMITTED → APPROVED`.
9. Run simulation with order amount ₹650000.
10. See permission/rule outcome.
11. Open Overlay tab.
12. Inspect tenant GSTIN delta.
13. Add changes to release package.
14. Run validation.
15. Review compile readiness.

## 8. Important Mock Limitations

The seed data is not a backend contract. It is a UI-driving dataset.

Do not infer that every property is currently persisted exactly as shown. Use it to design and validate screens, interactions, and data dependencies.



---

<!-- Source: 10-critical-review.md -->

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

