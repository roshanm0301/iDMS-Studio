type Status = 'active' | 'active_with_draft' | 'draft' | 'paused' | 'deprecated' | 'compile_error' | 'archived';

const STATUS_MAP: Record<Status, { cls: string; label: string }> = {
  active:           { cls: 'green',  label: 'Active' },
  active_with_draft:{ cls: 'amber',  label: 'Active + Draft' },
  draft:            { cls: 'amber',  label: 'Draft' },
  paused:           { cls: 'red',    label: 'Paused' },
  deprecated:       { cls: '',       label: 'Deprecated' },
  compile_error:    { cls: 'red',    label: 'Compile Error' },
  archived:         { cls: '',       label: 'Archived' },
};

export default function StatusTag({ status }: { status: Status }) {
  const m = STATUS_MAP[status] ?? STATUS_MAP.draft;
  return (
    <span className={`tag ${m.cls}`}>
      <span className="dot" />
      {m.label}
    </span>
  );
}
