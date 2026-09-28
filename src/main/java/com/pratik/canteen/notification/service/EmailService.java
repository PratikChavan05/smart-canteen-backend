package com.pratik.canteen.notification.service;

import com.pratik.canteen.order.dto.OrderResponse;
import com.pratik.canteen.order.entity.OrderStatus;

/**
 * Service interface for email notifications.
 */
public interface EmailService {

    /**
     * Send OTP verification email.
     */
    void sendOtp(String email, String otp, String fullName);

    /**
     * Send order confirmation email.
     */
    void sendOrderConfirmation(String email, OrderResponse order);

    /**
     * Send order status update notification.
     */
    void sendOrderStatusUpdate(String email, String orderId, OrderStatus newStatus);

    /**
     * Send welcome email after successful registration.
     */
    void sendWelcomeEmail(String email, String fullName);
}
