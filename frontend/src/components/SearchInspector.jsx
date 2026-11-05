import React, { useState } from 'react';
import { Search, Target, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { directVectorSearch } from '../services/api';

export default function SearchInspector({ settings }) {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(settings?.topK || 5);
  const [threshold, setThreshold] = useState(0.0);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [searchTime, setSearchTime] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    const start = performance.now();

    try {
      const data = await directVectorSearch({
        query: query.trim(),
        topK: Number(topK),
        similarityThreshold: Number(threshold)
      });
      setResults(data);
      setSearchTime((performance.now() - start).toFixed(1));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-5xl mx-auto overflow-y-auto">
      
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Target className="w-5 h-5 text-teal-400" />
          <span>pgvector Similarity Search Inspector</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Inspect raw cosine distance nearest-neighbors and vector chunks directly from PostgreSQL without LLM generation.
        </p>
      </div>

      {/* Query Form */}
      <form onSubmit={handleSearch} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-6">
        <div className="flex space-x-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter search phrase to test semantic vector similarity..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center space-x-2 transition shrink-0"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search Vectors</span>
          </button>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
          <div>
            <div className="flex justify-between mb-1">
              <span>Top-K Nearest Neighbors:</span>
              <span className="font-mono text-teal-400 font-semibold">{topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              className="w-full accent-teal-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Minimum Cosine Similarity:</span>
              <span className="font-mono text-teal-400 font-semibold">{(threshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full accent-teal-500"
            />
          </div>
        </div>
      </form>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs mb-6">
          Error executing vector search: {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pb-2 border-b border-slate-800">
            <span>
              Found <strong className="text-white">{results.length}</strong> matching chunks in <strong className="text-teal-400 font-mono">{searchTime}ms</strong>
            </span>
            <span className="text-[11px] font-mono">Distance Metric: Cosine (HNSW)</span>
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No vector chunks passed the similarity threshold of {(threshold * 100).toFixed(0)}%. Try lowering the threshold or uploading relevant documents.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((res, i) => {
                const score = res.score != null ? (res.score * 100).toFixed(1) : 'N/A';
                return (
                  <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 font-mono font-bold text-teal-400">
                          #{i + 1}
                        </span>
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-200">{res.filename}</span>
                        <span className="text-slate-500">• Chunk {res.chunkIndex}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/30 font-mono text-xs font-semibold">
                        {score}% similarity
                      </span>
                    </div>

                    <pre className="p-3 rounded-lg bg-slate-950 text-slate-300 font-mono text-xs whitespace-pre-wrap break-words leading-relaxed border border-slate-800/80">
                      {res.content}
                    </pre>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

