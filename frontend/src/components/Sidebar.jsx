import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FolderGit2,
  SearchCode,
  FlaskConical,
  Sparkles,
  GitCompare,
  ShieldCheck,
  BarChart3,
  Award,
  FileText,
  Settings,
  HardDrive,
  Cpu
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'new-session', label: 'New Debugging Session', icon: PlusCircle },
  { id: 'repository-analysis', label: 'Repository Analysis', icon: FolderGit2 },
  { id: 'investigation', label: 'Bug Investigation', icon: SearchCode },
  { id: 'test-first', label: 'Regression-Test-First', icon: FlaskConical },
  { id: 'repair-workspace', label: 'AI Repair Workspace', icon: Sparkles },
  { id: 'patch-comparison', label: 'Patch Comparison', icon: GitCompare },
  { id: 'verification', label: 'Test Verification', icon: ShieldCheck },
  { id: 'experiments', label: 'Research Experiments', icon: BarChart3 },
  { id: 'benchmarks', label: 'Benchmark Results', icon: Award },
  { id: 'reports', label: 'Research Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-[#090D16] border-r border-slate-800 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-lg">
              TF
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-100 tracking-tight flex items-center gap-1.5">
                TraceFix <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-medium">RESEARCH</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Causal AI Debugging</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Storage and System Status Footer */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-900/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
          <span className="flex items-center gap-1.5 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Storage Root
          </span>
          <span className="font-mono text-emerald-400 font-semibold">E:\ ONLY</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
          <span className="flex items-center gap-1.5 font-medium">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Sandbox
          </span>
          <span className="font-mono text-cyan-300">Pytest Isolated</span>
        </div>
        <div className="text-[10px] text-slate-500 text-center pt-1 border-t border-slate-800/50">
          Evidence-Driven APR v1.0
        </div>
      </div>
    </aside>
  );
}
