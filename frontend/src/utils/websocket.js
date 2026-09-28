import { Client } from '@stomp/stompjs';

/**
 * Creates a configured STOMP client using native browser WebSockets.
 * Connects to Spring Boot's STOMP endpoint at /ws/websocket.
 */
export function createWebSocketClient({ onConnect, onError, onDisconnect }) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  const client = new Client({
    brokerURL: `${protocol}//${host}/ws/websocket`,
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: () => {},
    onConnect: (frame) => {
      console.log('✅ STOMP WebSocket connected');
      if (onConnect) onConnect(frame);
    },
    onStompError: (frame) => {
      console.warn('STOMP Broker error:', frame.headers?.message);
      if (onError) onError(frame);
    },
    onWebSocketClose: () => {
      if (onDisconnect) onDisconnect();
    },
  });

  return client;
}
