import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  BookOpen,
  Award,
  Layers,
  Activity
} from 'lucide-react';
import { getLatestReport, downloadReport } from '../services/api';

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestReport()
      .then(data => setReportData(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header and Download Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-cyan-400" />
            Academic Research Paper & Empirical Report
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Formal research paper formatted with methodology, mathematical invariants, tables, and case studies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadReport('md')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" /> Download .MD
          </button>
          <button
            onClick={() => downloadReport('html')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" /> Download .HTML
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-white transition-all shadow-md shadow-cyan-500/20"
          >
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex items-center justify-center text-slate-400 text-sm font-mono">
          <Activity className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
          Compiling research findings & comparative data...
        </div>
      ) : reportData ? (
        <article className="bg-[#0F172A] border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl text-slate-200 space-y-6 leading-relaxed">
          {/* Paper Title Header */}
          <div className="border-b border-slate-800 pb-6 text-center">
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20">
              NATIONAL TECHNICAL HACKATHON RESEARCH TRACK
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 tracking-tight">
              TraceFix: Evidence-Driven AI Program Repair with Causal Invariant Verification
            </h2>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              TraceFix Automated Research Team • Evaluation Engine: Isolated Python AST & Pytest Sandbox
            </p>
          </div>

          {/* Formatted Markdown Content Container */}
          <div className="prose prose-invert prose-sm max-w-none space-y-6 text-slate-300">
            <pre className="font-sans whitespace-pre-wrap leading-relaxed text-xs sm:text-sm bg-transparent p-0 border-0 text-slate-300">
              {reportData.markdown}
            </pre>
          </div>
        </article>
      ) : (
        <div className="p-16 text-center text-slate-500 text-xs font-mono bg-[#0F172A] border border-slate-800 rounded-2xl">
          Unable to compile research report. Please verify backend service status.
        </div>
      )}
    </div>
  );
}
