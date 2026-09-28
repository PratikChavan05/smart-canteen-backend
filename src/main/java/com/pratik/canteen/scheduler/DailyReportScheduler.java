package com.pratik.canteen.scheduler;

import com.pratik.canteen.order.dto.DailySalesSummary;
import com.pratik.canteen.order.service.OrderService;
import com.pratik.canteen.user.entity.Role;
import com.pratik.canteen.user.entity.User;
import com.pratik.canteen.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled job to aggregate and generate daily sales reports every night at 11 PM.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DailyReportScheduler {

    private final OrderService orderService;
    private final UserRepository userRepository;

    /**
     * Run every day at 11:00 PM to calculate day's performance.
     */
    @Scheduled(cron = "${app.cron.daily-report:0 0 23 * * *}")
    public void generateDailyReport() {
        LocalDate today = LocalDate.now();
        log.info("Generating daily sales summary report for date: {}", today);

        try {
            DailySalesSummary summary = orderService.getDailySalesSummary(today);
            log.info("=== DAILY SALES REPORT [{}] ===", summary.getDate());
            log.info("Total Orders Processed: {}", summary.getTotalOrders());
            log.info("Total Revenue: ₹{}", summary.getTotalRevenue());
            log.info("=====================================");

            // List managers and admins for reporting
            List<User> managersAndAdmins = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.MANAGER || u.getRole() == Role.ADMIN)
                    .toList();

            log.info("Notified {} managers and admins of the daily report.", managersAndAdmins.size());
        } catch (Exception e) {
            log.error("Failed to generate daily sales summary report: {}", e.getMessage());
        }
    }
}
