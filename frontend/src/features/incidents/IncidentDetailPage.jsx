import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchIncidentById,
  updateIncident,
  assignIncident,
  addComment,
  addArtifact,
  deleteArtifact,
  deleteIncident,
  fetchDraftReport,
  clearCurrentIncident,
} from './incidentSlice';
import SeverityBadge from './components/SeverityBadge';
import StatusBadge from './components/StatusBadge';
import IncidentTimeline from './components/IncidentTimeline';
import DraftReportModal from './components/DraftReportModal';
import {
  ShieldAlert,
  ArrowLeft,
  Clock,
  Server,
  Terminal,
  Activity,
  FileText,
  UserCheck,
  Send,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  Lock,
  Layers,
  FileCode,
  MessageSquare,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';
import { useNotification } from '../../components/NotificationContext';
import axiosClient from '../../api/axiosClient';

export default function IncidentDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const { currentIncident, loading, draftReport, reportLoading } = useSelector(
    (state) => state.incidents
  );
  const { user } = useSelector((state) => state.auth);

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'iocs' | 'playbook' | 'timeline' | 'report'

  // Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Analysts list
  const [analysts, setAnalysts] = useState([]);

  // Form states for triage & playbook
  const [statusVal, setStatusVal] = useState('');
  const [severityVal, setSeverityVal] = useState('');
  const [priorityVal, setPriorityVal] = useState('');
  const [assignedToVal, setAssignedToVal] = useState('');
  const [containmentVal, setContainmentVal] = useState('');
  const [rootCauseVal, setRootCauseVal] = useState('');
  const [resolutionVal, setResolutionVal] = useState('');
  const [triageNote, setTriageNote] = useState('');

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(true);

  // New Artifact modal / inline state
  const [showAddArtifact, setShowAddArtifact] = useState(false);
  const [newArtifactType, setNewArtifactType] = useState('IPv4');
  const [newArtifactVal, setNewArtifactVal] = useState('');
  const [newArtifactScore, setNewArtifactScore] = useState(75);
  const [newArtifactDesc, setNewArtifactDesc] = useState('');
  const [newArtifactSource, setNewArtifactSource] = useState('publicly reported');

  const [copiedValue, setCopiedValue] = useState(null);
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'analyst' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    dispatch(fetchIncidentById(id));
    if (canManage) {
      axiosClient.get('/users/analysts')
        .then((res) => setAnalysts(res.data.analysts || []))
        .catch(() => {});
    }
    return () => {
      dispatch(clearCurrentIncident());
    };
  }, [dispatch, id, canManage]);

  useEffect(() => {
    if (currentIncident) {
      setStatusVal(currentIncident.status || 'Reported');
      setSeverityVal(currentIncident.severity || 'Medium');
      setPriorityVal(currentIncident.priority || 'P3 - Medium');
      setAssignedToVal(currentIncident.assigned_to ? String(currentIncident.assigned_to) : '');
      setContainmentVal(currentIncident.containment_plan || '');
      setRootCauseVal(currentIncident.root_cause || '');
      setResolutionVal(currentIncident.resolution_notes || '');
    }
  }, [currentIncident]);

  const handleUpdatePlaybook = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await dispatch(
      updateIncident({
        id,
        updates: {
          status: statusVal,
          severity: severityVal,
          priority: priorityVal,
          containment_plan: containmentVal,
          root_cause: rootCauseVal,
          resolution_notes: resolutionVal,
          note: triageNote || undefined,
        },
      })
    );
    setSaving(false);
    if (!result.error) {
      showNotification('Triage and containment playbook saved.', 'success');
      setTriageNote('');
    } else {
      showNotification(result.payload || 'Failed to save updates.', 'error');
    }
  };

  const handleQuickStatus = async (newStatus) => {
    setStatusVal(newStatus);
    const result = await dispatch(
      updateIncident({
        id,
        updates: { status: newStatus },
      })
    );
    if (!result.error) {
      showNotification(`Status advanced to [${newStatus}]`, 'success');
    }
  };

  const handleAssign = async (val) => {
    setAssignedToVal(val);
    const result = await dispatch(assignIncident({ id, assigned_to: val ? Number(val) : null }));
    if (!result.error) {
      showNotification('Analyst assignment updated.', 'info');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const result = await dispatch(
      addComment({ id, comment: newComment, is_internal: isInternalComment ? 1 : 0 })
    );
    if (!result.error) {
      setNewComment('');
      showNotification('Comment logged into case record.', 'success');
    }
  };

  const handleCreateArtifact = async (e) => {
    e.preventDefault();
    if (!newArtifactVal.trim()) return;
    const result = await dispatch(
      addArtifact({
        id,
        artifact: {
          artifact_type: newArtifactType,
          artifact_value: newArtifactVal.trim(),
          threat_score: newArtifactScore,
          description: newArtifactDesc.trim(),
          source_ref: newArtifactSource,
        },
      })
    );
    if (!result.error) {
      setShowAddArtifact(false);
      setNewArtifactVal('');
      setNewArtifactDesc('');
      showNotification('Observable artifact attached to dossier.', 'success');
    }
  };

  const handleDeleteArtifact = async (artId) => {
    if (window.confirm('Remove this IOC artifact from the incident dossier?')) {
      await dispatch(deleteArtifact({ id, artifactId: artId }));
      showNotification('Artifact removed.', 'info');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedValue(text);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const handleDeleteIncident = async () => {
    if (window.confirm(`Permanently expunge record ${currentIncident.tracking_id}?`)) {
      await dispatch(deleteIncident(id));
      showNotification('Incident record removed.', 'info');
      navigate('/incidents');
    }
  };

  if (loading || !currentIncident) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-3" />
        <p className="text-slate-400 font-mono text-xs">Querying incident dossier & intelligence artifacts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner: Breadcrumb & Quick Actions */}
      <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-xs text-slate-400">
              <Link to="/incidents" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Incident Queue</span>
              </Link>
              <span>/</span>
              <span className="text-cyan-400 font-semibold">{currentIncident.tracking_id}</span>
              <span>/</span>
              <span className="text-slate-300 capitalize">{currentIncident.incident_type}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                {currentIncident.tracking_id}
              </span>
              <SeverityBadge severity={currentIncident.severity} />
              <StatusBadge status={currentIncident.status} />
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                {currentIncident.priority || 'P3 - Medium'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white mt-2">
              {currentIncident.title}
            </h1>
          </div>

          {/* Quick Lifecycle Status Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {canManage && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                {['In Triage', 'Under Investigation', 'Contained', 'Resolved'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleQuickStatus(st)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      currentIncident.status === st
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                dispatch(fetchDraftReport(id));
                setIsReportModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>DRAFT IR Report (JSON)</span>
            </button>

            {isAdmin && (
              <button
                onClick={handleDeleteIncident}
                title="Delete Case Record"
                className="p-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Reporter & Assignee strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Reporter</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{currentIncident.reporter_name}</span>
            <span className="text-[10px] text-slate-400 truncate block">{currentIncident.reporter_department}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">SOC Investigator</span>
            {canManage ? (
              <select
                value={assignedToVal}
                onChange={(e) => handleAssign(e.target.value)}
                className="mt-0.5 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-cyan-300 font-medium focus:outline-none"
              >
                <option value="">Unassigned</option>
                {analysts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold text-slate-200 mt-0.5 block">
                {currentIncident.assigned_name || 'Unassigned'}
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Reported Timestamp</span>
            <span className="font-mono text-slate-300 mt-0.5 block">
              {new Date(currentIncident.created_at).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Target Environment</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{currentIncident.environment || 'Production'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-medium">
        {[
          { key: 'overview', label: 'Case Overview & Scope', icon: Layers },
          { key: 'iocs', label: `IOCs & Observables (${currentIncident.artifacts?.length || 0})`, icon: Terminal },
          { key: 'playbook', label: 'Triage & Containment Playbook', icon: ClipboardList },
          { key: 'timeline', label: `Timeline & Discussion (${(currentIncident.timeline?.length || 0) + (currentIncident.comments?.length || 0)})`, icon: MessageSquare },
        ].map((tab) => {
          const IconComp = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-cyan-500 text-cyan-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Case Overview & Scope */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Executive Summary */}
            <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Executive Incident Briefing
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#0d1320] p-4 rounded-xl border border-slate-800/80">
                {currentIncident.summary || currentIncident.description}
              </p>
            </div>

            {/* Scope & Sequence of Events */}
            <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Full Technical Narrative
              </h3>
              <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-[#0d1320] p-4 rounded-xl border border-slate-800/80">
                {currentIncident.description}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Impacted Assets */}
            <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>Impacted Assets & Infrastructure</span>
              </h3>
              <div className="p-3 bg-[#0d1320] rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
                {currentIncident.impacted_assets || 'unconfirmed'}
              </div>
            </div>

            {/* MITRE ATT&CK Matrix */}
            <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>MITRE ATT&CK Enterprise Mapping</span>
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Tactics</span>
                  <div className="p-2.5 bg-[#0d1320] rounded-lg border border-slate-800 text-xs text-slate-200 mt-1">
                    {currentIncident.mitre_tactics || 'unconfirmed'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Techniques</span>
                  <div className="p-2.5 bg-[#0d1320] rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 mt-1">
                    {currentIncident.mitre_techniques || 'unconfirmed'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Indicators of Compromise (IOCs) */}
      {activeTab === 'iocs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Indicators of Compromise & Technical Observables</h3>
              <p className="text-xs text-slate-400">Threat telemetry attributed to CISA, NVD, or active triage forensics.</p>
            </div>
            {canManage && (
              <button
                onClick={() => setShowAddArtifact(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Attach Observable</span>
              </button>
            )}
          </div>

          {/* New Artifact inline form */}
          {showAddArtifact && (
            <form onSubmit={handleCreateArtifact} className="bg-[#111726] border border-cyan-900/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-cyan-300">Add Technical Observable</h4>
                <button type="button" onClick={() => setShowAddArtifact(false)} className="text-slate-400 hover:text-white text-xs">
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Observable Type</label>
                  <select
                    value={newArtifactType}
                    onChange={(e) => setNewArtifactType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="IPv4">IPv4 Address</option>
                    <option value="Domain">Domain / FQDN</option>
                    <option value="SHA256">SHA-256 Hash</option>
                    <option value="URL">Malicious URL</option>
                    <option value="CIDR">CIDR Subnet</option>
                    <option value="File">File Artifact</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Observable Value</label>
                  <input
                    type="text"
                    required
                    value={newArtifactVal}
                    onChange={(e) => setNewArtifactVal(e.target.value)}
                    placeholder="e.g. 198.51.100.23 or malicious-domain.org"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Threat Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newArtifactScore}
                    onChange={(e) => setNewArtifactScore(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Forensic Description</label>
                  <input
                    type="text"
                    value={newArtifactDesc}
                    onChange={(e) => setNewArtifactDesc(e.target.value)}
                    placeholder="e.g. C2 callback target observed in memory dump"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Attribution Reference</label>
                  <select
                    value={newArtifactSource}
                    onChange={(e) => setNewArtifactSource(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="publicly reported">publicly reported</option>
                    <option value="unconfirmed">unconfirmed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow"
                >
                  Save Observable
                </button>
              </div>
            </form>
          )}

          {/* IOCs Table */}
          <div className="bg-[#111726] border border-slate-800/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d1320] text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Indicator Value</th>
                    <th className="px-5 py-3">Threat Score</th>
                    <th className="px-5 py-3">Attribution Status</th>
                    <th className="px-5 py-3">Forensic Description</th>
                    {canManage && <th className="px-5 py-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono">
                  {!currentIncident.artifacts || currentIncident.artifacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500 font-sans">
                        No observables attached to this incident record yet.
                      </td>
                    </tr>
                  ) : (
                    currentIncident.artifacts.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap text-cyan-400 font-bold font-sans">
                          {art.artifact_type}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-200 font-semibold">{art.artifact_value}</span>
                            <button
                              onClick={() => copyToClipboard(art.artifact_value)}
                              title="Copy to clipboard"
                              className="text-slate-500 hover:text-white"
                            >
                              {copiedValue === art.artifact_value ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-300 font-bold">{art.threat_score}</span>
                            <div className="w-16 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                              <div
                                className={`h-full ${
                                  art.threat_score >= 80 ? 'bg-rose-500' : art.threat_score >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${art.threat_score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              art.source_ref?.includes('publicly reported')
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {art.source_ref}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-sans text-slate-300 max-w-xs truncate">
                          {art.description || '-'}
                        </td>
                        {canManage && (
                          <td className="px-5 py-3.5 text-right font-sans whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteArtifact(art.id)}
                              className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Triage & Containment Playbook */}
      {activeTab === 'playbook' && (
        <form onSubmit={handleUpdatePlaybook} className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Containment Playbook & Post-Mortem Analysis</h3>
              <p className="text-xs text-slate-400">Coordinate active mitigation measures and document root causes.</p>
            </div>
            {canManage && (
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition-colors disabled:opacity-50"
              >
                {saving ? 'Persisting...' : 'Save Playbook Updates'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Lifecycle Status</label>
              <select
                disabled={!canManage}
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
              >
                <option value="Reported">Reported</option>
                <option value="In Triage">In Triage</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Contained">Contained</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Severity Calibration</label>
              <select
                disabled={!canManage}
                value={severityVal}
                onChange={(e) => setSeverityVal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Priority Tier</label>
              <select
                disabled={!canManage}
                value={priorityVal}
                onChange={(e) => setPriorityVal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
              >
                <option value="P1 - Critical">P1 - Critical (Immediate Escalation)</option>
                <option value="P2 - High">P2 - High (4h SLA)</option>
                <option value="P3 - Medium">P3 - Medium (24h SLA)</option>
                <option value="P4 - Low">P4 - Low (Next Sprint)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Active Containment Steps Executed
              </label>
              <textarea
                disabled={!canManage}
                rows={3}
                value={containmentVal}
                onChange={(e) => setContainmentVal(e.target.value)}
                placeholder="1. Sinkholed domain on edge DNS.&#10;2. Severed host network interface.&#10;3. Invalidate credentials in Azure AD."
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Root Cause Analysis (RCA)
              </label>
              <textarea
                disabled={!canManage}
                rows={3}
                value={rootCauseVal}
                onChange={(e) => setRootCauseVal(e.target.value)}
                placeholder="Explain the vector of initial compromise, architectural gap, or human error..."
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Post-Mortem Resolution Notes
              </label>
              <textarea
                disabled={!canManage}
                rows={3}
                value={resolutionVal}
                onChange={(e) => setResolutionVal(e.target.value)}
                placeholder="Long-term remediation actions implemented to prevent recurrence..."
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {canManage && (
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Timeline Transition Note (Appended to Audit Trail)
                </label>
                <input
                  type="text"
                  value={triageNote}
                  onChange={(e) => setTriageNote(e.target.value)}
                  placeholder="e.g. Updated firewall policy; waiting for secondary verification from NetOps"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>
            )}
          </div>
        </form>
      )}

      {/* Tab 4: Timeline & Discussion */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Audit Timeline */}
          <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Incident Response Timeline ({currentIncident.timeline?.length || 0})</span>
            </h3>
            <IncidentTimeline timeline={currentIncident.timeline} />
          </div>

          {/* Right: Analyst Collaboration & Discussion */}
          <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Internal Analyst Discussion ({currentIncident.comments?.length || 0})</span>
              </h3>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {!currentIncident.comments || currentIncident.comments.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">
                    No internal discussion recorded yet. Post an observation below.
                  </p>
                ) : (
                  currentIncident.comments.map((comm) => (
                    <div key={comm.id} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{comm.user_name}</span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {comm.user_role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(comm.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed pt-1">{comm.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Post comment box */}
            <form onSubmit={handlePostComment} className="pt-3 border-t border-slate-800 space-y-2">
              <textarea
                rows={2}
                required
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write an internal investigation note or update..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-slate-400 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-0"
                  />
                  <span>Internal SOC eyes only</span>
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>Post Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CyberShield IR Agent DRAFT Report Modal */}
      <DraftReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={draftReport}
        loading={reportLoading}
      />
    </div>
  );
}
