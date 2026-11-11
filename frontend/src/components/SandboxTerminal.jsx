import React, { useState } from 'react';
import { Terminal, Copy, Check, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function SandboxTerminal({
  stdout = '',
  stderr = '',
  passedCount = 0,
  failedCount = 0,
  errorCount = 0,
  durationMs = 0,
  status = 'READY',
  testDetails = []
}) {
  const [copied, setCopied] = useState(false);

  const fullLogs = [stdout, stderr].filter(Boolean).join('\n') || 'Sandbox initialized. Awaiting execution command...';

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLogs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'VERIFIED_SUCCESS':
      case 'SUCCESS':
      case 'PASSED':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'REGRESSION_DETECTED':
      case 'FAILED':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'REPRODUCTION_FAILED':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0A0E17] shadow-xl">
      {/* Terminal Title Bar */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Isolated Execution Sandbox (E:\.cache\sandbox_runs)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {durationMs > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-400">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{durationMs} ms</span>
            </div>
          )}

          <div className={`px-2 py-0.5 rounded border text-[11px] font-mono font-semibold ${getStatusColor()}`}>
            {status}
          </div>

          <button
            onClick={handleCopy}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Test Counts Badge Bar */}
      {(passedCount > 0 || failedCount > 0 || errorCount > 0) && (
        <div className="px-4 py-1.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> {passedCount} Passed
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <XCircle className="w-3.5 h-3.5" /> {failedCount} Failed
          </span>
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" /> {errorCount} Errors
            </span>
          )}
        </div>
      )}

      {/* Terminal Output */}
      <pre className="p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto max-h-80 select-text whitespace-pre-wrap">
        {fullLogs}
      </pre>
    </div>
  );
}
