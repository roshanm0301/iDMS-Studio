/**
 * Tax Rules Page — Tax Configuration hub
 *
 * Shows tax rules, groups, components, and rates in a unified view.
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt, Plus, Search, Globe,
} from 'lucide-react';
import { getTaxRules, getTaxGroups, getTaxStats } from '../../data/taxService';
import {
  TAX_REGIME_LABELS,
  TAX_REGIMES,
  TAX_TREATMENT_LABELS,
} from '../../metadata/tax-rules-definition';
import type { TaxRegime } from '../../metadata/tax-rules-definition';

export default function TaxRulesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [regimeFilter, setRegimeFilter] = useState<TaxRegime | ''>('');

  const stats = useMemo(() => getTaxStats(), []);
  const groups = useMemo(() => getTaxGroups(), []);
  const rules = useMemo(
    () => getTaxRules({ regime: regimeFilter || undefined, search: search || undefined }),
    [search, regimeFilter],
  );

  return (
    <div className="content" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={20} />
            Tax Configuration
          </h1>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>
            {stats.totalRules} rules · {stats.totalGroups} groups · {stats.totalComponents} components · {stats.totalRates} rates
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/studio/rule-engine/tax/new')}>
          <Plus size={14} /> New Tax Rule
        </button>
      </div>

      {/* Regime cards */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TAX_REGIMES.filter(r => (stats.byRegime as Record<string, number>)[r] > 0 || r === 'gst' || r === 'vat').map(regime => (
          <div
            key={regime}
            onClick={() => setRegimeFilter(regime === regimeFilter ? '' : regime)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              backgroundColor: regime === regimeFilter ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
              border: `1px solid ${regime === regimeFilter ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Globe size={12} />
            <span style={{ fontWeight: 500 }}>{TAX_REGIME_LABELS[regime]}</span>
            <span style={{ color: 'var(--muted)' }}>{(stats.byRegime as Record<string, number>)[regime] || 0}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tax rules…"
            style={{ width: '100%', paddingLeft: 28, fontSize: 12, padding: '6px 8px 6px 28px', borderRadius: 6, border: '1px solid var(--border)' }}
          />
        </div>
      </div>

      {/* Tax Rules Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Rule Name</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Regime</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Tax Group</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Treatment</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Condition</th>
            <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Priority</th>
          </tr>
        </thead>
        <tbody>
          {rules.map(rule => {
            const group = groups.find(g => g.id === rule.outputTaxGroupId);
            return (
              <tr
                key={rule.id}
                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => navigate(`/admin/studio/rule-engine/tax/${rule.id}`)}
              >
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 500 }}>{rule.name}</div>
                  {rule.isDefault && (
                    <span style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, backgroundColor: '#DBEAFE', color: '#1E40AF' }}>Default</span>
                  )}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--bg-subtle)' }}>
                    {TAX_REGIME_LABELS[rule.regime]}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 11 }}>
                  {group?.displayName || rule.outputTaxGroupId}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: rule.outputTreatment === 'taxable' ? '#D1FAE5' :
                      rule.outputTreatment === 'exempt' ? '#FEF3C7' :
                      rule.outputTreatment === 'zero_rated' ? '#DBEAFE' : 'var(--bg-subtle)',
                    color: rule.outputTreatment === 'taxable' ? '#065F46' :
                      rule.outputTreatment === 'exempt' ? '#92400E' :
                      rule.outputTreatment === 'zero_rated' ? '#1E40AF' : 'var(--muted)',
                  }}>
                    {TAX_TREATMENT_LABELS[rule.outputTreatment]}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--muted)' }}>
                  {rule.displayCondition || '—'}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11 }}>{rule.priority}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rules.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          No tax rules match the current filters.
        </div>
      )}
    </div>
  );
}
