import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { FileText, Shield, Clock, Terminal, Filter, Search } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axiosClient.get('/audit')
      .then((res) => setLogs(res.data.logs || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'all' && !log.action.includes(filterAction)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.action?.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q) ||
        log.ip_address?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Immutable Security Audit Stream</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically anchored tamper-evident access logs and system mutation telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search action or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Actions</option>
            <option value="INCIDENT">Incidents</option>
            <option value="USER">User & Auth</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
      </div>

      <div className="bg-[#111726] border border-slate-800/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0e1422] text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Audit ID</th>
                <th className="px-5 py-3">Timestamp (UTC)</th>
                <th className="px-5 py-3">Event Signature</th>
                <th className="px-5 py-3">Actor Identity</th>
                <th className="px-5 py-3">Source IP</th>
                <th className="px-5 py-3 font-sans">Mutation Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 font-sans">
                    Streaming security audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 font-sans">
                    No matching audit records.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3 text-slate-500 font-mono">#{log.id}</td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-bold text-cyan-400">
                      {log.action}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-300">
                      {log.user_email || 'system_daemon'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-400">{log.ip_address}</td>
                    <td className="px-5 py-3 font-sans text-slate-200 max-w-sm truncate">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
