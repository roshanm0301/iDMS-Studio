// ============================================================
// Relationship Definition v2 — Type System
// Implements all 10 archetypes, 10 classification dimensions,
// 72 metadata fields, and supporting constants.
// ============================================================
import type { LayerCode } from './index';

// ── Dimension 1: Semantic Intent ─────────────────────────────────────────────
export type RelationshipSemanticIntent =
  | 'reference'              // one entity points to another for context (lookup)
  | 'composition'            // parent structurally owns child lifecycle
  | 'association'            // many-to-many peer relationship
  | 'hierarchy'              // self-referential parent/child tree
  | 'contextual_attachment'  // polymorphic — attaches to one of many entity types
  | 'external_reference'     // native entity references an external system record
  | 'derived_navigation';    // computed/virtual — derived from a query or projection

// ── Dimension 2: Relationship Archetype ──────────────────────────────────────
export type RelationshipArchetype =
  // Phase A — Core archetypes
  | 'lookup_reference'          // FK reference to independent master
  | 'composition_owned_child'   // parent owns child lifecycle
  | 'junction_association'      // M:N link table
  | 'self_reference'            // entity references another record of its own type
  | 'self_hierarchy'            // hierarchical self-reference (tree)
  | 'polymorphic_reference'     // source → one of a controlled allowlist of targets
  // Phase B — External & derived archetypes
  | 'external_lookup'           // native → external system record
  | 'indirect_external_lookup'  // external → native via alternate key
  | 'synthetic_virtual_relation'// provider-resolved or key-matched virtual relation
  | 'projection_relation';      // read-only relation from virtual/materialized projection

// ── Dimension 3: Cardinality ─────────────────────────────────────────────────
export type RelationshipCardinality =
  | 'one_to_one'
  | 'one_to_many'
  | 'many_to_one'
  | 'many_to_many';

// ── Dimension 4: Endpoint Topology ───────────────────────────────────────────
export type EndpointTopology =
  | 'two_entity'          // source and target are different native entities
  | 'self_entity'         // source and target are the same entity type
  | 'multi_target'        // polymorphic: one source, many possible target types
  | 'native_to_external'  // native source → external provider target
  | 'external_to_native'  // external source → native target (via alternate key)
  | 'native_to_virtual'   // native → virtual/computed entity
  | 'virtual_to_native'   // virtual → native
  | 'virtual_to_virtual'  // virtual → virtual
  | 'projection_to_source'; // projection entity → its source entity

// ── Dimension 5: Key Binding Strategy ────────────────────────────────────────
export type KeyBindingStrategy =
  | 'target_primary_key'    // FK references target PK (standard)
  | 'target_alternate_key'  // FK references a unique alternate key
  | 'target_external_id'    // FK matches external ID field on target
  | 'composite_key'         // multiple fields form the reference key
  | 'provider_key'          // external provider manages the key
  | 'derived_query_key';    // key resolved via query/derivation

// ── Dimension 6: Integrity / Enforcement Mode ────────────────────────────────
export type RelationshipIntegrityMode =
  | 'database_enforced'       // physical FK constraint in the database
  | 'application_enforced'    // application-layer validation on save
  | 'provider_enforced'       // external provider validates the reference
  | 'provider_plus_application' // both provider and application validate
  | 'derived_projection'      // integrity guaranteed by the projection engine
  | 'synthetic_key_match';    // key matching without a physical constraint

// ── Dimension 7: Ownership / Lifecycle Coupling ──────────────────────────────
export type OwnershipCouplingMode =
  | 'none'                      // no lifecycle coupling
  | 'parent_owns_child'         // child cannot exist without parent
  | 'shared_peer'               // peers — neither owns the other
  | 'target_controls_visibility'// target visibility determines source visibility
  | 'provider_controls_lifecycle'// external provider controls lifecycle
  | 'derived_read_only';        // derived / read-only coupling

// ── Dimension 8: Scope Compatibility Policy ───────────────────────────────────
export type RelationshipScopePolicy =
  | 'same_tenant_required'      // source and target must be in same tenant
  | 'same_company_required'     // must be in same company
  | 'same_node_required'        // must be in same node
  | 'hierarchy_allowed'         // cross-scope within hierarchy allowed
  | 'global_target_allowed'     // target may be global (platform-level)
  | 'external_scope_mapped'     // external system scope applied via mapping
  | 'cross_scope_explicit_only'; // cross-scope allowed only with explicit declaration

// ── Dimension 9: Link Mutability Mode ────────────────────────────────────────
export type LinkMutabilityMode =
  | 'link_writable'             // link can be created, changed, and removed
  | 'link_create_only'          // link can be created but not changed/removed
  | 'link_append_only'          // links accumulate; cannot be removed
  | 'link_read_only'            // link cannot be modified by user
  | 'provider_capability_driven'// external provider controls mutability
  | 'derived_read_only';        // derived relationship — always read-only

// ── Dimension 10: Temporal / Historical Semantics ────────────────────────────
export type TemporalSemanticMode =
  | 'current_only'       // no temporal tracking
  | 'effective_dated'    // link has effective from/to dates
  | 'history_tracked'    // all changes tracked in a history entity
  | 'bitemporal_reserved'; // both effective and transaction time (reserved)

// ── Lifecycle Policy Actions ──────────────────────────────────────────────────
export type LifecyclePolicyAction =
  | 'restrict'                               // block the operation if references exist
  | 'no_action'                              // ignore — allow dangling references
  | 'set_null'                               // clear the FK field on source
  | 'detach'                                 // detach child without deleting it
  | 'cascade_soft_delete'                    // soft-delete child records
  | 'cascade_archive'                        // archive child records
  | 'freeze_children'                        // lock child records from further edits
  | 'block_new_selection_allow_existing'     // allow existing refs; block new ones
  | 'cascade_deactivate'                     // deactivate child records
  | 'require_manual_resolution'              // block and require manual handling
  | 'provider_managed'                       // external provider handles lifecycle
  | 'revalidate_only'                        // re-run validation; no auto action
  | 'not_applicable'                         // lifecycle action not relevant
  | 'allow_existing_references_block_new_selection' // same as block_new_selection_allow_existing (alias)
  | 'restrict_if_referenced'                 // restrict only if actively referenced
  | 'require_revalidation'                   // require revalidation of dependent refs
  | 'none';                                  // no policy configured

// ── RelationshipDefinition — Full 72-field interface ─────────────────────────
export interface RelationshipDefinition {
  // ── Identity ────────────────────────────────────────────────────────────────
  relationshipId: string;
  apiName: string;          // snake_case, locked after activation
  label: string;
  description?: string;

  // ── 10 Classification Dimensions ────────────────────────────────────────────
  semanticIntent: RelationshipSemanticIntent;
  relationshipArchetype: RelationshipArchetype;
  cardinality: RelationshipCardinality;
  endpointTopology: EndpointTopology;

  // ── Endpoints ────────────────────────────────────────────────────────────────
  source: {
    entityId: string;
    roleCode: string;
    roleLabel?: string;
    fieldIds?: string[];   // source fields holding the FK value(s)
  };
  target: {
    entityId?: string;             // for non-polymorphic, non-external archetypes
    allowedEntityIds?: string[];   // for polymorphic_reference
    externalSystemCode?: string;   // for external_lookup / indirect_external_lookup
    externalEntityCode?: string;   // specific entity/resource in the external system
    roleCode?: string;
    roleLabel?: string;
  };

  // ── Key Binding ──────────────────────────────────────────────────────────────
  keyBinding: {
    strategy: KeyBindingStrategy;
    sourceFieldIds?: string[];
    targetKeyFieldIds?: string[];
    compositeMatchMode?: 'all_required' | 'any_match';
    externalProviderKey?: string;  // for external/provider archetypes
  };

  // ── Integrity / Enforcement ──────────────────────────────────────────────────
  integrity: {
    mode: RelationshipIntegrityMode;
    physicalConstraintName?: string; // e.g. 'fk_vo_customer_id'
    providerBindingId?: string;      // for provider-enforced integrity
    queryBindingId?: string;         // for synthetic/derived relationships
  };

  // ── Ownership & Security ─────────────────────────────────────────────────────
  ownership: {
    couplingMode: OwnershipCouplingMode;
    orphanPolicy?: LifecyclePolicyAction;
    securityInheritance: 'none' | 'evaluate_each' | 'inherit_from_parent' | 'inherit_from_target' | 'provider_managed';
  };

  // ── Scope Compatibility ──────────────────────────────────────────────────────
  scope: {
    policy: RelationshipScopePolicy;
    crossScopeAllowed: boolean;
    externalScopeMappingId?: string;
  };

  // ── Lifecycle Policies ───────────────────────────────────────────────────────
  lifecyclePolicies: {
    onTargetHardDelete: LifecyclePolicyAction;
    onTargetSoftDelete: LifecyclePolicyAction;
    onTargetDeactivate: LifecyclePolicyAction;
    onParentStateChange?: LifecyclePolicyAction;
    onReparent?: LifecyclePolicyAction;
    onScopeTransfer?: LifecyclePolicyAction;
  };

  // ── Navigation Capabilities ──────────────────────────────────────────────────
  navigationCapabilities: {
    forwardNavigation: boolean;
    reverseNavigation: boolean;
    expandAllowed: boolean;
    filterAcrossAllowed: boolean;
    sortAcrossAllowed: boolean;
    aggregateAcrossAllowed: boolean;
    capabilitySource: 'native' | 'provider' | 'projection' | 'compiler_derived';
  };

  // ── Link Mutation Capabilities ───────────────────────────────────────────────
  linkMutationCapabilities: {
    mode: LinkMutabilityMode;
    createLinkAllowed: boolean;
    changeLinkAllowed: boolean;
    removeLinkAllowed: boolean;
    capabilitySource: 'native' | 'provider' | 'projection' | 'compiler_derived';
  };

  // ── Temporal Semantics ───────────────────────────────────────────────────────
  temporalSemantics: {
    mode: TemporalSemanticMode;
    effectiveFromFieldId?: string;
    effectiveToFieldId?: string;
    historyEntityId?: string;
  };

  // ── Optional Bindings ────────────────────────────────────────────────────────
  bindings?: {
    targetEligibilityPolicyId?: string;
    lookupDefinitionId?: string;
    relationViewIds?: string[];
    snapshotDerivationIds?: string[];
    validationRuleIds?: string[];
  };

  // ── Governance ───────────────────────────────────────────────────────────────
  governance?: {
    owningLayer?: LayerCode;
    owningPackageId?: string;
    protected?: boolean;
    canDownstreamDecorate?: boolean;
    canDownstreamConstrain?: boolean;
    canDownstreamRelax?: boolean;
    canDownstreamDisable?: boolean;
  };

  // ── Metadata Lifecycle ───────────────────────────────────────────────────────
  lifecycle: {
    metadataStatus: 'draft' | 'active' | 'deprecated' | 'disabled';
    version?: string;
  };

  createdAt?: string;
  lastModified?: string;
}

// ── ARCHETYPE_CONFIG — Display metadata for all 10 archetypes ────────────────
// Used by ArchetypeGrid, RelationshipCard, RelationshipListPage, RelationshipInspector
export const ARCHETYPE_CONFIG: Record<RelationshipArchetype, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;       // lucide-react icon name
  group: string;      // 'Core' | 'External' | 'Derived'
  description: string;
}> = {
  lookup_reference: {
    label: 'Lookup Reference',
    color: '#2563eb',
    bgColor: '#dbeafe',
    icon: 'ArrowRight',
    group: 'Core',
    description: 'One record points to an independent master. No lifecycle coupling.',
  },
  composition_owned_child: {
    label: 'Composition',
    color: '#d97706',
    bgColor: '#fef3c7',
    icon: 'Layers',
    group: 'Core',
    description: 'Child record is structurally owned by parent. Child cannot exist without parent.',
  },
  junction_association: {
    label: 'Junction / Association',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    icon: 'Link2',
    group: 'Core',
    description: 'Many-to-many link between two entities. May carry payload attributes.',
  },
  self_reference: {
    label: 'Self-Reference',
    color: '#0891b2',
    bgColor: '#cffafe',
    icon: 'RotateCcw',
    group: 'Core',
    description: 'Entity references another record of its own type (e.g. replacement part).',
  },
  self_hierarchy: {
    label: 'Self-Hierarchy',
    color: '#059669',
    bgColor: '#d1fae5',
    icon: 'GitBranch',
    group: 'Core',
    description: 'Hierarchical parent/child within same entity type (e.g. dealer hierarchy).',
  },
  polymorphic_reference: {
    label: 'Polymorphic Reference',
    color: '#db2777',
    bgColor: '#fce7f3',
    icon: 'Shuffle',
    group: 'Core',
    description: 'Source can point to one of a controlled allowlist of target entity types.',
  },
  external_lookup: {
    label: 'External Lookup',
    color: '#ea580c',
    bgColor: '#ffedd5',
    icon: 'Globe',
    group: 'External',
    description: 'Native record references an entity in an external system (OEM, ERP, CRM).',
  },
  indirect_external_lookup: {
    label: 'Indirect External',
    color: '#c2410c',
    bgColor: '#fff7ed',
    icon: 'Search',
    group: 'External',
    description: 'External record references a native target via an alternate key.',
  },
  synthetic_virtual_relation: {
    label: 'Synthetic / Virtual',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    icon: 'Zap',
    group: 'Derived',
    description: 'Relationship resolved by provider or key matching — no physical FK.',
  },
  projection_relation: {
    label: 'Projection Relation',
    color: '#0f766e',
    bgColor: '#f0fdfa',
    icon: 'BarChart2',
    group: 'Derived',
    description: 'Read-only relation emitted by a virtual or materialized projection entity.',
  },
};

// ── INTENT_TO_ARCHETYPES — Maps semantic intent to suggested archetypes ───────
export const INTENT_TO_ARCHETYPES: Record<RelationshipSemanticIntent, RelationshipArchetype[]> = {
  reference: ['lookup_reference', 'external_lookup', 'indirect_external_lookup'],
  composition: ['composition_owned_child'],
  association: ['junction_association'],
  hierarchy: ['self_hierarchy', 'self_reference'],
  contextual_attachment: ['polymorphic_reference'],
  external_reference: ['external_lookup', 'indirect_external_lookup'],
  derived_navigation: ['synthetic_virtual_relation', 'projection_relation'],
};

// ── SEMANTIC_INTENT_CONFIG — Display info for intent cards in wizard step 1 ──
export const SEMANTIC_INTENT_CONFIG: Record<RelationshipSemanticIntent, {
  label: string;
  icon: string;
  description: string;
}> = {
  reference: {
    label: 'Reference',
    icon: 'ArrowRight',
    description: 'One entity references another for context or lookup. No lifecycle coupling.',
  },
  composition: {
    label: 'Composition',
    icon: 'Layers',
    description: 'Parent owns child lifecycle. Child record cannot exist without its parent.',
  },
  association: {
    label: 'Association',
    icon: 'Link2',
    description: 'Many-to-many peer relationship between two entity types.',
  },
  hierarchy: {
    label: 'Hierarchy',
    icon: 'GitBranch',
    description: 'Hierarchical or self-referential relationship within the same entity type.',
  },
  contextual_attachment: {
    label: 'Contextual Attachment',
    icon: 'Shuffle',
    description: 'Record can attach to one of multiple entity types (polymorphic).',
  },
  external_reference: {
    label: 'External Reference',
    icon: 'Globe',
    description: 'Native entity references a record in an external system (ERP, OEM portal, CRM).',
  },
  derived_navigation: {
    label: 'Derived Navigation',
    icon: 'Zap',
    description: 'Relationship is computed or projected — no physical FK. Read-only.',
  },
};

// ── CARDINALITY_LABELS — Human-readable cardinality display ──────────────────
export const CARDINALITY_LABELS: Record<RelationshipCardinality, { label: string; arrow: string }> = {
  one_to_one: { label: 'One-to-One', arrow: '1 — 1' },
  one_to_many: { label: 'One-to-Many', arrow: '1 — N' },
  many_to_one: { label: 'Many-to-One', arrow: 'N — 1' },
  many_to_many: { label: 'Many-to-Many', arrow: 'M — N' },
};

// ── INTEGRITY_MODE_CONFIG — Display info for integrity mode cards ─────────────
export const INTEGRITY_MODE_CONFIG: Record<RelationshipIntegrityMode, {
  label: string;
  description: string;
  icon: string;
}> = {
  database_enforced: {
    label: 'Database Enforced',
    icon: 'Database',
    description: 'Physical FK constraint in the database. Strongest guarantee — prevents orphans at DB level.',
  },
  application_enforced: {
    label: 'Application Enforced',
    icon: 'Shield',
    description: 'Validation on save in the application layer. Suitable for cross-schema references.',
  },
  provider_enforced: {
    label: 'Provider Enforced',
    icon: 'Globe',
    description: 'External provider validates the reference. Used for external / federated relationships.',
  },
  provider_plus_application: {
    label: 'Provider + Application',
    icon: 'ShieldCheck',
    description: 'Both provider and application validate. Highest coverage for external relationships.',
  },
  derived_projection: {
    label: 'Derived Projection',
    icon: 'BarChart2',
    description: 'Integrity guaranteed by the projection engine. Used for virtual/materialized relationships.',
  },
  synthetic_key_match: {
    label: 'Synthetic Key Match',
    icon: 'Zap',
    description: 'Key matching without a physical constraint. Used for synthetic/virtual relations.',
  },
};
