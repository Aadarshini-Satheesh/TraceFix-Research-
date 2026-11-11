import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Activity,
  Layers,
  ArrowRight,
  Terminal,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { listSessions, getSessionDetails, verifyPatch } from '../services/api';
import SandboxTerminal from '../components/SandboxTerminal';

export default function TestVerificationPage({ activeSession, setActiveSession, setActiveTab }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(activeSession?.id || null);
  const [sessionData, setSessionData] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

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
      // Check if latest patch already has verification
      if (data.patches?.length > 0) {
        const latest = data.patches[data.patches.length - 1];
        if (latest.verification) {
          setVerificationResult(latest.verification);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async () => {
    if (!sessionData || !sessionData.patches?.length) return;
    const latestPatch = sessionData.patches[sessionData.patches.length - 1];
    setVerifying(true);

    try {
      const res = await verifyPatch({
        patch_id: latestPatch.id
      });
      setVerificationResult(res);
      await loadSession(sessionData.id);
    } catch (err) {
      alert("Verification failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBanner = (status) => {
    if (status === 'VERIFIED_SUCCESS') {
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
        icon: CheckCircle2,
        title: 'VERIFIED SUCCESS: CAUSAL INVARIANTS PRESERVED',
        desc: 'Reproduction test turned from FAIL to PASS, and all existing regression tests passed without regressions.'
      };
    } else if (status === 'REGRESSION_DETECTED') {
      return {
        bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
        icon: XCircle,
        title: 'REGRESSION DETECTED: CAUSAL INVARIANTS BROKEN',
        desc: 'While the patch may have addressed the target symptom, pre-existing tests in the repository failed. Patch REJECTED.'
      };
    } else {
      return {
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        icon: AlertTriangle,
        title: 'REPRODUCTION FAILED: BUG NOT RESOLVED',
        desc: 'The reproduction test still fails with the patch applied. The patch is unverified and rejected.'
      };
    }
  };

  const latestPatch = sessionData?.patches?.[sessionData.patches.length - 1] || null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            Dual-Gate Sandbox Verification
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Causal APR Requirement 2: Strict execution of reproduction and regression suites in isolated sandbox.
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

      {sessionData && latestPatch ? (
        <div className="space-y-6">
          {/* Dual Gate Action Banner */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-200">
                  Target Patch #{latestPatch.id} ({latestPatch.method.toUpperCase()})
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  {latestPatch.target_file}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                TraceFix executes pytest inside an isolated sandbox clone on the E: drive. It checks both:
                <span className="text-slate-300 font-semibold"> Gate 1 (Reproduction test passes)</span> and
                <span className="text-slate-300 font-semibold"> Gate 2 (All regression tests pass)</span>.
              </p>
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 transition-all disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Running Sandbox Verification...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Execute Dual-Gate Verification
                </>
              )}
            </button>
          </div>

          {/* Verification Verdict Banner */}
          {verificationResult && (
            (() => {
              const banner = getStatusBanner(verificationResult.status);
              const BannerIcon = banner.icon;
              return (
                <div className={`p-5 rounded-2xl border flex items-start gap-3.5 ${banner.bg}`}>
                  <BannerIcon className="w-6 h-6 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm font-mono">{banner.title}</h3>
                      <span className="text-xs font-mono font-semibold">
                        {verificationResult.execution_time_ms} ms
                      </span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">{banner.desc}</p>

                    {/* Dual Gate Verification Pills */}
                    <div className="mt-4 flex flex-wrap gap-4 pt-3 border-t border-current/20 text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">Gate 1 (Reproduction Test):</span>
                        {verificationResult.reproduction_test_passed ? (
                          <span className="text-emerald-400 font-bold">PASSED (FAIL -&gt; PASS)</span>
                        ) : (
                          <span className="text-rose-400 font-bold">FAILED</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">Gate 2 (Regression Suite):</span>
                        {verificationResult.regression_tests_passed ? (
                          <span className="text-emerald-400 font-bold">ALL TESTS PASSED (NO REGRESSIONS)</span>
                        ) : (
                          <span className="text-rose-400 font-bold">REGRESSION DETECTED</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* Sandbox Execution Terminal */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Live Pytest Sandbox Execution Log
            </h3>
            <SandboxTerminal
              stdout={verificationResult?.raw_logs || ''}
              passedCount={verificationResult?.passed_count || verificationResult?.tests_passed_count || 0}
              failedCount={verificationResult?.failed_count || verificationResult?.tests_failed_count || 0}
              durationMs={verificationResult?.execution_time_ms || 0}
              status={verificationResult?.status || 'READY'}
              testDetails={verificationResult?.test_details || []}
            />
          </div>
        </div>
      ) : (
        <div className="p-16 text-center text-slate-500 text-xs font-mono bg-[#0F172A] border border-slate-800 rounded-2xl">
          No generated patch available for this session. Visit the AI Repair Workspace to generate a patch first.
        </div>
      )}
    </div>
  );
}
