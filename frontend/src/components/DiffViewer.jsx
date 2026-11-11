import React, { useState } from 'react';
import { Copy, Check, Split, AlignJustify } from 'lucide-react';

export default function DiffViewer({ unifiedDiff, originalCode, modifiedCode, filename }) {
  const [viewMode, setViewMode] = useState('split'); // 'split' or 'unified'
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(unifiedDiff || modifiedCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderUnified = () => {
    if (!unifiedDiff) {
      return <div className="p-4 text-xs text-slate-500 font-mono">No diff content available.</div>;
    }
    const lines = unifiedDiff.split('\n');
    return (
      <div className="font-mono text-xs overflow-x-auto">
        {lines.map((line, idx) => {
          let lineClass = 'text-slate-300';
          let bgClass = 'hover:bg-slate-800/40';
          if (line.startsWith('+') && !line.startsWith('+++')) {
            lineClass = 'text-emerald-400';
            bgClass = 'bg-emerald-500/10 hover:bg-emerald-500/20';
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            lineClass = 'text-rose-400';
            bgClass = 'bg-rose-500/10 hover:bg-rose-500/20';
          } else if (line.startsWith('@@')) {
            lineClass = 'text-cyan-400 font-semibold';
            bgClass = 'bg-cyan-500/10';
          }

          return (
            <div key={idx} className={`px-4 py-0.5 flex items-start gap-4 ${bgClass}`}>
              <span className="w-8 select-none text-slate-600 text-right">{idx + 1}</span>
              <span className={`flex-1 whitespace-pre ${lineClass}`}>{line}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSplit = () => {
    const origLines = (originalCode || '').split('\n');
    const modLines = (modifiedCode || '').split('\n');
    const maxLines = Math.max(origLines.length, modLines.length);

    return (
      <div className="grid grid-cols-2 divide-x divide-slate-800 font-mono text-xs overflow-x-auto">
        {/* Left: Original */}
        <div>
          <div className="bg-slate-900/90 px-4 py-1.5 text-xs font-semibold text-rose-400 border-b border-slate-800 flex items-center justify-between">
            <span>Original Code</span>
            <span className="text-[11px] text-slate-500">{origLines.length} lines</span>
          </div>
          <div>
            {Array.from({ length: maxLines }).map((_, idx) => {
              const line = origLines[idx] ?? '';
              return (
                <div key={idx} className="px-3 py-0.5 flex items-start gap-3 hover:bg-slate-800/30">
                  <span className="w-8 select-none text-slate-600 text-right">{idx + 1}</span>
                  <span className="flex-1 whitespace-pre text-slate-300">{line}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Modified */}
        <div>
          <div className="bg-slate-900/90 px-4 py-1.5 text-xs font-semibold text-emerald-400 border-b border-slate-800 flex items-center justify-between">
            <span>Repaired Code</span>
            <span className="text-[11px] text-slate-500">{modLines.length} lines</span>
          </div>
          <div>
            {Array.from({ length: maxLines }).map((_, idx) => {
              const line = modLines[idx] ?? '';
              const origLine = origLines[idx] ?? '';
              const isDiff = line !== origLine;
              return (
                <div
                  key={idx}
                  className={`px-3 py-0.5 flex items-start gap-3 ${
                    isDiff ? 'bg-emerald-500/10 text-emerald-300' : 'hover:bg-slate-800/30 text-slate-300'
                  }`}
                >
                  <span className="w-8 select-none text-slate-600 text-right">{idx + 1}</span>
                  <span className="flex-1 whitespace-pre">{line}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0F172A]">
      {/* Header toolbar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-slate-300">
            {filename || 'Patch Output'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
            Git Unified Diff
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'split' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Split className="w-3.5 h-3.5" /> Split
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'unified' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlignJustify className="w-3.5 h-3.5" /> Unified
            </button>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[520px] overflow-y-auto">
        {viewMode === 'split' ? renderSplit() : renderUnified()}
      </div>
    </div>
  );
}
