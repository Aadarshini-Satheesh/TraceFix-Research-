import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodeBlock({ code, language = 'python', filename, highlightLines = [] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = (code || '').split('\n');

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0A0E17]">
      {filename && (
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
          <span>{filename}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
      <div className="p-3 font-mono text-xs overflow-x-auto max-h-96">
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isHighlighted = highlightLines.includes(lineNum);
          return (
            <div
              key={idx}
              className={`flex items-start gap-4 px-2 py-0.5 rounded ${
                isHighlighted ? 'bg-amber-500/20 text-amber-200 border-l-2 border-amber-400' : 'text-slate-300'
              }`}
            >
              <span className="w-8 select-none text-slate-600 text-right">{lineNum}</span>
              <span className="flex-1 whitespace-pre">{line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
