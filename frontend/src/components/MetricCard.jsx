import React from 'react';

export default function MetricCard({ title, value, unit, delta, isGoodDelta = true, subtext, icon: Icon, color = 'cyan' }) {
  const colorMap = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/30',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30',
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{title}</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl font-bold font-mono text-slate-100">{value}</span>
            {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg border bg-gradient-to-br ${colorMap[color] || colorMap.cyan}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400">{subtext}</span>
        {delta && (
          <span className={`font-mono font-semibold ${isGoodDelta ? 'text-emerald-400' : 'text-rose-400'}`}>
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
