package com.pratik.canteen.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for daily sales summary (Manager feature).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailySalesSummary {

    private String date;
    private long totalOrders;
    private BigDecimal totalRevenue;
}
