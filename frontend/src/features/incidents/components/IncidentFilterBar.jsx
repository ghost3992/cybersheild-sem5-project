import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

export default function IncidentFilterBar({ filters, onFilterChange, onReset }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
        {/* Search Input */}
        <div className="relative md:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search title, ID, IP..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Severity Filter */}
        <div>
          <select
            value={filters.severity}
            onChange={(e) => onFilterChange({ severity: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="In Triage">In Triage</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Contained">Contained</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Incident Type & Reset */}
        <div className="flex gap-2">
          <select
            value={filters.incident_type}
            onChange={(e) => onFilterChange({ incident_type: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="all">All Threat Types</option>
            <option value="Phishing">Phishing</option>
            <option value="Ransomware">Ransomware</option>
            <option value="Malware">Malware</option>
            <option value="Data Breach">Data Breach</option>
            <option value="Unauthorized Access">Unauthorized Access</option>
            <option value="DDoS">DDoS</option>
            <option value="Insider Threat">Insider Threat</option>
            <option value="System Vulnerability">System Vulnerability</option>
            <option value="Other">Other</option>
          </select>

          <button
            onClick={onReset}
            title="Reset Filters"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-colors flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

