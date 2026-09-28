package com.pratik.canteen.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO with Razorpay order details for frontend checkout.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private String razorpayOrderId;
    private BigDecimal amount;
    private String currency;
    private String keyId;  // Razorpay public key for frontend
    private String orderId; // Our internal order ID
}
