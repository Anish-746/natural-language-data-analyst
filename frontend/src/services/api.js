/**
 * src/services/api.js
 * Thin wrapper around the backend REST API.
 * Keeping fetch calls here (rather than inline in components)
 * makes them easy to mock in tests and centralises error handling.
 */

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * POST /api/query — sends a natural language question to the agent.
 * @param {{ question: string, socketId: string|null }} payload
 * @returns {Promise<{ status: string, message: string }>}
 */
export async function postQuery({ question, socketId }) {
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, socketId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}
