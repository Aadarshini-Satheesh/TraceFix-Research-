import React, { useState, useEffect } from 'react';
import {
  SearchCode,
  AlertOctagon,
  Layers,
  ArrowRight,
  ShieldAlert,
  Flame,
  CheckCircle2,
  FileCode,
  Terminal,
  Activity
} from 'lucide-react';
import { listSessions, getSessionDetails, analyzeInvestigation } from '../services/api';
import CodeBlock from '../components/CodeBlock';

export default function InvestigationPage({ activeSession, setActiveSession, setActiveTab }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(activeSession?.id || null);
  const [sessionData, setSessionData] = useState(null);
  const [investigationData, setInvestigationData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listSessions().then(items => {
      setSessions(items);
      if (items.length > 0 && !selectedSessionId) {
        setSelectedSessionId(items[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadSession(selectedSessionId);
    }
  }, [selectedSessionId]);

  const loadSession = async (id) => {
    setLoading(true);
    try {
      const data = await getSessionDetails(id);
      setSessionData(data);
      setActiveSession(data);

      // Run or retrieve investigation analysis
      const invRes = await analyzeInvestigation({
        session_id: data.id,
        repo_id: data.repo_id,
        bug_description: data.bug_description,
        stack_trace: data.stack_trace,
        target_file: data.target_file
      });
      setInvestigationData(invRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <SearchCode className="w-6 h-6 text-cyan-400" />
            Evidence-Guided Bug Investigation & SBFL
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Spectrum-Based Fault Localization (Ochiai/Tarantula) merged with AST stack frame correlation.
          </p>
        </div>

        {/* Session Switcher */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">Session:</span>
          <select
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(parseInt(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                #{s.id} – {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex items-center justify-center text-slate-400 text-sm font-mono">
          <Activity className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
          Performing AST fault localization & Ochiai spectrum ranking...
        </div>
      ) : sessionData && investigationData ? (
        <div className="space-y-6">
          {/* Causal Evidence Synthesis Banner */}
          <div className="bg-[#0F172A] border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-cyan-400 mb-2">
                  <ShieldAlert className="w-4 h-4" /> EVIDENCE-BACKED ROOT CAUSE DOSSIER
                </div>
                <h2 className="text-lg font-bold text-slate-100">{sessionData.title}</h2>
                <div className="mt-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {investigationData.root_cause_analysis}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('test-first')}
                className="shrink-0 ml-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                Proceed to Test-First <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2-Column: Call Stack Frames vs SBFL Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Col: Stack Trace Call Stack */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-rose-400" />
                    Parsed Call Stack Hierarchy
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    {investigationData.parsed_trace?.total_frames || 0} frames
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {investigationData.parsed_trace?.frames?.length > 0 ? (
                    investigationData.parsed_trace.frames.map((frame, idx) => {
                      const isCulprit = investigationData.parsed_trace.primary_suspect?.line === frame.line;
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                            isCulprit
                              ? 'bg-rose-500/10 border-rose-500/40 shadow-sm'
                              : 'bg-slate-900/60 border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">
                              {frame.filename}:{frame.line}
                            </span>
                            {isCulprit && (
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500 text-white">
                                PRIMARY SUSPECT
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px] mt-1">
                            Function: <span className="text-cyan-300 font-semibold">{frame.function}</span>
                          </div>
                          {frame.snippet && (
                            <div className="mt-2 p-2 rounded bg-slate-950 text-slate-300 border border-slate-800/80 overflow-x-auto text-[11px]">
                              {frame.snippet}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500 font-mono">
                      No stack trace supplied. AST static inspection active.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Spectrum-Based Fault Localization (SBFL) Table */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    SBFL Suspiciousness Ranking (Ochiai)
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-400">
                    Ochiai + AST Complexity
                  </span>
                </div>

                <div className="divide-y divide-slate-800 max-h-[420px] overflow-y-auto">
                  {investigationData.ranked_candidates?.map((candidate, idx) => (
                    <div key={idx} className="py-3.5 flex items-start justify-between gap-4">
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-200 truncate">
                            {candidate.function_name}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${getTierBadge(candidate.confidence_tier)}`}>
                            {candidate.confidence_tier}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-1">
                          lines {candidate.lineno}–{candidate.end_lineno} • complexity: {candidate.complexity}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 font-sans">
                          {candidate.evidence?.join(', ')}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-500 font-mono block">Suspiciousness</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                              style={{ width: `${Math.round(candidate.suspiciousness_score * 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-xs font-bold text-amber-400">
                            {candidate.suspiciousness_score}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Culprit Code Inspection */}
          {investigationData.primary_suspect && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Culprit Source Code Slice: <span className="font-mono text-cyan-300">{investigationData.primary_suspect.function_name}</span>
              </h3>
              <CodeBlock
                code={investigationData.primary_suspect.code_snippet}
                language="python"
                filename={investigationData.primary_suspect.function_name}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Select or initialize a debugging session to begin investigation.
        </div>
      )}
    </div>
  );
}
