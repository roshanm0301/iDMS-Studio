/**
 * Calculation Engine Page — CALC-UI-001 through CALC-UI-007
 *
 * Lists calculation definitions with stats, filters, and a dependency graph view.
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator, Plus, Search, GitBranch, ArrowRight, AlertTriangle,
} from 'lucide-react';
import { getCalculations, getCalculationStats } from '../../data/calculationService';
import {
  CALCULATION_TYPES,
  CALCULATION_TYPE_LABELS,
  ROUNDING_MODE_LABELS,
  buildDependencyGraph,
} from '../../metadata/calculation-engine-definition';
import type { CalculationType, CalculationDefinition } from '../../metadata/calculation-engine-definition';

export default function CalculationEnginePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CalculationType | ''>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [view, setView] = useState<'list' | 'graph'>('list');

  const stats = useMemo(() => getCalculationStats(), []);
  const allCalcs = useMemo(() => getCalculations(), []);
  const calcs = useMemo(
    () =>
      getCalculations({
        calculationType: typeFilter || undefined,
        entityType: entityFilter || undefined,
        search: search || undefined,
      }),
    [search, typeFilter, entityFilter],
  );

  const graph = useMemo(() => buildDependencyGraph(allCalcs), [allCalcs]);

  return (
    <div className="content" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={20} />
            Calculation Engine
          </h1>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>
            {stats.total} calculations · {graph.hasCycle ? '⚠️ Cycle detected' : `${graph.executionOrder.length} in sequence`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${view === 'list' ? 'btn-primary' : ''}`}
            onClick={() => setView('list')}
          >
            List
          </button>
          <button
            className={`btn btn-sm ${view === 'graph' ? 'btn-primary' : ''}`}
            onClick={() => setView('graph')}
          >
            <GitBranch size={12} /> Dependency Graph
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/studio/rule-engine/calculations/new')}>
            <Plus size={14} /> New Calculation
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(stats.byType).map(([type, count]) => (
          <div
            key={type}
            onClick={() => setTypeFilter(type === typeFilter ? '' : type as CalculationType)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              backgroundColor: type === typeFilter ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
              border: `1px solid ${type === typeFilter ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontWeight: 500 }}>{CALCULATION_TYPE_LABELS[type as CalculationType] || type}</span>
            <span style={{ color: 'var(--muted)' }}>{count as number}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      {view === 'list' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search calculations…"
              style={{ width: '100%', paddingLeft: 28, fontSize: 12, padding: '6px 8px 6px 28px', borderRadius: 6, border: '1px solid var(--border)' }}
            />
          </div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)' }}
          >
            <option value="">All Entities</option>
            <option value="sale_invoice">Sale Invoice</option>
            <option value="delivery">Delivery</option>
            <option value="purchase_receipt">Purchase Receipt</option>
          </select>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Output</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Precision</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Dependencies</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Entity</th>
            </tr>
          </thead>
          <tbody>
            {calcs.map(calc => (
              <tr
                key={calc.id}
                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => navigate(`/admin/studio/rule-engine/calculation/${calc.id}`)}
              >
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 500 }}>{calc.name}</div>
                  {calc.description && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{calc.description}</div>
                  )}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--bg-subtle)' }}>
                    {CALCULATION_TYPE_LABELS[calc.calculationType]}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <code style={{ fontSize: 11, padding: '1px 4px', background: 'var(--bg-subtle)', borderRadius: 3 }}>{calc.outputField}</code>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 11 }}>
                  {calc.precision}dp · {ROUNDING_MODE_LABELS[calc.roundingMode]}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {calc.dependsOn.length > 0 ? (
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {calc.dependsOn.map(dep => {
                        const depCalc = allCalcs.find(c => c.id === dep);
                        return (
                          <span key={dep} style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, backgroundColor: 'var(--bg-subtle)', color: 'var(--muted)' }}>
                            {depCalc?.name || dep}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 11 }}>{calc.entityType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Dependency Graph view — CALC-UI-004 */}
      {view === 'graph' && (
        <DependencyGraphView calcs={allCalcs} graph={graph} />
      )}

      {view === 'list' && calcs.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          No calculations match the current filters.
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Dependency Graph Visual (CALC-UI-004)
// ═══════════════════════════════════════════════════════════════
function DependencyGraphView({ calcs, graph }: {
  calcs: CalculationDefinition[];
  graph: ReturnType<typeof buildDependencyGraph>;
}) {
  const calcMap = new Map(calcs.map(c => [c.id, c]));
  const maxLevel = Math.max(...graph.nodes.map(n => n.level), 0);

  // Group nodes by level
  const levels: { id: string; name: string; isInCycle: boolean }[][] = [];
  for (let i = 0; i <= maxLevel; i++) {
    levels.push(
      graph.nodes
        .filter(n => n.level === i)
        .map(n => ({ id: n.calcId, name: n.name, isInCycle: graph.cycleParticipants.includes(n.calcId) })),
    );
  }

  // Cycle participants go at end
  if (graph.cycleParticipants.length > 0) {
    levels.push(
      graph.cycleParticipants.map(id => ({
        id,
        name: calcMap.get(id)?.name || id,
        isInCycle: true,
      })),
    );
  }

  return (
    <div>
      {graph.hasCycle && (
        <div style={{ padding: '8px 12px', marginBottom: 12, borderRadius: 6, backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <AlertTriangle size={14} color="#991B1B" />
          <span>Circular dependency detected — publish blocked (CALC-SEQ-003). Participants: {graph.cycleParticipants.join(', ')}</span>
        </div>
      )}
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
        Execution order: {graph.executionOrder.map(id => calcMap.get(id)?.name || id).join(' → ')}
      </div>
      <div style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '12px 0' }}>
        {levels.map((level, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
              {i < levels.length - (graph.hasCycle ? 1 : 0) ? `Level ${i}` : '⚠️ Cycle'}
            </div>
            {level.map(node => (
              <div
                key={node.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `1px solid ${node.isInCycle ? '#FCA5A5' : 'var(--border)'}`,
                  backgroundColor: node.isInCycle ? '#FEF2F2' : 'var(--bg-subtle)',
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                }}
              >
                {node.name}
              </div>
            ))}
            {i < levels.length - 1 && (
              <ArrowRight size={14} color="var(--muted)" style={{ marginTop: 4 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
