import { useEffect, useRef } from 'react';

const EVENT_STYLES = {
  thinking:    { prefix: '◆', cls: 'thinking' },
  tool_start:  { prefix: '▶', cls: 'tool_start' },
  tool_result: { prefix: '✓', cls: 'tool_result' },
  error:       { prefix: '✗', cls: 'error' },
  done:        { prefix: '★', cls: 'done' },
  fatal:       { prefix: '✗', cls: 'fatal' },
};

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function AgentTerminal({ events, isProcessing }) {
  const bodyRef = useRef(null);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="panel terminal" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">
          <span>⬡</span>
          Agent Terminal
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399' }} />
        </div>
      </div>

      {/* Terminal body */}
      <div ref={bodyRef} className="terminal-body" style={{ flex: 1 }}>
        {events.length === 0 ? (
          <div className="terminal-empty">
            <span style={{ fontSize: '1.5rem' }}>_</span>
            <span>Awaiting input...</span>
            <span className="terminal-cursor" />
          </div>
        ) : (
          events.map((evt, idx) => {
            const style = EVENT_STYLES[evt.type] || { prefix: '·', cls: 'thinking' };
            return (
              <div key={idx} className={`terminal-line ${style.cls}`}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span className="prefix" style={{ color: 'var(--text-muted)' }}>
                      {evt.timestamp ? formatTime(evt.timestamp) : ''}
                    </span>
                    <span style={{ color: 'inherit' }}>{style.prefix}</span>
                    <span className="message">{evt.message}</span>
                  </div>
                  {/* Show SQL snippet for tool_start events */}
                  {evt.sql && (
                    <div className="terminal-sql">{evt.sql}</div>
                  )}
                  {/* Show error detail */}
                  {evt.error && (evt.type === 'error' || evt.type === 'fatal') && (
                    <div className="terminal-sql" style={{ borderLeftColor: 'var(--accent-rose)', color: '#fca5a5' }}>
                      {evt.error}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Live typing indicator */}
        {isProcessing && (
          <div className="terminal-line thinking">
            <span className="prefix">{'>'}</span>
            <span className="message" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="terminal-cursor" style={{ width: 6, height: 12 }} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
