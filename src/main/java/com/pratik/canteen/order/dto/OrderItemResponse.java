package com.pratik.canteen.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for a single item within an order.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {

    private String menuItemId;
    private String name;
    private BigDecimal price;
    private int quantity;
    private BigDecimal subtotal;
}
