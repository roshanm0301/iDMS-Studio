import { useState } from 'react';
import {
  Check, X, Eye, EyeOff, Lock, ShieldCheck, ShieldOff, ShieldAlert,
} from 'lucide-react';
import { getPermissionRules, getEntitySchema, getRoles } from '../../data/mockService';
import { useStudioStore } from '../../hooks/useStudioStore';
import LayerBadge from '../ui/LayerBadge';
import type { Role, PermissionRule } from '../../types';

interface Props {
  artifactKey: string;
}

const TABS = ['Action Access', 'Field Visibility', 'Row Filters', 'Effective Preview'] as const;
type Tab = (typeof TABS)[number];

const MATRIX_ROLES: string[] = [
  'OEM_ADMIN',
  'DEALER_PRINCIPAL',
  'SALES_MANAGER',
  'SALES_EXECUTIVE',
  'SERVICE_MANAGER',
];

const ACTIONS = ['create', 'read', 'update', 'submit', 'approve', 'reject', 'delete'];

const STUDIO_ACCESS_LABELS: Record<string, string> = {
  full: 'Full',
  tenant_admin: 'Tenant Admin',
  read_and_approve: 'Read & Approve',
  none: 'No Access',
  module_read: 'Module Read',
};

const STUDIO_ACCESS_CLASS: Record<string, string> = {
  full: 'green',
  tenant_admin: 'violet',
  read_and_approve: 'amber',
  none: 'red',
  module_read: '',
};

function AccessCell({ effect }: { effect?: 'ALLOW' | 'DENY' | 'CONDITIONAL' | null }) {
  if (!effect) {
    return <span style={{ color: 'var(--text-subtle)', fontSize: 13 }}>—</span>;
  }
  if (effect === 'ALLOW') {
    return (
      <span className="perm-allow" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
        <Check size={13} strokeWidth={2.5} />
        Allow
      </span>
    );
  }
  if (effect === 'DENY') {
    return (
      <span className="perm-deny" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
        <X size={13} strokeWidth={2.5} />
        Deny
      </span>
    );
  }
  return (
    <span className="perm-conditional" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
      <ShieldAlert size={13} />
      Cond.
    </span>
  );
}

function EditableAccessCell({
  effect,
  artifactKey,
  roleCode,
  action,
}: {
  effect: 'ALLOW' | 'DENY' | 'CONDITIONAL' | null;
  artifactKey: string;
  roleCode: string;
  action: string;
}) {
  const setPermission = useStudioStore(s => s.setPermission);
  const savedPermissions = useStudioStore(s => s.savedPermissions);
  const key = `${artifactKey}||${roleCode}||${action}`;
  const current = (savedPermissions[key] as 'ALLOW' | 'DENY' | undefined) ?? effect;

  function cycle() {
    const next = current === 'ALLOW' ? 'DENY' : 'ALLOW';
    setPermission(artifactKey, roleCode, action, next);
  }

  return (
    <button
      onClick={cycle}
      style={{
        background: 'none',
        border: `1px solid ${current === 'ALLOW' ? 'var(--green)' : current === 'DENY' ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 5,
        padding: '3px 8px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        color: current === 'ALLOW' ? 'var(--green)' : current === 'DENY' ? 'var(--red)' : 'var(--text-muted)',
        transition: 'all 0.12s',
      }}
      title="Click to toggle Allow / Deny"
    >
      {current === 'ALLOW' && <><Check size={12} strokeWidth={2.5} /> Allow</>}
      {current === 'DENY'  && <><X size={12} strokeWidth={2.5} /> Deny</>}
      {!current            && <span style={{ opacity: 0.5 }}>—</span>}
    </button>
  );
}

function ActionAccessTab({ artifactKey }: { artifactKey: string }) {
  const allRoles: Role[] = getRoles();
  const permRules: PermissionRule[] = getPermissionRules(artifactKey);
  const entityName = artifactKey.replace('entity.', '').replace('permission.', '');

  const roleObjects = MATRIX_ROLES.map(rc => allRoles.find(r => r.role_code === rc)).filter(Boolean) as Role[];

  function getEffect(roleCode: string, action: string): 'ALLOW' | 'DENY' | 'CONDITIONAL' | null {
    // wildcard rule first
    const wildcard = permRules.find(
      p =>
        (p.role_code === roleCode || (p as any).role_ref === roleCode) &&
        (p.resource_ref?.includes(entityName)) &&
        p.action_ref === '*',
    );
    if (wildcard) return wildcard.effect;

    const match = permRules.find(
      p =>
        (p.role_code === roleCode || (p as any).role_ref === roleCode) &&
        (p.resource_ref?.includes(entityName)) &&
        p.action_ref === action,
    );
    if (!match) return null;
    if (match.condition || (match as any).conditions) {
      const cond = match.condition ?? (match as any).conditions;
      if (typeof cond === 'string' && !cond.includes('{actor')) return match.effect;
      return 'CONDITIONAL';
    }
    return match.effect;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="matrix-table">
        <thead>
          <tr>
            <th style={{ minWidth: 200, textAlign: 'left' }}>Role</th>
            {ACTIONS.map(a => (
              <th key={a} style={{ textTransform: 'capitalize' }}>{a}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roleObjects.map(role => {
            const saClass = STUDIO_ACCESS_CLASS[role.studio_access] || '';
            return (
              <tr key={role.role_code}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{role.role_name}</span>
                    <span className={`tag${saClass ? ' ' + saClass : ''}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                      {STUDIO_ACCESS_LABELS[role.studio_access] ?? role.studio_access}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {role.role_code}
                  </div>
                </td>
                {ACTIONS.map(action => (
                  <td key={action}>
                    <EditableAccessCell
                      effect={getEffect(role.role_code, action)}
                      artifactKey={artifactKey}
                      roleCode={role.role_code}
                      action={action}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function VisibilityCell({ vis }: { vis?: string }) {
  if (vis === 'hidden') {
    return (
      <span className="perm-deny" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12 }}>
        <EyeOff size={13} />
        Hidden
      </span>
    );
  }
  if (vis === 'readonly') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--text-muted)' }}>
        <Lock size={13} />
        Read-only
      </span>
    );
  }
  if (vis === 'visible') {
    return (
      <span className="perm-allow" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12 }}>
        <Eye size={13} />
        Visible
      </span>
    );
  }
  return <span style={{ color: 'var(--text-subtle)', fontSize: 13 }}>—</span>;
}

function FieldVisibilityTab({ artifactKey }: { artifactKey: string }) {
  const schema = getEntitySchema(artifactKey);
  const allRoles: Role[] = getRoles();
  const roleObjects = MATRIX_ROLES.map(rc => allRoles.find(r => r.role_code === rc)).filter(Boolean) as Role[];

  if (!schema) {
    return <div className="empty"><p className="empty-title">No schema found.</p></div>;
  }

  const fields = schema.fields.slice(0, 8);

  function truncate(s: string, max = 12) {
    return s.length > max ? s.slice(0, max) + '…' : s;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="matrix-table">
        <thead>
          <tr>
            <th style={{ minWidth: 180, textAlign: 'left' }}>Role</th>
            {fields.map(f => (
              <th key={f.field_id ?? (f as any).name} title={(f as any).label ?? f.field_id}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {f.protected && <Lock size={11} style={{ color: 'var(--amber)' }} />}
                  {truncate((f as any).label ?? f.field_id)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roleObjects.map(role => (
            <tr key={role.role_code}>
              <td>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{role.role_name}</span>
                <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                  {role.role_code}
                </div>
              </td>
              {fields.map(f => {
                const vbr = f.visibility_by_role ?? {};
                const vis = vbr[role.role_code] ?? (f.visibility ?? 'visible');
                return (
                  <td key={f.field_id ?? (f as any).name}>
                    <VisibilityCell vis={vis} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ROW_FILTER_MEANINGS: Record<string, string> = {
  'created_by = {actor.user_id}': 'Own records only',
  'node_id = {actor.node_id}': 'Current node records only',
  'tenant_id = {actor.tenant_id}': 'All tenant records',
};

function RowFiltersTab({ artifactKey }: { artifactKey: string }) {
  const permRules: PermissionRule[] = getPermissionRules(artifactKey);
  const allRoles: Role[] = getRoles();

  const rowFilterRules = permRules.filter(
    p => p.action_ref === 'row_filter' && (p.condition || (p as any).conditions),
  );

  if (rowFilterRules.length === 0) {
    return (
      <div className="empty">
        <ShieldCheck size={36} style={{ color: 'var(--text-subtle)' }} />
        <p className="empty-title">No row filters defined</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>All roles can access all rows matching their permission scope.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Role</th>
            <th>Resource</th>
            <th>Filter Condition</th>
            <th>Meaning</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {rowFilterRules.map(rule => {
            const roleCode = (rule as any).role_ref ?? rule.role_code ?? '';
            const roleObj = allRoles.find(r => r.role_code === roleCode);
            const cond = rule.condition ?? (rule as any).conditions ?? '';
            const meaning = ROW_FILTER_MEANINGS[cond] ?? 'Custom filter';
            return (
              <tr key={rule.rule_id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{roleObj?.role_name ?? roleCode}</div>
                  <div className="muted mono" style={{ fontSize: 11 }}>{roleCode}</div>
                </td>
                <td>
                  <span className="mono" style={{ fontSize: 12 }}>{rule.resource_ref}</span>
                </td>
                <td>
                  <code
                    style={{
                      background: 'var(--bg-sunken)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: '2px 7px',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent)',
                    }}
                  >
                    {cond}
                  </code>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{meaning}</td>
                <td>
                  {rule.source_layer && (
                    <LayerBadge layer={rule.source_layer} small />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const COMMANDS = ['Submit', 'Approve', 'Reject', 'Delete', 'Update', 'Create'];

function EffectivePreviewTab({ artifactKey }: { artifactKey: string }) {
  const allRoles: Role[] = getRoles();
  const schema = getEntitySchema(artifactKey);
  const permRules: PermissionRule[] = getPermissionRules(artifactKey);

  const [selectedRole, setSelectedRole] = useState('SALES_EXECUTIVE');
  const [selectedNode, setSelectedNode] = useState('node_pune_central');
  const [selectedCommand, setSelectedCommand] = useState('Approve');
  const [recordId, setRecordId] = useState('ORD-00123');

  const entityName = artifactKey.replace('entity.', '').replace('permission.', '');
  const roleObj = allRoles.find(r => r.role_code === selectedRole);
  const action = selectedCommand.toLowerCase();

  function getActionEffect(): 'ALLOW' | 'DENY' | 'CONDITIONAL' | null {
    const wildcard = permRules.find(
      p =>
        ((p as any).role_ref === selectedRole || p.role_code === selectedRole) &&
        p.resource_ref?.includes(entityName) &&
        p.action_ref === '*',
    );
    if (wildcard) return wildcard.effect;

    const match = permRules.find(
      p =>
        ((p as any).role_ref === selectedRole || p.role_code === selectedRole) &&
        p.resource_ref?.includes(entityName) &&
        p.action_ref === action,
    );
    if (!match) return null;
    const cond = match.condition ?? (match as any).conditions;
    if (cond && typeof cond === 'string' && cond.includes('{actor')) return 'CONDITIONAL';
    return match.effect;
  }

  function getHiddenFields(): string[] {
    if (!schema) return [];
    return schema.fields
      .filter(f => {
        const vis = f.visibility_by_role?.[selectedRole] ?? f.visibility ?? 'visible';
        return vis === 'hidden';
      })
      .map(f => (f as any).label ?? f.field_id);
  }

  function getRowFilter(): string | null {
    const rf = permRules.find(
      p =>
        ((p as any).role_ref === selectedRole || p.role_code === selectedRole) &&
        p.resource_ref?.includes(entityName) &&
        p.action_ref === 'row_filter',
    );
    if (!rf) return null;
    return rf.condition ?? (rf as any).conditions ?? null;
  }

  const actionEffect = getActionEffect();
  const hiddenFields = getHiddenFields();
  const rowFilter = getRowFilter();
  const overallAllowed = actionEffect === 'ALLOW' || actionEffect === 'CONDITIONAL';

  function summaryMessage(): string {
    if (!overallAllowed) {
      return `${roleObj?.role_name ?? selectedRole} cannot ${action} this record. Permission is denied.`;
    }
    if (actionEffect === 'CONDITIONAL') {
      return `${roleObj?.role_name ?? selectedRole} can ${action} this record, subject to conditions.`;
    }
    return `${roleObj?.role_name ?? selectedRole} is allowed to ${action} record ${recordId}.`;
  }

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
        }}
      >
        <div className="col" style={{ gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Role
          </label>
          <select
            className="form-select"
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
          >
            {MATRIX_ROLES.map(rc => {
              const r = allRoles.find(x => x.role_code === rc);
              return (
                <option key={rc} value={rc}>
                  {r?.role_name ?? rc}
                </option>
              );
            })}
          </select>
        </div>

        <div className="col" style={{ gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Node
          </label>
          <select
            className="form-select"
            value={selectedNode}
            onChange={e => setSelectedNode(e.target.value)}
          >
            <option value="node_pune_central">Pune Central Branch</option>
            <option value="node_mumbai_west">Mumbai West Branch</option>
          </select>
        </div>

        <div className="col" style={{ gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Command
          </label>
          <select
            className="form-select"
            value={selectedCommand}
            onChange={e => setSelectedCommand(e.target.value)}
          >
            {COMMANDS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="col" style={{ gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Record ID
          </label>
          <input
            className="form-input"
            value={recordId}
            onChange={e => setRecordId(e.target.value)}
            placeholder="e.g. ORD-00123"
          />
        </div>
      </div>

      {/* Result summary banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderRadius: 'var(--radius-lg)',
          border: `1px solid ${overallAllowed ? 'var(--green)' : 'var(--red)'}`,
          background: overallAllowed ? 'var(--green-soft)' : 'var(--red-soft)',
        }}
      >
        {overallAllowed ? (
          <ShieldCheck size={22} style={{ color: 'var(--green)', flexShrink: 0 }} />
        ) : (
          <ShieldOff size={22} style={{ color: 'var(--red)', flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 13.5, fontWeight: 500, color: overallAllowed ? 'var(--green)' : 'var(--red)' }}>
          {summaryMessage()}
        </span>
      </div>

      {/* Detail cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* Action access */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 10 }}>
            Action Access
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AccessCell effect={actionEffect} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {actionEffect === 'CONDITIONAL' ? '(condition applies)' : actionEffect === null ? '(inherited)' : ''}
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            Resource: <span className="mono" style={{ fontSize: 11 }}>{entityName}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Action: <span className="mono" style={{ fontSize: 11 }}>{action}</span>
          </div>
        </div>

        {/* Field mask */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 10 }}>
            Field Mask
          </div>
          {hiddenFields.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green)' }}>
              <Eye size={14} />
              All fields visible
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {hiddenFields.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--red)' }}>
                  <EyeOff size={13} />
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row filter */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 10 }}>
            Row Filter
          </div>
          {rowFilter ? (
            <>
              <code
                style={{
                  display: 'block',
                  background: 'var(--bg-sunken)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 11.5,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent)',
                  wordBreak: 'break-all',
                }}
              >
                {rowFilter}
              </code>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                {ROW_FILTER_MEANINGS[rowFilter] ?? 'Custom filter condition'}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No row filter — full access</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PermissionMatrix({ artifactKey }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Action Access');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub-tab bar */}
      <div className="cockpit-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`cockpit-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'Action Access' && <ActionAccessTab artifactKey={artifactKey} />}
        {activeTab === 'Field Visibility' && <FieldVisibilityTab artifactKey={artifactKey} />}
        {activeTab === 'Row Filters' && <RowFiltersTab artifactKey={artifactKey} />}
        {activeTab === 'Effective Preview' && <EffectivePreviewTab artifactKey={artifactKey} />}
      </div>
    </div>
  );
}
