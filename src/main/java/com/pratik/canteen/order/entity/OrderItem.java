package com.pratik.canteen.order.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Embedded document representing a single item in an order.
 * Values are snapshotted at order time so price/name changes don't affect past orders.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    private String menuItemId;
    private String name;
    private BigDecimal price;
    private int quantity;
}
