import { AlertTriangle, Info, XCircle, ArrowRight, Workflow, Shield, Layout, Eye, Download, Code, BarChart2 } from 'lucide-react';
import { getFieldDependencies } from '../../data/mockService';
import type { DependencyType, DependencySeverity, FieldDependency } from '../../types/entityDesigner';

interface Props {
  entityType: string;
  fieldId: string;
  fieldLabel: string;
}

const TYPE_CONFIG: Record<DependencyType, { label: string; icon: React.ElementType; color: string }> = {
  rule: { label: 'Rules', icon: Code, color: '#7c3aed' },
  workflow: { label: 'Workflows', icon: Workflow as React.ElementType, color: '#2563eb' },
  permission: { label: 'Permissions', icon: Shield, color: '#059669' },
  layout: { label: 'Layouts', icon: Layout, color: '#d97706' },
  view: { label: 'Views', icon: Eye, color: '#0891b2' },
  import_export: { label: 'Imports / Exports', icon: Download, color: '#64748b' },
  report: { label: 'Reports', icon: BarChart2, color: '#c2410c' },
  api: { label: 'APIs', icon: Code, color: '#1d4ed8' },
};

const SEVERITY_CONFIG: Record<DependencySeverity, { label: string; color: string; icon: React.ElementType }> = {
  info: { label: 'Info', color: '#2563eb', icon: Info },
  warning: { label: 'Warning', color: '#f59e0b', icon: AlertTriangle },
  breaking: { label: 'Breaking', color: '#ef4444', icon: XCircle },
};

function DependencyGroup({ type, deps }: { type: DependencyType; deps: FieldDependency[] }) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
        <Icon size={13} style={{ color: cfg.color }} />
        <span>{cfg.label}</span>
        <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--muted)' }}>({deps.length})</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {deps.map((dep, i) => {
          const sevCfg = SEVERITY_CONFIG[dep.severity];
          const SevIcon = sevCfg.icon;
          return (
            <div key={i} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '12px', borderLeftWidth: '3px', borderLeftColor: sevCfg.color }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500, flex: 1 }}>{dep.name}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--muted)' }}>{dep.artifactKey}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: sevCfg.color, fontWeight: 600, fontSize: '11px' }}>
                  <SevIcon size={11} /> {sevCfg.label}
                </span>
              </div>
              <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>
                Field path: <code style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '1px 4px', borderRadius: '3px' }}>{dep.fieldPath}</code>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: sevCfg.color }}>
                <ArrowRight size={11} /> {dep.recommendedAction}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DependencyDetailsPanel({ entityType, fieldId, fieldLabel }: Props) {
  const deps = getFieldDependencies(entityType, fieldId);

  const grouped = deps.reduce<Partial<Record<DependencyType, FieldDependency[]>>>((acc, dep) => {
    if (!acc[dep.dependencyType]) acc[dep.dependencyType] = [];
    acc[dep.dependencyType]!.push(dep);
    return acc;
  }, {});

  const orderedTypes: DependencyType[] = ['rule', 'workflow', 'permission', 'layout', 'view', 'import_export', 'report', 'api'];

  if (deps.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
        <Info size={16} style={{ marginBottom: '8px' }} />
        <p style={{ margin: 0 }}>No known dependencies for <strong>{fieldLabel}</strong> in mock data.</p>
        <p style={{ margin: '4px 0 0', fontSize: '12px' }}>In production, this panel shows live dependency analysis from the rule engine and workflow service.</p>
      </div>
    );
  }

  const breaking = deps.filter(d => d.severity === 'breaking').length;
  const warnings = deps.filter(d => d.severity === 'warning').length;

  return (
    <div style={{ padding: '12px' }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Total: <strong>{deps.length}</strong></div>
        {breaking > 0 && <div style={{ fontSize: '12px', color: '#ef4444' }}><XCircle size={11} /> {breaking} breaking</div>}
        {warnings > 0 && <div style={{ fontSize: '12px', color: '#f59e0b' }}><AlertTriangle size={11} /> {warnings} warnings</div>}
      </div>

      {orderedTypes.map(type => {
        const typeDeps = grouped[type];
        if (!typeDeps?.length) return null;
        return <DependencyGroup key={type} type={type} deps={typeDeps} />;
      })}
    </div>
  );
}
