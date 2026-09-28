package com.pratik.canteen.payment.service;

import com.pratik.canteen.payment.dto.PaymentResponse;
import com.pratik.canteen.payment.dto.PaymentVerificationRequest;

/**
 * Service interface for payment operations.
 */
public interface PaymentService {

    /**
     * Create a Razorpay order for the given canteen order.
     * @param demoMode when true, force a mock checkout session (sandbox UI)
     */
    PaymentResponse createPaymentOrder(String orderId, String customerId, boolean demoMode);

    /**
     * Verify Razorpay payment signature and complete the payment.
     * Ownership is enforced via customerId (authenticated principal).
     */
    void verifyPayment(PaymentVerificationRequest request, String customerId);
}
