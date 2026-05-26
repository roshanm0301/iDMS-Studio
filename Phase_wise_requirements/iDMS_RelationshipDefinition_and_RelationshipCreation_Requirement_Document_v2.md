# iDMS Admin Studio — RelationshipDefinition and Relationship Creation Requirement Document v2
## Supersedes the earlier RelationshipDefinition requirement document
### Audience: Product, Architecture, Engineering, QA, AI Coding Agents
### Status: Revised Target Requirements
### Purpose: Define a complete enterprise-grade relationship model for iDMS Admin Studio across native, virtual, external, materialized, owned-child, junction, self, and polymorphic entity patterns.

---

## 0. Supersession Note

This document **supersedes the earlier `RelationshipDefinition` requirement document**.

The earlier version correctly identified the need for lookup, parent-child, junction, and polymorphic relationships, but it was incomplete after the revised `EntityDefinition v2` and `FieldDefinition v2` architecture. It did not sufficiently model:

- Self-referencing and hierarchical relationships
- External lookup and indirect external lookup relationships
- Synthetic relationships involving virtual or external entities
- Projection relationships on virtual/materialized entities
- Relationship roles when the same two entities are linked in different business meanings
- Referenced-key strategy beyond primary keys
- Database versus application versus provider enforcement
- Scope compatibility across tenant/company/node/global/external entities
- Relationship query/navigation capabilities such as expand, filter-across, sort-across, and aggregate-across
- Relationship lifecycle policy beyond a single delete behavior
- Distinction between live relations and legal snapshot fields
- Distinction between formal relationships and informal/ad hoc business connections
- Junction representation as either system-managed or business-visible association entities
- Entity-archetype compatibility rules for native, virtual, external, projection, append-only, and owned-child entities

The revised model below must be treated as the target truth for future relationship implementation.

---

## 1. Design Objective

`RelationshipDefinition` shall define the **formal, governed, runtime-resolvable association** between entity records.

It must support the full enterprise relationship spectrum needed by iDMS, including:

1. Native references between canonical entities
2. Strong ownership/composition such as document header → document lines
3. Many-to-many associations with or without business attributes
4. Self-relations and hierarchical structures
5. Polymorphic references such as attachments and activities
6. Relationships between native and external/federated entities
7. Indirect relationships from external entities to native entities through alternate/external keys
8. Synthetic relationships involving virtual entities or provider-backed entities
9. Read-only projection relationships exposed by virtual/materialized read models
10. Application-level relationship behavior that is richer than physical database foreign keys

The relationship model must support both:

- **Business semantics**: What does this relationship mean?
- **Runtime semantics**: How is it joined, enforced, navigated, secured, and governed?

---

## 2. Non-Negotiable Architecture Principles

| Principle | Requirement |
|---|---|
| A relationship is not merely a database foreign key | `RelationshipDefinition` is an application-level metadata object. PostgreSQL constraints may support it, but do not define the full business relationship. |
| Structural meaning, cardinality, and role are distinct | The system must model relationship archetype, cardinality, optionality, and end-role names independently. |
| Same entities may have multiple different relationships | `Sales Invoice → Customer` may mean `bill_to_customer`, `ship_to_customer`, or `sold_to_customer`; entity pair alone is not identity. |
| Live relation and historical snapshot are different | A transaction may have a live `customer_id` relationship and separate snapshot fields such as `customer_name_snapshot` and `gstin_snapshot`. Snapshot fields must not be treated as relationships. |
| Formal relationships and informal connections are different | Ad hoc social/business links should not be forced into `RelationshipDefinition`; they require a separate future `ConnectionDefinition` pattern if needed. |
| Relationship type is not the same as UI presentation | `RelationshipDefinition` states that records are related; `RelationViewDefinition` decides whether they appear as grids, cards, layouts, timelines, or not at all. |
| Relationship requiredness must not be duplicated blindly | Lookup field nullability belongs to `FieldDefinition`; conditional business requiredness belongs to `ValidationRuleDefinition`; relationship metadata owns structural semantics and compiled consistency. |
| External and virtual relationships are first-class | Relationships involving external, provider-backed, virtual, or projection entities must be represented explicitly rather than squeezed into native lookup assumptions. |
| Integrity mode must be explicit | Every active formal relationship must declare whether integrity is database-enforced, application-enforced, provider-enforced, or derived by query/projection. |
| Scope compatibility must be explicit | Tenant/company/node/global/external scope combinations must be declared and validated. Cross-scope references are forbidden by default unless explicitly allowed. |
| Cascade behavior is not one boolean | Physical delete, soft delete, archive, deactivate, close, reparent, transfer, and lifecycle-state changes may require different policies. |
| Runtime must consume compiled metadata only | Draft relationships must never be interpreted directly by runtime consumers. |

---

## 3. Why the Earlier Version Was Insufficient

The earlier relationship model was directionally correct but too narrow.

### 3.1 It modeled only four relationship types

It covered:

- Lookup
- Parent-child
- Junction
- Polymorphic

That is not enough for the corrected entity architecture because iDMS now supports `external_federated`, `virtual_computed`, `materialized_projection`, `owned_child`, `junction_association`, and `append_only_record` entities.

### 3.2 It did not model role semantics

A relationship between the same two entities can have different business meanings:

- `sales_invoice.bill_to_customer → customer`
- `sales_invoice.ship_to_customer → customer`
- `vehicle.owner_customer → customer`
- `vehicle.financier_customer → customer`

Without relationship roles, the model becomes ambiguous and downstream APIs, views, rules, and reports become hard to reason about.

### 3.3 It assumed relationships are usually ID-to-ID

Enterprise relationships may use:

- target primary key,
- target alternate key,
- target external ID,
- provider key,
- or composite key mappings.

This is essential for external/indirect lookups and for integrations where external systems do not expose iDMS UUIDs.

### 3.4 It treated delete behavior too simplistically

A single `deleteBehavior` cannot model the difference between:

- hard delete,
- soft delete/archive,
- master deactivation,
- parent closure/posting,
- reparenting,
- ownership transfer,
- or provider-driven deletion.

### 3.5 It did not model virtual/external relationship capability limits

A relation across virtual or provider-backed entities may support:

- lookup only,
- filtering but not ordering,
- expansion but not mutation,
- or no provider-side referential enforcement.

These differences must be represented in metadata because runtime, UI, API, and analytics cannot assume native-table behavior.

### 3.6 It did not clearly separate optionality ownership

A lookup relationship may be structurally optional because its `FieldDefinition` is nullable, while a business rule may still require it before submit. These are not the same thing and must not be duplicated with conflicting metadata.

---

## 4. Boundary with Other Metadata Objects

| Concern | Metadata Owner |
|---|---|
| Field storing a reference value | `FieldDefinition` |
| Formal business relationship, roles, keys, integrity, lifecycle coupling | `RelationshipDefinition` |
| Lookup data source, display members, fetch columns, UI query filters | `FieldValueSourceDefinition` / `LookupDefinition` |
| Display of related records inside a parent experience | `RelationViewDefinition` |
| View-specific lookup rendering | `ViewDefinition` / `ViewFieldDefinition` |
| Conditional requirement such as “Customer required before submit” | `ValidationRuleDefinition` |
| Security access to source, target, child, relation actions | `SecurityDefinition` |
| Historical copied values from a related record | `FieldDerivationDefinition` / `snapshot_copy` field archetype |
| Related record impact and reverse usage | `DependencyDefinition` |
| Ad hoc informal links not part of formal business structure | Future `ConnectionDefinition`, not `RelationshipDefinition` |

### 4.1 Hard Boundary Rules

1. `RelationshipDefinition` shall **not** define grid columns, card layouts, or embedded child workspaces.
2. `RelationshipDefinition` shall **not** contain raw SQL. Query-backed relations shall reference governed `QueryBindingDefinition` or provider binding metadata.
3. `RelationshipDefinition` shall **not** replace field-level storage metadata.
4. `RelationshipDefinition` shall **not** replace validation rules.
5. `RelationshipDefinition` shall **not** silently imply security visibility.
6. A snapshot field shall **not** be used in place of a live relationship where lineage is required.
7. A formal `entity_reference` field must reference an active or draft `RelationshipDefinition`; “loose entity lookup without relationship” is not allowed for production metadata.

---

## 5. Relationship Classification Model

Every `RelationshipDefinition` must be classified across **ten independent dimensions**.

### 5.1 Dimension 1 — Semantic Intent

| Semantic Intent | Meaning | Examples |
|---|---|---|
| `reference` | One record points to another independent record | Job Card → Customer |
| `composition` | Child record is owned by and structurally part of parent | Invoice Header → Invoice Lines |
| `association` | Peer records are linked through an association | Campaign ↔ Vehicle Model |
| `hierarchy` | Same-entity or hierarchical parent/child structure | Dealer → Parent Dealer |
| `contextual_attachment` | Generic related item attached to one of several business records | Attachment → Invoice / Claim / Job Card |
| `external_reference` | Link crosses source-of-truth boundary | Local Job Card → OEM Allocation |
| `derived_navigation` | Relation is exposed by a projection/read model | Customer 360 → Open Documents |

### 5.2 Dimension 2 — Relationship Archetype

| Archetype | Meaning | Typical Use |
|---|---|---|
| `lookup_reference` | Native or application lookup to a single target entity | Job Card → Customer |
| `composition_owned_child` | Parent owns child lifecycle | Invoice Header → Invoice Lines |
| `junction_association` | Many-to-many relationship through a junction representation | Scheme ↔ Dealer |
| `self_reference` | Entity references itself | Part → Superseded Part |
| `self_hierarchy` | Self-reference with hierarchy semantics | Dealer → Parent Dealer |
| `polymorphic_reference` | Source can point to one target from a controlled allowlist | Attachment → Supported Documents |
| `external_lookup` | Local/native child references an external target | Service Order → OEM Campaign |
| `indirect_external_lookup` | External child references a native target through alternate/external key | External Order → Local Customer by external customer ID |
| `synthetic_virtual_relation` | Relationship involving virtual/external entities resolved by provider or key matching | Native Customer ↔ Virtual Service History |
| `projection_relation` | Read-only relation emitted by virtual/materialized projection logic | Customer 360 → Open Orders |

### 5.3 Dimension 3 — Cardinality

| Cardinality | Meaning |
|---|---|
| `one_to_one` | At most one record on each side |
| `one_to_many` | One source/parent to many target/children |
| `many_to_one` | Many source/children to one target/parent |
| `many_to_many` | Many records on both sides; requires junction representation |

**Rule:** Cardinality must be modeled independently from archetype. A lookup may be `many_to_one` or `one_to_one`; a self-reference may be `one_to_many`; a junction is normally `many_to_many`.

### 5.4 Dimension 4 — Endpoint Topology

| Topology | Meaning |
|---|---|
| `two_entity` | Source and target are different entities |
| `self_entity` | Source and target are the same entity |
| `multi_target` | One source can reference one of several allowed target entities |
| `native_to_external` | Native source references external target |
| `external_to_native` | External source references native target |
| `native_to_virtual` | Native source relates to virtual target |
| `virtual_to_native` | Virtual source relates to native target |
| `virtual_to_virtual` | Both endpoints are virtual/provider-backed |
| `projection_to_source` | Projection entity exposes navigation back to source entity/entities |

### 5.5 Dimension 5 — Key Binding Strategy

| Key Binding Strategy | Meaning | Typical Use |
|---|---|---|
| `target_primary_key` | Source stores target primary key | Native lookup by UUID |
| `target_alternate_key` | Source matches a unique alternate key | Relationship by VIN / GSTIN / business code |
| `target_external_id` | Source stores/matches target external ID | External lookup |
| `composite_key` | Relationship resolves through multiple fields | Tenant ID + external code |
| `provider_key` | Provider owns key semantics | Provider-backed external entity |
| `derived_query_key` | Query/projection resolver defines relation | Projection relation |

### 5.6 Dimension 6 — Integrity / Enforcement Mode

| Integrity Mode | Meaning |
|---|---|
| `database_enforced` | PostgreSQL FK/unique constraints enforce physical integrity |
| `application_enforced` | iDMS services enforce existence, scope, lifecycle, and referential rules |
| `provider_enforced` | External provider guarantees relation validity |
| `provider_plus_application` | Provider validates identity; iDMS additionally validates scope/permissions/runtime eligibility |
| `derived_projection` | Relation is computed from source query/projection and not independently persisted |
| `synthetic_key_match` | Relation resolves by configured key matching where a physical FK is not possible |

**Hard rule:** `none` is not a valid integrity mode for an active formal `RelationshipDefinition`.

### 5.7 Dimension 7 — Ownership / Lifecycle Coupling

| Coupling Mode | Meaning |
|---|---|
| `none` | Records are independent; relationship is only a reference |
| `parent_owns_child` | Child lifecycle is owned by parent |
| `shared_peer` | Association links independent peers |
| `target_controls_visibility` | Child visibility/security derives from referenced parent/target |
| `provider_controls_lifecycle` | External provider controls lifecycle |
| `derived_read_only` | Lifecycle is inherited from source query/projection; no direct mutation |

### 5.8 Dimension 8 — Scope Compatibility

| Scope Policy | Meaning |
|---|---|
| `same_tenant_required` | Source and target must belong to same tenant |
| `same_company_required` | Source and target must belong to same company/legal entity |
| `same_node_required` | Source and target must belong to same node/branch |
| `hierarchy_allowed` | Parent/ancestor scope may be used where configured |
| `global_target_allowed` | Tenant-scoped source may reference global/reference target |
| `external_scope_mapped` | External scope is mapped through provider metadata |
| `cross_scope_explicit_only` | Cross-scope relationship requires explicit allowance and compiler approval |

### 5.9 Dimension 9 — Link Mutability / Operation Mode

| Link Mutability Mode | Meaning |
|---|---|
| `link_writable` | Relationship link can be created, changed, and removed subject to lifecycle/security |
| `link_create_only` | Link is set once and cannot be changed after creation |
| `link_append_only` | New association rows may be added, but existing links are not edited/deleted |
| `link_read_only` | Relationship can be navigated but not mutated by users |
| `provider_capability_driven` | Link mutation depends on external provider capability |
| `derived_read_only` | Link is emitted by projection/query logic and cannot be directly mutated |

### 5.10 Dimension 10 — Temporal / Historical Semantics

| Temporal Semantics | Meaning | Typical Use |
|---|---|---|
| `current_only` | Relationship stores only current state | Current owner, current supplier |
| `effective_dated` | Relationship validity is bounded by effective-from/effective-to dates | Scheme applicability, dealer-territory mapping |
| `history_tracked` | Relationship changes must preserve historical versions | Vehicle ownership history, customer-account relationship history |
| `bitemporal_reserved` | Valid-time and system-time history required; architecture reserved for future | Regulatory history-heavy domains |

**Rule:** When relationship history or effective dating matters, use a business junction/history entity. Do not overwrite a simple lookup and lose historical facts.

---

## 6. Required Relationship Archetypes

### 6.1 Lookup Reference

| Area | Requirement |
|---|---|
| Semantic intent | Reference |
| Typical source field | `entity_reference` |
| Typical cardinality | `many_to_one` or `one_to_one` |
| Ownership | None |
| Examples | Job Card → Customer, Receipt → Customer, Vehicle → Owner Customer |
| Notes | Same source and target pair may have multiple roles such as bill-to and ship-to. |

### 6.2 Composition / Owned Child

| Area | Requirement |
|---|---|
| Semantic intent | Composition |
| Typical cardinality | `one_to_many` or `one_to_one` |
| Ownership | `parent_owns_child` |
| Examples | Invoice Header → Invoice Lines, Job Card → Parts Lines |
| Notes | Child normally cannot exist independently; security, lifecycle, and orphan rules must be explicit. |

### 6.3 Junction Association

| Area | Requirement |
|---|---|
| Semantic intent | Association |
| Typical cardinality | `many_to_many` |
| Representation | System-managed junction or business-visible junction entity |
| Examples | Campaign ↔ Vehicle Model, Scheme ↔ Dealer |
| Notes | If the association carries business attributes such as validity dates, priority, status, remarks, or approvals, it must be a business-visible junction entity. |

### 6.4 Self Reference

| Area | Requirement |
|---|---|
| Semantic intent | Reference or hierarchy |
| Typical cardinality | `many_to_one`, `one_to_many`, or `one_to_one` |
| Examples | Part → Superseded Part, Customer → Parent Customer |
| Notes | Self-reference is not automatically a hierarchy. Hierarchy semantics require additional constraints and traversal rules. |

### 6.5 Self Hierarchy

| Area | Requirement |
|---|---|
| Semantic intent | Hierarchy |
| Typical cardinality | `one_to_many` parent-child |
| Examples | Dealer hierarchy, organizational unit hierarchy, product category hierarchy |
| Notes | Must support cycle prevention. Future deep hierarchy acceleration may use closure table or materialized path, but semantic relationship remains self-hierarchy. |

### 6.6 Polymorphic Reference

| Area | Requirement |
|---|---|
| Semantic intent | Contextual attachment |
| Topology | Multi-target |
| Examples | Attachment → Invoice/Claim/Job Card, Activity → Customer/Vehicle/Dealer |
| Notes | Allowed target entities must be explicitly whitelisted. Security resolves against actual target entity and record. |

### 6.7 External Lookup

| Area | Requirement |
|---|---|
| Semantic intent | External reference |
| Direction | Native/local child → external parent/target |
| Examples | Local Service Order → OEM Campaign, Local Warranty Claim → OEM Claim Reference |
| Notes | Relationship usually resolves through target external ID or provider key. Provider capability and cache strategy must be explicit. |

### 6.8 Indirect External Lookup

| Area | Requirement |
|---|---|
| Semantic intent | External reference |
| Direction | External child → native parent/target |
| Examples | External Order → local Customer by `customer_external_id` |
| Notes | Target key is typically a unique external ID or alternate key on the native entity. |

### 6.9 Synthetic Virtual Relationship

| Area | Requirement |
|---|---|
| Semantic intent | External or derived reference |
| Direction | Native ↔ virtual, virtual ↔ native, or virtual ↔ virtual |
| Examples | Customer → Virtual Service History, Native Account → Virtual Order History |
| Notes | Physical FK is not available. Supported operations depend on provider/query capability. |

### 6.10 Projection Relation

| Area | Requirement |
|---|---|
| Semantic intent | Derived navigation |
| Direction | Projection entity → source entity, or source entity → projection child set |
| Examples | Customer 360 → Open Documents, Vehicle Health Summary → Latest Service Event |
| Notes | Relation is read-only and resolved from query/projection metadata. |

---

## 7. Formal Relationship vs Adjacent Concepts

### 7.1 Relationship vs Snapshot

| Use Case | Correct Model |
|---|---|
| Keep link to current customer record | `RelationshipDefinition` + `customer_id` reference field |
| Preserve customer name/GSTIN on posted invoice | `snapshot_copy` fields linked to the customer relation |
| Need both lineage and legal history | Use both live relationship and snapshot fields |

**Rule:** Historical snapshot fields must not replace live relationship metadata where lineage, drilldown, or referential impact is required.

### 7.2 Relationship vs Value Source

| Use Case | Correct Model |
|---|---|
| Customer field stores a record reference | `RelationshipDefinition` |
| Customer lookup dialog fetches active customers and shows code/name/mobile columns | `FieldValueSourceDefinition` + `Lookup ViewDefinition` |
| Customer lookup must only show same-tenant customers | Structural scope in `RelationshipDefinition`; display/query filters in value source/view |

### 7.3 Relationship vs Relation View

| Use Case | Correct Model |
|---|---|
| Job Card owns Parts Lines | `RelationshipDefinition` |
| Parts Lines appear as editable grid in Job Card form | `RelationViewDefinition` |
| Customer 360 shows Open Documents cards | `RelationViewDefinition` over an appropriate relationship/projection relation |

### 7.4 Relationship vs Informal Connection

A formal relationship should exist when:

- data integrity matters,
- it drives lifecycle behavior,
- it is used in queries/reports/rules,
- or most records of that entity reasonably use it.

Informal/ad hoc associations such as “person A knows person B” or “record is casually related to another record for reference only” should not be forced into `RelationshipDefinition`. If required, iDMS should later introduce a separate `ConnectionDefinition` model.

---

## 8. RelationshipDefinition Metadata Model

```json
{
  "relationshipId": "rel_sales_invoice_bill_to_customer",
  "apiName": "sales_invoice_bill_to_customer",
  "label": "Bill To Customer",
  "description": "Identifies the customer legally billed on the sales invoice.",

  "semanticIntent": "reference",
  "relationshipArchetype": "lookup_reference",
  "cardinality": "many_to_one",
  "endpointTopology": "two_entity",

  "source": {
    "entityId": "ent_sales_invoice",
    "roleCode": "bill_to",
    "roleLabel": "is billed to",
    "fieldIds": ["fld_sales_invoice_bill_to_customer_id"]
  },
  "target": {
    "entityId": "ent_customer",
    "roleCode": "billed_customer",
    "roleLabel": "receives invoice",
    "allowedEntityIds": null
  },

  "keyBinding": {
    "strategy": "target_primary_key",
    "sourceFieldIds": ["fld_sales_invoice_bill_to_customer_id"],
    "targetKeyFieldIds": ["fld_customer_id"],
    "compositeMatchMode": null,
    "externalProviderKey": null
  },

  "integrity": {
    "mode": "database_enforced",
    "physicalConstraintName": "fk_sales_invoice_bill_to_customer",
    "providerBindingId": null,
    "queryBindingId": null
  },

  "ownership": {
    "couplingMode": "none",
    "orphanPolicy": "not_applicable",
    "securityInheritance": "evaluate_each"
  },

  "scope": {
    "policy": "same_tenant_required",
    "crossScopeAllowed": false,
    "externalScopeMappingId": null
  },

  "lifecyclePolicies": {
    "onTargetHardDelete": "restrict",
    "onTargetSoftDelete": "restrict_if_referenced",
    "onTargetDeactivate": "allow_existing_references_block_new_selection",
    "onParentStateChange": "none",
    "onReparent": "not_applicable",
    "onScopeTransfer": "require_revalidation"
  },

  "navigationCapabilities": {
    "forwardNavigation": true,
    "reverseNavigation": true,
    "expandAllowed": true,
    "filterAcrossAllowed": true,
    "sortAcrossAllowed": true,
    "aggregateAcrossAllowed": false,
    "capabilitySource": "native"
  },

  "linkMutationCapabilities": {
    "mode": "link_writable",
    "createLinkAllowed": true,
    "changeLinkAllowed": true,
    "removeLinkAllowed": true,
    "capabilitySource": "native"
  },

  "temporalSemantics": {
    "mode": "current_only",
    "effectiveFromFieldId": null,
    "effectiveToFieldId": null,
    "historyEntityId": null
  },

  "bindings": {
    "targetEligibilityPolicyId": "policy_same_tenant_active_customer",
    "lookupDefinitionId": "lookup_customer_default",
    "relationViewIds": [],
    "snapshotDerivationIds": ["deriv_invoice_customer_snapshot"],
    "validationRuleIds": ["val_bill_to_required_before_submit"]
  },

  "governance": {
    "owningLayer": "Vertical",
    "owningPackageId": "pkg_sales_core",
    "protected": true,
    "canDownstreamDecorate": true,
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

## 9. Metadata Field Specification

### 9.1 Identity and Semantics

| Field | Type | Mandatory | Rules |
|---|---:|---:|---|
| `relationshipId` | string | Yes | Immutable internal ID generated by system. |
| `apiName` | string | Yes | Unique within metadata namespace. Snake case. Locked after activation unless migration workflow exists. |
| `label` | string | Yes | Business-readable name. Must distinguish role where same entity pair appears multiple times. |
| `description` | string | Recommended | Must explain business meaning, not only entity names. |
| `semanticIntent` | enum | Yes | `reference`, `composition`, `association`, `hierarchy`, `contextual_attachment`, `external_reference`, `derived_navigation`. |
| `relationshipArchetype` | enum | Yes | As defined in Section 5.2. |
| `cardinality` | enum | Yes | `one_to_one`, `one_to_many`, `many_to_one`, `many_to_many`. |
| `endpointTopology` | enum | Yes | `two_entity`, `self_entity`, `multi_target`, `native_to_external`, `external_to_native`, `native_to_virtual`, `virtual_to_native`, `virtual_to_virtual`, `projection_to_source`. |

### 9.2 Endpoint Roles

| Field | Type | Mandatory | Rules |
|---|---:|---:|---|
| `source.entityId` | entity ref | Yes | Must reference valid entity definition. |
| `source.roleCode` | string | Yes | Distinguishes business role such as `bill_to`, `ship_to`, `owner`, `parent`. |
| `source.roleLabel` | string | Recommended | Sentence-readable role phrase. |
| `source.fieldIds` | field ref[] | Conditional | Required for stored or key-bound source relationships. |
| `target.entityId` | entity ref | Conditional | Required except polymorphic multi-target relationship. |
| `target.allowedEntityIds` | entity ref[] | Conditional | Mandatory for polymorphic relationship. |
| `target.roleCode` | string | Recommended | Reverse business role such as `receives_invoice`, `owns_child`. |
| `target.roleLabel` | string | Recommended | Sentence-readable inverse phrase. |

### 9.3 Key Binding

| Field | Type | Mandatory | Rules |
|---|---:|---:|---|
| `keyBinding.strategy` | enum | Yes | `target_primary_key`, `target_alternate_key`, `target_external_id`, `composite_key`, `provider_key`, `derived_query_key`. |
| `keyBinding.sourceFieldIds` | field ref[] | Conditional | Required where persisted or matched source fields exist. |
| `keyBinding.targetKeyFieldIds` | field ref[] | Conditional | Required for native target key strategies. |
| `keyBinding.compositeMatchMode` | enum | Conditional | Required for composite keys: `all_fields_required`, `match_full`, etc. |
| `keyBinding.externalProviderKey` | string | Conditional | Required for provider-key/external lookups where configured. |

### 9.4 Integrity and Execution

| Field | Type | Mandatory | Rules |
|---|---:|---:|---|
| `integrity.mode` | enum | Yes | One of the allowed integrity modes; `none` prohibited for active formal relations. |
| `integrity.physicalConstraintName` | string | Conditional | Required if database-enforced. |
| `integrity.providerBindingId` | ref | Conditional | Required for provider-enforced external relations. |
| `integrity.queryBindingId` | ref | Conditional | Required for projection/query-derived relations. |

### 9.5 Ownership, Security, and Scope

| Field | Type | Mandatory | Rules |
|---|---:|---:|---|
| `ownership.couplingMode` | enum | Yes | `none`, `parent_owns_child`, `shared_peer`, `target_controls_visibility`, `provider_controls_lifecycle`, `derived_read_only`. |
| `ownership.orphanPolicy` | enum | Conditional | Required for composition relationships. |
| `ownership.securityInheritance` | enum | Yes | `none`, `inherit_from_parent`, `evaluate_each`, `evaluate_both`, `provider_mapped`. |
| `scope.policy` | enum | Yes | Scope compatibility policy. |
| `scope.crossScopeAllowed` | boolean | Yes | Default false. |
| `scope.externalScopeMappingId` | ref | Conditional | Required for external scope mapping. |

### 9.6 Lifecycle Policies

| Field | Type | Mandatory | Rules |
|---|---:|---:|---|
| `lifecyclePolicies.onTargetHardDelete` | enum | Yes | Must align with entity archetype and PostgreSQL capability. |
| `lifecyclePolicies.onTargetSoftDelete` | enum | Yes | Required because many business entities use soft delete/archive instead of hard delete. |
| `lifecyclePolicies.onTargetDeactivate` | enum | Yes | Required for master/configuration targets. |
| `lifecyclePolicies.onParentStateChange` | enum/policy ref | Conditional | Required when parent lifecycle affects child mutability. |
| `lifecyclePolicies.onReparent` | enum | Conditional | Required for hierarchy/composition where reparenting is permitted. |
| `lifecyclePolicies.onScopeTransfer` | enum | Conditional | Required where entity ownership can move between companies/nodes/dealers. |

### 9.7 Navigation Capabilities

| Field | Type | Mandatory | Rules |
|---|---:|---:|---|
| `navigationCapabilities.forwardNavigation` | boolean | Yes | Source → target navigation. |
| `navigationCapabilities.reverseNavigation` | boolean | Yes | Target → source related-list/navigation. |
| `navigationCapabilities.expandAllowed` | boolean | Yes | Whether runtime/API may expand relation inline. |
| `navigationCapabilities.filterAcrossAllowed` | boolean | Yes | Whether queries may filter using related fields. |
| `navigationCapabilities.sortAcrossAllowed` | boolean | Yes | Whether queries may order by related fields. |
| `navigationCapabilities.aggregateAcrossAllowed` | boolean | Yes | Whether aggregates may traverse relation. |
| `navigationCapabilities.capabilitySource` | enum | Yes | `native`, `provider`, `projection`, `compiler_derived`. |

### 9.8 Link Mutation Capabilities

| Field | Type | Mandatory | Rules |
|---|---:|---:|---|
| `linkMutationCapabilities.mode` | enum | Yes | `link_writable`, `link_create_only`, `link_append_only`, `link_read_only`, `provider_capability_driven`, `derived_read_only`. |
| `linkMutationCapabilities.createLinkAllowed` | boolean | Yes | Effective create-link capability. |
| `linkMutationCapabilities.changeLinkAllowed` | boolean | Yes | Effective change/reparent capability. |
| `linkMutationCapabilities.removeLinkAllowed` | boolean | Yes | Effective detach/delete-link capability. |
| `linkMutationCapabilities.capabilitySource` | enum | Yes | `native`, `provider`, `projection`, `compiler_derived`. |

### 9.9 Temporal Semantics

| Field | Type | Mandatory | Rules |
|---|---:|---:|---|
| `temporalSemantics.mode` | enum | Yes | `current_only`, `effective_dated`, `history_tracked`, `bitemporal_reserved`. |
| `temporalSemantics.effectiveFromFieldId` | field ref | Conditional | Required for effective-dated relationships. |
| `temporalSemantics.effectiveToFieldId` | field ref | Conditional | Required where interval closure is configured. |
| `temporalSemantics.historyEntityId` | entity ref | Conditional | Required when relationship history is stored separately. |

---

## 10. Relationship Creation Decision Flow

When an admin/architect creates a relationship, the system shall guide them through this order:

1. **What business meaning does this relationship represent?**
   - reference,
   - owned child,
   - association,
   - hierarchy,
   - contextual attachment,
   - external reference,
   - derived navigation.

2. **Which entity/entities participate and what roles do they play?**
   - source entity,
   - target entity or allowed target set,
   - source role,
   - target role.

3. **What is the cardinality?**
   - 1:1,
   - 1:N,
   - N:1,
   - N:N.

4. **How is the relationship resolved?**
   - target primary key,
   - alternate key,
   - external ID,
   - composite key,
   - provider key,
   - query-derived key.

5. **How is integrity enforced?**
   - database,
   - application,
   - provider,
   - provider + application,
   - query/projection,
   - synthetic key match.

6. **What lifecycle coupling applies?**
   - no ownership,
   - parent owns child,
   - peer association,
   - provider controls lifecycle,
   - derived read-only.

7. **What scope rules apply?**
   - same tenant,
   - same company,
   - same node,
   - global target allowed,
   - external scope mapping,
   - explicit cross-scope allowance.

8. **What operations and navigation capabilities are truly supported?**
   - forward/reverse navigation,
   - expand,
   - filter-across,
   - sort-across,
   - aggregate-across,
   - create/change/remove link.

9. **Does the relationship need temporal or historical semantics?**
   - current-only,
   - effective-dated,
   - history-tracked,
   - future bitemporal reservation.

10. **What downstream metadata depends on this relation?**
   - lookup definition,
   - validation rules,
   - relation views,
   - snapshot derivations,
   - rollups,
   - security inheritance,
   - API exposure.

---

## 11. Required Behavior by Archetype

### 11.1 Lookup Reference Behavior

REQ-REL2-001: A lookup reference shall have a valid source entity, target entity, source reference field, key binding strategy, integrity mode, and scope policy.

REQ-REL2-002: A lookup relationship between the same two entities shall be allowed multiple times only when each relationship has a unique `apiName` and distinct role semantics.

REQ-REL2-003: Source field nullability shall be derived from `FieldDefinition`; conditional mandatory behavior shall be enforced through `ValidationRuleDefinition`, not duplicated inside `RelationshipDefinition`.

REQ-REL2-004: Runtime shall reject any target record that violates scope policy, target eligibility policy, lifecycle eligibility, or actual security access, even if UI filtering was bypassed.

### 11.2 Composition / Owned Child Behavior

REQ-REL2-005: A composition relationship shall define `parent_owns_child` coupling, orphan policy, and parent lifecycle impact policy.

REQ-REL2-006: Child rows shall not exist independently when orphan policy is `forbid_orphan`.

REQ-REL2-007: Child mutability shall be resolvable from parent lifecycle state, child lifecycle state, security, and relation view requests.

REQ-REL2-008: Composition shall not automatically imply physical hard-delete cascade; soft-delete/archive/posting semantics must be explicit.

### 11.3 Junction Association Behavior

REQ-REL2-009: Every many-to-many relationship shall have a junction representation.

REQ-REL2-010: Junction representation shall be either:

- `system_managed_junction` for a pure link with no business attributes; or
- `business_junction_entity` when the association requires business fields, lifecycle, permissions, effective dating, status, or audit visibility.

REQ-REL2-011: If duplicate association pairs are prohibited, compiler shall require a uniqueness policy across the junction keys and any scoping fields.

REQ-REL2-012: A business-visible junction entity shall be allowed to have its own fields, validation rules, security, lifecycle, and views.

REQ-REL2-012A: An association requiring effective dates, priority, approval status, audit visibility, or historical preservation shall use a business-visible junction/history entity, not a system-managed pure junction.

REQ-REL2-012B: When relationship history matters, the model shall preserve prior links rather than overwriting the only stored relationship value.

### 11.4 Self Reference and Hierarchy Behavior

REQ-REL2-013: A self-reference shall explicitly identify whether it is a simple self-reference or a hierarchy.

REQ-REL2-014: A self-hierarchy shall prevent cycles at save time and compile time where metadata can detect invalid static design.

REQ-REL2-015: Self-hierarchy shall define allowed reparenting behavior and whether descendants inherit scope/security/lifecycle changes.

REQ-REL2-016: Future hierarchy acceleration structures may be added without changing the semantic relationship contract.

### 11.5 Polymorphic Behavior

REQ-REL2-017: A polymorphic relationship shall declare an explicit allowlist of target entities.

REQ-REL2-018: Runtime shall store and validate both target entity identifier and target record identifier.

REQ-REL2-019: Security shall be evaluated against the actual target entity and target record at runtime.

REQ-REL2-020: Compiler shall reject polymorphic relationships whose target set includes incompatible entity archetypes or entities forbidden by package/governance policy.

### 11.6 External and Indirect External Lookup Behavior

REQ-REL2-021: An external lookup shall declare provider binding, target key strategy, capability source, and provider-backed integrity mode.

REQ-REL2-022: An indirect external lookup shall point to a unique alternate/external key on the native parent entity; compiler shall reject non-unique target keys.

REQ-REL2-023: Runtime shall not assume external relations support native-table capabilities such as filter-across, sort-across, expand, update, or delete unless provider capability says so.

REQ-REL2-024: If provider availability is required for save or lookup validation, failure mode must be explicit: block, queue, cache-validate, or best-effort with warning.

### 11.7 Synthetic Virtual and Projection Behavior

REQ-REL2-025: Synthetic virtual relationships shall declare query/provider resolver, key mapping, and available query capabilities.

REQ-REL2-026: Projection relationships shall be read-only and shall not permit direct link mutation.

REQ-REL2-027: Runtime contract shall expose provider/projection capability limits so UI, API, and analytics do not assume unsupported navigation.

---

## 12. Lifecycle Policy Model

A relationship must be able to define behavior for more than physical delete.

### 12.1 Supported Relationship Lifecycle Events

| Event | Examples |
|---|---|
| `onTargetHardDelete` | Physical delete of referenced master |
| `onTargetSoftDelete` | Archive/soft delete of referenced record |
| `onTargetDeactivate` | Master/configuration record made inactive |
| `onParentSoftDelete` | Parent transaction archived |
| `onParentCloseOrPost` | Parent document becomes immutable |
| `onParentStateChange` | Draft → Submitted, Open → Closed, etc. |
| `onReparent` | Child moved to a different parent |
| `onScopeTransfer` | Entity moves company/node/dealer ownership |
| `onProviderDeleteOrUnavailability` | External target removed or provider unavailable |

### 12.2 Supported Policy Actions

| Action | Meaning |
|---|---|
| `restrict` | Block operation while related records exist |
| `no_action` | Do nothing beyond normal integrity checks |
| `set_null` | Clear optional reference |
| `detach` | Break relation but preserve child/association record where allowed |
| `cascade_soft_delete` | Soft-delete child records |
| `cascade_archive` | Archive child records |
| `freeze_children` | Preserve children but make them immutable |
| `block_new_selection_allow_existing` | Existing references remain; new selection blocked |
| `cascade_deactivate` | Deactivate dependents where business-safe |
| `require_manual_resolution` | Operation may not complete until impact is resolved |
| `provider_managed` | Provider determines outcome; runtime records observed result |
| `revalidate_only` | Re-run scope/security/eligibility checks after move/change |

### 12.3 Hard Lifecycle Rules

1. Hard-delete cascade shall be blocked for ledger-like, posted financial, append-only, and audit records.
2. `set_null` shall be blocked when the reference field is not nullable.
3. Master deactivation shall not silently delete or null historical transaction references.
4. For legal/financial documents, historical facts must be preserved through snapshot fields where required, even if referenced master later changes.
5. Parent close/posting shall normally freeze owned child mutations unless explicitly allowed by lifecycle policy.

---

## 13. Security, Scope, and Governance Rules

### 13.1 Security Resolution

| Scenario | Requirement |
|---|---|
| Lookup source references target | User must have permission to set the relation and read the selected target as required by policy. |
| Owned child | Child may inherit parent access where configured, but backend must still enforce entity/action permissions. |
| Polymorphic target | Security resolves against actual entity type and record. |
| External provider target | Provider access and iDMS access both must be considered where applicable. |
| Relation view | View may display only what relationship + security + lifecycle collectively permit. |

### 13.2 Scope Compatibility

REQ-REL2-028: Cross-tenant references shall be forbidden by default.

REQ-REL2-029: A tenant/company/node-scoped entity may reference global/reference data only when `global_target_allowed` is configured.

REQ-REL2-030: Cross-company or cross-node references shall require explicit scope policy and compiler validation.

REQ-REL2-031: External scope mappings shall be declared rather than assumed.

### 13.3 Downstream Governance

REQ-REL2-031A: Lower layers may decorate labels and constrain target eligibility only when permitted by relationship governance.

REQ-REL2-031B: Lower layers shall not change source entity, target entity, key binding, relationship archetype, cardinality, integrity mode, ownership mode, temporal semantics, or scope policy unless the higher layer explicitly permits override and migration checks pass.

REQ-REL2-031C: A lower layer may add a relation view over an inherited relationship without changing the relationship contract itself.

---

## 14. Entity Archetype Compatibility Matrix

| Source Archetype | Target Archetype | Supported Relationship Patterns | Mandatory Notes |
|---|---|---|---|
| `native_persistent` | `native_persistent` | lookup, composition, junction, self, polymorphic | Full native capabilities possible. |
| `native_persistent` | `external_federated` | external lookup | Provider binding and capability policy required. |
| `external_federated` | `native_persistent` | indirect external lookup | Native target key must be unique alternate/external key. |
| `native_persistent` | `virtual_computed` | synthetic virtual relation | Usually read-only; provider/query capability required. |
| `virtual_computed` | `native_persistent` | projection/synthetic relation | Query-derived; no direct mutation. |
| `virtual_computed` | `virtual_computed` | synthetic virtual relation | Only if common provider/query support exists. |
| `materialized_projection` | `native_persistent` | projection relation | Read-only navigation; source of truth remains native entity. |
| `owned_child` | `native_persistent` parent | composition | Parent ownership mandatory. |
| `junction_association` | participating entities | junction association | Both endpoints and uniqueness/scoping policies required. |
| `append_only_record` | any | lookup/reference only | No cascade hard delete; mutability highly constrained. |

---

## 15. PostgreSQL-Oriented Persistence Guidance

### 15.1 Native Lookup

| Concern | Guidance |
|---|---|
| Storage | Source table stores target key column, usually UUID. |
| FK | Use PostgreSQL foreign key where both entities are in same physical database and lifecycle semantics are compatible. |
| Index | Index referencing column for joins and referential actions. |
| One-to-one | Add unique constraint on source reference column where required. |

### 15.2 Composition / Owned Child

| Concern | Guidance |
|---|---|
| Storage | Child table stores parent key, normally NOT NULL. |
| FK | FK usually appropriate. |
| Physical cascade | Use only when hard-delete semantics are genuinely correct; otherwise application soft-delete/archive policy prevails. |
| Relation view | Separate metadata object renders child rows. |

### 15.3 Junction Association

| Concern | Guidance |
|---|---|
| Storage | Junction table/entity stores both endpoint keys and scope keys. |
| Uniqueness | Use composite unique constraint when duplicate pair not allowed. |
| Business attributes | Use business-visible junction entity when association has fields such as valid-from, valid-to, priority, status, or audit needs. |

### 15.4 Self Reference / Hierarchy

| Concern | Guidance |
|---|---|
| Storage | Same-table FK such as `parent_id`. |
| Cycles | Must be blocked by application validation; database FK alone is insufficient. |
| Traversal | Adjacency list is acceptable initially; closure table/materialized path may be added later for deep hierarchy performance. |

### 15.5 Polymorphic Reference

| Concern | Guidance |
|---|---|
| Storage | `target_entity_api_name` or `target_entity_id` + `target_record_id`. |
| FK | Ordinary PostgreSQL FK cannot cover all target types. |
| Integrity | Application-enforced allowlist and existence/security checks mandatory. |

### 15.6 External / Virtual / Projection Relations

| Concern | Guidance |
|---|---|
| Storage | Use external IDs, provider keys, query bindings, or synthetic key mappings as applicable. |
| FK | Do not assume database FK is possible. |
| Capability | Expose capability matrix from provider/query compiler. |
| Caching | Any cache/materialization strategy must not change source-of-truth semantics. |

---

## 16. Compile-Time Validation Requirements

Compiler shall block activation when any of the following occur.

| Code | Scenario | Validation Message |
|---|---|---|
| `REL2-COMP-001` | Source entity missing | Source entity is required. |
| `REL2-COMP-002` | Target entity missing for non-polymorphic relationship | Target entity is required for this relationship archetype. |
| `REL2-COMP-003` | Same source-target pair duplicated without distinct role semantics | Relationship role must distinguish this relationship from existing relationships between the same entities. |
| `REL2-COMP-004` | Polymorphic allowlist empty | At least one allowed target entity is required. |
| `REL2-COMP-005` | Source reference field missing where required | Source reference field is required for this relationship archetype. |
| `REL2-COMP-006` | Source field logical type incompatible | Source field type is not compatible with the selected relationship archetype. |
| `REL2-COMP-007` | One-to-one without uniqueness guarantee | One-to-one relationship requires a uniqueness policy or unique constraint. |
| `REL2-COMP-008` | Many-to-many without junction representation | Many-to-many relationship requires a junction representation. |
| `REL2-COMP-009` | Business attributes placed on system-managed junction | Association with business fields must use a business-visible junction entity. |
| `REL2-COMP-010` | Indirect external lookup target key not unique | Indirect external lookup requires a unique target alternate/external key. |
| `REL2-COMP-011` | External/virtual relationship lacks provider/query binding | Provider or query binding is required for this relationship. |
| `REL2-COMP-012` | Cross-scope relation without explicit policy | Cross-scope relationship is not allowed without an explicit scope policy. |
| `REL2-COMP-013` | `set_null` selected on non-nullable source field | Set-null is not allowed because the source field is not nullable. |
| `REL2-COMP-014` | Hard delete cascade on ledger-like, posted, append-only, or audit record | Hard delete cascade is not allowed for this entity category/archetype. |
| `REL2-COMP-015` | Self-hierarchy permits cycles | Hierarchy relationship must enforce cycle prevention. |
| `REL2-COMP-016` | Formal relationship integrity mode missing | Active formal relationship requires an integrity mode. |
| `REL2-COMP-017` | Projection relation marked writable | Projection relationships are read-only and cannot permit direct mutation. |
| `REL2-COMP-018` | Provider relation claims unsupported navigation capability | Selected capability is not supported by the provider/query binding. |
| `REL2-COMP-019` | Relationship change breaks dependent rollup/computed/snapshot rules | Relationship change has unresolved dependent metadata impact. |
| `REL2-COMP-020` | Snapshot fields used without live relation where lineage is required | Live relationship is required when snapshot derivation depends on related source lineage. |
| `REL2-COMP-021` | Effective-dated/history-tracked relationship uses system-managed pure junction | Temporal or historical relationships require a business junction/history entity. |
| `REL2-COMP-022` | Effective-dated relationship lacks required effective date fields | Effective-dated relationship requires valid effective date fields. |
| `REL2-COMP-023` | History-tracked semantics selected but no history storage strategy exists | History-tracked relationship requires a history entity or business junction strategy. |

---

## 17. Runtime Contract Requirements

Runtime contract shall expose for each active resolved relationship:

- relationship identity and labels,
- semantic intent and archetype,
- endpoint roles,
- cardinality,
- source/target entities,
- effective key binding strategy,
- effective integrity mode,
- ownership/lifecycle coupling,
- effective scope policy,
- effective security inheritance mode,
- effective navigation capabilities,
- provider/query capability limits,
- target eligibility policy reference,
- related lookup/view/snapshot/validation bindings,
- dependency warnings where applicable.

### 17.1 Runtime Resolution Rules

REQ-REL2-032: Runtime shall expose only active, compiled, security-resolved relationships.

REQ-REL2-033: Runtime shall not assume `expand`, `filterAcross`, `sortAcross`, or `aggregateAcross` are allowed unless the resolved relationship says so.

REQ-REL2-034: Runtime shall not allow mutation of a relation when link mutability is denied by relationship archetype, entity archetype, lifecycle, provider capability, or security.

REQ-REL2-035: Runtime shall expose the actual reason when a relationship exists but an operation is unavailable, such as `provider_read_only`, `parent_closed`, `security_denied`, `scope_violation`, or `projection_read_only`.

---

## 18. Dependency and Impact Tracking

`DependencyDefinition` shall track relationship consumption by:

- source and target `FieldDefinition`s,
- `RelationViewDefinition`s,
- `LookupDefinition`s / field value sources,
- `ValidationRuleDefinition`s,
- `FieldDerivationDefinition`s including snapshot copies and rollups,
- `SecurityDefinition`s,
- lifecycle models,
- APIs and runtime contracts,
- reports and analytics contracts,
- query bindings and projections,
- packages and lower-layer overlays.

### 18.1 High-Risk Relationship Changes

The following active changes must require impact analysis and migration planning:

- changing source or target entity,
- changing relationship archetype,
- changing cardinality,
- changing target key strategy,
- changing role meaning where external contracts depend on it,
- changing integrity mode,
- changing ownership/cascade/lifecycle policies,
- changing scope policy,
- changing provider/query binding,
- disabling or retiring a relationship used by active metadata,
- changing a system-managed junction into a business-visible junction or vice versa.

---

## 19. API Requirements

### 19.1 Admin Metadata APIs

| API | Purpose |
|---|---|
| `POST /admin/metadata/relationships` | Create draft relationship. |
| `GET /admin/metadata/relationships/{relationshipId}` | Read full definition. |
| `PATCH /admin/metadata/relationships/{relationshipId}` | Update draft-safe attributes. |
| `POST /admin/metadata/relationships/{relationshipId}/validate` | Run compile and impact checks without activation. |
| `POST /admin/metadata/relationships/{relationshipId}/activate` | Publish active relationship after successful validation. |
| `POST /admin/metadata/relationships/{relationshipId}/deprecate` | Mark relationship deprecated. |
| `POST /admin/metadata/relationships/{relationshipId}/retire` | Retire relationship after dependency/migration resolution. |
| `GET /admin/metadata/relationships/{relationshipId}/impact` | Show downstream usage and migration impact. |

### 19.2 Runtime APIs

| API | Purpose |
|---|---|
| `GET /runtime/entities/{entityApiName}/relationships` | Resolve active relationships available in context. |
| `GET /runtime/relationships/{relationshipApiName}/capabilities` | Return effective navigation/mutation/provider capabilities. |
| `POST /runtime/relationships/{relationshipApiName}/validate-target` | Validate target eligibility for a proposed link. |

### 19.3 API Hard Rules

1. Runtime APIs must consume compiled metadata only.
2. Target validation must be server-side; UI-only filtering is insufficient.
3. Provider-backed validations must return explicit provider status and failure reason.
4. Active structural changes must not be allowed through simple patch; they require migration workflow.

---

## 20. Examples

### 20.1 Bill-To Customer vs Ship-To Customer

| Relationship | Purpose |
|---|---|
| `sales_invoice_bill_to_customer` | Legal billing party |
| `sales_invoice_ship_to_customer` | Delivery recipient |

Both may reference `Customer`, but they are different relationships because the business roles differ.

### 20.2 Invoice Header → Invoice Lines

- Archetype: `composition_owned_child`
- Cardinality: `one_to_many`
- Ownership: `parent_owns_child`
- Parent close/post policy: `freeze_children`
- Physical storage: child table with parent UUID
- Relation view: editable grid before posting, read-only after posting

### 20.3 Campaign ↔ Vehicle Model

- Archetype: `junction_association`
- Cardinality: `many_to_many`
- If relationship stores only pair link: `system_managed_junction`
- If it stores effective date, priority, status, source, remarks: `business_junction_entity`

### 20.4 Vehicle Ownership History

- Current owner may be exposed through a convenience relation, but legal/business ownership history must be modeled through a business-visible history/junction entity.
- Temporal semantics: `history_tracked` or `effective_dated`.
- Prior owner links must not be overwritten and lost.

### 20.5 Dealer Hierarchy

- Archetype: `self_hierarchy`
- Source and target entity: `Dealer`
- Role: child dealer `reports_to` parent dealer
- Must prevent cycles and declare reparent behavior

### 20.6 Attachment → Multiple Documents

- Archetype: `polymorphic_reference`
- Allowed targets: `Sales Invoice`, `Job Card`, `Warranty Claim`
- Runtime stores actual target entity + target record ID
- Security resolves against actual target record

### 20.7 Native Job Card → External OEM Campaign

- Archetype: `external_lookup`
- Target: external/federated OEM Campaign entity
- Key strategy: `target_external_id`
- Integrity mode: `provider_plus_application`
- Sort/filter/expand allowed only if provider exposes capability

### 20.8 External OEM Order → Native Customer

- Archetype: `indirect_external_lookup`
- External child field `customer_code` matches native unique external ID `oem_customer_code`
- Target key must be unique; no iDMS UUID assumption

### 20.9 Customer 360 → Open Documents

- Archetype: `projection_relation`
- Source: virtual/materialized Customer 360
- Target: source documents exposed by projection
- Read-only; no direct link mutation

---

## 21. Acceptance Criteria

| ID | Acceptance Criteria |
|---|---|
| `AC-REL2-001` | Given two relationships from Sales Invoice to Customer with different roles, when compiled, then both are allowed and remain distinguishable by API name and role semantics. |
| `AC-REL2-002` | Given a lookup relationship to Customer, when a source field is nullable but a validation rule requires it before submit, then draft save may succeed and submit is blocked until populated. |
| `AC-REL2-003` | Given a composition relationship from Invoice to Invoice Line, when invoice is posted, then child mutations are blocked according to lifecycle policy even if the relation view requests edit capability. |
| `AC-REL2-004` | Given a many-to-many association with effective date fields, when configured, then system requires a business-visible junction entity rather than a pure system-managed junction. |
| `AC-REL2-005` | Given a self-hierarchy relationship, when a user attempts to create a cycle, then backend rejects the save. |
| `AC-REL2-006` | Given a polymorphic attachment relationship, when the target entity is not in the allowlist, then save is rejected. |
| `AC-REL2-007` | Given an indirect external lookup, when the target native key is not unique, then relationship activation is blocked. |
| `AC-REL2-008` | Given an external provider relationship that does not support sort-across, when runtime contract is generated, then `sortAcrossAllowed` is false and UI/API may not assume the capability. |
| `AC-REL2-009` | Given a projection relation, when a user attempts to directly mutate the relation, then operation is blocked as read-only. |
| `AC-REL2-010` | Given a target master is deactivated, when existing historical transactions reference it, then existing references remain valid while new selection is blocked if policy says so. |
| `AC-REL2-011` | Given a same-tenant relationship, when an API caller submits a target from another tenant, then backend blocks save regardless of UI behavior. |
| `AC-REL2-012` | Given snapshot fields depend on a live customer relation, when the relation is removed, then compiler reports unresolved dependency impact. |
| `AC-REL2-013` | Given an active relationship used by rollups, views, and APIs, when admin attempts to retire it, then impact analysis identifies all dependent metadata before retirement. |
| `AC-REL2-014` | Given vehicle ownership requires history, when the relationship is configured, then system requires a business history/junction strategy and does not allow current-only overwrite to be the sole model. |
| `AC-REL2-015` | Given an effective-dated association, when configured without effective-from field, then activation is blocked. |

---

## 22. Negative Scenarios and Validation Messages

| Scenario | Expected Behavior | Validation Message |
|---|---|---|
| Relationship lacks distinct role but duplicates existing source-target pair | Block activation | A relationship between these entities already exists. Provide a distinct business role. |
| External lookup has no provider binding | Block activation | Provider binding is required for external lookup relationships. |
| Indirect external lookup target field is not unique | Block activation | Target key must be unique for indirect external lookup. |
| N:N relation has no junction representation | Block activation | Many-to-many relationship requires a junction representation. |
| Business fields added to system-managed junction | Block activation | Association with business attributes must use a business junction entity. |
| One-to-one relation lacks uniqueness enforcement | Block activation | One-to-one relationship requires uniqueness enforcement. |
| Self-hierarchy cycle detected | Block save | This change would create a hierarchy cycle. |
| Polymorphic target outside allowlist | Block save | Selected target entity is not allowed for this relationship. |
| `set_null` chosen for non-nullable field | Block activation | Set-null is not allowed because the source reference field is not nullable. |
| Hard cascade selected for ledger/posted/append-only entity | Block activation | Hard-delete cascade is not allowed for this entity type. |
| Cross-tenant relation attempted without explicit policy | Block save/activation | Cross-tenant relationship is not allowed by scope policy. |
| Projection relation marked writable | Block activation | Projection relationships are read-only. |
| Provider relation claims unsupported expand/filter/sort capability | Block activation | Selected capability is not supported by the provider binding. |
| Snapshot derivation exists but live relation removed | Block activation | Snapshot derivation requires a valid source relationship. |
| Target record inactive where policy blocks new selection | Block save | Selected record is inactive and cannot be newly referenced. |
| Effective-dated relationship lacks effective date fields | Block activation | Effective-dated relationship requires valid effective date fields. |
| Historical relationship modeled as current-only overwrite where history is mandatory | Block activation | Historical relationship requires a history or business junction strategy. |

---

## 23. MVP vs Later Scope

### 23.1 MVP Must Support

- Native lookup references
- Composition/owned child relationships
- Business-visible junction entities
- System-managed pure junctions
- Effective-dated/history-aware association strategy where required
- Self-reference and basic self-hierarchy with cycle prevention
- Polymorphic reference with allowlist
- Scope policy and security inheritance
- Key binding strategy for primary key, alternate key, and external ID
- Integrity modes: database-enforced and application-enforced
- Relationship lifecycle policies for hard delete, soft delete, deactivate, parent state change
- Runtime relationship capability output
- Dependency impact tracking

### 23.2 Architecture Must Reserve Now, Even If UI Comes Later

- External lookup
- Indirect external lookup
- Synthetic virtual relationships
- Projection relationships
- Provider capability matrix
- Composite key matching
- Cross-provider virtual-to-virtual relationships
- Hierarchy acceleration strategies such as closure table/materialized path
- Future `ConnectionDefinition` for informal links

---

## 24. AI Developer Implementation Guardrails

1. Do not model `RelationshipDefinition` as only a foreign key table.
2. Do not store UI grid/card/layout behavior inside relationship metadata.
3. Do not assume every relation is native UUID-to-UUID.
4. Do not assume same source-target pair means duplicate; business role matters.
5. Do not duplicate conditional mandatory logic that belongs to `ValidationRuleDefinition`.
6. Do not replace legal snapshot fields with live relation fields.
7. Do not use raw SQL inside relationship records; reference governed query/provider bindings.
8. Do not allow external/virtual relations to inherit unsupported native capabilities by default.
9. Do not permit hard-delete cascade for ledger-like, posted, append-only, or audit records.
10. Do not allow active structural relationship changes without migration/impact workflow.
11. Do not let relation view metadata override structural/security/lifecycle denials.
12. Do not treat role as schema-owning layer.
13. Do not overwrite historically meaningful relationship changes into a single mutable lookup where history is required; use a business junction/history entity.

---

## 25. Open Product Decisions to Freeze Before Detailed Implementation

| Decision | Recommendation |
|---|---|
| Should pure N:N associations allow system-managed junctions? | Yes, but only where no business attributes/lifecycle/security are needed; otherwise use business junction entity. |
| Should a formal relationship allow no integrity enforcement? | No. Use future `ConnectionDefinition` for informal links. |
| Should target eligibility live in relationship or lookup definition? | Structural eligibility in relationship; presentation/query filter in lookup/value source; business condition in validation rule. |
| Should relationships support composite key bindings? | Yes, reserve architecture now; essential for external/provider scenarios. |
| Should self-hierarchy be a separate archetype from self-reference? | Yes. Self-reference is structural; hierarchy adds cycle and traversal semantics. |
| Should one relation support multiple role names? | No. Create separate relationships for distinct business roles. |
| Should relationships that require history use a mutable simple lookup? | No. Use a business junction/history entity with temporal semantics. |
| Should external/virtual relationship operations be assumed? | No. Derive from provider/query capability only. |

---

## 26. Reference Inputs Used

### Internal iDMS Sources

- Current Entity Designer implementation extract covering entity references, views, actions, governance, and compile-readiness concepts.
- Prior metadata architecture documents showing relation metadata as application-level metadata with `Primary Attribute`, `Foreign Entity`, `Foreign Attribute`, `Profile`, and `Cascade Delete`.
- Revised `EntityDefinition and Entity Creation Requirement Document v2`.
- Revised `FieldDefinition and Field Creation Requirement Document v2`.
- Existing `RelationViewDefinition Requirement Document` for UI boundary validation.

### External Primary References Consulted

- Salesforce Data Model Notation — named relationships, cardinality, optionality, and distinction between lookup versus parent-child/master-detail semantics.
- Salesforce relationship and polymorphic field documentation — polymorphic relationship behavior and external/indirect lookup concepts.
- Microsoft Dataverse relationship documentation — 1:N, N:N, and relationship behavior/cascade concepts.
- Microsoft Dataverse virtual table relationship documentation — virtual/native/virtual relationship support and capability limits.
- PostgreSQL official documentation — foreign keys, composite keys, self-referential foreign keys, referential actions such as `RESTRICT`, `CASCADE`, `SET NULL`, and `SET DEFAULT`.

---

## 27. Final Architectural Position

`RelationshipDefinition` must be treated as the **formal graph contract of the iDMS metadata platform**.

It is not:

- just a foreign key,
- just a lookup dropdown,
- just a child grid,
- or just a reverse dependency list.

It is the governed metadata object that tells the platform:

- which records are meaningfully connected,
- what role each endpoint plays,
- how the connection is resolved,
- what integrity exists,
- what lifecycle coupling applies,
- what scope/security boundaries apply,
- what navigation is possible,
- and what downstream metadata depends on it.

That is the level required for an enterprise-grade configurable DMS platform.
