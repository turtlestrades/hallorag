import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Loader2, Trash2, ArrowDown } from 'lucide-react';
import ChatMessage from './ChatMessage';

const SUGGESTIONS = [
  "Summarize the main points from the uploaded documents",
  "What are the key technical concepts described in the files?",
  "List actionable recommendations found in the documents",
  "Extract important dates, metrics, or statistics"
];

export default function ChatArea({ 
  messages, 
  onSendMessage, 
  isLoading, 
  onClearHistory,
  hasDocuments 
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative">
      
      {/* Top Bar */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <Bot className="w-4 h-4 text-teal-400" />
          <span className="font-semibold">RAG Conversation</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{messages.length} message(s)</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center space-x-1 text-slate-400 hover:text-rose-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 shadow-lg shadow-teal-500/10">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Ask Anything About Your Data
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Upload documents using the sidebar. Every question runs pgvector semantic similarity search, pulls the most relevant chunks, and prompts Ollama to answer with precise citations.
            </p>

            {/* Prompt pills */}
            <div className="w-full space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">
                Suggested Prompts
              </p>
              {SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(sug);
                    inputRef.current?.focus();
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/40 text-xs text-slate-300 hover:text-white transition"
                >
                  "{sug}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
          </>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center space-x-3 text-slate-400 text-xs py-3 px-4 bg-slate-900/60 rounded-xl border border-slate-800 w-fit">
            <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
            <span>Querying pgvector & synthesizing answer via Ollama...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/70 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-end space-x-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hasDocuments 
                  ? "Ask a question about your documents... (Shift+Enter for new line)"
                  : "Upload a document first, or ask a general query..."
              }
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-3.5 pr-12 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none shadow-inner leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-semibold transition shadow-lg shadow-teal-500/20 shrink-0"
            title="Send query"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>

    </div>
  );
}

