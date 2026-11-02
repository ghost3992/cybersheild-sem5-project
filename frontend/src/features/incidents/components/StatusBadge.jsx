import React from 'react';
import { Flag, Search, Activity, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

export default function StatusBadge({ status }) {
  const s = status?.toLowerCase() || 'reported';

  const styles = {
    reported: {
      bg: 'bg-slate-900 text-slate-300 border-slate-700',
      dot: 'bg-slate-400',
    },
    'in triage': {
      bg: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60',
      dot: 'bg-indigo-400',
    },
    'under investigation': {
      bg: 'bg-sky-950/70 text-sky-300 border-sky-800/60',
      dot: 'bg-sky-400',
    },
    contained: {
      bg: 'bg-teal-950/70 text-teal-300 border-teal-800/60',
      dot: 'bg-teal-400',
    },
    resolved: {
      bg: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
      dot: 'bg-emerald-400',
    },
    closed: {
      bg: 'bg-zinc-900 text-zinc-400 border-zinc-700',
      dot: 'bg-zinc-500',
    },
  };

  const current = styles[s] || styles.reported;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{status || 'Reported'}</span>
    </span>
  );
}
