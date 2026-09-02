import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="panel error-boundary-panel">
          <div className="panel-header" style={{ color: 'var(--accent-rose)' }}>
            <span className="panel-title">
              <span>⚠️</span>
              Something went wrong
            </span>
          </div>
          <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>
            <p>An unexpected error occurred in the visualizer.</p>
            <pre style={{ fontSize: '0.8rem', marginTop: '1rem', overflowX: 'auto' }}>
              {this.state.error?.toString()}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
