import React, { useState, useEffect } from 'react';
import { PlusCircle, Sparkles, FolderGit2, AlertCircle, ArrowRight, Play, Terminal } from 'lucide-react';
import { getRepositories, createSession } from '../services/api';

const SAMPLE_BUGS = [
  {
    repoName: 'math_stats',
    title: 'IndexError on 100th Percentile & Boundary Ranks',
    targetFile: 'stats/metrics.py',
    description: 'calculate_percentile crashes with IndexError: list index out of range when calculating the 100th percentile or when provided single-element arrays due to unconstrained ceiling index.',
    stackTrace: `Traceback (most recent call last):
  File "stats/metrics.py", line 42, in calculate_percentile
    return sorted_vals[floor_idx] * (1.0 - weight) + sorted_vals[ceil_idx] * weight
IndexError: list index out of range`,
    reproductionTest: `import pytest
from stats.metrics import calculate_percentile

def test_percentile_100th_boundary():
    result = calculate_percentile([10, 20, 30], 100)
    assert result == 30.0

def test_percentile_single_element():
    result = calculate_percentile([42.0], 50)
    assert result == 42.0`
  },
  {
    repoName: 'string_toolkit',
    title: 'Slugify Fails Delimiter Stripping & Collapsing',
    targetFile: 'toolkit/formatter.py',
    description: 'slugify does not collapse consecutive punctuation separators and fails to strip custom separators from string boundaries.',
    stackTrace: `Traceback (most recent call last):
  File "tests/test_reproduce_slugify.py", line 7, in test_slugify_consecutive
    assert result == "hello-world-2026"
AssertionError: Expected 'hello-world-2026' but got '---hello---world---2026---'`,
    reproductionTest: `import pytest
from toolkit.formatter import slugify

def test_slugify_consecutive_separators_and_boundary_stripping():
    result = slugify("--- Hello, World!!! 2026 ---")
    assert result == "hello-world-2026"`
  },
  {
    repoName: 'data_cache',
    title: 'TypeError on Non-TTL Cache Entry Retrieval',
    targetFile: 'cache/lru_cache.py',
    description: 'TimedLRUCache.get raises TypeError: > not supported between instances of float and NoneType when retrieving persistent entries created with ttl=None.',
    stackTrace: `Traceback (most recent call last):
  File "cache/lru_cache.py", line 38, in get
    if time.time() > expires_at:
TypeError: '>' not supported between instances of 'float' and 'NoneType'`,
    reproductionTest: `import pytest
from cache.lru_cache import TimedLRUCache

def test_cache_without_ttl_reproduction():
    cache = TimedLRUCache(capacity=5)
    cache.set("persistent", "data-payload", ttl_seconds=None)
    assert cache.get("persistent") == "data-payload"`
  }
];

export default function NewSessionPage({ setActiveTab, setActiveSession }) {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [title, setTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [stackTrace, setStackTrace] = useState('');
  const [targetFile, setTargetFile] = useState('');
  const [reproTestCode, setReproTestCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getRepositories().then(repos => {
      setRepositories(repos);
      if (repos.length > 0) {
        setSelectedRepoId(repos[0].id);
      }
    });
  }, []);

  const loadSampleBug = (sample) => {
    const matchedRepo = repositories.find(r => r.name.toLowerCase().includes(sample.repoName.toLowerCase()));
    if (matchedRepo) {
      setSelectedRepoId(matchedRepo.id);
    }
    setTitle(sample.title);
    setTargetFile(sample.targetFile);
    setBugDescription(sample.description);
    setStackTrace(sample.stackTrace);
    setReproTestCode(sample.reproductionTest);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRepoId || !title || !bugDescription) {
      setError("Please select a repository, title, and bug description.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await createSession({
        repo_id: parseInt(selectedRepoId),
        title,
        bug_description: bugDescription,
        stack_trace: stackTrace,
        target_file: targetFile,
        reproduction_test_code: reproTestCode
      });
      setActiveSession({
        id: res.session_id,
        title: res.title,
        repo_id: parseInt(selectedRepoId)
      });
      // Move to investigation
      setActiveTab('investigation');
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create debugging session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <PlusCircle className="w-6 h-6 text-cyan-400" />
          Initialize New Debugging Session
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Input repository defect details, stack trace evidence, and candidate reproduction tests.
        </p>
      </div>

      {/* 1-Click Sample Bug Scenario Presets */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-200">Load Pre-Configured Sample Bug Scenarios</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Select one of the benchmark scenarios bundled on the E: drive to populate authentic bug reports and reproduction tests instantly:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_BUGS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadSampleBug(sample)}
              className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
                  {sample.repoName}
                </span>
                <p className="text-xs font-semibold text-slate-200 mt-2 group-hover:text-cyan-300 transition-colors">
                  {sample.title}
                </p>
              </div>
              <span className="text-[11px] text-cyan-400/80 font-medium mt-3 flex items-center gap-1">
                Load Scenario <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Repository Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" /> Target Repository
            </label>
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.name} ({repo.file_count} files, {repo.is_sample ? 'Sample Repo' : 'Custom'})
                </option>
              ))}
            </select>
          </div>

          {/* Session Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Session Title / Task Identifier
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fix IndexError in calculate_percentile"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
        </div>

        {/* Target Relative File */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Primary Target File (Relative Path inside Repository)
          </label>
          <input
            type="text"
            value={targetFile}
            onChange={(e) => setTargetFile(e.target.value)}
            placeholder="e.g. stats/metrics.py"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Bug Description */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Bug Description & Expected Behavior
          </label>
          <textarea
            rows={3}
            value={bugDescription}
            onChange={(e) => setBugDescription(e.target.value)}
            placeholder="Describe the defect, failure symptoms, and expected behavior..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            required
          />
        </div>

        {/* Stack Trace */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-rose-400" /> Stack Trace / Culprit Traceback
          </label>
          <textarea
            rows={4}
            value={stackTrace}
            onChange={(e) => setStackTrace(e.target.value)}
            placeholder="Paste Python traceback here for AST frame extraction and SBFL ranking..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Candidate Reproduction Test */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-emerald-400" /> Reproduction Test (Regression-Test-First)
          </label>
          <textarea
            rows={5}
            value={reproTestCode}
            onChange={(e) => setReproTestCode(e.target.value)}
            placeholder="Pytest test function that asserts the failing condition..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
          >
            {loading ? 'Initializing Session...' : 'Create Session & Start Investigation'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
