import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function SeverityBadge({ severity }) {
  const s = severity?.toLowerCase() || 'medium';

  const styles = {
    critical: {
      bg: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
      dot: 'bg-rose-500 animate-pulse',
      icon: ShieldAlert,
    },
    high: {
      bg: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
    },
    medium: {
      bg: 'bg-yellow-950/70 text-yellow-300 border-yellow-800/60',
      dot: 'bg-yellow-500',
      icon: AlertCircle,
    },
    low: {
      bg: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
      dot: 'bg-emerald-500',
      icon: Info,
    },
  };

  const current = styles[s] || styles.medium;
  const IconComp = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono border ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{severity || 'Medium'}</span>
    </span>
  );
}
