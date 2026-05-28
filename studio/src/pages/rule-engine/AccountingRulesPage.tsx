/**
 * Accounting Rules Page — GL posting rule configuration hub
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Plus } from 'lucide-react';
import {
  getAccountingRules,
  getAccountingStats,
  getPostingTemplateById,
} from '../../data/accountingService';
import { ACCOUNTING_EVENT_LABELS } from '../../metadata/accounting-rules-definition';
import type { AccountingEvent } from '../../metadata/accounting-rules-definition';

export default function AccountingRulesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<AccountingEvent | ''>('');

  const stats = useMemo(() => getAccountingStats(), []);
  const rules = useMemo(
    () => getAccountingRules({ event: eventFilter || undefined, search: search || undefined }),
    [search, eventFilter],
  );

  return (
    <div className="content" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={20} />
            Accounting Rules
          </h1>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>
            {stats.totalRules} rules · {stats.totalTemplates} templates
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/studio/rule-engine/accounting/new')}>
          <Plus size={14} /> New Accounting Rule
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounting rules…"
            style={{ width: '100%', paddingLeft: 28, fontSize: 12, padding: '6px 8px 6px 28px', borderRadius: 6, border: '1px solid var(--border)' }}
          />
        </div>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value as AccountingEvent | '')}
          style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)' }}
        >
          <option value="">All Events</option>
          {Object.entries(ACCOUNTING_EVENT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Rules Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Rule Name</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Event</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Template</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Entity</th>
            <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Priority</th>
          </tr>
        </thead>
        <tbody>
          {rules.map(rule => {
            const tpl = getPostingTemplateById(rule.postingTemplateId);
            return (
              <tr key={rule.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{rule.name}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--bg-subtle)' }}>
                    {ACCOUNTING_EVENT_LABELS[rule.event]}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 11 }}>{tpl?.displayName || rule.postingTemplateId}</td>
                <td style={{ padding: '10px 12px', fontSize: 11, textTransform: 'capitalize' }}>{rule.entityType.replace(/_/g, ' ')}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>{rule.priority}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rules.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No accounting rules match the current filters.</div>
      )}
    </div>
  );
}
