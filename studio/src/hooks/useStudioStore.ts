// ============================================================
// iDMS Admin Studio — Zustand Store
// Manages: scope, theme, artifact selection, mutations, toasts
// ============================================================
import { create } from 'zustand';
import type { ScopeContext, LayerCode, RuleDefinition, OverlayDelta, SimulationCase } from '../types';
import { getDefaultScope } from '../data/mockService';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StudioStore {
  // Scope context
  scope: ScopeContext;
  setScope: (patch: Partial<ScopeContext>) => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Selected artifact
  selectedArtifactKey: string | null;
  setSelectedArtifact: (key: string | null) => void;

  // Active cockpit tab
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Sidebar compact mode
  sidebarCompact: boolean;
  toggleSidebar: () => void;

  // Impact panel visible
  impactVisible: boolean;
  toggleImpact: () => void;

  // ── Mutable Rules (keyed by rule_id) ─────────────────────────
  savedRules: Record<string, any>;
  saveRule: (rule: any) => void;
  deleteRule: (ruleId: string) => void;

  // ── Mutable Deltas ────────────────────────────────────────────
  savedDeltas: Record<string, OverlayDelta[]>; // keyed by artifactKey
  saveDelta: (artifactKey: string, delta: OverlayDelta) => void;
  deleteDelta: (artifactKey: string, deltaId: string) => void;

  // Legacy localDeltas alias kept for existing OverlayStudio usage
  localDeltas: Record<string, unknown[]>;
  addLocalDelta: (artifactKey: string, delta: unknown) => void;

  // ── Mutable Permissions ───────────────────────────────────────
  // key: `${artifactKey}||${roleCode}||${action}` → effect
  savedPermissions: Record<string, 'ALLOW' | 'DENY'>;
  setPermission: (artifactKey: string, roleCode: string, action: string, effect: 'ALLOW' | 'DENY') => void;

  // ── Mutable Test Cases ────────────────────────────────────────
  savedTestCases: Record<string, SimulationCase[]>; // keyed by artifactKey
  saveTestCase: (artifactKey: string, tc: SimulationCase) => void;
  deleteTestCase: (artifactKey: string, caseId: string) => void;

  // ── Version Restore Tracking ──────────────────────────────────
  versionHistory: Record<string, any[]>; // keyed by artifactKey
  addVersionEntry: (artifactKey: string, entry: any) => void;

  // ── Mutable Schema Fields ────────────────────────────────────
  savedFields: Record<string, any[]>; // keyed by artifactKey
  saveField: (artifactKey: string, field: any) => void;
  deleteField: (artifactKey: string, fieldId: string) => void;
  addCatalogField: (artifactKey: string, field: any) => void;

  // Toast
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: number) => void;
}

export const useStudioStore = create<StudioStore>((set, get) => ({
  scope: getDefaultScope(),
  setScope: (patch) => set(s => ({ scope: { ...s.scope, ...patch } })),

  theme: 'light',
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    set({ theme: next });
  },

  selectedArtifactKey: null,
  setSelectedArtifact: (key) => set({ selectedArtifactKey: key, activeTab: 'schema' }),

  activeTab: 'schema',
  setActiveTab: (tab) => set({ activeTab: tab }),

  sidebarCompact: false,
  toggleSidebar: () => set(s => ({ sidebarCompact: !s.sidebarCompact })),

  impactVisible: true,
  toggleImpact: () => set(s => ({ impactVisible: !s.impactVisible })),

  // Rules
  savedRules: {},
  saveRule: (rule) => {
    set(s => ({ savedRules: { ...s.savedRules, [rule.rule_id]: rule } }));
    get().showToast(`Rule "${rule.rule_name}" saved`, 'success');
  },
  deleteRule: (ruleId) => {
    set(s => {
      const next = { ...s.savedRules };
      delete next[ruleId];
      return { savedRules: next };
    });
    get().showToast('Rule deleted', 'info');
  },

  // Deltas
  savedDeltas: {},
  saveDelta: (artifactKey, delta) => {
    set(s => {
      const existing = s.savedDeltas[artifactKey] ?? [];
      const idx = existing.findIndex(d => d.delta_id === delta.delta_id);
      const updated = idx >= 0
        ? existing.map((d, i) => i === idx ? delta : d)
        : [...existing, delta];
      return { savedDeltas: { ...s.savedDeltas, [artifactKey]: updated } };
    });
    get().showToast('Delta saved as draft', 'success');
  },
  deleteDelta: (artifactKey, deltaId) => {
    set(s => ({
      savedDeltas: {
        ...s.savedDeltas,
        [artifactKey]: (s.savedDeltas[artifactKey] ?? []).filter(d => d.delta_id !== deltaId),
      },
    }));
    get().showToast('Delta removed', 'info');
  },

  // Legacy alias
  localDeltas: {},
  addLocalDelta: (artifactKey, delta) =>
    set(s => ({
      localDeltas: {
        ...s.localDeltas,
        [artifactKey]: [...(s.localDeltas[artifactKey] ?? []), delta],
      },
    })),

  // Permissions
  savedPermissions: {},
  setPermission: (artifactKey, roleCode, action, effect) => {
    const key = `${artifactKey}||${roleCode}||${action}`;
    set(s => ({ savedPermissions: { ...s.savedPermissions, [key]: effect } }));
    get().showToast(`Permission updated: ${roleCode} → ${action} = ${effect}`, 'success');
  },

  // Test cases
  savedTestCases: {},
  saveTestCase: (artifactKey, tc) => {
    set(s => {
      const existing = s.savedTestCases[artifactKey] ?? [];
      const idx = existing.findIndex(c => c.case_id === tc.case_id);
      const updated = idx >= 0
        ? existing.map((c, i) => i === idx ? tc : c)
        : [...existing, tc];
      return { savedTestCases: { ...s.savedTestCases, [artifactKey]: updated } };
    });
    get().showToast(`Test case "${tc.label}" saved`, 'success');
  },
  deleteTestCase: (artifactKey, caseId) => {
    set(s => ({
      savedTestCases: {
        ...s.savedTestCases,
        [artifactKey]: (s.savedTestCases[artifactKey] ?? []).filter(c => c.case_id !== caseId),
      },
    }));
    get().showToast('Test case deleted', 'info');
  },

  // Version history
  versionHistory: {},
  addVersionEntry: (artifactKey, entry) => {
    set(s => ({
      versionHistory: {
        ...s.versionHistory,
        [artifactKey]: [entry, ...(s.versionHistory[artifactKey] ?? [])],
      },
    }));
  },

  // Schema fields
  savedFields: {},
  saveField: (artifactKey, field) => {
    set(s => {
      const existing = s.savedFields[artifactKey] ?? [];
      const idx = existing.findIndex((f: any) => f.field_id === field.field_id);
      const updated = idx >= 0
        ? existing.map((f: any, i: number) => i === idx ? field : f)
        : [...existing, field];
      return { savedFields: { ...s.savedFields, [artifactKey]: updated } };
    });
    get().showToast(`Field "${field.label}" saved`, 'success');
  },
  deleteField: (artifactKey, fieldId) => {
    set(s => ({
      savedFields: {
        ...s.savedFields,
        [artifactKey]: (s.savedFields[artifactKey] ?? []).filter((f: any) => f.field_id !== fieldId),
      },
    }));
    get().showToast('Field removed', 'info');
  },
  addCatalogField: (artifactKey, field) => {
    set(s => {
      const existing = s.savedFields[artifactKey] ?? [];
      if (existing.some((f: any) => f.field_id === field.field_id)) {
        get().showToast('Field already in schema', 'info');
        return s;
      }
      return { savedFields: { ...s.savedFields, [artifactKey]: [...existing, field] } };
    });
    get().showToast(`Field "${field.label}" added from catalog`, 'success');
  },

  // Toasts
  toasts: [],
  showToast: (message, type = 'success') => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().dismissToast(id), 2500);
  },
  dismissToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
