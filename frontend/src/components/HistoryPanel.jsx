export default function HistoryPanel({ history, activeIndex, onSelect }) {
  return (
    <div className="panel history-panel history-panel-layout">
      <div className="panel-header">
        <span className="panel-title">
          <span>◈</span>
          Query History
        </span>
        <span className="history-meta-count">
          {history.length} queries
        </span>
      </div>
      <div className="history-body history-body-layout">
        {history.length === 0 ? (
          <div className="history-empty">
            <span className="history-empty-icon">📋</span>
            <span>No queries yet</span>
          </div>
        ) : (
          [...history].reverse().map((item, revIdx) => {
            const idx = history.length - 1 - revIdx;
            return (
              <div
                key={idx}
                className={`history-item ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => onSelect(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onSelect(idx)}
              >
                <div className="history-question">{item.question}</div>
                <div className="history-meta">
                  {new Date(item.timestamp).toLocaleTimeString()} ·{' '}
                  {item.rows ? `${item.rows.length} rows` : 'pending'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
