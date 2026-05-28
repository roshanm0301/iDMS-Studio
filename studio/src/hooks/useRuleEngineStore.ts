/**
 * Rule Engine — Zustand Store
 *
 * Global state for rule engine UI: selected filters, active rule, navigation.
 */
import { create } from 'zustand';
import type { RuleLifecycleState, RuleType } from '../metadata/rule-platform-definition';

export interface RuleEngineFilters {
  search: string;
  ruleType: RuleType | 'all';
  lifecycleState: RuleLifecycleState | 'all';
  domain: string | 'all';
  entityType: string | 'all';
}

interface RuleEngineState {
  // Filters
  filters: RuleEngineFilters;
  setFilter: <K extends keyof RuleEngineFilters>(key: K, value: RuleEngineFilters[K]) => void;
  resetFilters: () => void;

  // Active selection
  activeFamilyId: string | null;
  activeVersionId: string | null;
  setActiveFamily: (familyId: string | null) => void;
  setActiveVersion: (versionId: string | null) => void;

  // UI state
  showCreateDialog: boolean;
  setShowCreateDialog: (show: boolean) => void;
}

const DEFAULT_FILTERS: RuleEngineFilters = {
  search: '',
  ruleType: 'all',
  lifecycleState: 'all',
  domain: 'all',
  entityType: 'all',
};

export const useRuleEngineStore = create<RuleEngineState>((set) => ({
  filters: { ...DEFAULT_FILTERS },
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  activeFamilyId: null,
  activeVersionId: null,
  setActiveFamily: (familyId) => set({ activeFamilyId: familyId, activeVersionId: null }),
  setActiveVersion: (versionId) => set({ activeVersionId: versionId }),

  showCreateDialog: false,
  setShowCreateDialog: (show) => set({ showCreateDialog: show }),
}));
