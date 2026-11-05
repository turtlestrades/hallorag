import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Copy, Check, Target } from 'lucide-react';

export default function SourceViewer({ sources }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!sources || sources.length === 0) return null;

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const copyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/60">
      <div className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 mb-2">
        <Target className="w-3.5 h-3.5 text-teal-400" />
        <span>Retrieved Context ({sources.length} chunks from pgvector):</span>
      </div>

      <div className="space-y-1.5">
        {sources.map((src, idx) => {
          const isExpanded = expandedIndex === idx;
          const scorePercent = src.score != null ? Math.round(src.score * 100) : null;

          return (
            <div
              key={idx}
              className="rounded-lg border border-slate-700/50 bg-slate-800/40 overflow-hidden transition"
            >
              {/* Accordion Header */}
              <div
                onClick={() => toggleExpand(idx)}
                className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 text-xs"
              >
                <div className="flex items-center space-x-2 min-w-0 pr-2">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="font-medium text-slate-200 truncate">
                    {src.filename || 'Document'}
                  </span>
                  <span className="text-slate-400 text-[11px] shrink-0">
                    Chunk #{src.chunkIndex}
                  </span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {scorePercent !== null && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      scorePercent >= 75
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : scorePercent >= 50
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    }`}>
                      {scorePercent}% match
                    </span>
                  )}
                </div>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-700/40 bg-slate-900/60 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Indexed Chunk Text</span>
                    <button
                      onClick={() => copyText(src.content, idx)}
                      className="flex items-center space-x-1 text-slate-400 hover:text-white transition"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-teal-400" />
                          <span className="text-teal-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy snippet</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-[11px] whitespace-pre-wrap break-words max-h-48 overflow-y-auto leading-relaxed">
                    {src.content}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

