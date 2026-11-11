import React, { useState, useEffect } from 'react';
import {
  Settings,
  HardDrive,
  Cpu,
  Key,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';

export default function SettingsPage({ settingsInfo, setSettingsInfo }) {
  const [provider, setProvider] = useState('mock');
  const [model, setModel] = useState('gemini-1.5-pro');
  const [timeoutSec, setTimeoutSec] = useState(20);
  const [temperature, setTemperature] = useState(0.2);
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [customBase, setCustomBase] = useState('http://localhost:11434/v1');
  const [showKeys, setShowKeys] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getSettings().then(cfg => {
      setProvider(cfg.default_provider || 'mock');
      setModel(cfg.default_model || 'gemini-1.5-pro');
      setTimeoutSec(cfg.sandbox_timeout_seconds || 20);
      setTemperature(cfg.temperature || 0.2);
      setCustomBase(cfg.custom_api_base || 'http://localhost:11434/v1');
      if (setSettingsInfo) setSettingsInfo(cfg);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({
        default_provider: provider,
        default_model: model,
        sandbox_timeout_seconds: timeoutSec,
        temperature,
        gemini_api_key: geminiKey || undefined,
        openai_api_key: openaiKey || undefined,
        anthropic_api_key: anthropicKey || undefined,
        custom_api_base: customBase
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      const updated = await getSettings();
      if (setSettingsInfo) setSettingsInfo(updated);
    } catch (err) {
      alert("Error saving settings: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-cyan-400" />
          System & AI Provider Configuration
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure language model endpoints, isolated sandbox execution parameters, and verify E: drive storage paths.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Configuration saved successfully. System parameters updated.</span>
        </div>
      )}

      {/* Storage Architecture Verification Banner */}
      <div className="bg-[#0F172A] border border-emerald-500/30 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-100 font-mono">
            STRICT STORAGE REQUIREMENT: E:\ DRIVE ISOLATION
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Because C: drive has restricted disk quota (&lt;1 GB free), TraceFix enforces zero file creation on C:. All components, packages, temporary files, and isolated test sandboxes are mounted strictly on E: drive.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500 block text-[10px]">Project Root</span>
            <span>E:\Projects\TraceFix-Research</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500 block text-[10px]">Pytest Sandbox Directory</span>
            <span>E:\Projects\TraceFix-Research\.cache\sandbox_runs</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500 block text-[10px]">Pip & NPM Caches</span>
            <span>E:\Projects\TraceFix-Research\.cache</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500 block text-[10px]">SQLite Database</span>
            <span>E:\Projects\TraceFix-Research\backend\data\tracefix.db</span>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-6">
        {/* Provider Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-200 mb-2 font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> AI Provider Selection
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'mock', label: 'Mock AI Engine', desc: 'Deterministic AST repairs (Free, Zero API keys needed)' },
              { id: 'gemini', label: 'Google Gemini', desc: 'Gemini 1.5 Pro / Flash via Google AI Studio' },
              { id: 'openai', label: 'OpenAI GPT-4o', desc: 'OpenAI API endpoint' },
              { id: 'custom', label: 'Custom / Ollama', desc: 'Local models (e.g., Llama 3, DeepSeek)' },
            ].map(item => (
              <div
                key={item.id}
                onClick={() => setProvider(item.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  provider === item.id
                    ? 'bg-cyan-500/15 border-cyan-400 text-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">{item.label}</span>
                  <span className={`w-3 h-3 rounded-full border ${
                    provider === item.id ? 'bg-cyan-400 border-cyan-400' : 'border-slate-600'
                  }`}></span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Model & Hyperparameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
              Model Name / Identifier
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. gemini-1.5-pro, gpt-4o, llama3"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
              Sandbox Timeout (Seconds)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={60}
                value={timeoutSec}
                onChange={(e) => setTimeoutSec(parseInt(e.target.value))}
                className="flex-1 accent-cyan-500"
              />
              <span className="w-12 text-right font-mono text-xs font-bold text-cyan-400">
                {timeoutSec}s
              </span>
            </div>
          </div>
        </div>

        {/* API Keys Configuration */}
        {provider !== 'mock' && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" /> API Keys & Endpoints
              </h3>
              <button
                type="button"
                onClick={() => setShowKeys(!showKeys)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showKeys ? 'Hide Keys' : 'Show Keys'}
              </button>
            </div>

            {provider === 'gemini' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono">Gemini API Key</label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            )}

            {provider === 'openai' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono">OpenAI API Key</label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            )}

            {provider === 'custom' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono">Custom API Base URL (Ollama / vLLM)</label>
                <input
                  type="text"
                  value={customBase}
                  onChange={(e) => setCustomBase(e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
