// === WebSocketContext ========================================================
//
// Allows descendant components to initialize a web socket connection and access
// the web socket.
//
// =============================================================================
import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

interface WebSocketContextType {
  connect: (uri: string, onMessage: (ev: MessageEvent) => void) => void;
  isConnected: boolean;
  socket: WebSocket | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback((uri: string, onMessage: (ev: MessageEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    const ws = new WebSocket(uri);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      socketRef.current = null;
    };
    ws.onmessage = onMessage;
    ws.onerror = () => {
      setConnected(false);
      socketRef.current = null;
    };
    socketRef.current = ws;
  }, []);

  return (
    <WebSocketContext.Provider value={{ connect, isConnected: connected, socket: socketRef.current }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
