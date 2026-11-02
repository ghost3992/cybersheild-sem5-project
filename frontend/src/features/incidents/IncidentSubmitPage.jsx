import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createIncident } from './incidentSlice';
import {
  ShieldAlert,
  ArrowLeft,
  Server,
  Terminal,
  Plus,
  Trash2,
  ShieldCheck,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useNotification } from '../../components/NotificationContext';

export default function IncidentSubmitPage() {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    description: '',
    incident_type: 'Phishing',
    category: 'Social Engineering',
    severity: 'Medium',
    priority: 'P3 - Medium',
    impacted_assets: '',
    environment: 'Production',
    mitre_tactics: 'Initial Access',
    mitre_techniques: 'T1566.002 (Spearphishing Link)',
  });

  const [artifacts, setArtifacts] = useState([
    { type: 'IPv4', value: '', threat_score: 80, description: 'Source adversary IP' }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleAddArtifactRow = () => {
    setArtifacts([...artifacts, { type: 'Domain', value: '', threat_score: 75, description: '' }]);
  };

  const handleRemoveArtifactRow = (idx) => {
    setArtifacts(artifacts.filter((_, i) => i !== idx));
  };

  const handleArtifactChange = (idx, field, val) => {
    const updated = [...artifacts];
    updated[idx][field] = val;
    setArtifacts(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const cleanArtifacts = artifacts
      .filter((a) => a.value && a.value.trim().length > 0)
      .map((a) => ({
        type: a.type,
        value: a.value.trim(),
        threat_score: Number(a.threat_score) || 50,
        description: a.description ? a.description.trim() : null,
        source_ref: 'unconfirmed - incident report'
      }));

    const payload = {
      ...formData,
      artifacts: cleanArtifacts
    };

    const result = await dispatch(createIncident(payload));
    setSubmitting(false);

    if (!result.error) {
      showNotification(`Incident ${result.payload.data.tracking_id} successfully registered into CyberShield.`, 'success');
      navigate(`/incidents/${result.payload.data.id}`);
    } else {
      showNotification(result.payload || 'Failed to submit incident report.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 mb-2 transition-colors font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Incident Queue</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-cyan-400" />
          <span>Submit Security Incident Report</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          CyberShield centralized intake for security anomalies, active threats, and breach indicators.
        </p>
      </div>

      {/* Compliance Box */}
      <div className="bg-[#111726] border border-cyan-900/50 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <span className="font-semibold text-cyan-300">Data Minimization Policy: </span>
          <span>
            Never input raw passwords, unencrypted customer PII, or full memory dumps. Provide technical metadata, network observables (IPs, hashes, domains, endpoints), and operational impact summaries only.
          </span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Section 1: Core Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
            1. Incident Identification & Scope
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Incident Headline / Subject *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Unusual outbound TLS connection to unregistered foreign IP"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Executive Briefing Summary
            </label>
            <input
              type="text"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief 1-line impact statement for executive dashboard"
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Threat Classification *
              </label>
              <select
                value={formData.incident_type}
                onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="Phishing">Phishing / Social Engineering</option>
                <option value="Ransomware">Ransomware / Extortion</option>
                <option value="Malware">Malware / Trojan Infection</option>
                <option value="Data Breach">Data Breach / Exfiltration</option>
                <option value="Unauthorized Access">Unauthorized Access / Credential Abuse</option>
                <option value="DDoS">DDoS / Volumetric Attack</option>
                <option value="Insider Threat">Insider Threat</option>
                <option value="System Vulnerability">Zero-day / Known CVE Vulnerability</option>
                <option value="Other">Other Security Incident</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Social Engineering or Access Violation"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Detailed Sequence of Events & Technical Narrative *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail chronological order of detection, relevant hosts, log anomalies, and containment measures already taken..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Section 2: Severity & Environment */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
            2. Impacted Assets & Priority
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Initial Severity *
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="Low">Low — Minor anomaly</option>
                <option value="Medium">Medium — Contained scope</option>
                <option value="High">High — Privileged host risk</option>
                <option value="Critical">Critical — P1 Enterprise emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="P1 - Critical">P1 - Critical (Immediate)</option>
                <option value="P2 - High">P2 - High (4h SLA)</option>
                <option value="P3 - Medium">P3 - Medium (24h SLA)</option>
                <option value="P4 - Low">P4 - Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Environment
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Corporate IT">Corporate IT / Endpoints</option>
                <option value="Development">Development / Sandbox</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Impacted Assets / Hostnames
              </label>
              <input
                type="text"
                value={formData.impacted_assets}
                onChange={(e) => setFormData({ ...formData, impacted_assets: e.target.value })}
                placeholder="e.g. AWS Prod VPC, WS-FIN-09, Exchange Server"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                MITRE ATT&CK Technique (Optional)
              </label>
              <input
                type="text"
                value={formData.mitre_techniques}
                onChange={(e) => setFormData({ ...formData, mitre_techniques: e.target.value })}
                placeholder="e.g. T1566.002 (Spearphishing Link)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Attached Indicators of Compromise (IOCs) */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>3. Initial Indicators of Compromise (Optional)</span>
            </h3>
            <button
              type="button"
              onClick={handleAddArtifactRow}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Observable</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {artifacts.map((art, idx) => (
              <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
                <select
                  value={art.type}
                  onChange={(e) => handleArtifactChange(idx, 'type', e.target.value)}
                  className="w-full sm:w-28 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200"
                >
                  <option value="IPv4">IPv4</option>
                  <option value="Domain">Domain</option>
                  <option value="SHA256">SHA256</option>
                  <option value="URL">URL</option>
                  <option value="File">File</option>
                </select>

                <input
                  type="text"
                  placeholder="Indicator value (e.g. 198.51.100.23)"
                  value={art.value}
                  onChange={(e) => handleArtifactChange(idx, 'value', e.target.value)}
                  className="flex-1 w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 font-mono"
                />

                <input
                  type="text"
                  placeholder="Forensic context / description"
                  value={art.description}
                  onChange={(e) => handleArtifactChange(idx, 'description', e.target.value)}
                  className="flex-1 w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveArtifactRow(idx)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-end gap-3">
          <Link
            to="/incidents"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Submit Incident Dossier</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
