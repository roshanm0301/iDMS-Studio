import * as Dialog from '@radix-ui/react-dialog'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { useCreateViewMutation } from '../../../hooks/ui-studio/useUIStudioViewsQuery'
import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'
import type { ViewSurfaceType } from '../../../types/ui-studio/index'

const SURFACE_OPTIONS: { value: ViewSurfaceType; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'record_detail', label: 'Record Detail' },
  { value: 'create_edit', label: 'Create / Edit Form' },
  { value: 'related_records', label: 'Related Records' },
  { value: 'transaction_workspace', label: 'Transaction Workspace' },
  { value: 'dashboard_summary', label: 'Dashboard Summary' },
]

const VIEW_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,79}$/

interface FormValues {
  label: string
  viewKey: string
  surfaceType: ViewSurfaceType
  primaryEntityId: string
  description: string
}

interface CreateViewDraftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (viewId: string) => void
}

export function CreateViewDraftDialog({ open, onOpenChange, onCreated }: CreateViewDraftDialogProps) {
  const createMutation = useCreateViewMutation()
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { label: '', viewKey: '', surfaceType: 'list', primaryEntityId: '', description: '' },
  })

  function handleLabelBlur() {
    const labelVal = getValues('label')
    const key = labelVal.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80)
    if (key && !getValues('viewKey')) setValue('viewKey', key)
  }

  async function onSubmit(values: FormValues) {
    try {
      const artifact = await createMutation.mutateAsync({
        viewKey: values.viewKey.trim(),
        label: values.label.trim(),
        surfaceType: values.surfaceType,
        primaryEntityId: values.primaryEntityId || undefined,
        description: values.description.trim() || undefined,
      })
      reset()
      onOpenChange(false)
      onCreated?.(artifact.id)
    } catch (err) {
      // Key conflict or other error — react-hook-form will show server error via setError
      // We surface it via the mutation's isError state
    }
  }

  function handleClose() {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 100,
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 101,
            background: 'var(--bg-elev)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            width: '520px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <Dialog.Title style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                Create New View
              </Dialog.Title>
              <Dialog.Description style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Creates a draft — not visible to end users until published.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="btn btn-ghost btn-icon btn-sm" aria-label="Close">
                <X size={15} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Label */}
            <div className="form-field">
              <label htmlFor="cvd-label" className="form-label">View Label *</label>
              <input
                id="cvd-label"
                className="form-input"
                placeholder="e.g. Customer List"
                {...register('label', { required: 'Label is required' })}
                onBlur={handleLabelBlur}
              />
              {errors.label && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{errors.label.message}</span>}
            </div>

            {/* View Key */}
            <div className="form-field">
              <label htmlFor="cvd-viewKey" className="form-label">View Key *</label>
              <input
                id="cvd-viewKey"
                className="form-input"
                placeholder="e.g. customer_list"
                style={{ fontFamily: 'monospace', fontSize: '12.5px' }}
                {...register('viewKey', {
                  required: 'View key is required',
                  pattern: {
                    value: VIEW_KEY_PATTERN,
                    message: 'Letters, digits, underscores only. Must start with a letter. Max 80 chars.',
                  },
                })}
              />
              {errors.viewKey && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{errors.viewKey.message}</span>}
              {!errors.viewKey && (
                <span style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>
                  Unique identifier. Letters, digits, underscores. Auto-filled from label.
                </span>
              )}
            </div>

            {/* Surface Type */}
            <div className="form-field">
              <label htmlFor="cvd-surfaceType" className="form-label">Surface Type *</label>
              <select id="cvd-surfaceType" className="form-select" {...register('surfaceType', { required: true })}>
                {SURFACE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Primary Entity */}
            <div className="form-field">
              <label htmlFor="cvd-primaryEntityId" className="form-label">Primary Entity</label>
              <select id="cvd-primaryEntityId" className="form-select" {...register('primaryEntityId')}>
                <option value="">— Select entity —</option>
                {MOCK_ENTITIES.map(e => (
                  <option key={e.id} value={e.id}>{e.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="form-field">
              <label htmlFor="cvd-description" className="form-label">Description</label>
              <textarea
                id="cvd-description"
                className="form-textarea"
                placeholder="Optional description…"
                rows={2}
                {...register('description')}
              />
            </div>

            {/* Server error */}
            {createMutation.isError && (
              <div style={{ padding: '8px 12px', background: 'var(--red-soft)', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', color: 'var(--red)' }}>
                {createMutation.error instanceof Error ? createMutation.error.message : 'Failed to create view. Please try again.'}
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating…' : 'Create Draft'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
