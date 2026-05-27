// ============================================================
// CreateRelationshipPage — 10-step relationship creation wizard
// Route: /admin/studio/relationships/new
// ============================================================
import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, GitFork, AlertCircle } from 'lucide-react';
import { useEntityDesignerStore } from '../hooks/useEntityDesignerStore';
import { getEntityDefinitions } from '../data/mockService';
import { ArchetypeGrid } from '../components/relationship-designer/ArchetypeGrid';
import {
  ARCHETYPE_CONFIG,
  INTENT_TO_ARCHETYPES,
  SEMANTIC_INTENT_CONFIG,
  INTEGRITY_MODE_CONFIG,
} from '../types/relationshipDesigner';
import type {
  RelationshipDefinition,
  RelationshipSemanticIntent,
  RelationshipArchetype,
  RelationshipCardinality,
  KeyBindingStrategy,
  RelationshipIntegrityMode,
  OwnershipCouplingMode,
  LifecyclePolicyAction,
  RelationshipScopePolicy,
  LinkMutabilityMode,
  TemporalSemanticMode,
} from '../types/relationshipDesigner';

// ── Helpers ────────────────────────────────────────────────────────────────
function toSlug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function generateRelId(label: string): string {
  return `rel_${toSlug(label)}_${Date.now().toString(36)}`;
}

const STEP_LABELS = [
  'Semantic Intent',
  'Archetype',
  'Entities & Roles',
  'Key Binding',
  'Integrity',
  'Lifecycle Coupling',
  'Scope',
  'Capabilities',
  'Temporal',
  'Review & Create',
];

const CARDINALITIES: { value: RelationshipCardinality; label: string }[] = [
  { value: 'one_to_one',   label: '1:1 — One to One' },
  { value: 'one_to_many',  label: '1:N — One to Many' },
  { value: 'many_to_one',  label: 'N:1 — Many to One' },
  { value: 'many_to_many', label: 'M:N — Many to Many' },
];

const KEY_STRATEGIES: { value: KeyBindingStrategy; label: string }[] = [
  { value: 'target_primary_key',   label: 'Target Primary Key' },
  { value: 'target_alternate_key', label: 'Target Alternate Key' },
  { value: 'target_external_id',   label: 'Target External ID' },
  { value: 'composite_key',        label: 'Composite Key' },
  { value: 'provider_key',         label: 'Provider-managed Key' },
  { value: 'derived_query_key',    label: 'Derived Query Key' },
];

const LIFECYCLE_ACTIONS: { value: LifecyclePolicyAction; label: string }[] = [
  { value: 'restrict',                   label: 'Restrict (block operation if referenced)' },
  { value: 'no_action',                  label: 'No Action' },
  { value: 'set_null',                   label: 'Set Null (clear the FK)' },
  { value: 'detach',                     label: 'Detach (break the link)' },
  { value: 'cascade_soft_delete',        label: 'Cascade Soft Delete' },
  { value: 'cascade_archive',            label: 'Cascade Archive' },
  { value: 'freeze_children',            label: 'Freeze Children' },
  { value: 'require_manual_resolution',  label: 'Require Manual Resolution' },
  { value: 'cascade_deactivate',         label: 'Cascade Deactivate' },
  { value: 'provider_managed',           label: 'Provider Managed' },
  { value: 'not_applicable',             label: 'Not Applicable' },
  { value: 'none',                       label: 'None' },
];

const SCOPE_POLICIES: { value: RelationshipScopePolicy; label: string }[] = [
  { value: 'same_tenant_required',        label: 'Same Tenant Required' },
  { value: 'same_company_required',       label: 'Same Company Required' },
  { value: 'same_node_required',          label: 'Same Node Required' },
  { value: 'hierarchy_allowed',           label: 'Hierarchy Allowed' },
  { value: 'global_target_allowed',       label: 'Global Target Allowed' },
  { value: 'external_scope_mapped',       label: 'External Scope Mapped' },
  { value: 'cross_scope_explicit_only',   label: 'Cross-Scope Explicit Only' },
];

const TEMPORAL_MODES: { value: TemporalSemanticMode; label: string; desc: string }[] = [
  { value: 'current_only',      label: 'Current Only',         desc: 'No time dimension — always reflects the current state' },
  { value: 'effective_dated',   label: 'Effective Dated',      desc: 'Link has a valid-from date; optionally valid-to' },
  { value: 'history_tracked',   label: 'History Tracked',      desc: 'All historical states are recorded in a history entity' },
  { value: 'bitemporal_reserved', label: 'Bitemporal (Reserved)', desc: 'Transaction time + valid time tracking — future use' },
];

// ── Component ───────────────────────────────────────────────────────────────
export default function CreateRelationshipPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { savedRelationships, savedEntities, createRelationship } = useEntityDesignerStore();

  const allEntities = useMemo(() => getEntityDefinitions(savedEntities), [savedEntities]);
  const lookupEntities = useMemo(() => allEntities.filter(e => e.lookupEligible !== false), [allEntities]);

  const [step, setStep] = useState(0);

  // Step 1 — Semantic Intent
  const [semanticIntent, setSemanticIntent] = useState<RelationshipSemanticIntent | null>(null);

  // Step 2 — Archetype
  const [archetype, setArchetype] = useState<RelationshipArchetype | null>(null);

  // Step 3 — Entities & Roles
  const prefilledSource = searchParams.get('sourceEntity') ?? '';
  const [sourceEntityId, setSourceEntityId] = useState(prefilledSource);
  const [sourceRoleCode, setSourceRoleCode] = useState('');
  const [sourceRoleLabel, setSourceRoleLabel] = useState('');
  const [targetEntityId, setTargetEntityId] = useState('');
  const [targetRoleCode, setTargetRoleCode] = useState('');
  const [targetRoleLabel, setTargetRoleLabel] = useState('');
  const [allowedEntityIds, setAllowedEntityIds] = useState<string[]>([]);
  const [externalSystemCode, setExternalSystemCode] = useState('');
  const [cardinality, setCardinality] = useState<RelationshipCardinality>('many_to_one');
  const [relLabel, setRelLabel] = useState('');
  const [relApiName, setRelApiName] = useState('');
  const [relDescription, setRelDescription] = useState('');

  // Step 4 — Key Binding
  const [keyStrategy, setKeyStrategy] = useState<KeyBindingStrategy>('target_primary_key');
  const [externalProviderKey, setExternalProviderKey] = useState('');

  // Step 5 — Integrity
  const [integrityMode, setIntegrityMode] = useState<RelationshipIntegrityMode>('application_enforced');

  // Step 6 — Lifecycle Coupling
  const [couplingMode, setCouplingMode] = useState<OwnershipCouplingMode>('none');
  const [orphanPolicy, setOrphanPolicy] = useState<LifecyclePolicyAction>('restrict');
  const [securityInheritance, setSecurityInheritance] = useState<'none' | 'evaluate_each' | 'inherit_from_parent' | 'inherit_from_target' | 'provider_managed'>('none');
  const [onTargetHardDelete, setOnTargetHardDelete] = useState<LifecyclePolicyAction>('restrict');
  const [onTargetSoftDelete, setOnTargetSoftDelete] = useState<LifecyclePolicyAction>('no_action');
  const [onTargetDeactivate, setOnTargetDeactivate] = useState<LifecyclePolicyAction>('no_action');

  // Step 7 — Scope
  const [scopePolicy, setScopePolicy] = useState<RelationshipScopePolicy>('same_tenant_required');
  const [crossScopeAllowed, setCrossScopeAllowed] = useState(false);

  // Step 8 — Capabilities
  const [forwardNavigation, setForwardNavigation] = useState(true);
  const [reverseNavigation, setReverseNavigation] = useState(true);
  const [expandAllowed, setExpandAllowed] = useState(true);
  const [filterAcrossAllowed, setFilterAcrossAllowed] = useState(false);
  const [sortAcrossAllowed, setSortAcrossAllowed] = useState(false);
  const [aggregateAcrossAllowed, setAggregateAcrossAllowed] = useState(false);
  const [linkMutMode, setLinkMutMode] = useState<LinkMutabilityMode>('link_writable');
  const [createLinkAllowed, setCreateLinkAllowed] = useState(true);
  const [changeLinkAllowed, setChangeLinkAllowed] = useState(true);
  const [removeLinkAllowed, setRemoveLinkAllowed] = useState(true);

  // Step 9 — Temporal
  const [temporalMode, setTemporalMode] = useState<TemporalSemanticMode>('current_only');
  const [effectiveFromFieldId, setEffectiveFromFieldId] = useState('');
  const [effectiveToFieldId, setEffectiveToFieldId] = useState('');
  const [historyEntityId, setHistoryEntityId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Computed: archetype-conditional logic ──────────────────────────────

  const isSelf = archetype === 'self_reference' || archetype === 'self_hierarchy';
  const isPolymorphic = archetype === 'polymorphic_reference';
  const isExternal = archetype === 'external_lookup' || archetype === 'indirect_external_lookup';
  const isDerived = archetype === 'synthetic_virtual_relation' || archetype === 'projection_relation';

  const filteredArchetypes = semanticIntent
    ? INTENT_TO_ARCHETYPES[semanticIntent] ?? undefined
    : undefined;

  // Apply archetype defaults when archetype changes
  function applyArchetypeDefaults(a: RelationshipArchetype) {
    if (a === 'composition_owned_child') {
      setCouplingMode('parent_owns_child');
      setOnTargetHardDelete('cascade_soft_delete');
    } else if (a === 'projection_relation' || a === 'synthetic_virtual_relation') {
      setLinkMutMode('derived_read_only');
      setCreateLinkAllowed(false);
      setChangeLinkAllowed(false);
      setRemoveLinkAllowed(false);
      setIntegrityMode(a === 'projection_relation' ? 'derived_projection' : 'synthetic_key_match');
    } else if (a === 'external_lookup') {
      setScopePolicy('external_scope_mapped');
      setIntegrityMode('provider_enforced');
    } else if (a === 'indirect_external_lookup') {
      setScopePolicy('external_scope_mapped');
      setIntegrityMode('synthetic_key_match');
      setKeyStrategy('target_external_id');
    } else if (a === 'self_hierarchy') {
      setIntegrityMode('application_enforced');
    } else if (a === 'junction_association') {
      setCardinality('many_to_many');
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────

  function canAdvance(): boolean {
    if (step === 0) return semanticIntent !== null;
    if (step === 1) return archetype !== null;
    if (step === 2) {
      if (!sourceEntityId || !relLabel) return false;
      if (isPolymorphic) return allowedEntityIds.length > 0;
      if (isExternal) return !!externalSystemCode;
      if (!isSelf) return !!targetEntityId;
      return true;
    }
    return true;
  }

  function handleNext() {
    if (step < 9) setStep(s => s + 1);
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1);
  }

  // ── Create ─────────────────────────────────────────────────────────────

  function handleCreate() {
    if (!archetype || !sourceEntityId || !relLabel) return;
    setIsSubmitting(true);

    const relId = generateRelId(relLabel);
    const apiName = relApiName || toSlug(relLabel);

    const effectiveTargetEntityId = isSelf ? sourceEntityId : targetEntityId;

    const endpointTopology = isExternal
      ? (archetype === 'external_lookup' ? 'native_to_external' : 'external_to_native')
      : isDerived
        ? (archetype === 'projection_relation' ? 'projection_to_source' : 'native_to_virtual')
        : isSelf
          ? 'self_entity'
          : isPolymorphic
            ? 'multi_target'
            : 'two_entity';

    const newRel: RelationshipDefinition = {
      relationshipId: relId,
      apiName,
      label: relLabel,
      description: relDescription || undefined,
      semanticIntent: semanticIntent!,
      relationshipArchetype: archetype,
      cardinality,
      endpointTopology,
      source: {
        entityId: sourceEntityId,
        roleCode: sourceRoleCode || toSlug(sourceEntityId),
        roleLabel: sourceRoleLabel || undefined,
      },
      target: {
        entityId: isPolymorphic ? undefined : (effectiveTargetEntityId || undefined),
        allowedEntityIds: isPolymorphic ? allowedEntityIds : undefined,
        roleCode: targetRoleCode || undefined,
        roleLabel: targetRoleLabel || undefined,
        externalSystemCode: isExternal ? externalSystemCode : undefined,
      },
      keyBinding: {
        strategy: keyStrategy,
        externalProviderKey: (isExternal && externalProviderKey) ? externalProviderKey : undefined,
      },
      integrity: {
        mode: integrityMode,
      },
      ownership: {
        couplingMode,
        orphanPolicy,
        securityInheritance,
      },
      scope: {
        policy: scopePolicy,
        crossScopeAllowed,
      },
      lifecyclePolicies: {
        onTargetHardDelete,
        onTargetSoftDelete,
        onTargetDeactivate,
      },
      navigationCapabilities: {
        forwardNavigation,
        reverseNavigation,
        expandAllowed,
        filterAcrossAllowed,
        sortAcrossAllowed,
        aggregateAcrossAllowed,
        capabilitySource: isDerived ? 'projection' : 'native',
      },
      linkMutationCapabilities: {
        mode: linkMutMode,
        createLinkAllowed,
        changeLinkAllowed,
        removeLinkAllowed,
        capabilitySource: isDerived ? 'projection' : 'native',
      },
      temporalSemantics: {
        mode: temporalMode,
        effectiveFromFieldId: temporalMode === 'effective_dated' ? (effectiveFromFieldId || undefined) : undefined,
        effectiveToFieldId: (temporalMode === 'effective_dated' && effectiveToFieldId) ? effectiveToFieldId : undefined,
        historyEntityId: temporalMode === 'history_tracked' ? (historyEntityId || undefined) : undefined,
      },
      lifecycle: {
        metadataStatus: 'draft',
        version: '1.0',
      },
    };

    createRelationship(newRel);
    navigate(`/admin/studio/relationships/${relId}`);
  }

  // ── Render helpers ──────────────────────────────────────────────────────

  function ToggleRow({ label, desc, value, onChange }: {
    label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
  }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 0', borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
          {desc && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{desc}</div>}
        </div>
        <button
          onClick={() => onChange(!value)}
          style={{
            width: 38, height: 22, borderRadius: 11,
            background: value ? 'var(--accent)' : 'var(--border)',
            border: 'none', cursor: 'pointer', transition: 'background 0.2s',
            position: 'relative', flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: 3, left: value ? 18 : 3,
            width: 16, height: 16, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>
    );
  }

  function FieldRow({ label, children, required }: {
    label: string; children: React.ReactNode; required?: boolean;
  }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
          {label}{required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
        </label>
        {children}
      </div>
    );
  }

  // ── Step renderers ──────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      // ── Step 0: Semantic Intent ──────────────────────────────────────────
      case 0:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
              What is the primary semantic intent of this relationship?
            </p>
            {(Object.keys(SEMANTIC_INTENT_CONFIG) as RelationshipSemanticIntent[]).map(intent => {
              const cfg = SEMANTIC_INTENT_CONFIG[intent];
              const isSelected = semanticIntent === intent;
              return (
                <button
                  key={intent}
                  onClick={() => setSemanticIntent(intent)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 8,
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'hsl(22 100% 51% / 0.07)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 6, background: 'var(--bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>
                    {cfg.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                      {cfg.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                      {cfg.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        );

      // ── Step 1: Archetype ────────────────────────────────────────────────
      case 1:
        return (
          <div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Select the relationship archetype. All 10 archetypes are available.
            </p>
            <ArchetypeGrid
              selected={archetype}
              filtered={filteredArchetypes}
              onSelect={a => {
                setArchetype(a);
                applyArchetypeDefaults(a);
              }}
            />
          </div>
        );

      // ── Step 2: Entities & Roles ─────────────────────────────────────────
      case 2:
        return (
          <div>
            <FieldRow label="Relationship Label" required>
              <input
                className="search-input"
                placeholder="e.g. Vehicle Order to Customer"
                value={relLabel}
                onChange={e => {
                  setRelLabel(e.target.value);
                  if (!relApiName) setRelApiName(toSlug(e.target.value));
                }}
              />
            </FieldRow>
            <FieldRow label="API Name (auto-generated, editable)">
              <input
                className="search-input"
                value={relApiName}
                onChange={e => setRelApiName(toSlug(e.target.value))}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </FieldRow>
            <FieldRow label="Description">
              <textarea
                className="search-input"
                value={relDescription}
                onChange={e => setRelDescription(e.target.value)}
                rows={2}
                placeholder="Describe the purpose of this relationship…"
                style={{ resize: 'vertical' }}
              />
            </FieldRow>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FieldRow label="Source Entity" required>
                <select
                  className="search-input"
                  value={sourceEntityId}
                  onChange={e => {
                    setSourceEntityId(e.target.value);
                    if (isSelf) setTargetEntityId(e.target.value);
                  }}
                >
                  <option value="">— Select entity —</option>
                  {allEntities.map(e => (
                    <option key={e.entityType} value={e.entityType}>{e.label}</option>
                  ))}
                </select>
              </FieldRow>

              <FieldRow label="Cardinality" required>
                <select
                  className="search-input"
                  value={cardinality}
                  onChange={e => setCardinality(e.target.value as RelationshipCardinality)}
                  disabled={archetype === 'junction_association'}
                >
                  {CARDINALITIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </FieldRow>
            </div>

            {/* Source role */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FieldRow label="Source Role Code">
                <input className="search-input" value={sourceRoleCode}
                  onChange={e => setSourceRoleCode(e.target.value)}
                  placeholder="e.g. ordering_customer" />
              </FieldRow>
              <FieldRow label="Source Role Label">
                <input className="search-input" value={sourceRoleLabel}
                  onChange={e => setSourceRoleLabel(e.target.value)}
                  placeholder="e.g. Ordering Customer" />
              </FieldRow>
            </div>

            {/* Target — conditional */}
            {isExternal ? (
              <>
                <FieldRow label="External System Code" required>
                  <input
                    className="search-input"
                    value={externalSystemCode}
                    onChange={e => setExternalSystemCode(e.target.value.toUpperCase())}
                    placeholder="e.g. OEM_PORTAL, SAP_PROD"
                    style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                  />
                </FieldRow>
                <FieldRow label="External Entity / Resource Code">
                  <input
                    className="search-input"
                    value={targetEntityId}
                    onChange={e => setTargetEntityId(e.target.value)}
                    placeholder="e.g. oem_catalogue_entry"
                    style={{ fontFamily: 'monospace' }}
                  />
                </FieldRow>
              </>
            ) : isPolymorphic ? (
              <FieldRow label="Allowed Target Entities" required>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {lookupEntities.map(e => {
                    const included = allowedEntityIds.includes(e.entityType);
                    return (
                      <label key={e.entityType} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={() =>
                            setAllowedEntityIds(prev =>
                              included ? prev.filter(x => x !== e.entityType) : [...prev, e.entityType]
                            )
                          }
                        />
                        <span style={{ fontSize: 13 }}>{e.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{e.entityType}</span>
                      </label>
                    );
                  })}
                </div>
              </FieldRow>
            ) : isSelf ? (
              <div style={{
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: 7,
                fontSize: 12,
                color: 'var(--muted)',
                marginBottom: 14,
              }}>
                🔄 Self-referential — target entity is the same as source ({sourceEntityId || '(none selected)'})
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FieldRow label="Target Entity" required>
                  <select
                    className="search-input"
                    value={targetEntityId}
                    onChange={e => setTargetEntityId(e.target.value)}
                  >
                    <option value="">— Select entity —</option>
                    {lookupEntities.map(e => (
                      <option key={e.entityType} value={e.entityType}>{e.label}</option>
                    ))}
                  </select>
                </FieldRow>
                <FieldRow label="Target Role Code">
                  <input className="search-input" value={targetRoleCode}
                    onChange={e => setTargetRoleCode(e.target.value)}
                    placeholder="e.g. ordered_vehicle_model" />
                </FieldRow>
              </div>
            )}

            <FieldRow label="Target Role Label">
              <input className="search-input" value={targetRoleLabel}
                onChange={e => setTargetRoleLabel(e.target.value)}
                placeholder="e.g. Ordered Vehicle Model" />
            </FieldRow>
          </div>
        );

      // ── Step 3: Key Binding ──────────────────────────────────────────────
      case 3:
        return (
          <div>
            <FieldRow label="Key Binding Strategy" required>
              <select
                className="search-input"
                value={keyStrategy}
                onChange={e => setKeyStrategy(e.target.value as KeyBindingStrategy)}
              >
                {KEY_STRATEGIES.map(k => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </select>
            </FieldRow>

            {isExternal && (
              <FieldRow label="External Provider Key" required>
                <input
                  className="search-input"
                  value={externalProviderKey}
                  onChange={e => setExternalProviderKey(e.target.value)}
                  placeholder="e.g. oem_catalogue_id"
                  style={{ fontFamily: 'monospace' }}
                />
              </FieldRow>
            )}

            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--muted)',
              marginTop: 8,
            }}>
              <strong style={{ color: 'var(--text)' }}>Strategy:</strong>{' '}
              {keyStrategy === 'target_primary_key' && 'Source entity stores the target\'s primary key (UUID or natural key) in an FK field.'}
              {keyStrategy === 'target_alternate_key' && 'Source stores an alternate unique key from the target (e.g. document number, code).'}
              {keyStrategy === 'target_external_id' && 'Source stores an ID assigned by the external system to identify the target record.'}
              {keyStrategy === 'composite_key' && 'Multiple fields together form the reference key — all must match for link resolution.'}
              {keyStrategy === 'provider_key' && 'The integration provider manages the key assignment and resolution (no iDMS FK field).'}
              {keyStrategy === 'derived_query_key' && 'Link is resolved at query time using a computed/derived condition rather than a stored FK.'}
            </div>
          </div>
        );

      // ── Step 4: Integrity ────────────────────────────────────────────────
      case 4: {
        const lockedIntegrity = isDerived || isExternal;
        return (
          <div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              How is referential integrity enforced for this relationship?
            </p>
            {Object.entries(INTEGRITY_MODE_CONFIG).map(([mode, cfg]) => {
              const isSelected = integrityMode === mode;
              const disabled = lockedIntegrity && mode !== integrityMode;
              return (
                <button
                  key={mode}
                  disabled={disabled}
                  onClick={() => setIntegrityMode(mode as RelationshipIntegrityMode)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    marginBottom: 8,
                    borderRadius: 8,
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'hsl(22 100% 51% / 0.07)' : 'var(--bg-secondary)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                      {cfg.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{cfg.description}</div>
                  </div>
                </button>
              );
            })}
            {lockedIntegrity && (
              <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8 }}>
                ℹ Integrity mode locked based on archetype selection.
              </p>
            )}
          </div>
        );
      }

      // ── Step 5: Lifecycle Coupling ───────────────────────────────────────
      case 5: {
        const isComposition = archetype === 'composition_owned_child';
        return (
          <div>
            <FieldRow label="Ownership Coupling Mode">
              <select
                className="search-input"
                value={couplingMode}
                onChange={e => setCouplingMode(e.target.value as OwnershipCouplingMode)}
                disabled={isComposition}
              >
                <option value="none">None</option>
                <option value="parent_owns_child">Parent Owns Child</option>
                <option value="shared_peer">Shared Peer</option>
                <option value="target_controls_visibility">Target Controls Visibility</option>
                <option value="provider_controls_lifecycle">Provider Controls Lifecycle</option>
                <option value="derived_read_only">Derived / Read-only</option>
              </select>
            </FieldRow>

            <FieldRow label="Orphan Policy">
              <select className="search-input" value={orphanPolicy}
                onChange={e => setOrphanPolicy(e.target.value as LifecyclePolicyAction)}>
                {LIFECYCLE_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </FieldRow>

            <FieldRow label="Security Inheritance">
              <select className="search-input" value={securityInheritance}
                onChange={e => setSecurityInheritance(e.target.value as typeof securityInheritance)}>
                <option value="none">None</option>
                <option value="evaluate_each">Evaluate Each Record Independently</option>
                <option value="inherit_from_parent">Inherit from Parent</option>
                <option value="inherit_from_target">Inherit from Target</option>
                <option value="provider_managed">Provider Managed</option>
              </select>
            </FieldRow>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
                Target State Change Policies
              </p>
              <FieldRow label="On Target Hard Delete">
                <select className="search-input" value={onTargetHardDelete}
                  onChange={e => setOnTargetHardDelete(e.target.value as LifecyclePolicyAction)}>
                  {LIFECYCLE_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="On Target Soft Delete">
                <select className="search-input" value={onTargetSoftDelete}
                  onChange={e => setOnTargetSoftDelete(e.target.value as LifecyclePolicyAction)}>
                  {LIFECYCLE_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="On Target Deactivate">
                <select className="search-input" value={onTargetDeactivate}
                  onChange={e => setOnTargetDeactivate(e.target.value as LifecyclePolicyAction)}>
                  {LIFECYCLE_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </FieldRow>
            </div>
          </div>
        );
      }

      // ── Step 6: Scope ────────────────────────────────────────────────────
      case 6:
        return (
          <div>
            <FieldRow label="Scope Policy">
              <select className="search-input" value={scopePolicy}
                onChange={e => setScopePolicy(e.target.value as RelationshipScopePolicy)}>
                {SCOPE_POLICIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </FieldRow>
            <ToggleRow
              label="Cross-Scope Allowed"
              desc="Allow this relationship to link records across different tenants, nodes, or hierarchical scopes"
              value={crossScopeAllowed}
              onChange={setCrossScopeAllowed}
            />
          </div>
        );

      // ── Step 7: Capabilities ─────────────────────────────────────────────
      case 7: {
        const isReadOnly = isDerived || linkMutMode === 'derived_read_only' || linkMutMode === 'link_read_only';
        return (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Navigation</p>
            <ToggleRow label="Forward Navigation" desc="Traverse from source to target" value={forwardNavigation} onChange={setForwardNavigation} />
            <ToggleRow label="Reverse Navigation" desc="Traverse from target to source" value={reverseNavigation} onChange={setReverseNavigation} />
            <ToggleRow label="Expand Allowed" desc="Target record can be expanded inline" value={expandAllowed} onChange={setExpandAllowed} />
            <ToggleRow label="Filter Across" desc="Can filter source records by target fields" value={filterAcrossAllowed} onChange={setFilterAcrossAllowed} />
            <ToggleRow label="Sort Across" desc="Can sort source records by target fields" value={sortAcrossAllowed} onChange={setSortAcrossAllowed} />
            <ToggleRow label="Aggregate Across" desc="Can aggregate values from related records" value={aggregateAcrossAllowed} onChange={setAggregateAcrossAllowed} />

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Link Mutation</p>
              <FieldRow label="Mutation Mode">
                <select
                  className="search-input"
                  value={linkMutMode}
                  onChange={e => setLinkMutMode(e.target.value as LinkMutabilityMode)}
                  disabled={isDerived}
                >
                  <option value="link_writable">Link Writable (full CRUD on the link)</option>
                  <option value="link_create_only">Link Create Only</option>
                  <option value="link_append_only">Link Append Only</option>
                  <option value="link_read_only">Link Read Only</option>
                  <option value="provider_capability_driven">Provider Capability Driven</option>
                  <option value="derived_read_only">Derived / Read Only</option>
                </select>
              </FieldRow>
              <ToggleRow label="Create Link Allowed" desc="New links can be created" value={createLinkAllowed} onChange={v => !isReadOnly && setCreateLinkAllowed(v)} />
              <ToggleRow label="Change Link Allowed" desc="Existing links can be modified" value={changeLinkAllowed} onChange={v => !isReadOnly && setChangeLinkAllowed(v)} />
              <ToggleRow label="Remove Link Allowed" desc="Links can be removed" value={removeLinkAllowed} onChange={v => !isReadOnly && setRemoveLinkAllowed(v)} />
            </div>
          </div>
        );
      }

      // ── Step 8: Temporal ─────────────────────────────────────────────────
      case 8:
        return (
          <div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Does this relationship have time-dimension semantics?
            </p>
            {TEMPORAL_MODES.map(tm => {
              const isSelected = temporalMode === tm.value;
              return (
                <button
                  key={tm.value}
                  onClick={() => setTemporalMode(tm.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    marginBottom: 8,
                    borderRadius: 8,
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'hsl(22 100% 51% / 0.07)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                      {tm.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{tm.desc}</div>
                  </div>
                </button>
              );
            })}

            {temporalMode === 'effective_dated' && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <FieldRow label="Effective From Field ID" required>
                  <input className="search-input" value={effectiveFromFieldId}
                    onChange={e => setEffectiveFromFieldId(e.target.value)}
                    placeholder="e.g. effective_from" style={{ fontFamily: 'monospace' }} />
                </FieldRow>
                <FieldRow label="Effective To Field ID">
                  <input className="search-input" value={effectiveToFieldId}
                    onChange={e => setEffectiveToFieldId(e.target.value)}
                    placeholder="e.g. effective_to" style={{ fontFamily: 'monospace' }} />
                </FieldRow>
              </div>
            )}

            {temporalMode === 'history_tracked' && (
              <div style={{ marginTop: 12 }}>
                <FieldRow label="History Entity ID" required>
                  <select className="search-input" value={historyEntityId}
                    onChange={e => setHistoryEntityId(e.target.value)}>
                    <option value="">— Select history entity —</option>
                    {allEntities.map(e => (
                      <option key={e.entityType} value={e.entityType}>{e.label} ({e.entityType})</option>
                    ))}
                  </select>
                </FieldRow>
              </div>
            )}
          </div>
        );

      // ── Step 9: Review & Create ──────────────────────────────────────────
      case 9: {
        const archetypeCfg = archetype ? ARCHETYPE_CONFIG[archetype] : null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
            }}>
              {/* Identity */}
              <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Identity</p>
                <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>{relLabel || '—'}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', margin: 0 }}>{relApiName}</p>
              </div>

              {/* Archetype */}
              <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Architecture</p>
                {archetypeCfg && (
                  <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: archetypeCfg.bgColor, color: archetypeCfg.color, fontWeight: 600 }}>
                    {archetypeCfg.label}
                  </span>
                )}
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 0' }}>
                  {cardinality.replace(/_/g, ':')} · {integrityMode.replace(/_/g, ' ')}
                </p>
              </div>

              {/* Endpoints */}
              <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Endpoints</p>
                <p style={{ fontSize: 12, fontFamily: 'monospace', margin: '0 0 4px' }}>
                  {sourceEntityId || '—'} → {
                    isPolymorphic
                      ? `[${allowedEntityIds.join(', ')}]`
                      : isExternal
                        ? externalSystemCode
                        : (targetEntityId || '—')
                  }
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
                  Scope: {scopePolicy.replace(/_/g, ' ')}
                </p>
              </div>

              {/* Capabilities */}
              <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Capabilities</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[
                    ['Forward Nav', forwardNavigation],
                    ['Reverse Nav', reverseNavigation],
                    ['Expand', expandAllowed],
                    ['Filter Across', filterAcrossAllowed],
                    ['Create Link', createLinkAllowed],
                    ['Change Link', changeLinkAllowed],
                  ].map(([label, val]) => (
                    <span key={label as string} style={{
                      fontSize: 11, padding: '2px 7px', borderRadius: 10,
                      background: val ? '#dcfce7' : '#fee2e2',
                      color: val ? '#166534' : '#991b1b',
                    }}>
                      {val ? '✓' : '✗'} {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Temporal */}
            {temporalMode !== 'current_only' && (
              <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Temporal</p>
                <p style={{ fontSize: 12, margin: 0 }}>
                  {temporalMode.replace(/_/g, ' ')}
                  {temporalMode === 'effective_dated' && effectiveFromFieldId && ` — from: ${effectiveFromFieldId}`}
                  {temporalMode === 'history_tracked' && historyEntityId && ` — history entity: ${historyEntityId}`}
                </p>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 8,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: 14,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Creating…' : 'Create Relationship'}
            </button>
          </div>
        );
      }

      default:
        return null;
    }
  }

  // ── Main layout ────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/admin/studio/relationships')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
        >
          <ChevronLeft size={16} /> Relationships
        </button>
        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitFork size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>Define Relationship</span>
        </div>
      </div>

      {/* Step progress bar */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        flexShrink: 0,
        background: 'var(--bg-secondary)',
      }}>
        {STEP_LABELS.map((label, idx) => {
          const isCompleted = idx < step;
          const isCurrent = idx === step;
          return (
            <React.Fragment key={idx}>
              <button
                onClick={() => idx < step && setStep(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: 'none',
                  background: isCurrent ? 'var(--accent)' : isCompleted ? 'hsl(22 100% 51% / 0.12)' : 'transparent',
                  color: isCurrent ? '#fff' : isCompleted ? 'var(--accent)' : 'var(--muted)',
                  cursor: isCompleted ? 'pointer' : 'default',
                  fontWeight: isCurrent ? 700 : 500,
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {isCompleted ? <Check size={11} /> : (
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: isCurrent ? 'rgba(255,255,255,0.3)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700,
                  }}>
                    {idx + 1}
                  </span>
                )}
                {label}
              </button>
              {idx < STEP_LABELS.length - 1 && (
                <div style={{ width: 16, height: 1, background: 'var(--border)', flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>
            Step {step + 1}: {STEP_LABELS[step]}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 20px' }}>
            {archetype && step > 1 && (
              <span style={{ marginRight: 8 }}>
                Archetype: <strong>{ARCHETYPE_CONFIG[archetype].label}</strong>
              </span>
            )}
          </p>
          {renderStep()}
        </div>
      </div>

      {/* Navigation footer */}
      {step < 9 && (
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <button
            onClick={handleBack}
            disabled={step === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: step === 0 ? 'var(--muted)' : 'var(--text)',
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: 13,
              opacity: step === 0 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={15} /> Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: canAdvance() ? 'var(--accent)' : 'var(--border)',
              color: canAdvance() ? '#fff' : 'var(--muted)',
              cursor: canAdvance() ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
