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
