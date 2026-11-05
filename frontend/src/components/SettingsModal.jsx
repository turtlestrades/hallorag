import React, { useState } from 'react';
import { X, Sliders, RotateCcw, Check } from 'lucide-react';

const DEFAULT_SETTINGS = {
  topK: 4,
  similarityThreshold: 0.5,
  temperature: 0.2,
  systemPrompt: `You are an expert AI knowledge assistant powered by a RAG system.
Your task is to answer the user's question accurately and thoroughly based ONLY on the provided context information.

Key Instructions:
1. Rely strictly on facts mentioned in the context. If the context does not contain enough info, admit that clearly.
2. Whenever citing information, reference the specific source (e.g. [Source 1] or the filename).
3. Format your response cleanly using Markdown with bullet points or sections where appropriate.`
};

export default function SettingsModal({ isOpen, onClose, settings, onSave }) {
  const [form, setForm] = useState(settings || DEFAULT_SETTINGS);

  if (!isOpen) return null;

  const handleReset = () => {
    setForm(DEFAULT_SETTINGS);
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">RAG Hyperparameters & Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          
          {/* Top-K */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-semibold text-slate-200">
                Top-K Chunks Retrieved:
              </label>
              <span className="font-mono text-teal-400 font-bold text-sm">{form.topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={form.topK}
              onChange={(e) => setForm({ ...form, topK: Number(e.target.value) })}
              className="w-full accent-teal-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Number of most relevant vector chunks to pull from pgvector and feed to Ollama.
            </p>
          </div>

          {/* Similarity Threshold */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-semibold text-slate-200">
                Cosine Similarity Cutoff Threshold:
              </label>
              <span className="font-mono text-teal-400 font-bold text-sm">
                {(form.similarityThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.9"
              step="0.05"
              value={form.similarityThreshold}
              onChange={(e) => setForm({ ...form, similarityThreshold: Number(e.target.value) })}
              className="w-full accent-teal-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Minimum semantic relevance score. Lower values retrieve more general matches; higher values enforce strict relevance.
            </p>
          </div>

          {/* Temperature */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-semibold text-slate-200">
                LLM Temperature:
              </label>
              <span className="font-mono text-teal-400 font-bold text-sm">
                {form.temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={form.temperature}
              onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
              className="w-full accent-teal-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Lower temperature (0.1 - 0.3) makes responses factual and grounded in context, reducing hallucinations.
            </p>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1.5">
              Custom RAG System Prompt:
            </label>
            <textarea
              rows={5}
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Instructs the LLM on how to treat the retrieved context and structure answers.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white flex items-center space-x-1.5 shadow-md shadow-teal-500/20 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Settings</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

