import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Activity,
  Code2
} from 'lucide-react';
import { listSessions, getSessionDetails, runTestFirst } from '../services/api';
import SandboxTerminal from '../components/SandboxTerminal';

export default function RegressionTestFirstPage({ activeSession, setActiveSession, setActiveTab }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(activeSession?.id || null);
  const [sessionData, setSessionData] = useState(null);
  const [testCode, setTestCode] = useState('');
  const [executing, setExecuting] = useState(false);
  const [runResult, setRunResult] = useState(null);

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
      if (data.tests?.length > 0) {
        setTestCode(data.tests[0].code);
      } else {
        // Fallback default reproduction test template
        setTestCode(`import pytest\n\ndef test_reproduce_defect():\n    # Reproduction assertion\n    assert False, "Bug not yet resolved"\n`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteTest = async () => {
    if (!sessionData) return;
    setExecuting(true);
    setRunResult(null);

    try {
      const res = await runTestFirst({
        session_id: sessionData.id,
        custom_test_code: testCode
      });
      setRunResult(res);
      // Reload session data to update status
      loadSession(sessionData.id);
    } catch (err) {
      alert("Error executing reproduction test: " + (err.response?.data?.detail || err.message));
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <FlaskConical className="w-6 h-6 text-cyan-400" />
            Regression-Test-First Pre-Repair Verification
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Causal APR Requirement 1: Formulate and execute a reproduction test on unmodified code to prove failure.
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
          {/* Scientific Rationale Banner */}
          <div className="bg-[#0F172A] border border-cyan-500/20 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200 font-mono">
                  CAUSAL REQUISITE: NEGATIVE EVIDENCE CONFIRMATION
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  An AI patch must never be generated on blind faith. The reproduction test must <span className="text-rose-400 font-bold">FAIL</span> in the isolated sandbox first before any fix is accepted.
                </p>
              </div>
            </div>

            <button
              onClick={handleExecuteTest}
              disabled={executing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 shrink-0"
            >
              {executing ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Executing Sandbox...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Execute Pre-Repair Test
                </>
              )}
            </button>
          </div>

          {/* Test Editor and Sandbox Result Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Test Code Editor */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    Reproduction Test Definition
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    pytest assertions
                  </span>
                </div>

                <textarea
                  rows={14}
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  className="w-full bg-[#0A0E17] border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Executes in isolated clone on E: drive</span>
                <span className="font-mono text-cyan-400 font-medium">Timeout: 20s</span>
              </div>
            </div>

            {/* Right: Sandbox Execution & Causal Confirmation Status */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    Pre-Repair Sandbox Execution
                  </span>
                  {runResult && (
                    <span className="text-xs font-mono font-bold text-slate-300">
                      Duration: {runResult.duration_ms} ms
                    </span>
                  )}
                </div>

                {runResult ? (
                  <div className="space-y-4">
                    {/* Causal Verdict Pill */}
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                      runResult.pre_repair_test_failed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}>
                      {runResult.pre_repair_test_failed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className="font-bold text-xs font-mono">
                          {runResult.pre_repair_test_failed
                            ? 'CAUSAL VERIFICATION CONFIRMED: REPRODUCTION FAILED AS EXPECTED'
                            : 'INVALID REPRODUCTION: TEST PASSED ON UNPATCHED CODE'}
                        </h4>
                        <p className="text-xs mt-1 opacity-90">
                          {runResult.message}
                        </p>
                      </div>
                    </div>

                    {/* Output logs terminal */}
                    <SandboxTerminal
                      stdout={runResult.stdout}
                      stderr={runResult.stderr}
                      passedCount={runResult.passed_count}
                      failedCount={runResult.failed_count}
                      durationMs={runResult.duration_ms}
                      status={runResult.pre_repair_test_failed ? 'FAILED (CONFIRMED)' : 'PASSED (INVALID)'}
                    />
                  </div>
                ) : (
                  <div className="p-16 text-center text-slate-500 text-xs font-mono">
                    Click "Execute Pre-Repair Test" to verify that the bug is authentically reproduced before generating any fix.
                  </div>
                )}
              </div>

              {runResult?.pre_repair_test_failed && (
                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setActiveTab('repair-workspace')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all"
                  >
                    Proceed to AI Code Repair <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Select or initialize a debugging session to configure reproduction tests.
        </div>
      )}
    </div>
  );
}
