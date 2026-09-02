/**
 * src/hooks/useSocket.js
 * Custom hook that manages the Socket.io lifecycle.
 * Centralises connection, event listeners, and cleanup —
 * fixing the unused `socketId` state anti-pattern in App.jsx.
 */

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Module-level singleton so reconnecting across HMR doesn't spawn extra sockets
let _socket = null;
function getSocket() {
  if (!_socket) {
    _socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
  }
  return _socket;
}

/**
 * @param {(type: string, data: object) => void} onAgentEvent
 *   Callback invoked for every agent:* event received from the server.
 */
export function useSocket(onAgentEvent) {
  // Lazy initializers derive the initial value from the already-connected
  // singleton (e.g. after HMR) without triggering synchronous setState in an effect.
  const [isConnected, setIsConnected] = useState(() => getSocket().connected);
  const [socketId, setSocketId] = useState(() => {
    const s = getSocket();
    return s.connected ? s.id : null;
  });
  const socketRef = useRef(null);
  const onAgentEventRef = useRef(onAgentEvent);

  // Keep the callback ref current without re-running the effect
  useEffect(() => {
    onAgentEventRef.current = onAgentEvent;
  }, [onAgentEvent]);

  useEffect(() => {
    const sock = getSocket();
    socketRef.current = sock;

    const onConnect = () => {
      setIsConnected(true);
      setSocketId(sock.id);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setSocketId(null);
    };

    // Generic handler that forwards every agent:* event to the caller
    const makeHandler = (type) => (data) => {
      onAgentEventRef.current?.(type, data);
    };

    const handlers = {
      'agent:thinking':    makeHandler('thinking'),
      'agent:tool_start':  makeHandler('tool_start'),
      'agent:tool_result': makeHandler('tool_result'),
      'agent:error':       makeHandler('error'),
      'agent:done':        makeHandler('done'),
      'agent:fatal':       makeHandler('fatal'),
    };

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);
    Object.entries(handlers).forEach(([evt, fn]) => sock.on(evt, fn));


    return () => {
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
      Object.entries(handlers).forEach(([evt, fn]) => sock.off(evt, fn));
    };
  }, []); // stable — runs once

  return { isConnected, socketId };
}
