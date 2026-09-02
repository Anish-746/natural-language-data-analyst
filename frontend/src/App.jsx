import { useState, useCallback } from 'react';
import { useSocket } from './hooks/useSocket.js';
import { postQuery } from './services/api.js';
import ChatInput from './components/ChatInput';
import AgentTerminal from './components/AgentTerminal';
import DataVisualizer from './components/DataVisualizer';
import HistoryPanel from './components/HistoryPanel';
import ErrorBoundary from './components/ErrorBoundary';

// ─────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────
export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentEvents, setAgentEvents] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(null);

  // ── Socket.io hook ──
  const { isConnected, socketId } = useSocket(
    useCallback((type, data) => {
      setAgentEvents(prev => [...prev, { type, ...data }]);

      if (type === 'done') {
        setIsProcessing(false);
        // The LLM might return an array directly, or an object { rows: [...] }
        const parsedData = data.data;
        const rows = Array.isArray(parsedData) ? parsedData : (parsedData?.rows ?? null);
        setResult({ answer: data.answer, rows });
        setHistory(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              rows,
              answer: data.answer,
            };
          }
          return updated;
        });
      }

      if (type === 'fatal') setIsProcessing(false);
    }, [])
  );

  // ── Submit a new query ──
  const handleSubmit = useCallback(async (question) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setAgentEvents([]);
    setResult(null);

    // Optimistically add to history
    setHistory(prev => {
      const updated = [...prev, { question, timestamp: new Date().toISOString(), rows: null, answer: null }];
      setActiveHistoryIndex(updated.length - 1);
      return updated;
    });

    try {
      await postQuery({ question, socketId });
    } catch (err) {
      console.error('[postQuery]', err);
      setAgentEvents(prev => [
        ...prev,
        {
          type: 'fatal',
          message: `❌ Could not reach backend: ${err.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsProcessing(false);
    }
  }, [isProcessing, socketId]);

  // ── Restore a previous result from history ──
  const handleHistorySelect = useCallback((idx) => {
    const item = history[idx];
    if (!item) return;
    setActiveHistoryIndex(idx);
    setResult({ answer: item.answer, rows: item.rows });
    setAgentEvents([{
      type: 'done',
      message: '🎉 Loaded from history',
      timestamp: item.timestamp,
    }]);
  }, [history]);

  return (
    <>
      {/* Animated background */}
      <div className="app-bg" aria-hidden="true" />

      <div className="app-layout">
        {/* ── Header ── */}
        <header className="app-header">
          <div className="header-brand">
            <div className="header-logo" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <div className="header-title">NL Data Analyst</div>
              <div className="header-subtitle">Agentic Text-to-SQL</div>
            </div>
          </div>

          <div className="header-badge-container">
            <div className="header-badge">
              <span
                className="status-dot"
                style={{
                  background: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  boxShadow: `0 0 8px ${isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
                }}
              />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="main-content">
          {/* Left column: Query History + Terminal */}
          <div className="main-left-column">
            
            {/* Query History */}
            <HistoryPanel
              history={history}
              activeIndex={activeHistoryIndex}
              onSelect={handleHistorySelect}
            />

            {/* Agent Terminal */}
            <div className="terminal-container">
              <AgentTerminal events={agentEvents} isProcessing={isProcessing} />
            </div>
          </div>

          {/* Right column: Visualization */}
          <div className="main-right-column">
            <div className="panel results-panel results-panel-layout">
              <div className="panel-header">
                <span className="panel-title">
                  <span>◉</span>
                  Visualization
                </span>
                {result?.rows && (
                  <span className="results-meta-count">
                    {result.rows.length} rows
                  </span>
                )}
              </div>
              <div className="results-body results-body-layout">
                <ErrorBoundary>
                  <DataVisualizer rows={result?.rows} answer={result?.answer} />
                </ErrorBoundary>
              </div>
            </div>
          </div>

          {/* Full-width bottom: Chat Input */}
          <div className="chat-input-container">
            <ChatInput onSubmit={handleSubmit} isProcessing={isProcessing} />
          </div>
        </main>
      </div>
    </>
  );
}
