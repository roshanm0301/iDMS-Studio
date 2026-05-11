import { useState, useRef, useEffect } from 'react';
import { Settings, ChevronDown, X } from 'lucide-react';
import { useStudioStore } from '../../hooks/useStudioStore';

const MODES = [
  { value: 'draft',    label: 'Draft',    desc: 'Editable — changes are saved locally' },
  { value: 'resolved', label: 'Resolved', desc: 'Merged view of all layers' },
  { value: 'compiled', label: 'Compiled', desc: 'Production snapshot — read only' },
] as const;

export default function ScopeBar() {
  const { scope, setScope } = useStudioStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [settingsOpen]);

  return (
    <>
      <div className="scope-bar">
        {/* Mode chip */}
        <div
          className={`mode-chip ${scope.mode === 'compiled' ? 'active' : ''}`}
          style={{ marginLeft: 'auto' }}
        >
          <span style={{
            width: 5, height: 5,
            background: 'currentColor',
            borderRadius: '50%',
            display: 'inline-block',
            marginRight: 5,
          }} />
          {scope.mode === 'draft' ? 'Draft' : scope.mode === 'compiled' ? 'Compiled · Active' : 'Resolved preview'}
        </div>

        {/* Settings popover */}
        <div style={{ position: 'relative' }} ref={popoverRef}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', marginLeft: 4 }}
            onClick={() => setSettingsOpen(v => !v)}
            title="Switch view mode"
          >
            <Settings size={13} />
            <ChevronDown size={11} style={{
              opacity: 0.6,
              transform: settingsOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }} />
          </button>

          {settingsOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
              padding: '16px',
              minWidth: '260px',
              zIndex: 200,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px' }}>View Mode</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSettingsOpen(false)}
                  style={{ padding: '2px 4px' }}
                >
                  <X size={13} />
                </button>
              </div>

              {/* Mode options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {MODES.map(m => {
                  const isActive = scope.mode === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => { setScope({ mode: m.value as any }); setSettingsOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        padding: '10px 12px', borderRadius: '7px', textAlign: 'left',
                        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                        background: isActive ? 'hsl(22 100% 51% / 0.08)' : 'transparent',
                        cursor: 'pointer', width: '100%',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                    >
                      {/* Radio dot */}
                      <span style={{
                        width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                        border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                        background: isActive ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {isActive && (
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
                        )}
                      </span>
                      <div>
                        <div style={{
                          fontWeight: 600, fontSize: '13px',
                          color: isActive ? 'var(--accent)' : 'var(--text)',
                        }}>
                          {m.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                          {m.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
