import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Radio,
  Search,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Copy,
  Check,
  Zap,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useNotification } from '../../components/NotificationContext';

export default function LiveThreatFeedPage() {
  const [attacks, setAttacks] = useState([]);
  const [totalAttacks, setTotalAttacks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ingestingCve, setIngestingCve] = useState(null);

  // AI Analyzer state
  const [aiInput, setAiInput] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const fetchLiveFeed = async (query = '', pageNum = 1) => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/threat-intel/cisa-feed?search=${encodeURIComponent(query)}&page=${pageNum}&limit=12`);
      setAttacks(res.data.attacks || []);
      setTotalAttacks(res.data.totalActiveAttacks || 0);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.totalPages || 1);
        setPage(res.data.pagination.page || 1);
      }
    } catch (err) {
      showNotification('Failed to fetch live CISA feed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveFeed(search, page);
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLiveFeed(search, 1);
  };

  const handleIngest = async (vuln) => {
    try {
      setIngestingCve(vuln.cve_id);
      const res = await axiosClient.post('/threat-intel/ingest', vuln);
      showNotification(`Ingested ${vuln.cve_id} as ${res.data.trackingId}!`, 'success');
      navigate(`/incidents/${res.data.incidentId}`);
    } catch (err) {
      showNotification('Failed to ingest threat.', 'error');
    } finally {
      setIngestingCve(null);
    }
  };

  const handleRunAiAnalysis = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    try {
      setAiAnalyzing(true);
      setAiResult(null);
      const res = await axiosClient.post('/threat-intel/ai-analyze', {
        text: aiInput,
      });
      setAiResult(res.data.analysis);
      showNotification('AI analysis & MITRE mapping completed.', 'success');
    } catch (err) {
      showNotification('AI analysis failed.', 'error');
    } finally {
      setAiAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live CISA Threat Ingestion Stream
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {totalAttacks.toLocaleString()} Actively Exploited Incursions Tracked
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Live Global Threat Intelligence & AI Triager
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Live telemetry from the US CISA Known Exploited Vulnerabilities (KEV) repository combined with AI MITRE ATT&CK auto-analysis.
          </p>
        </div>

        <button
          onClick={() => fetchLiveFeed(search, page)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 rounded-xl transition-colors self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Live Feed</span>
        </button>
      </div>

      {/* AI Threat Analyzer Sandbox Section */}
      <div className="bg-[#111726] border border-cyan-900/60 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                CyberShield AI Incident Triager & MITRE ATT&CK Auto-Analyzer
              </h2>
              <p className="text-[11px] text-slate-400">
                Paste raw syslog text, phishing email headers, or breach descriptions for instant IOC extraction and playbooks.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            Heuristic + LLM Hybrid
          </span>
        </div>

        <form onSubmit={handleRunAiAnalysis} className="space-y-3">
          <textarea
            rows={3}
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="Paste suspicious log / narrative here (e.g., 'Target received email from secure-update.com with attachment hash e3b0c442... and IP 198.51.100.23 attempting to encrypt NAS storage pool')..."
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Zero sensitive data leaked: Extracts network observables and MITRE techniques only.
            </span>

            <button
              type="submit"
              disabled={aiAnalyzing || !aiInput.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow transition-all disabled:opacity-40"
            >
              {aiAnalyzing ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{aiAnalyzing ? 'Analyzing Threat Telemetry...' : 'Run AI Threat Analysis'}</span>
            </button>
          </div>
        </form>

        {/* AI Results Card */}
        {aiResult && (
          <div className="mt-4 p-4 rounded-xl bg-[#0d1320] border border-cyan-800/80 space-y-4 animate-in fade-in duration-200 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-300 font-mono">Classification: {aiResult.threat_type}</span>
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono">
                  Risk Score: {aiResult.risk_score}/100 ({aiResult.severity})
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{aiResult.confidence_metric}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-slate-300 block mb-1">MITRE ATT&CK Matrix Alignment:</span>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-[11px]"><span className="text-slate-500">Tactics:</span> <span className="text-slate-200">{aiResult.mitre_tactics}</span></div>
                  <div className="text-[11px] font-mono"><span className="text-slate-500">Techniques:</span> <span className="text-cyan-300">{aiResult.mitre_techniques}</span></div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-1">Extracted Observables ({aiResult.extracted_iocs?.length || 0}):</span>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1 max-h-24 overflow-y-auto">
                  {aiResult.extracted_iocs?.length > 0 ? (
                    aiResult.extracted_iocs.map((ioc, i) => (
                      <div key={i} className="flex justify-between text-slate-300">
                        <span className="text-cyan-400 font-bold">{ioc.type}</span>
                        <span>{ioc.value}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-500">No raw IOCs found in input string.</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-300 block mb-1">Generated Containment Playbook:</span>
              <pre className="p-3 bg-slate-900 rounded border border-slate-800 text-emerald-300 whitespace-pre-line text-[11px] leading-relaxed font-mono">
                {aiResult.containment_playbook}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Live CISA Attacks Feed Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Live Exploited CVE Incursions (CISA Official Feed)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Government-verified zero-days and active campaigns. Convert any into an internal case with 1 click.
            </p>
          </div>

          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className="relative sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search CVE, Vendor, Product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#111726] border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </form>
        </div>

        {/* Attacks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <div className="inline-block animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mb-2" />
              <p className="text-xs font-mono">Streaming live attacks from CISA KEV repository...</p>
            </div>
          ) : attacks.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs">
              No matching CISA exploits found.
            </div>
          ) : (
            attacks.map((vuln) => (
              <div
                key={vuln.cve_id}
                className="bg-[#111726] border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/80">
                      {vuln.cve_id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Added: {vuln.date_added}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-100 text-xs line-clamp-1">
                    {vuln.vendor} {vuln.product}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">
                    {vuln.vulnerability_name}
                  </p>

                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed bg-[#0d1320] p-2.5 rounded-lg border border-slate-800/80">
                    {vuln.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Ransomware: <strong className="text-slate-200">{vuln.known_ransomware_campaign}</strong></span>
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${vuln.cve_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>NIST NVD</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <button
                    onClick={() => handleIngest(vuln)}
                    disabled={ingestingCve === vuln.cve_id}
                    className="w-full py-1.5 px-3 bg-slate-900 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-700 hover:border-cyan-800 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {ingestingCve === vuln.cve_id ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>Ingest as Internal Incident</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-slate-900 border border-slate-700 disabled:opacity-30"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded bg-slate-900 border border-slate-700 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

