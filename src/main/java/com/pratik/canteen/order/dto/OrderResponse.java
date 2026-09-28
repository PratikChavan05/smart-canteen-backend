package com.pratik.canteen.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for order data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private String id;
    private String customerId;
    private List<OrderItemResponse> items;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime createdAt;
}
