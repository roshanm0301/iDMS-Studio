// ============================================================
// ArchetypeGrid — 10-card archetype selector for wizard step 2
// All 10 archetypes are fully selectable (none deferred)
// ============================================================
import React from 'react';
import {
  ArrowRight, Layers, Link2, RotateCcw, GitBranch, Shuffle,
  Globe, Search, Zap, BarChart2,
} from 'lucide-react';
import type { RelationshipArchetype } from '../../types/relationshipDesigner';
import { ARCHETYPE_CONFIG } from '../../types/relationshipDesigner';

const ICON_MAP: Record<RelationshipArchetype, React.ReactNode> = {
  lookup_reference:           <ArrowRight size={22} />,
  composition_owned_child:    <Layers size={22} />,
  junction_association:       <Link2 size={22} />,
  self_reference:             <RotateCcw size={22} />,
  self_hierarchy:             <GitBranch size={22} />,
  polymorphic_reference:      <Shuffle size={22} />,
  external_lookup:            <Globe size={22} />,
  indirect_external_lookup:   <Search size={22} />,
  synthetic_virtual_relation: <Zap size={22} />,
  projection_relation:        <BarChart2 size={22} />,
};

const GROUP_ORDER = ['Core', 'External', 'Derived'];
const ARCHETYPES_BY_GROUP: Record<string, RelationshipArchetype[]> = {
  Core: [
    'lookup_reference',
    'composition_owned_child',
    'junction_association',
    'self_reference',
    'self_hierarchy',
    'polymorphic_reference',
  ],
  External: [
    'external_lookup',
    'indirect_external_lookup',
  ],
  Derived: [
    'synthetic_virtual_relation',
    'projection_relation',
  ],
};

interface ArchetypeGridProps {
  selected: RelationshipArchetype | null;
  onSelect: (a: RelationshipArchetype) => void;
  /** Optionally restrict which archetypes are shown (e.g. filtered by semantic intent) */
  filtered?: RelationshipArchetype[];
}

export function ArchetypeGrid({ selected, onSelect, filtered }: ArchetypeGridProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {GROUP_ORDER.map(group => {
        const archetypes = ARCHETYPES_BY_GROUP[group].filter(
          a => !filtered || filtered.includes(a)
        );
        if (archetypes.length === 0) return null;

        return (
          <div key={group}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 10,
            }}>
              {group}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 10,
            }}>
              {archetypes.map(archetype => {
                const cfg = ARCHETYPE_CONFIG[archetype];
                const isSelected = selected === archetype;

                return (
                  <button
                    key={archetype}
                    onClick={() => onSelect(archetype)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      background: isSelected
                        ? `hsl(22 100% 51% / 0.07)`
                        : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    {/* Icon + label row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: cfg.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: cfg.color,
                        flexShrink: 0,
                      }}>
                        {ICON_MAP[archetype]}
                      </div>
                      <span style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: isSelected ? 'var(--accent)' : 'var(--text)',
                      }}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      margin: 0,
                      lineHeight: 1.45,
                    }}>
                      {cfg.description}
                    </p>

                    {/* Group tag */}
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: 10,
                      background: cfg.bgColor,
                      color: cfg.color,
                      marginTop: 2,
                    }}>
                      {cfg.group}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
