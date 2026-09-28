package com.pratik.canteen.order.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * MongoDB document representing a customer order.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "orders")
public class Order {

    @Id
    private String id;

    private String customerId;

    private List<OrderItem> items;

    private BigDecimal totalAmount;

    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING_PAYMENT;

    private String paymentId;

    @CreatedDate
    private LocalDateTime createdAt;
}
