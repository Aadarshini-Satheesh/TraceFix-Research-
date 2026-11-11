import React, { useState, useEffect } from 'react';
import {
  Award,
  Filter,
  Eye,
  FileCode,
  Upload,
  CheckCircle2,
  Terminal,
  Zap
} from 'lucide-react';
import { getBenchmarkTasks, importBenchmarks } from '../services/api';
import CodeBlock from '../components/CodeBlock';

export default function BenchmarkResultsPage({ setActiveTab, setActiveSession }) {
  const [tasks, setTasks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [inspectModalTask, setInspectModalTask] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await getBenchmarkTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJsonText);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      await importBenchmarks(arr);
      setImportModalOpen(false);
      setImportJsonText('');
      await loadTasks();
      alert("SWE-bench tasks imported successfully!");
    } catch (err) {
      alert("Invalid JSON format: " + err.message);
    }
  };

  const categories = ['ALL', ...new Set(tasks.map(t => t.category))];
  const filteredTasks = selectedCategory === 'ALL'
    ? tasks
    : tasks.filter(t => t.category === selectedCategory);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-cyan-400" />
            SWE-bench & Custom Benchmark Suite
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Realistic defect datasets with pre-tested reproduction harnesses and invariant test suites.
          </p>
        </div>

        <button
          onClick={() => setImportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
        >
          <Upload className="w-4 h-4 text-cyan-400" /> Import SWE-bench Lite JSON
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs text-slate-400 font-mono flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Category:
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              selectedCategory === cat
                ? 'bg-cyan-500 text-white font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Task Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="p-4">Task ID</th>
                <th className="p-4">Repository</th>
                <th className="p-4">Category</th>
                <th className="p-4">Difficulty</th>
                <th className="p-4">Problem Statement</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTasks.map((t) => (
                <tr key={t.task_id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-cyan-300">{t.task_id}</td>
                  <td className="p-4 font-mono text-slate-300">{t.repo_name}</td>
                  <td className="p-4 font-mono text-slate-400">{t.category}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      t.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                      t.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {t.difficulty}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 max-w-md truncate font-medium">
                    {t.bug_description}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setInspectModalTask(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Inspection Modal */}
      {inspectModalTask && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">{inspectModalTask.task_id}</span>
                <h3 className="text-base font-bold text-slate-100 mt-1">{inspectModalTask.title}</h3>
              </div>
              <button
                onClick={() => setInspectModalTask(null)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800"
              >
                Close
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase font-mono mb-1">Target Source File</h4>
              <p className="font-mono text-xs text-cyan-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {inspectModalTask.repo_name} / {inspectModalTask.target_file}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase font-mono mb-1">Defect Description</h4>
              <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed">
                {inspectModalTask.bug_description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase font-mono mb-1">Reproduction Test Code</h4>
              <CodeBlock
                code={inspectModalTask.failing_test_code}
                language="python"
                filename={inspectModalTask.failing_test_file}
              />
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              Import SWE-bench Lite JSON Dataset
            </h3>
            <p className="text-xs text-slate-400">
              Paste a JSON array matching the standard SWE-bench Lite task schema (e.g., <code>instance_id</code>, <code>problem_statement</code>, <code>test_patch</code>).
            </p>
            <form onSubmit={handleImport} className="space-y-4">
              <textarea
                rows={8}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='[{"instance_id": "django__django-11001", "problem_statement": "...", "test_patch": "..."}]'
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 text-xs text-white font-semibold hover:bg-cyan-400"
                >
                  Import Dataset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
