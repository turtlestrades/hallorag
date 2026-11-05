import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Clock, Sparkles } from 'lucide-react';
import SourceViewer from './SourceViewer';

export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-3xl space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
          isUser 
            ? 'bg-teal-600 text-white' 
            : 'bg-slate-800 border border-slate-700 text-teal-400'
        }`}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Bubble */}
        <div className={`flex-1 rounded-2xl p-4 shadow-sm ${
          isUser
            ? 'bg-teal-600 text-white rounded-tr-none'
            : 'bg-slate-800/80 border border-slate-700 text-slate-100 rounded-tl-none'
        }`}>
          
          {/* Header info */}
          <div className="flex items-center justify-between text-xs mb-1.5 opacity-70">
            <span className="font-semibold">{isUser ? 'You' : 'HalloRAG Assistant'}</span>
            {!isUser && message.executionTimeMs && (
              <span className="flex items-center space-x-1 font-mono text-[11px] text-teal-400">
                <Clock className="w-3 h-3" />
                <span>{(message.executionTimeMs / 1000).toFixed(2)}s</span>
              </span>
            )}
          </div>

          {/* Message Content */}
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-lg font-bold text-teal-300 mt-3 mb-1" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-base font-semibold text-teal-300 mt-2.5 mb-1" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-teal-400 mt-2 mb-1" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2 text-sm leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1 text-sm" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-sm" {...props} />,
                  li: ({node, ...props}) => <li className="text-slate-300" {...props} />,
                  code: ({node, inline, className, children, ...props}) => {
                    return inline ? (
                      <code className="bg-slate-900/80 text-teal-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-slate-950 p-3 rounded-lg overflow-x-auto my-2 border border-slate-800 text-xs font-mono text-teal-200">
                        <code {...props}>{children}</code>
                      </pre>
                    );
                  },
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-2 border-teal-500 pl-3 italic my-2 text-slate-400 text-xs" {...props} />
                  )
                }}
              >
                {message.text}
              </ReactMarkdown>

              {/* Source Viewer */}
              {message.sources && message.sources.length > 0 && (
                <SourceViewer sources={message.sources} />
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

