package com.pratik.canteen.notification.service;

import com.pratik.canteen.order.dto.OrderResponse;
import com.pratik.canteen.order.entity.OrderStatus;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

/**
 * Gmail SMTP implementation of EmailService.
 * Sends HTML emails using Thymeleaf templates.
 * All email sending is async to avoid blocking API requests.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    private String getSenderEmail() {
        if (mailUsername != null && !mailUsername.isBlank()) {
            return mailUsername;
        }
        return "noreply@smartcanteen.com";
    }

    @Override
    @Async
    public void sendOtp(String email, String otp, String fullName) {
        Context context = new Context();
        context.setVariable("fullName", fullName);
        context.setVariable("otp", otp);

        String html = templateEngine.process("otp-email", context);
        sendHtmlEmail(email, "Smart Canteen — Verify Your Email", html);
    }

    @Override
    @Async
    public void sendOrderConfirmation(String email, OrderResponse order) {
        Context context = new Context();
        context.setVariable("orderId", order.getId());
        context.setVariable("items", order.getItems());
        context.setVariable("totalAmount", order.getTotalAmount());
        context.setVariable("status", order.getStatus());

        String html = templateEngine.process("order-confirmation", context);
        sendHtmlEmail(email, "Smart Canteen — Order Confirmed #" + order.getId(), html);
    }

    @Override
    @Async
    public void sendOrderStatusUpdate(String email, String orderId, OrderStatus newStatus) {
        Context context = new Context();
        context.setVariable("orderId", orderId);
        context.setVariable("status", newStatus.name());
        context.setVariable("statusMessage", getStatusMessage(newStatus));

        String html = templateEngine.process("order-status-update", context);
        sendHtmlEmail(email, "Smart Canteen — Order Update #" + orderId, html);
    }

    @Override
    @Async
    public void sendWelcomeEmail(String email, String fullName) {
        Context context = new Context();
        context.setVariable("fullName", fullName);

        String html = templateEngine.process("welcome-email", context);
        sendHtmlEmail(email, "Welcome to Smart Canteen! 🍽️", html);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        if (mailUsername == null || mailUsername.isBlank() || mailPassword == null || mailPassword.isBlank()) {
            log.info("📧 [DEV MODE] SMTP not configured. Simulated email delivery to: {} | Subject: {}", to, subject);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(getSenderEmail());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email successfully sent to: {} — Subject: {}", to, subject);
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}. Continuing without breaking user flow.", to, e.getMessage());
        }
    }

    private String getStatusMessage(OrderStatus status) {
        return switch (status) {
            case PREPARING -> "Your order is now being prepared by our kitchen!";
            case READY -> "Your order is ready for pickup! 🎉";
            case DELIVERED -> "Your order has been delivered. Enjoy your meal!";
            case CANCELLED -> "Your order has been cancelled.";
            default -> "Your order status has been updated.";
        };
    }
}
