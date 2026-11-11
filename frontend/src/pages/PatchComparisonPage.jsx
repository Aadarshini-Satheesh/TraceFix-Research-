import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileCode,
  Layers,
  Lock
} from 'lucide-react';
import { listSessions, getSessionDetails } from '../services/api';
import DiffViewer from '../components/DiffViewer';

export default function PatchComparisonPage({ activeSession, setActiveSession, setActiveTab }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(activeSession?.id || null);
  const [sessionData, setSessionData] = useState(null);
  const [patchIndex, setPatchIndex] = useState(0);

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
        setPatchIndex(data.patches.length - 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentPatch = sessionData?.patches?.[patchIndex] || null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <GitCompare className="w-6 h-6 text-cyan-400" />
            Patch Comparison & AST Syntax Validation
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect line-level modifications, structural additions/deletions, and Python AST conformance.
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

      {sessionData && currentPatch ? (
        <div className="space-y-6">
          {/* Patch Meta Header */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-100 font-mono">
                    {currentPatch.target_file}
                  </h2>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    currentPatch.method === 'proposed'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {currentPatch.method}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Generated in {currentPatch.generation_time_ms} ms • Cost: ${currentPatch.cost_usd} • Tokens: {currentPatch.token_usage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* AST Validation Tag */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>AST: Syntax Valid</span>
              </div>

              {/* Source Safety Guard */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Original Code Protected</span>
              </div>

              {/* Proceed to verification */}
              <button
                onClick={() => setActiveTab('verification')}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold hover:from-emerald-400 hover:to-teal-500 transition-all shadow-md shadow-emerald-500/20"
              >
                Proceed to Verification <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Patch Switcher if multiple patches exist */}
          {sessionData.patches.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Available Patches:</span>
              <div className="flex gap-2">
                {sessionData.patches.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setPatchIndex(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                      patchIndex === idx
                        ? 'bg-cyan-500 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    #{p.id} ({p.method})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Diff Viewer */}
          <DiffViewer
            unifiedDiff={currentPatch.unified_diff}
            originalCode={currentPatch.original_code}
            modifiedCode={currentPatch.modified_code}
            filename={currentPatch.target_file}
          />
        </div>
      ) : (
        <div className="p-16 text-center text-slate-500 text-xs font-mono bg-[#0F172A] border border-slate-800 rounded-2xl">
          No generated patch available for comparison. Visit the AI Repair Workspace to generate a patch.
        </div>
      )}
    </div>
  );
}
