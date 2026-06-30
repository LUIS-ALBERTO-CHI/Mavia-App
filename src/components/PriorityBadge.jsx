import { AlertCircle, Minus, ChevronsDown } from 'lucide-react';

const CONFIG = {
  alta:  { label: 'Alta',  icon: AlertCircle,  bg: 'rgba(186,26,26,0.10)',  color: '#ba1a1a'           },
  media: { label: 'Media', icon: Minus,         bg: 'rgba(120,100,60,0.10)', color: '#7a6234'           },
  baja:  { label: 'Baja',  icon: ChevronsDown,  bg: 'rgba(84,99,71,0.12)',   color: 'var(--secondary)'  },
};

/**
 * PriorityBadge — pill con icono SVG + texto para mostrar prioridad
 * @param {{ priority: 'alta'|'media'|'baja', size?: 'sm'|'md' }} props
 */
export default function PriorityBadge({ priority, size = 'sm' }) {
  const cfg = CONFIG[priority];
  if (!cfg) return null;

  const iconSize  = size === 'md' ? 13 : 11;
  const fontSize  = size === 'md' ? '12px' : '11px';
  const padding   = size === 'md' ? '3px 10px' : '2px 8px';

  const Icon = cfg.icon;

  return (
    <span
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '4px',
        padding,
        borderRadius:   '9999px',
        fontSize,
        fontWeight:     700,
        background:     cfg.bg,
        color:          cfg.color,
        whiteSpace:     'nowrap',
        flexShrink:     0,
        lineHeight:     1,
      }}
    >
      <Icon size={iconSize} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}
