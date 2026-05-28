# 09A - Workflow and Approval Builder UX PRD

## 1. Feature Overview

The Workflow and Approval Builder is the Admin Studio configuration experience for designing workflow definitions and approval paths. It provides drag-and-drop visual configuration where sequence, branching, human tasks, approval steps, timers, and escalations are easier to understand visually.

The visual builder is not the runtime engine. It produces structured, validated, versioned metadata that the native iDMS Workflow Engine and Approval Engine execute.

## 2. Business Objective

Enable business admins and implementation consultants to configure workflow and approval behavior accurately without code, while preventing invalid, ambiguous, or unsafe process definitions.

## 3. Scope

### In Scope

- Drag-and-drop workflow canvas
- Drag-and-drop approval path builder
- Node palette
- Edge connection editor
- Property panel
- Validation panel
- Preview mode
- Simulation launch
- Version compare preview
- Read-only published view
- Undo/redo
- Copy/paste/duplicate node
- Auto-layout
- Zoom and pan
- Minimap
- Keyboard shortcuts where practical
- Accessibility baseline

### Out of Scope

- Free-form drawing that has no executable meaning
- Unstructured text-only conditions as runtime logic
- Direct editing of published versions
- Direct database editing of workflow metadata
- External workflow designer dependency

## 4. Design Principles

| Principle | Explanation |
|---|---|
| Visual where relationships matter | Use drag-and-drop for process sequence, branching, escalation, and approval path. |
| Structured where precision matters | Use forms, grids, and picklists for field mapping, SLA values, assignees, and conditions. |
| Canvas is not runtime truth | Executable metadata is the runtime source of truth. |
| Prevent invalid designs early | Builder should block or warn before publish. |
| Business friendly by default | Hide internal engine details from standard users. |
| Diagnostics available to advanced users | Show metadata and execution mapping in advanced mode. |

## 5. Functional Requirements

### 5.1 Canvas Basics

| ID | Requirement | Priority |
|---|---|---|
| WFB-CAN-001 | The system shall provide a drag-and-drop canvas for workflow configuration. | MVP |
| WFB-CAN-002 | The canvas shall support adding nodes from a node palette. | MVP |
| WFB-CAN-003 | The canvas shall support moving nodes without changing runtime behavior. | MVP |
| WFB-CAN-004 | The canvas shall support connecting nodes with directed edges. | MVP |
| WFB-CAN-005 | The canvas shall support deleting nodes with confirmation when connected. | MVP |
| WFB-CAN-006 | The canvas shall support zoom and pan. | MVP |
| WFB-CAN-007 | The canvas shall support auto-layout. | Phase 2 |
| WFB-CAN-008 | The canvas shall support minimap for large workflows. | Phase 2 |
| WFB-CAN-009 | The canvas shall support undo and redo for unsaved changes. | Phase 2 |
| WFB-CAN-010 | The canvas shall support read-only view for published versions. | MVP |

### 5.2 Node Palette

| ID | Requirement | Priority |
|---|---|---|
| WFB-PAL-001 | The workflow node palette shall include Start, End, Human Task, Approval Task, Service Task, Decision Gateway, Timer, Notification, and Error Handler. | MVP |
| WFB-PAL-002 | The approval builder palette shall include Approval Step, Parallel Group, Sequential Group, Fallback Approver, Escalation Step, Send Back Path, Reject Path, and End. | MVP |
| WFB-PAL-003 | The system shall show node descriptions to explain business usage. | MVP |
| WFB-PAL-004 | The system shall hide node types unavailable to the current user's permission or product phase. | MVP |

### 5.3 Property Panel

| ID | Requirement | Priority |
|---|---|---|
| WFB-PROP-001 | Selecting a node shall open a property panel. | MVP |
| WFB-PROP-002 | Property panel shall show only configuration relevant to selected node type. | MVP |
| WFB-PROP-003 | Required node properties shall be clearly marked. | MVP |
| WFB-PROP-004 | Property panel shall validate values before save. | MVP |
| WFB-PROP-005 | Property panel shall support advanced mode for technical metadata where permitted. | Phase 2 |

### 5.4 Edge and Gateway Configuration

| ID | Requirement | Priority |
|---|---|---|
| WFB-EDGE-001 | Admin shall be able to click an edge and configure transition label. | MVP |
| WFB-EDGE-002 | Admin shall be able to configure transition condition using Condition Builder. | MVP |
| WFB-EDGE-003 | The system shall support default gateway transition. | MVP |
| WFB-EDGE-004 | The system shall warn when multiple gateway conditions can match for exclusive gateway. | MVP |
| WFB-EDGE-005 | The system shall block publish if a gateway has no valid outgoing path. | MVP |

### 5.5 Approval Path Builder

| ID | Requirement | Priority |
|---|---|---|
| WFB-APR-001 | The system shall provide a visual approval path builder. | MVP |
| WFB-APR-002 | Admin shall be able to drag approval steps into sequence. | MVP |
| WFB-APR-003 | Admin shall be able to create parallel approval groups. | MVP |
| WFB-APR-004 | Admin shall be able to configure all-approver or any-one approval for a parallel group. | MVP |
| WFB-APR-005 | Admin shall be able to configure fallback approver per step. | MVP |
| WFB-APR-006 | Admin shall be able to configure escalation step per approval step. | MVP |
| WFB-APR-007 | Admin shall be able to configure send-back target. | MVP |
| WFB-APR-008 | Admin shall be able to configure rejection outcome. | MVP |
| WFB-APR-009 | Admin shall be able to preview resolved approval path using sample payload. | MVP |

### 5.6 Validation Panel

| ID | Requirement | Priority |
|---|---|---|
| WFB-VAL-001 | Builder shall provide validation panel listing errors and warnings. | MVP |
| WFB-VAL-002 | Validation panel shall categorize issues as Blocking Error, Warning, or Recommendation. | MVP |
| WFB-VAL-003 | Clicking validation issue shall navigate to affected node or property. | MVP |
| WFB-VAL-004 | The system shall block publish when blocking errors exist. | MVP |
| WFB-VAL-005 | The system shall allow publish with warnings only if authorized and reason is captured where configured. | Phase 2 |

### 5.7 Save, Draft, Publish

| ID | Requirement | Priority |
|---|---|---|
| WFB-SAVE-001 | Builder shall support saving draft configuration. | MVP |
| WFB-SAVE-002 | Builder shall autosave drafts where configured. | Phase 2 |
| WFB-SAVE-003 | Builder shall show unsaved changes warning before leaving page. | MVP |
| WFB-SAVE-004 | Builder shall require publish validation before publishing. | MVP |
| WFB-SAVE-005 | Builder shall create immutable published version on publish. | MVP |

### 5.8 Version Diff and Preview

| ID | Requirement | Priority |
|---|---|---|
| WFB-DIFF-001 | The system shall show version history for workflow and approval configurations. | MVP |
| WFB-DIFF-002 | The system shall support visual diff between draft and latest published version. | Phase 2 |
| WFB-DIFF-003 | Diff shall identify added nodes, removed nodes, changed properties, changed conditions, and changed assignees. | Phase 2 |
| WFB-DIFF-004 | Published version preview shall be read-only. | MVP |

## 6. Builder Metadata Requirements

| ID | Requirement | Priority |
|---|---|---|
| WFB-META-001 | The system shall store canvas coordinates, zoom state, and layout metadata separately from executable metadata. | MVP |
| WFB-META-002 | The system shall generate executable workflow metadata from validated builder configuration. | MVP |
| WFB-META-003 | The system shall reject executable metadata generation if required properties are missing. | MVP |
| WFB-META-004 | The system shall include builder version in saved metadata for future compatibility. | MVP |

## 7. Usage Examples

### Example 1: Approval Workflow Configuration

Admin creates Sale Invoice Approval flow:

1. Drag Start node.
2. Drag Decision Gateway named `Approval Required?`.
3. Drag Approval Task `Sales Manager Approval`.
4. Drag Approval Task `Finance Approval`.
5. Drag End node.
6. Configure condition: discount_percent > 5.
7. Configure Sales Manager resolver.
8. Configure Finance approver only when invoice_amount > 100000.
9. Run simulation.
10. Publish.

### Example 2: SLA Escalation Path

Admin configures Purchase Order approval:

1. Approval Step: Branch Manager.
2. SLA: 24 business hours.
3. Reminder: 4 hours before due.
4. Escalation: Procurement Head after due.
5. Publish blocked if escalation user/role cannot resolve.

## 8. Error Handling

| Error | Expected Behavior |
|---|---|
| Node missing required config | Show blocking validation error. |
| Edge creates invalid loop | Warn or block based on loop policy. |
| No terminal path | Block publish. |
| No approver resolves in simulation | Show error with resolver details. |
| Published version opened | Show read-only mode. |
| User lacks permission | Hide or disable restricted builder actions. |

## 9. Acceptance Criteria

| ID | Acceptance Criteria |
|---|---|
| WFB-AC-001 | Admin can create workflow by dragging nodes and connecting them. |
| WFB-AC-002 | Admin can configure approval path visually. |
| WFB-AC-003 | Builder blocks publish when required node properties are missing. |
| WFB-AC-004 | Moving node position does not change executable behavior. |
| WFB-AC-005 | Published version opens in read-only mode. |
| WFB-AC-006 | Simulation can be launched from builder before publish. |

## 10. Developer Implementation Notes

1. Do not store executable logic only as canvas coordinates.
2. Maintain strict separation between visual layout and runtime metadata.
3. Use shared Condition Builder for gateway conditions.
4. Use shared approver resolver components from Approval Engine.
5. Use validation service before publish.
6. Do not allow direct editing of published configuration.
