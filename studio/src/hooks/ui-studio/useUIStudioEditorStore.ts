import { create } from 'zustand'
import type { ViewArtifact, PreviewContext } from '../../types/ui-studio/index'

interface UIStudioEditorState {
  activeViewId: string | null
  artifact: ViewArtifact | null
  isDirty: boolean
  selectedComponentId: string | null
  previewContext: PreviewContext
  previewMode: boolean

  setActiveView: (viewId: string | null) => void
  setArtifact: (artifact: ViewArtifact | null) => void
  updateArtifact: (patch: Partial<ViewArtifact>) => void
  markDirty: () => void
  clearDirty: () => void
  setSelectedComponent: (componentId: string | null) => void
  reset: () => void
  setPreviewContext: (ctx: Partial<PreviewContext>) => void
  setPreviewMode: (on: boolean) => void
}

const defaultPreviewContext: PreviewContext = {
  role: 'Admin',
  device: 'desktop',
  workflowState: '',
  sampleRecordId: '',
}

const initialState = {
  activeViewId: null,
  artifact: null,
  isDirty: false,
  selectedComponentId: null,
  previewContext: defaultPreviewContext,
  previewMode: false,
}

export const useUIStudioEditorStore = create<UIStudioEditorState>((set, get) => ({
  ...initialState,

  setActiveView: (viewId) => set({ activeViewId: viewId }),

  setArtifact: (artifact) => set({ artifact }),

  updateArtifact: (patch) => {
    const current = get().artifact
    if (!current) return
    set({ artifact: { ...current, ...patch }, isDirty: true })
  },

  markDirty: () => set({ isDirty: true }),

  clearDirty: () => set({ isDirty: false }),

  setSelectedComponent: (componentId) => set({ selectedComponentId: componentId }),

  reset: () => set(initialState),

  setPreviewContext: (ctx) => {
    const current = get().previewContext
    set({ previewContext: { ...current, ...ctx } })
  },

  setPreviewMode: (on) => set({ previewMode: on }),
}))
