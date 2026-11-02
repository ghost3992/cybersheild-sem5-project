import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMetrics } from '../analytics/analyticsSlice';
import { fetchIncidents, setDrawerIncidentId } from '../incidents/incidentSlice';
import SeverityBadge from '../incidents/components/SeverityBadge';
import StatusBadge from '../incidents/components/StatusBadge';
import IncidentSlideOver from '../incidents/components/IncidentSlideOver';
import {
  ShieldAlert,
  Activity,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  Database,
  Flame,
  Clock,
  RotateCw,
  Terminal,
  Zap,
  TrendingUp,
  Server
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { metrics, loading: metricsLoading } = useSelector((state) => state.analytics);
  const { incidents, loading: incidentsLoading, drawerIncidentId } = useSelector(
    (state) => state.incidents
  );
  const { user } = useSelector((state) => state.auth);

  const [dbStatus, setDbStatus] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  const handleRefresh = () => {
    dispatch(fetchMetrics());
    dispatch(fetchIncidents({ limit: 6 }));
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    handleRefresh();
    axiosClient.get('/health')
      .then((res) => setDbStatus(res.data.database))
      .catch(() => {});
  }, [dispatch]);

  const recentIncidents = incidents.slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top SOC Operation Bar */}
      <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-800/80">
              SOC Enterprise Operations
            </span>
            {dbStatus && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                <Database className="w-3 h-3" />
                <span>{dbStatus.dialect} Engine</span>
              </span>
            )}
            <span className="text-[10px] font-mono text-slate-500">
              Synced at {lastRefreshed}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Security Intelligence & Incident Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active monitoring workspace for <span className="text-slate-200">{user?.name}</span> ({user?.department})
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleRefresh}
            title="Refresh Metrics"
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <Link
            to="/incidents/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Incident</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Incidents */}
        <div className="bg-[#111726] border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Incidents
            </span>
            <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {metrics?.summary?.totalIncidents ?? incidents.length}
            </span>
            <span className="text-[11px] text-slate-500">logged to repository</span>
          </div>
        </div>

        {/* Active Investigations */}
        <div className="bg-[#111726] border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active In-Flight
            </span>
            <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-300 font-mono">
              {metrics?.summary?.activeInvestigations ?? 0}
            </span>
            <span className="text-[11px] text-amber-400/80">in triage & investigation</span>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-[#111726] border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Critical Alerts (P1)
            </span>
            <div className="p-2 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/40">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400 font-mono">
              {metrics?.summary?.criticalAlerts ?? 0}
            </span>
            <span className="text-[11px] text-rose-400/80">requires immediate containment</span>
          </div>
        </div>

        {/* Containment Efficiency */}
        <div className="bg-[#111726] border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Containment Rate
            </span>
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              {metrics?.summary?.containmentRate ?? 0}%
            </span>
            <span className="text-[11px] text-emerald-400/80">
              {metrics?.summary?.containedThreats ?? 0} contained / resolved
            </span>
          </div>
        </div>
      </div>

      {/* Incident Lifecycle Pipeline visualizer */}
      <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Incident Lifecycle Progression Pipeline
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
          {[
            { label: 'Reported', count: metrics?.statusPipeline?.Reported || 0, color: 'text-slate-300', bg: 'bg-slate-800' },
            { label: 'In Triage', count: metrics?.statusPipeline?.['In Triage'] || 0, color: 'text-indigo-300', bg: 'bg-indigo-950 border border-indigo-800/60' },
            { label: 'Under Investigation', count: metrics?.statusPipeline?.['Under Investigation'] || 0, color: 'text-sky-300', bg: 'bg-sky-950 border border-sky-800/60' },
            { label: 'Contained', count: metrics?.statusPipeline?.Contained || 0, color: 'text-teal-300', bg: 'bg-teal-950 border border-teal-800/60' },
            { label: 'Resolved', count: metrics?.statusPipeline?.Resolved || 0, color: 'text-emerald-300', bg: 'bg-emerald-950 border border-emerald-800/60' },
            { label: 'Closed', count: metrics?.statusPipeline?.Closed || 0, color: 'text-slate-400', bg: 'bg-zinc-900 border border-zinc-800' },
          ].map((step, idx) => (
            <div key={step.label} className={`p-3 rounded-xl ${step.bg}`}>
              <span className="text-[10px] uppercase font-mono text-slate-400 block truncate">
                {step.label}
              </span>
              <span className={`text-lg font-bold font-mono mt-0.5 block ${step.color}`}>
                {step.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Threat Severity Distribution
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Critical', count: metrics?.severityDistribution?.Critical || 0, color: 'bg-rose-500', text: 'text-rose-400' },
              { label: 'High', count: metrics?.severityDistribution?.High || 0, color: 'bg-amber-500', text: 'text-amber-400' },
              { label: 'Medium', count: metrics?.severityDistribution?.Medium || 0, color: 'bg-yellow-500', text: 'text-yellow-400' },
              { label: 'Low', count: metrics?.severityDistribution?.Low || 0, color: 'bg-emerald-500', text: 'text-emerald-400' },
            ].map((sev) => {
              const total = metrics?.summary?.totalIncidents || 1;
              const pct = Math.round((sev.count / total) * 100);
              return (
                <div key={sev.label}>
                  <div className="flex justify-between text-xs mb-1 font-medium">
                    <span className={sev.text}>{sev.label}</span>
                    <span className="text-slate-400 font-mono">
                      {sev.count} incidents ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${sev.color} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attack Vectors Matrix */}
        <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
              Categorized Attack Vectors (MITRE Aligned)
            </h3>
            <div className="flex flex-wrap gap-2">
              {metrics?.typeDistribution && Object.keys(metrics.typeDistribution).length > 0 ? (
                Object.entries(metrics.typeDistribution).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    <span className="text-slate-300 font-medium">{type}</span>
                    <span className="font-mono font-bold text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800/60">
                      {count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No threat telemetry recorded.</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Observable IOCs Tracked: {metrics?.summary?.totalArtifactsTracked || 0}</span>
            <span>Active Responders: {metrics?.summary?.activeSocAnalysts || 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-[#111726] border border-slate-800/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Security Cases</h3>
            <p className="text-xs text-slate-400">Click any row to open quick-view drawer</p>
          </div>
          <Link
            to="/incidents"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>View Full Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e1422] text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="px-5 py-3">Tracking ID</th>
                <th className="px-5 py-3">Headline</th>
                <th className="px-5 py-3">Threat Vector</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Assignee</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {recentIncidents.map((inc) => (
                <tr
                  key={inc.id}
                  onClick={() => dispatch(setDrawerIncidentId(inc.id))}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-3 font-mono font-semibold text-cyan-400 whitespace-nowrap">
                    {inc.tracking_id}
                  </td>
                  <td className="px-5 py-3 max-w-xs truncate font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {inc.title}
                  </td>
                  <td className="px-5 py-3 text-slate-400">{inc.incident_type}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <SeverityBadge severity={inc.severity} />
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <StatusBadge status={inc.status} />
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-300">
                    {inc.assigned_name || <span className="text-slate-500 italic">Unassigned</span>}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Link
                      to={`/incidents/${inc.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                    >
                      <span>Investigate</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over quick view */}
      <IncidentSlideOver
        incidentId={drawerIncidentId}
        onClose={() => dispatch(setDrawerIncidentId(null))}
      />
    </div>
  );
}
