import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useStudioStore } from '../../hooks/useStudioStore';

export default function Toast() {
  const { toasts, dismissToast } = useStudioStore();
  if (!toasts.length) return null;
  return (
    <>
      {toasts.map(t => (
        <div
          key={t.id}
          className="toast"
          onClick={() => dismissToast(t.id)}
          style={{ cursor: 'pointer' }}
        >
          {t.type === 'success' && <CheckCircle size={14} style={{ color: '#4ade80' }} />}
          {t.type === 'error' && <XCircle size={14} style={{ color: '#f87171' }} />}
          {t.type === 'info' && <Info size={14} style={{ color: '#38bdf8' }} />}
          {t.message}
        </div>
      ))}
    </>
  );
}
