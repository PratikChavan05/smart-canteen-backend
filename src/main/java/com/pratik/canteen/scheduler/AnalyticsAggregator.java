package com.pratik.canteen.scheduler;

import com.pratik.canteen.order.dto.DashboardStats;
import com.pratik.canteen.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled job to aggregate system-wide analytics on a weekly basis.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnalyticsAggregator {

    private final OrderService orderService;

    /**
     * Run every Sunday at midnight to log aggregated analytics trends.
     */
    @Scheduled(cron = "${app.cron.weekly-analytics:0 0 0 * * SUN}")
    public void aggregateWeeklyAnalytics() {
        log.info("Running weekly analytics aggregation...");
        try {
            DashboardStats stats = orderService.getDashboardStats();
            log.info("=== WEEKLY ANALYTICS SUMMARY ===");
            log.info("Total Lifetime Orders: {}", stats.getTotalOrders());
            log.info("Total Lifetime Revenue: ₹{}", stats.getTotalRevenue());
            log.info("Order Distribution by Status: {}", stats.getOrderCountByStatus());
            log.info("================================");
        } catch (Exception e) {
            log.error("Failed to aggregate weekly analytics: {}", e.getMessage());
        }
    }
}
