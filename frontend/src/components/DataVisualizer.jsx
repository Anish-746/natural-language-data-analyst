/**
 * components/DataVisualizer.jsx
 * Renders the agent's result as a Bar chart, Line chart, or Data Table —
 * auto-selected based on the shape of the returned rows.
 *
 * Pure component file (default export only) — required for Vite Fast Refresh.
 * All chart-selection logic lives in src/lib/chartUtils.js.
 */

import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

import {
  selectChartType,
  detectColumns,
  formatLabel,
  formatTooltipValue,
} from '../lib/chartUtils.js';

// ─────────────────────────────────────────────
// Chart color palette
// ─────────────────────────────────────────────
const COLORS = [
  '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
  '#f43f5e', '#8b5cf6', '#34d399', '#fb923c',
];

// ─────────────────────────────────────────────
// Custom dark-themed Tooltip
// ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#111827',
      border: '1px solid rgba(99,102,241,0.4)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ color: '#f0f4ff', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', gap: 8 }}>
          <span>{p.name}:</span>
          <span style={{ color: '#f0f4ff' }}>{formatTooltipValue(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Bar Chart
// ─────────────────────────────────────────────
function BarChartView({ rows }) {
  const { textCols, numericCols, dateCols } = detectColumns(rows);
  const xKey = dateCols[0] || textCols[0] || Object.keys(rows[0])[0];
  const yKeys = numericCols.length ? numericCols : Object.keys(rows[0]).filter(k => k !== xKey);

  const data = rows.map(row => {
    const item = { [xKey]: formatLabel(row[xKey]) };
    yKeys.forEach(k => { item[k] = Number(row[k]) || 0; });
    return item;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString()} />
        <Tooltip content={<CustomTooltip />} />
        {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#8892b0' }} />}
        {yKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={60} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────
// Line Chart
// ─────────────────────────────────────────────
function LineChartView({ rows }) {
  const { textCols, numericCols, dateCols } = detectColumns(rows);
  const xKey = dateCols[0] || textCols[0] || Object.keys(rows[0])[0];
  const yKeys = numericCols.length ? numericCols : Object.keys(rows[0]).filter(k => k !== xKey);

  const data = rows.map(row => {
    const item = { [xKey]: formatLabel(row[xKey]) };
    yKeys.forEach(k => { item[k] = Number(row[k]) || 0; });
    return item;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString()} />
        <Tooltip content={<CustomTooltip />} />
        {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#8892b0' }} />}
        {yKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2.5}
            dot={{ r: 4, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────
// Data Table
// ─────────────────────────────────────────────
function DataTableView({ rows }) {
  if (!rows?.length) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No data</div>;
  }
  const columns = Object.keys(rows[0]);

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col} title={String(row[col] ?? '—')}>
                  {String(row[col] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
// Chart type metadata
// ─────────────────────────────────────────────
const CHART_TYPE_LABELS = {
  bar:   { icon: '▨', label: 'Bar Chart' },
  line:  { icon: '╱', label: 'Line Chart' },
  table: { icon: '⊟', label: 'Data Table' },
};

// ─────────────────────────────────────────────
// Main export — single default component
// ─────────────────────────────────────────────
export default function DataVisualizer({ rows, answer }) {
  if (!rows && !answer) {
    return (
      <div className="results-empty">
        <div className="results-empty-icon">📊</div>
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Results will appear here
        </div>
        <div style={{ fontSize: '0.78rem', maxWidth: 240 }}>
          Ask a question about your data to see charts and tables
        </div>
      </div>
    );
  }

  const chartType = rows ? selectChartType(rows) : 'table';
  const typeInfo = CHART_TYPE_LABELS[chartType];

  // Strip JSON code block from the answer for display
  const cleanAnswer = answer
    ? answer.replace(/```json[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '').trim()
    : '';

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      {cleanAnswer && <div className="results-answer">{cleanAnswer}</div>}

      {rows && rows.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="chart-type-badge">
              {typeInfo.icon} {typeInfo.label} · {rows.length} row{rows.length !== 1 ? 's' : ''}
            </span>
          </div>

          {chartType === 'bar'   && <BarChartView rows={rows} />}
          {chartType === 'line'  && <LineChartView rows={rows} />}
          {chartType === 'table' && <DataTableView rows={rows} />}
        </>
      )}

      {rows && rows.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
          Query returned 0 rows
        </div>
      )}
    </div>
  );
}
