import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  FileCode,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Layers,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  HardDrive
} from 'lucide-react';
import { getRepositories, getRepositoryTree, getRepositoryFile, uploadRepository } from '../services/api';
import CodeBlock from '../components/CodeBlock';

export default function RepositoryAnalysisPage() {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepoId, setSelectedRepoId] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [selectedFilePath, setSelectedFilePath] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [activeView, setActiveView] = useState('code'); // 'code' or 'ast'
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [localPathInput, setLocalPathInput] = useState('');

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    try {
      const repos = await getRepositories();
      setRepositories(repos);
      if (repos.length > 0 && !selectedRepoId) {
        selectRepo(repos[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectRepo = async (repoId) => {
    setSelectedRepoId(repoId);
    setLoading(true);
    try {
      const treeRes = await getRepositoryTree(repoId);
      setFileTree(treeRes.tree);
      // Auto-select first python file in tree
      const findFirstPyFile = (nodes) => {
        for (const n of nodes) {
          if (n.type === 'file' && n.is_python) return n.path;
          if (n.children) {
            const nested = findFirstPyFile(n.children);
            if (nested) return nested;
          }
        }
        return null;
      };
      const firstPy = findFirstPyFile(treeRes.tree);
      if (firstPy) {
        loadFile(repoId, firstPy);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (repoId, path) => {
    setSelectedFilePath(path);
    try {
      const data = await getRepositoryFile(repoId, path);
      setFileData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleLocalLink = async (e) => {
    e.preventDefault();
    if (!localPathInput) return;
    try {
      const formData = new FormData();
      formData.append('local_path', localPathInput);
      await uploadRepository(formData);
      setUploadModalOpen(false);
      setLocalPathInput('');
      await loadRepos();
    } catch (err) {
      alert("Error linking repository: " + (err.response?.data?.detail || err.message));
    }
  };

  const renderTreeNodes = (nodes) => {
    return nodes.map((node) => {
      if (node.type === 'directory') {
        const isExpanded = expandedFolders[node.path] ?? true;
        return (
          <div key={node.path} className="select-none">
            <button
              onClick={() => toggleFolder(node.path)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/50 rounded transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              {isExpanded ? <FolderOpen className="w-3.5 h-3.5 text-cyan-400" /> : <Folder className="w-3.5 h-3.5 text-slate-400" />}
              <span className="truncate">{node.name}</span>
            </button>
            {isExpanded && node.children && (
              <div className="pl-4 border-l border-slate-800/80 ml-2 mt-0.5 space-y-0.5">
                {renderTreeNodes(node.children)}
              </div>
            )}
          </div>
        );
      } else {
        const isSelected = selectedFilePath === node.path;
        return (
          <button
            key={node.path}
            onClick={() => loadFile(selectedRepoId, node.path)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors text-left ${
              isSelected
                ? 'bg-cyan-500/15 text-cyan-300 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileCode className={`w-3.5 h-3.5 ${node.is_python ? 'text-blue-400' : 'text-slate-500'}`} />
            <span className="truncate">{node.name}</span>
          </button>
        );
      }
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header and Repo Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <FolderGit2 className="w-6 h-6 text-cyan-400" />
            Repository Architecture & AST Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect source files, AST symbol hierarchies, and cyclomatic complexity metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRepoId || ''}
            onChange={(e) => selectRepo(parseInt(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            {repositories.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.file_count} files)
              </option>
            ))}
          </select>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" /> Add Repo
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Col: File Tree */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 h-[650px] flex flex-col">
          <div className="pb-3 mb-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-cyan-400" /> Explorer
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {fileTree.length} roots
            </span>
          </div>
          <div className="overflow-y-auto flex-1 space-y-0.5 pr-1">
            {fileTree.length > 0 ? renderTreeNodes(fileTree) : (
              <div className="text-xs text-slate-500 p-4 font-mono text-center">No files found.</div>
            )}
          </div>
        </div>

        {/* Right 3 Cols: Code & AST Analysis Inspector */}
        <div className="lg:col-span-3 bg-[#0F172A] border border-slate-800 rounded-2xl p-6 h-[650px] flex flex-col">
          {fileData ? (
            <div className="flex flex-col h-full">
              {/* File details bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-200 font-mono">{fileData.file_path}</h2>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {fileData.lines_count} lines • Python 3.12 AST
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {fileData.ast?.syntax_valid ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> AST Valid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium font-mono">
                      <AlertTriangle className="w-3.5 h-3.5" /> Syntax Error
                    </span>
                  )}

                  {/* Tabs switch */}
                  <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
                    <button
                      onClick={() => setActiveView('code')}
                      className={`px-3 py-1 rounded font-medium transition-colors ${
                        activeView === 'code' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Source Code
                    </button>
                    <button
                      onClick={() => setActiveView('ast')}
                      className={`px-3 py-1 rounded font-medium transition-colors ${
                        activeView === 'ast' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      AST Symbols ({fileData.ast?.functions?.length || 0})
                    </button>
                  </div>
                </div>
              </div>

              {/* View Content */}
              <div className="flex-1 overflow-y-auto">
                {activeView === 'code' ? (
                  <CodeBlock
                    code={fileData.content}
                    language="python"
                    filename={fileData.filename}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Functions table */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
                      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-300">
                        Discovered AST Function Definitions
                      </div>
                      <div className="divide-y divide-slate-800">
                        {fileData.ast?.functions?.map((fn, idx) => (
                          <div key={idx} className="p-4 flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-cyan-300">
                                  {fn.qualified_name}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                  lines {fn.lineno}–{fn.end_lineno}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 italic font-sans">
                                {fn.docstring || "No docstring provided."}
                              </p>
                              <div className="mt-2 text-[11px] font-mono text-slate-500">
                                Arguments: ({fn.args.join(', ')})
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] text-slate-400 block mb-1">Cyclomatic Complexity</span>
                              <span className={`px-2.5 py-1 rounded font-mono text-xs font-bold ${
                                fn.complexity > 4 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {fn.complexity} paths
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Classes summary if any */}
                    {fileData.ast?.classes?.length > 0 && (
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
                        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-300">
                          Class Definitions
                        </div>
                        <div className="p-4 space-y-3">
                          {fileData.ast.classes.map((cls, idx) => (
                            <div key={idx} className="text-xs font-mono">
                              <span className="font-bold text-purple-400">{cls.name}</span> (lines {cls.lineno}–{cls.end_lineno})
                              <div className="text-[11px] text-slate-400 pl-4 mt-1">
                                Methods: {cls.methods.join(', ') || 'None'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">
              Select a file in the explorer to analyze AST structure.
            </div>
          )}
        </div>
      </div>

      {/* Upload / Link Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" /> Link Local Repository on E: Drive
            </h3>
            <p className="text-xs text-slate-400">
              Provide an absolute directory path on the E: drive to scan and index for debugging.
            </p>
            <form onSubmit={handleLocalLink} className="space-y-4">
              <input
                type="text"
                value={localPathInput}
                onChange={(e) => setLocalPathInput(e.target.value)}
                placeholder="e.g. E:\Projects\TraceFix-Research\sample_repositories\string_toolkit"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 text-xs text-white font-semibold hover:bg-cyan-400"
                >
                  Link Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
