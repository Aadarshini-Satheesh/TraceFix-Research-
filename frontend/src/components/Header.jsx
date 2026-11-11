import React from 'react';
import { HardDrive, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export default function Header({ activeTab, activeSession, settingsInfo }) {
  const titles = {
    'dashboard': 'Research Dashboard & Verification Metrics',
    'new-session': 'Initialize New Debugging Session',
    'repository-analysis': 'Repository AST & Architecture Inspector',
    'investigation': 'Evidence-Guided Bug Investigation & SBFL',
    'test-first': 'Regression-Test-First Pre-Repair Verification',
    'repair-workspace': 'AI Code Repair Workspace (Baseline vs Proposed)',
    'patch-comparison': 'Unified Git Diff & AST Syntax Inspection',
    'verification': 'Dual-Gate Sandbox Verification',
    'experiments': 'Empirical A/B Research Experiments',
    'benchmarks': 'SWE-bench & Custom Benchmark Suite',
    'reports': 'Academic Research Paper & Report Generator',
    'settings': 'System & AI Provider Configuration',
  };

  const isMock = settingsInfo?.mock_mode_active ?? true;

  return (
    <header className="h-16 border-b border-slate-800 bg-[#090D16]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          {titles[activeTab] || 'TraceFix Research'}
        </h2>
        {activeSession ? (
          <p className="text-xs text-slate-400 font-mono">
            Active Session: <span className="text-cyan-400 font-semibold">#{activeSession.id}</span> – {activeSession.title}
          </p>
        ) : (
          <p className="text-xs text-slate-400">
            Causal Verification Architecture for Automated Program Repair
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Drive Storage Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
          <HardDrive className="w-3.5 h-3.5" />
          <span>E: Drive (Isolated)</span>
        </div>

        {/* AI Provider Status Pill */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
          isMock
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
        }`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isMock ? 'Mock AI (Deterministic)' : `${settingsInfo?.default_provider?.toUpperCase()} Active`}</span>
        </div>

        {/* Verification Guard Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Causal Guard: Enforced</span>
        </div>
      </div>
    </header>
  );
}
