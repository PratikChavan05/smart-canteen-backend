package com.pratik.canteen.scheduler;

import com.pratik.canteen.order.dto.OrderResponse;
import com.pratik.canteen.order.entity.Order;
import com.pratik.canteen.order.entity.OrderStatus;
import com.pratik.canteen.order.mapper.OrderMapper;
import com.pratik.canteen.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled job to clean up abandoned and stale orders.
 * Cancels orders that remain in PENDING_PAYMENT for longer than 30 minutes.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderCleanupScheduler {

    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Run every 10 minutes to auto-cancel abandoned unpaid orders.
     */
    @Scheduled(cron = "0 */10 * * * *")
    public void cleanupAbandonedOrders() {
        log.info("Running scheduled cleanup for abandoned unpaid orders...");

        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);
        List<Order> pendingPaymentOrders = orderRepository.findByStatus(OrderStatus.PENDING_PAYMENT);

        int cancelledCount = 0;
        for (Order order : pendingPaymentOrders) {
            if (order.getCreatedAt() != null && order.getCreatedAt().isBefore(cutoff)) {
                order.setStatus(OrderStatus.CANCELLED);
                orderRepository.save(order);
                cancelledCount++;

                try {
                    OrderResponse response = orderMapper.toResponse(order);
                    messagingTemplate.convertAndSend("/topic/orders/status", response);
                    messagingTemplate.convertAndSend("/topic/orders/" + order.getId(), response);
                    messagingTemplate.convertAndSend("/topic/dashboard", response);
                } catch (Exception e) {
                    log.warn("Failed to broadcast auto-cancellation for order {}: {}", order.getId(), e.getMessage());
                }
            }
        }

        if (cancelledCount > 0) {
            log.info("Auto-cancelled {} expired unpaid order(s)", cancelledCount);
        } else {
            log.info("No expired unpaid orders found during cleanup");
        }
    }
}
