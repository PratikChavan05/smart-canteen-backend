package com.pratik.canteen.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO to create a Razorpay order for payment.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentRequest {

    @NotBlank(message = "Order ID is required")
    private String orderId;

    /**
     * When true, create a mock payment session (dev/sandbox UI) even if live keys exist.
     */
    private boolean demoMode;
}
