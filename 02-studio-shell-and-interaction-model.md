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
