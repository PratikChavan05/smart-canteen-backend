package com.pratik.canteen.payment.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * MongoDB document representing a payment transaction.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payments")
public class Payment {

    @Id
    private String id;

    @Indexed
    private String orderId;

    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;

    private BigDecimal amount;

    @Builder.Default
    private String currency = "INR";

    @Builder.Default
    private PaymentStatus status = PaymentStatus.CREATED;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum PaymentStatus {
        CREATED, SUCCESS, FAILED
    }
}
