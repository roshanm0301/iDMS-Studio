// ============================================================
// iDMS Admin Studio — Archetype System Fields
// Required system fields auto-injected per entity archetype
// ============================================================
import type { EntityArchetype, SimpleFieldDef } from '../types/entityDesigner';

/** System fields that each archetype auto-creates when an entity is drafted. */
export const ARCHETYPE_SYSTEM_FIELDS: Record<EntityArchetype, SimpleFieldDef[]> = {
  // ─── Native Persistent ────────────────────────────────────────
  native_persistent: [
    { fieldId: 'id',         label: 'ID',         fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'tenant_id',  label: 'Tenant ID',  fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'status',     label: 'Status',     fieldType: 'select',   required: true, protected: true, typeConfig: { valueSource: 'workflow' } },
    { fieldId: 'created_at', label: 'Created At', fieldType: 'datetime', required: true, protected: true, systemOwned: true },
    { fieldId: 'created_by', label: 'Created By', fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'owner_id',   label: 'Owner',      fieldType: 'text',     required: true, protected: false, systemOwned: true },
    { fieldId: 'updated_at', label: 'Updated At', fieldType: 'datetime', required: false, protected: true, systemOwned: true },
    { fieldId: 'updated_by', label: 'Updated By', fieldType: 'text',     required: false, protected: true, systemOwned: true },
    { fieldId: 'is_deleted', label: 'Is Deleted', fieldType: 'boolean',  required: true, protected: true, systemOwned: true },
  ],

  // ─── Virtual Computed ─────────────────────────────────────────
  virtual_computed: [
    { fieldId: 'id',          label: 'ID',               fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'computed_at', label: 'Computed At',       fieldType: 'datetime', required: true, protected: true, systemOwned: true },
    { fieldId: 'source_ref',  label: 'Source Record ID',  fieldType: 'text',     required: true, protected: true, systemOwned: true },
  ],

  // ─── External / Federated ────────────────────────────────────
  external_federated: [
    { fieldId: 'id',             label: 'ID',             fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'external_key',   label: 'External Key',   fieldType: 'text',     required: true, protected: true },
    { fieldId: 'last_synced_at', label: 'Last Synced At', fieldType: 'datetime', required: false, protected: true, systemOwned: true },
    { fieldId: 'sync_status',    label: 'Sync Status',    fieldType: 'select',   required: false, protected: true,
      typeConfig: { optionItems: [{ label: 'Active', value: 'active' }, { label: 'Stale', value: 'stale' }, { label: 'Error', value: 'error' }] } },
  ],

  // ─── Materialized Projection ─────────────────────────────────
  materialized_projection: [
    { fieldId: 'id',                    label: 'ID',               fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'source_entity_type',    label: 'Source Entity',    fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'source_record_id',      label: 'Source Record ID', fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'projection_built_at',   label: 'Built At',         fieldType: 'datetime', required: true, protected: true, systemOwned: true },
    { fieldId: 'is_stale',             label: 'Is Stale',         fieldType: 'boolean',  required: false, protected: true, systemOwned: true },
  ],

  // ─── Junction / Association ──────────────────────────────────
  junction_association: [
    { fieldId: 'id',             label: 'ID',             fieldType: 'text',       required: true, protected: true, systemOwned: true },
    { fieldId: 'entity_a_ref',   label: 'Entity A',       fieldType: 'entity_ref', required: true, protected: true },
    { fieldId: 'entity_b_ref',   label: 'Entity B',       fieldType: 'entity_ref', required: true, protected: true },
    { fieldId: 'effective_from', label: 'Effective From', fieldType: 'date',       required: false },
    { fieldId: 'effective_to',   label: 'Effective To',   fieldType: 'date',       required: false },
    { fieldId: 'is_active',      label: 'Is Active',      fieldType: 'boolean',    required: true },
  ],

  // ─── Owned Child ─────────────────────────────────────────────
  owned_child: [
    { fieldId: 'id',          label: 'ID',            fieldType: 'text',       required: true, protected: true, systemOwned: true },
    { fieldId: 'parent_ref',  label: 'Parent Record', fieldType: 'entity_ref', required: true, protected: true },
    { fieldId: 'line_number', label: 'Line Number',   fieldType: 'number',     required: true, protected: true },
    { fieldId: 'tenant_id',   label: 'Tenant ID',     fieldType: 'text',       required: true, protected: true, systemOwned: true },
    { fieldId: 'created_at',  label: 'Created At',    fieldType: 'datetime',   required: true, protected: true, systemOwned: true },
  ],

  // ─── Append-Only Record ──────────────────────────────────────
  append_only_record: [
    { fieldId: 'id',          label: 'ID',           fieldType: 'text',        required: true, protected: true, systemOwned: true },
    { fieldId: 'tenant_id',   label: 'Tenant ID',    fieldType: 'text',        required: true, protected: true, systemOwned: true },
    { fieldId: 'entry_number',label: 'Entry Number',  fieldType: 'auto_number', required: true, protected: true,
      typeConfig: { codeSettingType: 'document', codeSettingId: 'dc_vehicle_order' } },
    { fieldId: 'occurred_at', label: 'Occurred At',   fieldType: 'datetime',    required: true, protected: true, systemOwned: true },
    { fieldId: 'actor_id',    label: 'Actor ID',      fieldType: 'text',        required: true, protected: true, systemOwned: true },
    { fieldId: 'event_type',  label: 'Event Type',    fieldType: 'select',      required: true,
      typeConfig: { optionItems: [{ label: 'Entry', value: 'entry' }, { label: 'Reversal', value: 'reversal' }] } },
  ],

  // ─── System / Technical ──────────────────────────────────────
  system_technical: [
    { fieldId: 'id',         label: 'ID',         fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'tenant_id',  label: 'Tenant ID',  fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'created_at', label: 'Created At', fieldType: 'datetime', required: true, protected: true, systemOwned: true },
    { fieldId: 'updated_at', label: 'Updated At', fieldType: 'datetime', required: false, protected: true, systemOwned: true },
  ],

  // ═══════════════════════════════════════════════════════════════
  // v3 NEW ARCHETYPES
  // ═══════════════════════════════════════════════════════════════

  // ─── Activity / Interaction ──────────────────────────────────
  activity_interaction: [
    { fieldId: 'activity_id',         label: 'Activity ID',         fieldType: 'text',       required: true, protected: true, systemOwned: true },
    { fieldId: 'subject',             label: 'Subject',             fieldType: 'text',       required: true },
    { fieldId: 'activity_type',       label: 'Activity Type',       fieldType: 'select',     required: true,
      typeConfig: { optionItems: [{ label: 'Task', value: 'task' }, { label: 'Call', value: 'call' }, { label: 'Appointment', value: 'appointment' }, { label: 'Follow-up', value: 'follow_up' }, { label: 'Reminder', value: 'reminder' }] } },
    { fieldId: 'status',              label: 'Status',              fieldType: 'select',     required: true, protected: true, typeConfig: { valueSource: 'workflow' } },
    { fieldId: 'owner_id',            label: 'Owner',               fieldType: 'text',       required: true },
    { fieldId: 'assigned_to_id',      label: 'Assigned To',         fieldType: 'text',       required: false },
    { fieldId: 'start_datetime',      label: 'Start Date/Time',     fieldType: 'datetime',   required: false },
    { fieldId: 'due_datetime',        label: 'Due Date/Time',       fieldType: 'datetime',   required: false },
    { fieldId: 'completed_at',        label: 'Completed At',        fieldType: 'datetime',   required: false, protected: true, systemOwned: true },
    { fieldId: 'related_entity_type', label: 'Related Entity Type', fieldType: 'text',       required: false },
    { fieldId: 'related_record_id',   label: 'Related Record ID',   fieldType: 'text',       required: false },
    { fieldId: 'tenant_id',           label: 'Tenant ID',           fieldType: 'text',       required: true, protected: true, systemOwned: true },
    { fieldId: 'created_at',          label: 'Created At',          fieldType: 'datetime',   required: true, protected: true, systemOwned: true },
    { fieldId: 'created_by',          label: 'Created By',          fieldType: 'text',       required: true, protected: true, systemOwned: true },
  ],

  // ─── Staging / Import ────────────────────────────────────────
  staging_import: [
    { fieldId: 'staging_record_id',     label: 'Staging Record ID',     fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'batch_id',              label: 'Batch ID',              fieldType: 'text',     required: true, protected: true },
    { fieldId: 'source_file_name',      label: 'Source File Name',      fieldType: 'text',     required: false },
    { fieldId: 'row_number',            label: 'Row Number',            fieldType: 'number',   required: false },
    { fieldId: 'raw_payload',           label: 'Raw Payload',           fieldType: 'json',     required: true },
    { fieldId: 'validation_status',     label: 'Validation Status',     fieldType: 'select',   required: true,
      typeConfig: { optionItems: [{ label: 'Pending', value: 'pending' }, { label: 'Valid', value: 'valid' }, { label: 'Error', value: 'error' }, { label: 'Promoted', value: 'promoted' }] } },
    { fieldId: 'validation_errors',     label: 'Validation Errors',     fieldType: 'json',     required: false },
    { fieldId: 'target_entity_api_name',label: 'Target Entity',         fieldType: 'text',     required: true },
    { fieldId: 'target_record_id',      label: 'Target Record ID',      fieldType: 'text',     required: false },
    { fieldId: 'processed_at',          label: 'Processed At',          fieldType: 'datetime', required: false, protected: true, systemOwned: true },
    { fieldId: 'tenant_id',             label: 'Tenant ID',             fieldType: 'text',     required: true, protected: true, systemOwned: true },
  ],

  // ─── High-Volume / Event Log ─────────────────────────────────
  high_volume_event_log: [
    { fieldId: 'event_id',        label: 'Event ID',        fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'event_type',      label: 'Event Type',      fieldType: 'text',     required: true },
    { fieldId: 'event_timestamp', label: 'Event Timestamp', fieldType: 'datetime', required: true, protected: true, systemOwned: true },
    { fieldId: 'source_system',   label: 'Source System',   fieldType: 'text',     required: true },
    { fieldId: 'tenant_id',       label: 'Tenant ID',       fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'node_id',         label: 'Node ID',         fieldType: 'text',     required: false, protected: true, systemOwned: true },
    { fieldId: 'payload',         label: 'Payload',         fieldType: 'json',     required: true },
    { fieldId: 'partition_key',   label: 'Partition Key',   fieldType: 'text',     required: true, protected: true },
    { fieldId: 'retention_until', label: 'Retention Until', fieldType: 'date',     required: false },
  ],

  // ─── Integration Event / Outbox ──────────────────────────────
  integration_outbox: [
    { fieldId: 'outbox_event_id',           label: 'Outbox Event ID',       fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'event_name',                label: 'Event Name',            fieldType: 'text',     required: true },
    { fieldId: 'aggregate_entity_api_name', label: 'Aggregate Entity',      fieldType: 'text',     required: true },
    { fieldId: 'aggregate_record_id',       label: 'Aggregate Record ID',   fieldType: 'text',     required: true },
    { fieldId: 'payload',                   label: 'Payload',               fieldType: 'json',     required: true },
    { fieldId: 'idempotency_key',           label: 'Idempotency Key',       fieldType: 'text',     required: true, protected: true },
    { fieldId: 'delivery_status',           label: 'Delivery Status',       fieldType: 'select',   required: true,
      typeConfig: { optionItems: [{ label: 'Pending', value: 'pending' }, { label: 'Sent', value: 'sent' }, { label: 'Failed', value: 'failed' }, { label: 'Dead Letter', value: 'dead_letter' }] } },
    { fieldId: 'retry_count',               label: 'Retry Count',           fieldType: 'number',   required: true },
    { fieldId: 'next_retry_at',             label: 'Next Retry At',         fieldType: 'datetime', required: false },
    { fieldId: 'last_error',                label: 'Last Error',            fieldType: 'text',     required: false },
    { fieldId: 'published_at',              label: 'Published At',          fieldType: 'datetime', required: false, protected: true, systemOwned: true },
    { fieldId: 'tenant_id',                 label: 'Tenant ID',             fieldType: 'text',     required: true, protected: true, systemOwned: true },
  ],

  // ─── Posting Document ────────────────────────────────────────
  posting_document: [
    { fieldId: 'id',                       label: 'ID',                    fieldType: 'text',        required: true, protected: true, systemOwned: true },
    { fieldId: 'document_no',              label: 'Document No.',          fieldType: 'auto_number', required: true, protected: true,
      typeConfig: { codeSettingType: 'document', codeSettingId: 'dc_vehicle_order' } },
    { fieldId: 'document_date',            label: 'Document Date',         fieldType: 'date',        required: true },
    { fieldId: 'posting_status',           label: 'Posting Status',        fieldType: 'select',      required: true, protected: true,
      typeConfig: { optionItems: [{ label: 'Draft', value: 'draft' }, { label: 'Posted', value: 'posted' }, { label: 'Cancelled', value: 'cancelled' }, { label: 'Reversed', value: 'reversed' }] } },
    { fieldId: 'posted_at',               label: 'Posted At',             fieldType: 'datetime',    required: false, protected: true, systemOwned: true },
    { fieldId: 'posted_by',               label: 'Posted By',             fieldType: 'text',        required: false, protected: true, systemOwned: true },
    { fieldId: 'reversal_of_document_id', label: 'Reversal Of',           fieldType: 'text',        required: false },
    { fieldId: 'cancelled_at',            label: 'Cancelled At',          fieldType: 'datetime',    required: false, protected: true, systemOwned: true },
    { fieldId: 'cancelled_by',            label: 'Cancelled By',          fieldType: 'text',        required: false, protected: true, systemOwned: true },
    { fieldId: 'cancellation_reason',     label: 'Cancellation Reason',   fieldType: 'text',        required: false },
    { fieldId: 'tenant_id',               label: 'Tenant ID',             fieldType: 'text',        required: true, protected: true, systemOwned: true },
    { fieldId: 'status',                  label: 'Status',                fieldType: 'select',      required: true, protected: true, typeConfig: { valueSource: 'workflow' } },
    { fieldId: 'created_at',              label: 'Created At',            fieldType: 'datetime',    required: true, protected: true, systemOwned: true },
    { fieldId: 'created_by',  label: 'Created By',  fieldType: 'text',     required: true, protected: true, systemOwned: true },
    { fieldId: 'owner_id',    label: 'Owner',        fieldType: 'text',     required: true, protected: false, systemOwned: true },
    { fieldId: 'updated_at',  label: 'Updated At',   fieldType: 'datetime', required: false, protected: true, systemOwned: true },
  ],

  // ─── Reference / Code ────────────────────────────────────────
  reference_code: [
    { fieldId: 'code_id',        label: 'Code ID',        fieldType: 'text',    required: true, protected: true, systemOwned: true },
    { fieldId: 'code',           label: 'Code',           fieldType: 'text',    required: true, protected: true },
    { fieldId: 'label',          label: 'Label',          fieldType: 'text',    required: true },
    { fieldId: 'description',    label: 'Description',    fieldType: 'text',    required: false },
    { fieldId: 'status',         label: 'Status',         fieldType: 'select',  required: true, protected: true,
      typeConfig: { optionItems: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }] } },
    { fieldId: 'effective_from', label: 'Effective From', fieldType: 'date',    required: false },
    { fieldId: 'effective_to',   label: 'Effective To',   fieldType: 'date',    required: false },
    { fieldId: 'sort_order',     label: 'Sort Order',     fieldType: 'number',  required: false },
    { fieldId: 'tenant_id',      label: 'Tenant ID',      fieldType: 'text',    required: true, protected: true, systemOwned: true },
  ],
};

/** Human-readable labels for display name field selection per archetype. */
export const ARCHETYPE_DISPLAY_NAME_FIELD: Partial<Record<EntityArchetype, { fieldId: string; label: string }>> = {
  posting_document:      { fieldId: 'document_no', label: 'Document No.' },
  reference_code:        { fieldId: 'code',        label: 'Code' },
  activity_interaction:  { fieldId: 'subject',     label: 'Subject' },
  append_only_record:    { fieldId: 'entry_number',label: 'Entry Number' },
  integration_outbox:    { fieldId: 'event_name',  label: 'Event Name' },
  high_volume_event_log: { fieldId: 'event_type',  label: 'Event Type' },
  staging_import:        { fieldId: 'batch_id',    label: 'Batch ID' },
};
