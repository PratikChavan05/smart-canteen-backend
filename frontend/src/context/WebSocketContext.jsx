import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { createWebSocketClient } from '../utils/websocket';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const subscriptionsRef = useRef(new Map());

  useEffect(() => {
    if (!isAuthenticated) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
        setConnected(false);
      }
      return;
    }

    const client = createWebSocketClient({
      onConnect: () => {
        setConnected(true);
        // Re-subscribe pending subscriptions
        subscriptionsRef.current.forEach((callbacks, topic) => {
          if (!client.active) return;
          try {
            client.subscribe(topic, (message) => {
              try {
                const parsed = JSON.parse(message.body);
                callbacks.forEach((cb) => cb(parsed));
              } catch (e) {
                console.error('Failed to parse WebSocket message:', e);
              }
            });
          } catch (err) {
            console.warn('Subscription error on reconnect:', err);
          }
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onError: () => {
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [isAuthenticated]);

  const subscribe = useCallback((topic, callback) => {
    if (!subscriptionsRef.current.has(topic)) {
      subscriptionsRef.current.set(topic, new Set());
    }
    subscriptionsRef.current.get(topic).add(callback);

    let stompSub = null;
    if (clientRef.current && clientRef.current.connected) {
      try {
        stompSub = clientRef.current.subscribe(topic, (message) => {
          try {
            const data = JSON.parse(message.body);
            callback(data);
          } catch (e) {
            console.error('WebSocket parse error:', e);
          }
        });
      } catch (e) {
        console.warn('Error subscribing to topic:', topic, e);
      }
    }

    return () => {
      if (subscriptionsRef.current.has(topic)) {
        subscriptionsRef.current.get(topic).delete(callback);
        if (subscriptionsRef.current.get(topic).size === 0) {
          subscriptionsRef.current.delete(topic);
        }
      }
      if (stompSub) {
        try {
          stompSub.unsubscribe();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ connected, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
