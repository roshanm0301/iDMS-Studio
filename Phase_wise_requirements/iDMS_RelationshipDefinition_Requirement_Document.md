# iDMS Admin Studio — RelationshipDefinition Requirement Document

**Document Type:** Functional + Metadata Architecture Requirement  
**Audience:** AI Developer, Backend Architect, Frontend Architect, Product Owner, QA  
**Status:** Frozen for implementation planning  
**Scope Area:** Entity Metadata Architecture → RelationshipDefinition  

---

## 1. Objective

RelationshipDefinition shall define how one iDMS entity is structurally, logically, and behaviorally connected to another entity. It must support enterprise-grade relationships without confusing relationship metadata with database foreign keys or UI relation views.

RelationshipDefinition is required because iDMS entities such as Customer, Vehicle, Service Job Card, Sales Invoice, Campaign, Dealer, Part, Claim, and Voucher are not isolated objects. They depend on governed references, ownership, child collections, junction mappings, lifecycle behavior, lookup filters, and dependency impact.

---

## 2. Product Position

RelationshipDefinition is an application-level relationship metadata object. It may result in a PostgreSQL foreign key or junction table, but it is not limited to database-level constraints.

The clean separation is:

| Concern | Owner |
|---|---|
| Source and target entity identity | RelationshipDefinition |
| Reference field storage | FieldDefinition |
| Physical FK or junction table | Persistence mapping generated from RelationshipDefinition and FieldDefinition |
| Embedded child grid/layout rendering | ViewDefinition / RelationViewDefinition |
| Related record access | SecurityDefinition |
| Parent-child lifecycle rules | RelationshipDefinition + LifecycleModelDefinition |
| Relationship-specific validations | ValidationRuleDefinition |
| Runtime lookup list and display | RelationshipDefinition + Lookup ViewDefinition |

**Hard rule:** RelationshipDefinition must not own UI layout. It may reference lookup views and related-list views, but it must not define screen controls directly.

---

## 3. In Scope

RelationshipDefinition MVP shall support:

1. Lookup relationship
2. Parent-child relationship
3. Junction relationship for many-to-many structures
4. Polymorphic reference relationship
5. Relationship cardinality
6. Required or optional relationship behavior
7. Delete and archive behavior
8. Parent lifecycle impact rules
9. Lookup filtering and selectable-target rules
10. Field copy rule linkage
11. Security inheritance option
12. Relationship dependency tracking
13. Compile-time validation
14. Runtime contract output
15. PostgreSQL persistence mapping guidance

---

## 4. Out of Scope for MVP

The following are not part of MVP implementation:

| Capability | Reason Deferred |
|---|---|
| Visual ER diagram editor | Useful later, but metadata correctness comes first |
| Cross-database relationship execution | PostgreSQL is the active database target |
| Arbitrary SQL relationships | High governance and security risk |
| Recursive hierarchy builder UI | Can be modeled first, visual tooling later |
| Full graph traversal query designer | Requires query runtime maturity |
| Drag-and-drop relation views | Belongs to ViewDefinition phase |

---

## 5. Relationship Types

### 5.1 Lookup Relationship

A lookup relationship references another entity without making the target entity own the source record lifecycle.

Examples:
- Service Job Card → Customer
- Service Job Card → Vehicle
- Sales Invoice → Customer
- Part Price → Part
- Receipt Voucher → Customer

Behavior:
- Source record stores a reference to target record.
- Target record deletion or deactivation behavior is controlled by RelationshipDefinition.
- Lookup can be optional or mandatory.
- Target records can be filtered by lifecycle status, tenant, node, role, or contextual field values.

### 5.2 Parent-Child Relationship

A parent-child relationship defines ownership or strong composition.

Examples:
- Sales Invoice Header → Sales Invoice Lines
- Service Job Card → Labour Lines
- Service Job Card → Parts Lines
- Stock Transfer Requisition → Requisition Lines

Behavior:
- Child record is logically owned by parent.
- Child records usually cannot exist independently without parent.
- Parent status can control child editability.
- Child add/edit/delete behavior is governed by lifecycle and security.

### 5.3 Junction Relationship

A junction relationship represents many-to-many association through an explicit junction entity.

Examples:
- Campaign ↔ Vehicle Models
- Scheme ↔ Dealers
- Service Package ↔ Applicable Service Types
- Role ↔ Permissions
- Tax Rule ↔ Applicable States

Behavior:
- Junction entity must be explicit, not hidden magic.
- Junction entity can carry attributes such as effective date, priority, status, and applicability.
- Junction relationship must define both sides of the association.

### 5.4 Polymorphic Reference Relationship

A polymorphic reference points to one record across a controlled list of allowed target entities.

Examples:
- Attachment → Sales Invoice or Job Card or Claim
- Comment → Any supported document
- Approval History → Any approval-enabled entity
- Activity → Customer or Vehicle or Dealer

Behavior:
- Source stores target entity API name and target record ID.
- Allowed target entities must be explicitly whitelisted.
- Security must be resolved against the actual target entity at runtime.
- Database FK cannot enforce every polymorphic case; application-level referential checks are mandatory.

---

## 6. RelationshipDefinition Metadata Model

```json
{
  "relationshipId": "rel_service_job_card_customer",
  "apiName": "service_job_card_customer",
  "label": "Service Job Card Customer",
  "description": "Links a service job card to the customer for whom the job is performed.",
  "sourceEntityId": "ent_service_job_card",
  "targetEntityId": "ent_customer",
  "relationshipType": "lookup",
  "cardinality": "many_to_one",
  "sourceFieldId": "fld_service_job_card_customer_id",
  "inverseName": "Service Job Cards",
  "requiredPolicy": "required_before_submit",
  "ownershipBehavior": "none",
  "deleteBehavior": "restrict_if_referenced",
  "archiveBehavior": "allow_target_archive_if_no_open_source_records",
  "targetFilterPolicyId": "filter_active_customers_same_tenant_node",
  "lookupViewId": "view_customer_lookup",
  "securityInheritance": "none",
  "copyRuleIds": ["copy_customer_address_to_job_card"],
  "lifecycleImpactPolicyId": "policy_customer_status_impacts_job_card_submit",
  "governance": {
    "owningLayer": "Vertical",
    "owningPackageId": "pkg_auto_service_core",
    "canDownstreamConstrain": true,
    "canDownstreamRelax": false,
    "canDownstreamDisable": false
  },
  "lifecycle": {
    "metadataStatus": "draft",
    "version": "1.0.0"
  }
}
```

---

## 7. Metadata Field Specification

| Field | Type | Mandatory | Rules |
|---|---:|---:|---|
| relationshipId | string | Yes | Immutable internal ID. Generated by system. |
| apiName | string | Yes | Unique within source entity. Snake case. Locked after activation unless migration workflow exists. |
| label | string | Yes | Business-readable label. Min 2 chars. |
| description | string | No | Explains business purpose and lifecycle implication. |
| sourceEntityId | entity reference | Yes | Must reference active or draft source EntityDefinition. |
| targetEntityId | entity reference | Conditional | Mandatory except polymorphic relationship. |
| allowedTargetEntityIds | array | Conditional | Mandatory for polymorphic relationship. |
| relationshipType | enum | Yes | lookup, parent_child, junction, polymorphic_reference. |
| cardinality | enum | Yes | one_to_one, one_to_many, many_to_one, many_to_many. |
| sourceFieldId | field reference | Conditional | Required for lookup, parent_child, and polymorphic source field. |
| junctionEntityId | entity reference | Conditional | Required for junction relationship. |
| inverseName | string | No | Label used when target displays related source records. |
| requiredPolicy | enum or policy ref | Yes | optional, required_on_create, required_before_submit, required_before_approve, policy_ref. |
| ownershipBehavior | enum | Yes | none, source_owns_target, target_owns_source, parent_owns_child. |
| deleteBehavior | enum | Yes | restrict, cascade_soft_delete, set_null, archive_child, block_if_open_children. |
| archiveBehavior | enum | Yes | restrict, allow_if_no_active_children, allow_and_freeze_children. |
| targetFilterPolicyId | policy ref | No | Controls selectable target records. |
| lookupViewId | view ref | No | View used to render lookup search and selection. |
| relatedListViewId | view ref | No | View used when relationship is rendered as related list. |
| securityInheritance | enum | Yes | none, inherit_from_parent, inherit_from_target, evaluate_both. |
| copyRuleIds | array | No | Field copy rules executed on select/save. |
| lifecycleImpactPolicyId | policy ref | No | Defines lifecycle effect between related records. |
| owningLayer | enum | Yes | Platform, Vertical, Tenant, Node. Role is not allowed to own schema relationship. |
| metadataStatus | enum | Yes | draft, active, deprecated, retired, disabled. |

---

## 8. Relationship Behavior Rules

### 8.1 Lookup Selection Rules

REQ-REL-001: System shall allow target selection only from entities allowed by RelationshipDefinition.

REQ-REL-002: System shall apply targetFilterPolicy before showing lookup records.

REQ-REL-003: System shall enforce the same target eligibility at backend save time. UI filtering alone is not sufficient.

REQ-REL-004: System shall block save when the selected target record does not exist, is inactive where inactive is not allowed, belongs to another tenant or node where cross-scope reference is not permitted, or fails the filter policy.

### 8.2 Parent-Child Rules

REQ-REL-005: Parent-child relationship shall support adding, editing, and deleting child rows only when parent lifecycle state, relationship behavior, and user permissions allow it.

REQ-REL-006: Child records shall store parent reference using the configured source or foreign field.

REQ-REL-007: Parent state changes shall be able to freeze child modifications when lifecycle policy requires it.

REQ-REL-008: Child records shall not be orphaned unless relationship explicitly allows set_null behavior.

### 8.3 Junction Rules

REQ-REL-009: A junction relationship shall always use an explicit junction entity.

REQ-REL-010: Junction entity shall support its own fields, lifecycle, validations, and security.

REQ-REL-011: System shall block duplicate junction rows when uniqueness policy says the same source-target pair cannot repeat.

REQ-REL-012: Junction relationship shall support effective-from and effective-to fields where configured.

### 8.4 Polymorphic Rules

REQ-REL-013: Polymorphic relationship shall restrict target entities to an explicit allowlist.

REQ-REL-014: Polymorphic relationship shall store both targetEntityId or targetApiName and targetRecordId.

REQ-REL-015: Runtime security shall evaluate access against the actual target entity and target record.

REQ-REL-016: Polymorphic targets shall be validated at save time. Invalid target entity or record shall be blocked.

---

## 9. PostgreSQL Persistence Guidance

| Relationship Type | Recommended Storage |
|---|---|
| Lookup | `uuid` column on source table, optional FK if same physical database and target table is stable |
| Parent-child | `uuid` parent_id on child table, usually indexed and optionally FK-constrained |
| Junction | Explicit junction table/entity with source_id and target_id columns |
| Polymorphic | target_entity_api_name + target_record_id, with application-level referential validation |

Hard rules:
- Business relationship behavior must not rely only on database FK constraints.
- Application validation must enforce tenant, node, lifecycle, security, and active/inactive eligibility.
- PostgreSQL constraints are encouraged where safe, but cannot replace metadata-driven checks.

---

## 10. Relationship vs View Boundary

RelationshipDefinition defines that a relationship exists and how it behaves.

ViewDefinition or RelationViewDefinition defines how that relationship appears in a screen.

Examples:
- `Job Card → Parts Lines` is RelationshipDefinition.
- Showing Parts Lines as editable grid inside Job Card form is RelationViewDefinition.
- Allowing add/edit/delete from that grid must be resolved from RelationshipDefinition + ViewDefinition + SecurityDefinition + LifecycleModelDefinition.

---

## 11. Compile-Time Validations

System shall block activation when:

| Code | Scenario | Validation Message |
|---|---|---|
| REL-COMP-001 | Source entity missing | Source entity is required. |
| REL-COMP-002 | Target entity missing for non-polymorphic relationship | Target entity is required for this relationship type. |
| REL-COMP-003 | Polymorphic allowlist empty | At least one allowed target entity is required. |
| REL-COMP-004 | Source field missing | Source reference field is required. |
| REL-COMP-005 | Source field logical type mismatch | Source field must be entity_reference or polymorphic_reference. |
| REL-COMP-006 | Junction entity missing | Junction entity is required for many-to-many relationship. |
| REL-COMP-007 | Cascade delete on ledger-like entity | Cascade delete is not allowed for ledger-like entities. |
| REL-COMP-008 | Delete behavior conflicts with field nullability | Set-null behavior is not allowed when source reference field is non-nullable. |
| REL-COMP-009 | Circular parent-child ownership | Circular ownership relationship is not allowed. |
| REL-COMP-010 | Inactive lookup view | Lookup view must be active before relationship activation. |

---

## 12. API Requirements

### 12.1 Create RelationshipDefinition

`POST /admin/metadata/relationships`

Must validate source entity, target entity, source field, relationship type, cardinality, and ownership policy.

### 12.2 Update RelationshipDefinition

`PATCH /admin/metadata/relationships/{relationshipId}`

Allowed while draft. Active relationship changes that affect storage, target entity, cardinality, or delete behavior require migration workflow.

### 12.3 Activate RelationshipDefinition

`POST /admin/metadata/relationships/{relationshipId}/activate`

Runs compile checks and dependency checks.

### 12.4 Resolve Runtime Relationship

`GET /runtime/entities/{entityApiName}/relationships`

Returns only relationships available to the user, role, tenant, node, channel, and record state.

---

## 13. Acceptance Criteria

| ID | Acceptance Criteria |
|---|---|
| AC-REL-001 | Given a valid lookup relationship, when activated, then runtime metadata exposes the relationship with target entity, lookup view, and target filter policy. |
| AC-REL-002 | Given a parent-child relationship, when parent record is submitted and lifecycle locks child edits, then child add/edit/delete is blocked. |
| AC-REL-003 | Given a junction relationship, when duplicate source-target pair is configured as not allowed, then duplicate mapping is blocked. |
| AC-REL-004 | Given a polymorphic relationship, when target entity is not in allowlist, then save is blocked. |
| AC-REL-005 | Given a target record outside user's tenant scope, when selected through API, then backend blocks save even if UI was bypassed. |
| AC-REL-006 | Given delete behavior restrict, when target record is referenced by active source records, then target delete/archive is blocked with clear message. |
| AC-REL-007 | Given set_null delete behavior and nullable source field, when target is deleted, then system clears the source reference and audits the change. |
| AC-REL-008 | Given relationship is used by active view, rule, or API, when admin disables it, then dependency impact warning is shown and activation is blocked if breaking. |

---

## 14. Negative Scenarios

| Scenario | Expected Behavior | Message |
|---|---|---|
| Target entity does not exist | Block activation | Target entity does not exist. |
| Source field is text instead of entity_reference | Block activation | Source field type is not compatible with relationship type. |
| Polymorphic target not allowed | Block save | Selected target entity is not allowed for this relationship. |
| Cascade delete selected for posted voucher lines | Block configuration | Cascade delete is not allowed for ledger-like or posted financial records. |
| Junction entity lacks source/target reference fields | Block activation | Junction entity must contain both source and target references. |
| User lacks read access to target entity | Do not show lookup records and block backend save | You do not have access to the selected record. |
| Parent closed, child edit attempted | Block edit | Related records cannot be changed after parent is closed. |

---

## 15. Critical Review and Conflict Checks

1. **No conflict with FieldDefinition:** RelationshipDefinition references the source reference field but does not redefine field storage type.
2. **No conflict with ViewDefinition:** RelationshipDefinition does not own child grid rendering. Relation views must remain view metadata.
3. **No conflict with SecurityDefinition:** Relationship eligibility is structural; record access must still be enforced by security.
4. **No conflict with ValidationRuleDefinition:** Relationship requiredness may define broad mandatory timing, but complex business checks belong to validation rules.
5. **No conflict with RuntimeContractDefinition:** Runtime contract consumes active, compiled relationships only.
6. **No conflict with Package model:** Relationship metadata must carry package ownership and version for deployment safety.
7. **Risk identified:** Polymorphic relationships are powerful but dangerous. MVP must enforce allowlists and backend target validation.
8. **Risk identified:** Cascade behavior must be extremely restricted for financial, ledger-like, and posted records.

---

## 16. Next Implementation Tasks

1. Create RelationshipDefinition metadata schema.
2. Add relationship type enum and cardinality enum.
3. Add compile checks for relationship activation.
4. Link entity_reference FieldDefinition to RelationshipDefinition.
5. Add target filter policy support.
6. Add runtime relationship resolver.
7. Add dependency tracking for views, validations, APIs, reports, and packages.
8. Add migration guard for active relationship changes.


## Reference Inputs Used
- Current iDMS Entity Designer implementation extract: entity creation, field management, views, actions, compile readiness, diff, governance, layer system, dependencies, and planned package pattern.
- Salesforce Metadata API principle: Salesforce metadata describes schema, process, presentation, authorization, and general configuration.
- Salesforce CustomObject and CustomField docs: object and field metadata are distinct metadata types.
- Salesforce ValidationRule docs: validation rules are separate metadata used to verify that record data is valid and can be saved.
- Salesforce UI API principle: runtime UI consumers should receive data plus metadata resolved against layouts, picklists, field-level security, and sharing.
- Salesforce FieldPermissions, ObjectPermissions, and PermissionSet docs: access control is represented as explicit permission metadata, not just UI visibility.
- Salesforce MetadataComponentDependency and packaging/source tracking docs: enterprise metadata platforms need dependency visibility, packageability, source tracking, and deployment safety.

Official reference URLs:
- https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_intro.htm
- https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/customobject.htm
- https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/customfield.htm
- https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_validationformulas.htm
- https://developer.salesforce.com/docs/atlas.en-us.uiapi.meta/uiapi/ui_api_get_started.htm
- https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_fieldpermissions.htm
- https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_objectpermissions.htm
- https://developer.salesforce.com/docs/atlas.en-us.api_tooling.meta/api_tooling/tooling_api_objects_metadatacomponentdependency.htm
- https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_unlocked_pkg_intro.htm
- https://developer.salesforce.com/docs/metadata-coverage
