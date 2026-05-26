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
  tenant:   '#0891b2',   // cyan-600 — distinct from lifecycle "Active" green
  node:     '#d97706',
  role:     '#e11d48',
};

// ── Layer Colors (chip / badge format) ───────────────────────
// Used by FieldGrid layer badges and filter buttons
export const LAYER_COLORS_CHIP: Record<LayerCode, { bg: string; text: string; border: string }> = {
  platform: { bg: 'rgba(124,58,237,0.12)', text: '#7c3aed', border: 'rgba(124,58,237,0.28)' },
  vertical: { bg: 'rgba(37,99,235,0.12)',  text: '#2563eb', border: 'rgba(37,99,235,0.28)' },
  tenant:   { bg: 'rgba(8,145,178,0.12)',  text: '#0891b2', border: 'rgba(8,145,178,0.28)' },
  node:     { bg: 'rgba(217,119,6,0.12)',  text: '#d97706', border: 'rgba(217,119,6,0.28)' },
  role:     { bg: 'rgba(225,29,72,0.12)',  text: '#e11d48', border: 'rgba(225,29,72,0.28)' },
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
  bg: string;
  icon: React.ElementType;
}> = {
  draft:      { label: 'Draft',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: Clock },
  active:     { label: 'Active',     color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  disabled:   { label: 'Disabled',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: XCircle },
  deprecated: { label: 'Deprecated', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock },
};
