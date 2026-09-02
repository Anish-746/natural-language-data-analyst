import { useRef, useEffect } from 'react';

export default function ChatInput({ onSubmit, isProcessing }) {
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = inputRef.current?.value?.trim();
    if (!val || isProcessing) return;
    onSubmit(val);
    inputRef.current.value = '';
  };

  return (
    <div className="chat-input-area panel" style={{ padding: '1.25rem' }}>
      <form className="chat-form" onSubmit={handleSubmit} id="query-form">
        <div className="chat-input-wrapper">
          <input
            ref={inputRef}
            id="query-input"
            className="chat-input"
            type="text"
            placeholder="Ask anything about your data… e.g. 'Show me revenue by month'"
            disabled={isProcessing}
            autoComplete="off"
            spellCheck="false"
          />
          <span className="input-icon" style={{ pointerEvents: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
        </div>

        <button
          id="send-btn"
          type="submit"
          className="send-btn"
          disabled={isProcessing}
          aria-label="Send query"
        >
          {isProcessing ? (
            <>
              <span className="spinner" />
              Analyzing...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2 11 13M22 2 15 22 11 13 2 9l20-7Z" />
              </svg>
              Analyze
            </>
          )}
        </button>
      </form>
    </div>
  );
}
