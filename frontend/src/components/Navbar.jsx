import React from 'react';
import { Database, Cpu, FileText, Sliders, Layers, RefreshCw } from 'lucide-react';

export default function Navbar({ status, onRefreshStatus, onOpenSettings }) {
  const isPostgresReady = status?.postgresConnected;
  const isOllamaReady = status?.ollamaConnected;

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Layers className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">HalloRAG</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono font-medium">
                Java 25 • Spring Boot 4.1.2
              </span>
            </div>
            <p className="text-xs text-slate-400">pgvector & Ollama RAG Intelligence</p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3 text-xs">
          
          {/* Postgres / pgvector */}
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border ${
            isPostgresReady 
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60' 
              : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
          }`}>
            <Database className="w-3.5 h-3.5" />
            <span>Postgres & pgvector:</span>
            <span className="font-semibold">{isPostgresReady ? 'Connected' : 'Offline'}</span>
          </div>

          {/* Ollama */}
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border ${
            isOllamaReady 
              ? 'bg-teal-950/40 text-teal-300 border-teal-800/60' 
              : 'bg-amber-950/40 text-amber-300 border-amber-800/60 animate-pulse'
          }`}>
            <Cpu className="w-3.5 h-3.5" />
            <span>Ollama:</span>
            <span className="font-semibold">
              {isOllamaReady ? status?.chatModel || 'Ready' : 'Waiting on models...'}
            </span>
          </div>

          {/* Counts */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <FileText className="w-3.5 h-3.5 text-teal-400" />
            <span>Docs: <strong className="text-white">{status?.documentCount ?? 0}</strong></span>
            <span className="text-slate-600">|</span>
            <span>Chunks: <strong className="text-white">{status?.vectorChunkCount ?? 0}</strong></span>
          </div>

          {/* Refresh button */}
          <button 
            onClick={onRefreshStatus}
            title="Refresh system status"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span>Settings</span>
          </button>

        </div>

      </div>
    </header>
  );
}

