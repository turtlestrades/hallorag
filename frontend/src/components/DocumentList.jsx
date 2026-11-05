import React, { useState, useRef } from 'react';
import { UploadCloud, File, Trash2, AlertCircle, CheckCircle2, Loader2, Sparkles, FolderArchive } from 'lucide-react';

export default function DocumentList({ 
  documents, 
  onUpload, 
  onDelete, 
  onClearAll, 
  isLoading 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  const processFiles = async (files) => {
    setIsUploading(true);
    setUploadMessage(null);
    let successCount = 0;
    let errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await onUpload(file);
        successCount++;
      } catch (err) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }

    setIsUploading(false);
    if (errors.length > 0) {
      setUploadMessage({
        type: 'error',
        text: `Uploaded ${successCount} file(s). Errors: ${errors.join('; ')}`
      });
    } else {
      setUploadMessage({
        type: 'success',
        text: `Successfully ingested ${successCount} document(s) into pgvector!`
      });
      setTimeout(() => setUploadMessage(null), 4000);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FolderArchive className="w-5 h-5 text-teal-400" />
          <h2 className="font-semibold text-white text-sm">Knowledge Base</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {documents.length}
          </span>
        </div>
        {documents.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center space-x-1"
            title="Remove all documents and vectors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Upload Drop Zone */}
      <div className="p-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
            isDragging
              ? 'border-teal-400 bg-teal-950/20'
              : 'border-slate-700 hover:border-teal-500/50 bg-slate-800/40 hover:bg-slate-800/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,.markdown,.docx,.doc,.json,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2 text-teal-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <p className="text-xs font-medium">Extracting text & computing embeddings...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                Drop documents here or <span className="text-teal-400 underline">browse</span>
              </p>
              <p className="text-[11px] text-slate-400">
                PDF, TXT, Markdown, Word (DOCX)
              </p>
            </div>
          )}
        </div>

        {/* Upload Status Alert */}
        {uploadMessage && (
          <div className={`mt-3 p-3 rounded-lg text-xs flex items-start space-x-2 ${
            uploadMessage.type === 'error'
              ? 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
              : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
          }`}>
            {uploadMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <span className="flex-1">{uploadMessage.text}</span>
          </div>
        )}
      </div>

      {/* Document Items List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {documents.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs text-center px-4">
            <File className="w-8 h-8 mb-2 opacity-40" />
            <p className="font-medium text-slate-400">No documents indexed yet</p>
            <p className="mt-1">Upload files above to start asking questions against your private data.</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="group p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-800/40 flex items-center justify-center text-teal-400 shrink-0">
                  <File className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate" title={doc.filename}>
                    {doc.filename}
                  </p>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>•</span>
                    <span className="text-teal-400 font-medium">{doc.chunkCount} chunks</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDelete(doc.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition shrink-0"
                title="Delete document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-950/50 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Embeddings: <span className="text-teal-300 font-mono">nomic-embed-text</span></span>
        <span>HNSW (Cosine)</span>
      </div>

    </div>
  );
}

