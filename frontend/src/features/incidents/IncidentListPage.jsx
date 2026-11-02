import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIncidents, setFilters, resetFilters, setDrawerIncidentId } from './incidentSlice';
import SeverityBadge from './components/SeverityBadge';
import StatusBadge from './components/StatusBadge';
import IncidentSlideOver from './components/IncidentSlideOver';
import {
  PlusCircle,
  Search,
  Filter,
  Download,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { useNotification } from '../../components/NotificationContext';
import axiosClient from '../../api/axiosClient';

export default function IncidentListPage() {
  const dispatch = useDispatch();
  const { incidents, loading, filters, pagination, drawerIncidentId } = useSelector(
    (state) => state.incidents
  );
  const { user } = useSelector((state) => state.auth);
  const { showNotification } = useNotification();
  const [analysts, setAnalysts] = useState([]);

  useEffect(() => {
    dispatch(fetchIncidents(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    if (user?.role !== 'employee') {
      axiosClient.get('/users/analysts')
        .then((res) => setAnalysts(res.data.analysts || []))
        .catch(() => {});
    }
  }, [user]);

  const handleFilterUpdate = (patch) => {
    dispatch(setFilters(patch));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      dispatch(setFilters({ page: newPage }));
    }
  };

  const handleExportCsv = () => {
    showNotification('Exporting filtered incident records to CSV...', 'info');
    window.open('/api/incidents/export/csv', '_blank');
  };

  const activeFilterCount = [
    filters.status !== 'all',
    filters.severity !== 'all',
    filters.incident_type !== 'all',
    filters.assigned_to !== 'all',
    Boolean(filters.search),
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Enterprise Incident Queue
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {pagination.totalRecords} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {user?.role === 'employee'
              ? 'Viewing your submitted incidents.'
              : 'Triaging and tracking active security incidents across the enterprise.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <Link
            to="/incidents/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Incident</span>
          </Link>
        </div>
      </div>

      {/* Structured Filter Bar */}
      <div className="bg-[#111726] border border-slate-800/90 rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, title, asset, adversary..."
              value={filters.search}
              onChange={(e) => handleFilterUpdate({ search: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {filters.search && (
              <button
                onClick={() => handleFilterUpdate({ search: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Severity */}
          <div>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterUpdate({ severity: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">Severity: All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterUpdate({ status: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">Status: All</option>
              <option value="Reported">Reported</option>
              <option value="In Triage">In Triage</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Contained">Contained</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Threat Type */}
          <div>
            <select
              value={filters.incident_type}
              onChange={(e) => handleFilterUpdate({ incident_type: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">Threat Type: All</option>
              <option value="Phishing">Phishing</option>
              <option value="Ransomware">Ransomware</option>
              <option value="Malware">Malware</option>
              <option value="Data Breach">Data Breach</option>
              <option value="Unauthorized Access">Unauthorized Access</option>
              <option value="DDoS">DDoS</option>
              <option value="Insider Threat">Insider Threat</option>
            </select>
          </div>
        </div>

        {/* Active Filters Row & Reset */}
        {activeFilterCount > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Active Filters:</span>
              {filters.severity !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">
                  Severity: {filters.severity}
                  <button onClick={() => handleFilterUpdate({ severity: 'all' })}><X className="w-3 h-3 hover:text-rose-400" /></button>
                </span>
              )}
              {filters.status !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">
                  Status: {filters.status}
                  <button onClick={() => handleFilterUpdate({ status: 'all' })}><X className="w-3 h-3 hover:text-rose-400" /></button>
                </span>
              )}
              {filters.incident_type !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">
                  Type: {filters.incident_type}
                  <button onClick={() => handleFilterUpdate({ incident_type: 'all' })}><X className="w-3 h-3 hover:text-rose-400" /></button>
                </span>
              )}
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">
                  Search: "{filters.search}"
                  <button onClick={() => handleFilterUpdate({ search: '' })}><X className="w-3 h-3 hover:text-rose-400" /></button>
                </span>
              )}
            </div>

            <button
              onClick={() => dispatch(resetFilters())}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset all filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Incident Data Table */}
      <div className="bg-[#111726] border border-slate-800/90 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e1422] text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="px-5 py-3">Tracking ID</th>
                <th className="px-5 py-3">Title & Summary</th>
                <th className="px-5 py-3">Threat Vector</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Assignee</th>
                <th className="px-5 py-3">Observables</th>
                <th className="px-5 py-3">Reported</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full mb-2" />
                    <p>Querying incident repository...</p>
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <div className="text-slate-400 font-medium">No incident records matched your query.</div>
                    <button
                      onClick={() => dispatch(resetFilters())}
                      className="mt-2 text-xs text-cyan-400 hover:underline"
                    >
                      Reset active filters
                    </button>
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => dispatch(setDrawerIncidentId(inc.id))}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-cyan-400 whitespace-nowrap">
                      {inc.tracking_id}
                    </td>

                    <td className="px-5 py-3.5 max-w-sm">
                      <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {inc.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {inc.impacted_assets ? `Impacted: ${inc.impacted_assets}` : (inc.summary || inc.description)}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-[11px] text-slate-300">
                        {inc.incident_type}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <SeverityBadge severity={inc.severity} />
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={inc.status} />
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-300">
                      {inc.assigned_name ? (
                        <span className="text-slate-200">{inc.assigned_name}</span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {inc.artifact_count ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-semibold">
                          {inc.artifact_count} IOCs
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {new Date(inc.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/incidents/${inc.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      >
                        <span>Dossier</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#0e1422] flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-200">
              {incidents.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(pagination.page * pagination.limit, pagination.totalRecords)}
            </span>{' '}
            of <span className="font-semibold text-slate-200">{pagination.totalRecords}</span> incidents
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-slate-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer */}
      <IncidentSlideOver
        incidentId={drawerIncidentId}
        onClose={() => dispatch(setDrawerIncidentId(null))}
      />
    </div>
  );
}
