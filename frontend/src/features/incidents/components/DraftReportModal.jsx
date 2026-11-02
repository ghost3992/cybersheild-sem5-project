import React, { useState } from 'react';
import { Terminal, Copy, Check, X, Shield, ExternalLink } from 'lucide-react';

export default function DraftReportModal({ isOpen, onClose, report, loading }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (report) {
      navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-950/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-100">
                  CyberShield IR Agent — DRAFT Incident Report
                </h3>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-700/50">
                  JSON Schema v1.0.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Metadata only • Claims tagged as "publicly reported" or "unconfirmed" • Standard IR compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={loading || !report}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-3" />
              <p className="text-sm text-slate-400 font-mono">
                CyberShield IR Agent compiling metadata and verifying public disclosures...
              </p>
            </div>
          ) : report ? (
            <>
              {/* Compliance banner */}
              <div className="bg-slate-950 border border-cyan-900/40 rounded-xl p-3.5 flex items-start gap-3">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1 text-slate-300">
                  <span className="font-semibold text-cyan-300">IR Policy Enforcement: </span>
                  Zero leaked credentials stored. Metadata verified against CISA, NVD, and MITRE ATT&CK repositories.
                </div>
              </div>

              {/* Verified Sources Reference */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Grounding & Verified Sources:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {(report.verified_sources || []).map((s, idx) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-800/60 text-xs text-slate-300 group transition-all"
                    >
                      <span className="truncate">{s.source}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0 ml-1" />
                    </a>
                  ))}
                </div>
              </div>

              {/* JSON Viewer */}
              <div className="relative">
                <div className="text-xs font-mono text-slate-400 mb-1 flex items-center justify-between">
                  <span>DRAFT REPORT SCHEMA OUTPUT:</span>
                  <span className="text-slate-500">{JSON.stringify(report).length} bytes</span>
                </div>
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed shadow-inner max-h-[380px]">
                  {JSON.stringify(report, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">
              Failed to load report schema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

