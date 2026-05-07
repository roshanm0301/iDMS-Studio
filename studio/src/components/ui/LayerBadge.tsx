import type { LayerCode } from '../../types';

const LABELS: Record<LayerCode, string> = {
  platform: 'Platform',
  vertical: 'Vertical',
  tenant: 'Tenant',
  node: 'Node',
  role: 'Role',
};

interface Props {
  layer: LayerCode;
  small?: boolean;
}

export default function LayerBadge({ layer, small }: Props) {
  return (
    <span className={`layer-badge ${layer}`} style={small ? { fontSize: 10, padding: '1px 6px' } : {}}>
      {LABELS[layer]}
    </span>
  );
}
