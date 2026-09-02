/**
 * src/lib/chartUtils.js
 * Pure utility functions for chart type detection.
 * Kept in lib/ (not components/) so DataVisualizer can be a
 * single-component file — required for Vite Fast Refresh.
 */

// ─────────────────────────────────────────────
// Type detectors
// ─────────────────────────────────────────────
export function isNumeric(value) {
  return (
    typeof value === 'number' ||
    (!isNaN(Number(value)) && value !== '' && value !== null)
  );
}

export function isDate(value) {
  if (typeof value !== 'string') return false;
  return (
    /^\d{4}-\d{2}-\d{2}/.test(value) ||
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(value)
  );
}

/**
 * Inspects the first row of a result set and categorises each column.
 * @param {object[]} rows
 * @returns {{ textCols: string[], numericCols: string[], dateCols: string[] }}
 */
export function detectColumns(rows) {
  if (!rows || rows.length === 0) {
    return { textCols: [], numericCols: [], dateCols: [] };
  }

  const textCols = [];
  const numericCols = [];
  const dateCols = [];

  for (const [key, val] of Object.entries(rows[0])) {
    if (isDate(val)) {
      dateCols.push(key);
    } else if (isNumeric(val)) {
      numericCols.push(key);
    } else {
      textCols.push(key);
    }
  }

  return { textCols, numericCols, dateCols };
}

/**
 * Chooses the best chart type for the given rows.
 * @param {object[]|null} rows
 * @returns {'bar' | 'line' | 'table'}
 */
export function selectChartType(rows) {
  if (!rows || rows.length === 0) return 'table';

  const { textCols, numericCols, dateCols } = detectColumns(rows);

  // Time series (date + numeric) → Line chart
  if (dateCols.length >= 1 && numericCols.length >= 1) return 'line';

  // Categorical + numeric, reasonable number of rows → Bar chart
  if (textCols.length >= 1 && numericCols.length >= 1 && rows.length <= 30) return 'bar';

  // Wide/complex result → Data table
  return 'table';
}

/**
 * Formats a raw cell value for axis / label display.
 * @param {*} val
 * @returns {string}
 */
export function formatLabel(val) {
  if (val === null || val === undefined) return '—';
  if (isDate(String(val))) {
    try {
      return new Date(val).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
    } catch {
      return String(val);
    }
  }
  if (typeof val === 'number') {
    return val % 1 === 0 ? val.toLocaleString() : val.toFixed(2);
  }
  const str = String(val);
  return str.length > 18 ? `${str.slice(0, 16)}…` : str;
}

/**
 * Formats a numeric tooltip value.
 * @param {*} val
 * @returns {string}
 */
export function formatTooltipValue(val) {
  if (typeof val === 'number') {
    return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  return val;
}
