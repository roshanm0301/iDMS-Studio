// ============================================================
// Shared constants for Entity Designer — eliminates duplication
// across FieldGrid, FieldInspector, EntityContextBar, and others
// ============================================================
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import type { LayerCode } from '../types';
import type { FieldLifecycleState } from '../types/entityDesigner';

// ── Layer Colors (hex string) ─────────────────────────────────
// Used by EntityContextBar, FieldInspector, AddFieldDrawer, etc.
export const LAYER_COLORS: Record<LayerCode, string> = {
  platform: '#7c3aed',
  vertical: '#2563eb',
  tenant:   '#059669',
  node:     '#d97706',
  role:     '#e11d48',
};

// ── Layer Colors (chip / badge format) ───────────────────────
// Used by FieldGrid layer badges and filter buttons
export const LAYER_COLORS_CHIP: Record<LayerCode, { bg: string; text: string }> = {
  platform: { bg: 'rgba(124,58,237,0.12)', text: '#7c3aed' },
  vertical: { bg: 'rgba(37,99,235,0.12)',  text: '#2563eb' },
  tenant:   { bg: 'rgba(5,150,105,0.12)',  text: '#059669' },
  node:     { bg: 'rgba(217,119,6,0.12)',  text: '#d97706' },
  role:     { bg: 'rgba(225,29,72,0.12)',  text: '#e11d48' },
};

// ── Layer Colors (CSS class names) ───────────────────────────
// Used by EntityListPage and EntitySchemaRedirectPanel
export const LAYER_CSS_CLASSES: Record<LayerCode, string> = {
  platform: 'layer-platform',
  vertical: 'layer-vertical',
  tenant:   'layer-tenant',
  node:     'layer-node',
  role:     'layer-role',
};

// ── Layer Labels ─────────────────────────────────────────────
export const LAYER_LABELS: Record<LayerCode, string> = {
  platform: 'Platform',
  vertical: 'Vertical',
  tenant:   'Tenant',
  node:     'Node',
  role:     'Role',
};

// ── Lifecycle Config ─────────────────────────────────────────
// Full config with label, color, and icon
export const LIFECYCLE_CONFIG: Record<FieldLifecycleState, {
  label: string;
  color: string;
  icon: React.ElementType;
}> = {
  draft:    { label: 'Draft',    color: '#6b7280', icon: Clock },
  active:   { label: 'Active',   color: '#10b981', icon: CheckCircle },
  disabled: { label: 'Disabled', color: '#ef4444', icon: XCircle },
};
