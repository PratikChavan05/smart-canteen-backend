package com.pratik.canteen.payment.controller;

import com.pratik.canteen.common.response.ApiResponse;
import com.pratik.canteen.payment.dto.CreatePaymentRequest;
import com.pratik.canteen.payment.dto.PaymentResponse;
import com.pratik.canteen.payment.dto.PaymentVerificationRequest;
import com.pratik.canteen.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for payment operations.
 * Handles Razorpay order creation and payment verification.
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Razorpay payment endpoints")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Create a Razorpay payment order (Customer)")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPaymentOrder(
            @Valid @RequestBody CreatePaymentRequest request,
            Authentication authentication) {
        String customerId = authentication.getName();
        PaymentResponse response = paymentService.createPaymentOrder(
                request.getOrderId(), customerId, request.isDemoMode());
        return ResponseEntity.ok(ApiResponse.success(response, "Payment order created"));
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Verify Razorpay payment after checkout (Customer)")
    public ResponseEntity<ApiResponse<Void>> verifyPayment(
            @Valid @RequestBody PaymentVerificationRequest request,
            Authentication authentication) {
        String customerId = authentication.getName();
        paymentService.verifyPayment(request, customerId);
        return ResponseEntity.ok(ApiResponse.success(null, "Payment verified successfully"));
    }
}
