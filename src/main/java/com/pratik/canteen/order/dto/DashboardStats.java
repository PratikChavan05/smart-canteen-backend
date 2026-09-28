package com.pratik.canteen.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Response DTO for admin dashboard statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {

    private long totalOrders;
    private BigDecimal totalRevenue;
    private Map<String, Long> orderCountByStatus;
}
