// ============================================================
// RelationshipInspector — 13-section accordion for RelationshipBuilderPage
// ============================================================
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { RelationshipDefinition } from '../../types/relationshipDesigner';
import type { EntityDefinition } from '../../types/entityDesigner';

interface Props {
  relationship: RelationshipDefinition;
  entities: EntityDefinition[];
}

// ── Accordion helpers ─────────────────────────────────────────
interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: open ? 'var(--bg-secondary)' : 'var(--bg)',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '0.02em',
        }}
      >
        {title}
        {open ? <ChevronDown size={13} style={{ color: 'var(--muted)' }} /> : <ChevronRight size={13} style={{ color: 'var(--muted)' }} />}
      </button>
      {open && (
        <div style={{ padding: '10px 14px', background: 'var(--bg)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── KV row helper ─────────────────────────────────────────────
function KVRow({ label, value, mono }: { label: string; value?: string | null | boolean; mono?: boolean }) {
  if (value === undefined || value === null || value === '') return null;
  const displayVal = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '140px 1fr',
      gap: 6,
      padding: '3px 0',
      fontSize: 12,
    }}>
      <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
      <span style={{
        color: 'var(--text)',
        fontFamily: mono ? 'monospace' : undefined,
        wordBreak: 'break-word',
      }}>{displayVal}</span>
    </div>
  );
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 8,
      background: bg,
      color,
      display: 'inline-block',
      marginRight: 4,
      marginBottom: 4,
    }}>
      {label}
    </span>
  );
}

function ToggleBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '3px 0',
      fontSize: 12,
    }}>
      <div style={{
        width: 28,
        height: 15,
        borderRadius: 8,
        background: value ? 'var(--accent)' : 'var(--border)',
        position: 'relative',
        flexShrink: 0,
      }}>
        <div style={{
          width: 11,
          height: 11,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          left: value ? 15 : 2,
          transition: 'left 0.15s',
        }} />
      </div>
      <span style={{ color: value ? 'var(--text)' : 'var(--muted)' }}>{label}</span>
    </div>
  );
}

function cleanLabel(str: string) {
  return str.replace(/_/g, ' ');
}

// ── Main component ────────────────────────────────────────────
export function RelationshipInspector({ relationship: rel, entities }: Props) {
  const sourceEntity = entities.find(e => e.entityType === rel.source.entityId);
  const targetEntity = entities.find(e => e.entityType === rel.target.entityId);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>

      {/* 1. Identity */}
      <Section title="1. Identity" defaultOpen>
        <KVRow label="Relationship ID"  value={rel.relationshipId} mono />
        <KVRow label="API Name"         value={rel.apiName} mono />
        <KVRow label="Label"            value={rel.label} />
        <KVRow label="Description"      value={rel.description} />
        <KVRow label="Semantic Intent"  value={cleanLabel(rel.semanticIntent)} />
        <KVRow label="Archetype"        value={cleanLabel(rel.relationshipArchetype)} />
        <KVRow label="Cardinality"      value={cleanLabel(rel.cardinality)} />
        <KVRow label="Endpoint Topology" value={cleanLabel(rel.endpointTopology)} />
      </Section>

      {/* 2. Endpoints */}
      <Section title="2. Endpoints">
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Source</div>
          <KVRow label="Entity"    value={rel.source.entityId} mono />
          <KVRow label="Role Code" value={rel.source.roleCode} mono />
          <KVRow label="Role Label" value={rel.source.roleLabel} />
          <KVRow label="Key Fields" value={rel.source.fieldIds?.join(', ')} mono />
          {sourceEntity && <KVRow label="Entity Label" value={sourceEntity.label} />}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Target</div>
          {rel.target.entityId && <KVRow label="Entity" value={rel.target.entityId} mono />}
          {rel.target.allowedEntityIds && (
            <KVRow label="Allowed Entities" value={rel.target.allowedEntityIds.join(', ')} mono />
          )}
          {rel.target.externalSystemCode && <KVRow label="External System" value={rel.target.externalSystemCode} mono />}
          {rel.target.externalEntityCode && <KVRow label="External Entity" value={rel.target.externalEntityCode} mono />}
          <KVRow label="Role Code"  value={rel.target.roleCode} mono />
          <KVRow label="Role Label" value={rel.target.roleLabel} />
          {targetEntity && <KVRow label="Entity Label" value={targetEntity.label} />}
        </div>
      </Section>

      {/* 3. Key Binding */}
      <Section title="3. Key Binding">
        <KVRow label="Strategy"           value={cleanLabel(rel.keyBinding.strategy)} />
        <KVRow label="Source Fields"      value={rel.keyBinding.sourceFieldIds?.join(', ')} mono />
        <KVRow label="Target Key Fields"  value={rel.keyBinding.targetKeyFieldIds?.join(', ')} mono />
        <KVRow label="Composite Mode"     value={rel.keyBinding.compositeMatchMode} />
        <KVRow label="External Provider Key" value={rel.keyBinding.externalProviderKey} mono />
      </Section>

      {/* 4. Integrity */}
      <Section title="4. Integrity">
        <KVRow label="Mode"               value={cleanLabel(rel.integrity.mode ?? '')} />
        <KVRow label="Constraint Name"    value={rel.integrity.physicalConstraintName} mono />
        <KVRow label="Provider Binding"   value={rel.integrity.providerBindingId} mono />
        <KVRow label="Query Binding"      value={rel.integrity.queryBindingId} mono />
      </Section>

      {/* 5. Ownership & Security */}
      <Section title="5. Ownership & Security">
        <KVRow label="Coupling Mode"      value={cleanLabel(rel.ownership.couplingMode)} />
        <KVRow label="Orphan Policy"      value={rel.ownership.orphanPolicy ? cleanLabel(rel.ownership.orphanPolicy) : undefined} />
        <KVRow label="Security Inheritance" value={cleanLabel(rel.ownership.securityInheritance)} />
      </Section>

      {/* 6. Scope */}
      <Section title="6. Scope">
        <KVRow label="Policy"             value={cleanLabel(rel.scope.policy)} />
        <KVRow label="Cross-Scope Allowed" value={rel.scope.crossScopeAllowed} />
        <KVRow label="External Scope Mapping" value={rel.scope.externalScopeMappingId} mono />
      </Section>

      {/* 7. Lifecycle Policies */}
      <Section title="7. Lifecycle Policies">
        <KVRow label="On Target Hard Delete"   value={cleanLabel(rel.lifecyclePolicies.onTargetHardDelete)} />
        <KVRow label="On Target Soft Delete"   value={cleanLabel(rel.lifecyclePolicies.onTargetSoftDelete)} />
        <KVRow label="On Target Deactivate"    value={cleanLabel(rel.lifecyclePolicies.onTargetDeactivate)} />
        {rel.lifecyclePolicies.onParentStateChange && (
          <KVRow label="On Parent State Change" value={cleanLabel(rel.lifecyclePolicies.onParentStateChange)} />
        )}
        {rel.lifecyclePolicies.onReparent && (
          <KVRow label="On Reparent" value={cleanLabel(rel.lifecyclePolicies.onReparent)} />
        )}
        {rel.lifecyclePolicies.onScopeTransfer && (
          <KVRow label="On Scope Transfer" value={cleanLabel(rel.lifecyclePolicies.onScopeTransfer)} />
        )}
      </Section>

      {/* 8. Navigation Capabilities */}
      <Section title="8. Navigation Capabilities">
        <ToggleBadge label="Forward Navigation"    value={rel.navigationCapabilities.forwardNavigation} />
        <ToggleBadge label="Reverse Navigation"    value={rel.navigationCapabilities.reverseNavigation} />
        <ToggleBadge label="Expand Allowed"        value={rel.navigationCapabilities.expandAllowed} />
        <ToggleBadge label="Filter Across Allowed" value={rel.navigationCapabilities.filterAcrossAllowed} />
        <ToggleBadge label="Sort Across Allowed"   value={rel.navigationCapabilities.sortAcrossAllowed} />
        <ToggleBadge label="Aggregate Across"      value={rel.navigationCapabilities.aggregateAcrossAllowed} />
        <KVRow label="Capability Source" value={rel.navigationCapabilities.capabilitySource} />
      </Section>

      {/* 9. Link Mutation */}
      <Section title="9. Link Mutation">
        <KVRow label="Mode" value={cleanLabel(rel.linkMutationCapabilities.mode)} />
        <ToggleBadge label="Create Link Allowed" value={rel.linkMutationCapabilities.createLinkAllowed} />
        <ToggleBadge label="Change Link Allowed" value={rel.linkMutationCapabilities.changeLinkAllowed} />
        <ToggleBadge label="Remove Link Allowed" value={rel.linkMutationCapabilities.removeLinkAllowed} />
        <KVRow label="Capability Source" value={rel.linkMutationCapabilities.capabilitySource} />
      </Section>

      {/* 10. Temporal Semantics */}
      <Section title="10. Temporal Semantics">
        <KVRow label="Mode"                    value={cleanLabel(rel.temporalSemantics.mode)} />
        <KVRow label="Effective From Field"    value={rel.temporalSemantics.effectiveFromFieldId} mono />
        <KVRow label="Effective To Field"      value={rel.temporalSemantics.effectiveToFieldId} mono />
        <KVRow label="History Entity"          value={rel.temporalSemantics.historyEntityId} mono />
      </Section>

      {/* 11. Bindings */}
      <Section title="11. Bindings">
        {rel.bindings ? (
          <>
            <KVRow label="Eligibility Policy"    value={rel.bindings.targetEligibilityPolicyId} mono />
            <KVRow label="Lookup Definition"     value={rel.bindings.lookupDefinitionId} mono />
            <KVRow label="Relation Views"        value={rel.bindings.relationViewIds?.join(', ')} mono />
            <KVRow label="Snapshot Derivations"  value={rel.bindings.snapshotDerivationIds?.join(', ')} mono />
            <KVRow label="Validation Rules"      value={rel.bindings.validationRuleIds?.join(', ')} mono />
          </>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>No bindings configured</span>
        )}
      </Section>

      {/* 12. Governance */}
      <Section title="12. Governance">
        {rel.governance ? (
          <>
            <KVRow label="Owning Layer"           value={rel.governance.owningLayer} />
            <KVRow label="Owning Package"         value={rel.governance.owningPackageId} mono />
            <KVRow label="Protected"              value={rel.governance.protected} />
            <KVRow label="Downstream Decorate"    value={rel.governance.canDownstreamDecorate} />
            <KVRow label="Downstream Constrain"   value={rel.governance.canDownstreamConstrain} />
            <KVRow label="Downstream Relax"       value={rel.governance.canDownstreamRelax} />
            <KVRow label="Downstream Disable"     value={rel.governance.canDownstreamDisable} />
          </>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>No governance metadata</span>
        )}
      </Section>

      {/* 13. Lifecycle */}
      <Section title="13. Lifecycle">
        <KVRow label="Metadata Status" value={rel.lifecycle.metadataStatus} />
        <KVRow label="Version"         value={rel.lifecycle.version} />
        <KVRow label="Created At"      value={rel.createdAt} />
        <KVRow label="Last Modified"   value={rel.lastModified} />
      </Section>

    </div>
  );
}
