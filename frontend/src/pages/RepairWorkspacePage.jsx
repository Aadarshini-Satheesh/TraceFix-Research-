import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  GitCompare,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Clock,
  DollarSign,
  FileCode,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { listSessions, getSessionDetails, generatePatch } from '../services/api';
import DiffViewer from '../components/DiffViewer';

export default function RepairWorkspacePage({ activeSession, setActiveSession, setActiveTab }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(activeSession?.id || null);
  const [sessionData, setSessionData] = useState(null);
  const [repairMethod, setRepairMethod] = useState('proposed'); // 'baseline' vs 'proposed'
  const [generating, setGenerating] = useState(false);
  const [latestPatch, setLatestPatch] = useState(null);

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
    try {
      const data = await getSessionDetails(id);
      setSessionData(data);
      setActiveSession(data);
      if (data.patches?.length > 0) {
        setLatestPatch(data.patches[data.patches.length - 1]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGeneratePatch = async () => {
    if (!sessionData) return;
    setGenerating(true);
    try {
      const res = await generatePatch({
        session_id: sessionData.id,
        method: repairMethod,
        target_file: sessionData.target_file
      });
      setLatestPatch(res);
      await loadSession(sessionData.id);
    } catch (err) {
      alert("Error generating patch: " + (err.response?.data?.detail || err.message));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            AI Code Repair Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare Standard Baseline LLM repair against TraceFix Evidence-Guided Causal Repair.
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

      {sessionData ? (
        <div className="space-y-6">
          {/* Method Selection Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline Option Card */}
            <div
              onClick={() => setRepairMethod('baseline')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                repairMethod === 'baseline'
                  ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-300">
                  METHOD A: BASELINE APR
                </span>
                <span className={`w-3.5 h-3.5 rounded-full border-2 ${
                  repairMethod === 'baseline' ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                }`}></span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">Standard Direct LLM Repair</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Standard prompt passing the bug report and file. Generates patch without pre-repair negative confirmation or invariant preservation constraints.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-400 font-mono">
                <AlertTriangle className="w-3.5 h-3.5" /> Subject to Plausibility Bias & Regressions
              </div>
            </div>

            {/* Proposed TraceFix Option Card */}
            <div
              onClick={() => setRepairMethod('proposed')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                repairMethod === 'proposed'
                  ? 'bg-gradient-to-br from-[#0B182B] to-[#0F172A] border-cyan-400 shadow-lg shadow-cyan-500/15'
                  : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  METHOD B: PROPOSED TRACEFIX
                </span>
                <span className={`w-3.5 h-3.5 rounded-full border-2 ${
                  repairMethod === 'proposed' ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                }`}></span>
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Evidence-Guided Causal Repair
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  RECOMMENDED
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Multi-stage causal repair using verified failing reproduction test, Ochiai SBFL suspiciousness slices, and strict regression invariant rules.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> Dual-Gate Invariant Verification Enforced
              </div>
            </div>
          </div>

          {/* Action Trigger Bar */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-xs text-slate-400">Target File:</span>
                <span className="ml-1.5 font-mono text-xs font-semibold text-slate-200">
                  {sessionData.target_file || 'Auto-detected from AST'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleGeneratePatch}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    Generating Causal Patch...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate Code Patch ({repairMethod.toUpperCase()})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Patch & Execution Metrics */}
          {latestPatch ? (
            <div className="space-y-6">
              {/* Metrics & Explanation Card */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      Generated Patch #{latestPatch.id || 'Latest'}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      latestPatch.method === 'proposed'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {latestPatch.method} method
                    </span>
                  </div>

                  {/* Latency & Cost Pills */}
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {latestPatch.generation_time_ms} ms
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      ${latestPatch.cost_usd}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      {latestPatch.token_usage} tokens
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 text-xs font-mono text-slate-300">
                  <p className="font-semibold text-cyan-400 mb-1">Causal Repair Explanation:</p>
                  <p className="leading-relaxed">{latestPatch.explanation}</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('patch-comparison')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors"
                  >
                    <GitCompare className="w-4 h-4 text-cyan-400" />
                    Inspect Full Git Diff
                  </button>
                  <button
                    onClick={() => setActiveTab('verification')}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-xs text-white font-semibold transition-all shadow-md shadow-emerald-500/20"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Verify in Isolated Sandbox
                  </button>
                </div>
              </div>

              {/* Inline Diff Preview */}
              <DiffViewer
                unifiedDiff={latestPatch.unified_diff}
                originalCode={latestPatch.original_code}
                modifiedCode={latestPatch.modified_code}
                filename={latestPatch.target_file}
              />
            </div>
          ) : (
            <div className="p-16 text-center text-slate-500 text-xs font-mono bg-[#0F172A] border border-slate-800 rounded-2xl">
              No patch generated yet for this session. Select a method and click "Generate Code Patch".
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Select or initialize a debugging session to begin code repair.
        </div>
      )}
    </div>
  );
}
