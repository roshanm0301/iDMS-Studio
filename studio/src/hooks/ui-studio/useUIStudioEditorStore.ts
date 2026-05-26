import { create } from 'zustand'
import type { ViewArtifact } from '../../types/ui-studio/index'

interface UIStudioEditorState {
  activeViewId: string | null
  artifact: ViewArtifact | null
  isDirty: boolean
  selectedComponentId: string | null

  setActiveView: (viewId: string | null) => void
  setArtifact: (artifact: ViewArtifact | null) => void
  markDirty: () => void
  clearDirty: () => void
  setSelectedComponent: (componentId: string | null) => void
  reset: () => void
}

const initialState = {
  activeViewId: null,
  artifact: null,
  isDirty: false,
  selectedComponentId: null,
}

export const useUIStudioEditorStore = create<UIStudioEditorState>((set) => ({
  ...initialState,

  setActiveView: (viewId) => set({ activeViewId: viewId }),

  setArtifact: (artifact) => set({ artifact }),

  markDirty: () => set({ isDirty: true }),

  clearDirty: () => set({ isDirty: false }),

  setSelectedComponent: (componentId) => set({ selectedComponentId: componentId }),

  reset: () => set(initialState),
}))
