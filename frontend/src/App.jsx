import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DocumentList from './components/DocumentList';
import ChatArea from './components/ChatArea';
import SearchInspector from './components/SearchInspector';
import SettingsModal from './components/SettingsModal';
import { 
  fetchSystemStatus, 
  fetchDocuments, 
  uploadDocument, 
  deleteDocument, 
  clearAllDocuments, 
  sendChatMessage 
} from './services/api';
import { MessageSquare, Target } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'inspector'
  const [status, setStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    topK: 4,
    similarityThreshold: 0.5,
    temperature: 0.2,
    systemPrompt: `You are an expert AI knowledge assistant powered by a RAG system.
Your task is to answer the user's question accurately and thoroughly based ONLY on the provided context information.

Key Instructions:
1. Rely strictly on facts mentioned in the context. If the context does not contain enough info, admit that clearly.
2. Whenever citing information, reference the specific source (e.g. [Source 1] or the filename).
3. Format your response cleanly using Markdown with bullet points or sections where appropriate.`
  });

  // Initial load & polling
  const loadStatus = async () => {
    try {
      const data = await fetchSystemStatus();
      setStatus(data);
    } catch (e) {
      console.warn("Failed to retrieve system status:", e);
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (e) {
      console.warn("Failed to retrieve documents:", e);
    }
  };

  useEffect(() => {
    loadStatus();
    loadDocuments();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (file) => {
    const newDoc = await uploadDocument(file);
    await loadDocuments();
    await loadStatus();
    return newDoc;
  };

  const handleDeleteDoc = async (id) => {
    await deleteDocument(id);
    await loadDocuments();
    await loadStatus();
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to delete all documents and vector embeddings?")) {
      await clearAllDocuments();
      await loadDocuments();
      await loadStatus();
    }
  };

  const handleSendMessage = async (text) => {
    const userMsg = { sender: 'user', text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoadingChat(true);

    try {
      const response = await sendChatMessage({
        message: text,
        topK: settings.topK,
        similarityThreshold: settings.similarityThreshold,
        temperature: settings.temperature,
        systemPrompt: settings.systemPrompt,
      });

      const assistantMsg = {
        sender: 'assistant',
        text: response.answer,
        sources: response.sources,
        executionTimeMs: response.executionTimeMs,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        sender: 'assistant',
        text: `⚠️ **Error generating response:** ${err.message}`,
        sources: [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* Top Navigation */}
      <Navbar
        status={status}
        onRefreshStatus={() => {
          loadStatus();
          loadDocuments();
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: Document Management */}
        <aside className="w-80 md:w-96 shrink-0 h-full">
          <DocumentList
            documents={documents}
            onUpload={handleUpload}
            onDelete={handleDeleteDoc}
            onClearAll={handleClearAll}
          />
        </aside>

        {/* Center Workspace */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
          
          {/* Workspace Tabs Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 py-3 border-b-2 text-xs font-semibold transition ${
                activeTab === 'chat'
                  ? 'border-teal-400 text-teal-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>RAG Assistant (Chat)</span>
            </button>

            <button
              onClick={() => setActiveTab('inspector')}
              className={`flex items-center space-x-2 py-3 border-b-2 text-xs font-semibold transition ${
                activeTab === 'inspector'
                  ? 'border-teal-400 text-teal-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Vector Search Inspector</span>
            </button>
          </div>

          {/* Active Tab View */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? (
              <ChatArea
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoadingChat}
                onClearHistory={() => setMessages([])}
                hasDocuments={documents.length > 0}
              />
            ) : (
              <SearchInspector settings={settings} />
            )}
          </div>

        </main>

      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => setSettings(newSettings)}
      />

    </div>
  );
}

