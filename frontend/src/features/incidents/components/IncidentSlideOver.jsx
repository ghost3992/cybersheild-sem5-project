import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIncidentById } from '../incidentSlice';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';
import { X, ExternalLink, ShieldAlert, Clock, User, Server, Terminal, ArrowRight } from 'lucide-react';

export default function IncidentSlideOver({ incidentId, onClose }) {
  const dispatch = useDispatch();
  const { currentIncident, loading } = useSelector((state) => state.incidents);

  useEffect(() => {
    if (incidentId) {
      dispatch(fetchIncidentById(incidentId));
    }
  }, [dispatch, incidentId]);

  if (!incidentId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-[#0e1422] border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-[#121929] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                  {currentIncident?.tracking_id || 'Loading...'}
                </span>
                {currentIncident && (
                  <>
                    <SeverityBadge severity={currentIncident.severity} />
                    <StatusBadge status={currentIncident.status} />
                  </>
                )}
              </div>
              <h2 className="text-sm font-bold text-white mt-1.5 line-clamp-1">
                {currentIncident?.title || 'Loading incident...'}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {loading || !currentIncident ? (
              <div className="py-20 text-center text-slate-500">
                <div className="inline-block animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mb-2" />
                <p>Loading dossier...</p>
              </div>
            ) : (
              <>
                {/* Executive Summary */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Case Summary
                  </h4>
                  <p className="text-slate-300 leading-relaxed bg-[#141b2c] p-3 rounded-xl border border-slate-800">
                    {currentIncident.summary || currentIncident.description}
                  </p>
                </div>

                {/* Key Metadata Table */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#141b2c] p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Threat Vector</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{currentIncident.incident_type}</span>
                  </div>

                  <div className="bg-[#141b2c] p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Environment</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{currentIncident.environment || 'Production'}</span>
                  </div>

                  <div className="bg-[#141b2c] p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Lead Assignee</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {currentIncident.assigned_name || 'Unassigned'}
                    </span>
                  </div>

                  <div className="bg-[#141b2c] p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Reporter</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {currentIncident.reporter_name}
                    </span>
                  </div>
                </div>

                {/* Impacted Systems */}
                {currentIncident.impacted_assets && (
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Impacted Assets</span>
                    </h4>
                    <p className="text-slate-300 font-mono text-[11px] bg-[#141b2c] p-2.5 rounded-xl border border-slate-800">
                      {currentIncident.impacted_assets}
                    </p>
                  </div>
                )}

                {/* MITRE Mapping */}
                {currentIncident.mitre_techniques && (
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>MITRE ATT&CK Mapping</span>
                    </h4>
                    <span className="inline-block px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[11px]">
                      {currentIncident.mitre_techniques}
                    </span>
                  </div>
                )}

                {/* Attached IOCs Count */}
                {currentIncident.artifacts && currentIncident.artifacts.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Indicators of Compromise ({currentIncident.artifacts.length})
                    </h4>
                    <div className="space-y-1.5">
                      {currentIncident.artifacts.slice(0, 3).map((art) => (
                        <div key={art.id} className="p-2 bg-[#141b2c] rounded-lg border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                          <span className="text-cyan-400 font-semibold">{art.artifact_type}</span>
                          <span className="text-slate-300 truncate max-w-[200px]">{art.artifact_value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-slate-800 bg-[#121929] flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Reported: {currentIncident ? new Date(currentIncident.created_at).toLocaleDateString() : '-'}
            </span>
            <Link
              to={`/incidents/${incidentId}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
            >
              <span>Open Full Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

