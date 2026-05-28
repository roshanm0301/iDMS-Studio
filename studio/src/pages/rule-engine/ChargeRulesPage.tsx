/**
 * Charge & Discount Rules Page — CHG-ADM-001
 *
 * Lists charge rules with stats, filters by method/timing/category.
 * Follows Admin Studio navigation under "Commercial Rules".
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Plus, Search, Tag, Percent, Calculator, Layers,
} from 'lucide-react';
import { getChargeRules, getChargeMasters, getChargeRuleStats } from '../../data/chargeService';
import {
  CALCULATION_METHOD_LABELS,
  TAX_TIMING_LABELS,
  CHARGE_CATEGORY_LABELS,
  CHARGE_CATEGORIES,
  CONFLICT_STRATEGY_LABELS,
} from '../../metadata/charge-discount-definition';
import type { CalculationMethod, ChargeCategory } from '../../metadata/charge-discount-definition';

const METHOD_ICONS: Record<string, typeof DollarSign> = {
  fixed_amount: DollarSign,
  percentage: Percent,
  formula: Calculator,
  slab_tier: Layers,
};

export default function ChargeRulesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<CalculationMethod | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<ChargeCategory | ''>('');

  const stats = useMemo(() => getChargeRuleStats(), []);
  const masters = useMemo(() => getChargeMasters(), []);
  const rules = useMemo(
    () =>
      getChargeRules({
        calculationMethod: methodFilter || undefined,
        category: categoryFilter || undefined,
        search: search || undefined,
      }),
    [search, methodFilter, categoryFilter],
  );

  return (
    <div className="content" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag size={20} />
            Charge & Discount Rules
          </h1>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>
            {stats.totalRules} rules · {stats.totalMasters} charge masters ({stats.activeMasters} active)
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/studio/rule-engine/charges/new')}>
          <Plus size={14} /> New Charge Rule
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(stats.byMethod).map(([method, count]) => {
          const Icon = METHOD_ICONS[method] || DollarSign;
          return (
            <div
              key={method}
              onClick={() => setMethodFilter(method === methodFilter ? '' : method as CalculationMethod)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                backgroundColor: method === methodFilter ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
                border: `1px solid ${method === methodFilter ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Icon size={12} />
              <span style={{ fontWeight: 500 }}>{CALCULATION_METHOD_LABELS[method as CalculationMethod]}</span>
              <span style={{ color: 'var(--muted)' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search charge rules…"
            style={{ width: '100%', paddingLeft: 28, fontSize: 12, padding: '6px 8px 6px 28px', borderRadius: 6, border: '1px solid var(--border)' }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as ChargeCategory | '')}
          style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)' }}
        >
          <option value="">All Categories</option>
          {CHARGE_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{CHARGE_CATEGORY_LABELS[cat]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Charge</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Condition</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Method</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Tax Timing</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Scope</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Entity</th>
            <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Seq</th>
          </tr>
        </thead>
        <tbody>
          {rules.map(rule => {
            const master = masters.find(m => m.id === rule.chargeMasterId);
            const Icon = METHOD_ICONS[rule.calculationMethod] || DollarSign;
            return (
              <tr
                key={rule.id}
                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => navigate(`/admin/studio/rule-engine/charges/${rule.id}/edit`)}
              >
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 500 }}>{master?.displayName || rule.chargeMasterId}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {master ? CHARGE_CATEGORY_LABELS[master.category] : ''}
                    {rule.conflictStrategy ? ` · ${CONFLICT_STRATEGY_LABELS[rule.conflictStrategy]}` : ''}
                  </div>
                </td>
                <td style={{ padding: '10px 12px', maxWidth: 200 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{rule.displayCondition || '—'}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--bg-subtle)' }}>
                    <Icon size={10} /> {CALCULATION_METHOD_LABELS[rule.calculationMethod]}
                    {rule.calculationMethod === 'fixed_amount' && rule.fixedAmount !== undefined && ` ₹${rule.fixedAmount.toLocaleString()}`}
                    {rule.calculationMethod === 'percentage' && rule.percentage !== undefined && ` ${rule.percentage}%`}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: rule.taxTiming === 'pre_tax' ? '#DBEAFE' : rule.taxTiming === 'post_tax' ? '#FEF3C7' : 'var(--bg-subtle)',
                    color: rule.taxTiming === 'pre_tax' ? '#1E40AF' : rule.taxTiming === 'post_tax' ? '#92400E' : 'var(--muted)',
                  }}>
                    {TAX_TIMING_LABELS[rule.taxTiming]}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 11 }}>{rule.scope === 'header' ? 'Header' : 'Line'}</td>
                <td style={{ padding: '10px 12px', fontSize: 11 }}>{rule.entityType}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11 }}>{rule.sequence}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rules.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          No charge rules match the current filters.
        </div>
      )}
    </div>
  );
}
