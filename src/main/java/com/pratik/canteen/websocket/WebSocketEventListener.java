package com.pratik.canteen.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Event listener for tracking WebSocket connection lifecycle.
 */
@Slf4j
@Component
public class WebSocketEventListener {

    private final AtomicInteger activeConnections = new AtomicInteger(0);

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        int current = activeConnections.incrementAndGet();
        log.info("New WebSocket client connected. Active sessions: {}", current);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        int current = activeConnections.decrementAndGet();
        log.info("WebSocket client disconnected. Active sessions: {}", Math.max(0, current));
    }

    @EventListener
    public void handleSessionSubscribeEvent(SessionSubscribeEvent event) {
        log.debug("WebSocket client subscribed to destination: {}", event.getMessage().getHeaders().get("simpDestination"));
    }

    public int getActiveConnectionCount() {
        return activeConnections.get();
    }
}
