import React from 'react';
import { Clock, ShieldAlert, UserCheck, MessageSquare, CheckCircle, FileSpreadsheet } from 'lucide-react';

export default function IncidentTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-sm">
        No timeline events logged yet for this incident.
      </div>
    );
  }

  const getActionIcon = (type) => {
    switch (type) {
      case 'REPORT_CREATED':
        return <FileSpreadsheet className="w-4 h-4 text-cyan-400" />;
      case 'STATUS_CHANGE':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'ASSIGNMENT':
        return <UserCheck className="w-4 h-4 text-indigo-400" />;
      case 'RESOLUTION':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {timeline.map((event, idx) => (
        <div key={event.id || idx} className="relative group">
          {/* Icon Bullet */}
          <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:border-cyan-500 transition-colors">
            {getActionIcon(event.action_type)}
          </div>

          {/* Event Content */}
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-lg p-3 hover:border-slate-700 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">
                  {event.user_name || 'System'}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {event.user_role || 'audit'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                <Clock className="w-3 h-3" />
                <span>
                  {event.created_at ? new Date(event.created_at).toLocaleString() : 'Just now'}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{event.note}</p>

            {(event.previous_state || event.new_state) && (
              <div className="mt-2 text-xs flex items-center gap-2 text-slate-400 bg-slate-950/50 px-2 py-1 rounded inline-block">
                <span>Transition:</span>
                <span className="text-slate-300 font-mono">{event.previous_state || 'Initial'}</span>
                <span>&rarr;</span>
                <span className="text-cyan-400 font-mono font-medium">{event.new_state}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

