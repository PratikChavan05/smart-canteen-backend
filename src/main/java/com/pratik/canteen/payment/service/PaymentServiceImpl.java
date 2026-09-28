package com.pratik.canteen.payment.service;

import com.pratik.canteen.exception.InvalidOperationException;
import com.pratik.canteen.exception.PaymentException;
import com.pratik.canteen.exception.ResourceNotFoundException;
import com.pratik.canteen.notification.service.EmailService;
import com.pratik.canteen.order.dto.OrderResponse;
import com.pratik.canteen.order.entity.Order;
import com.pratik.canteen.order.entity.OrderStatus;
import com.pratik.canteen.order.mapper.OrderMapper;
import com.pratik.canteen.order.repository.OrderRepository;
import com.pratik.canteen.payment.dto.PaymentResponse;
import com.pratik.canteen.payment.dto.PaymentVerificationRequest;
import com.pratik.canteen.payment.entity.Payment;
import com.pratik.canteen.payment.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

/**
 * Razorpay implementation of PaymentService.
 * Supports live Razorpay credentials or seamless dev-mode testing if keys are omitted.
 */
@Slf4j
@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final RazorpayClient razorpayClient;
    private final String keyId;
    private final String keySecret;
    private final SimpMessagingTemplate messagingTemplate;
    private final OrderMapper orderMapper;
    private final EmailService emailService;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            SimpMessagingTemplate messagingTemplate,
            OrderMapper orderMapper,
            EmailService emailService,
            @Value("${razorpay.key-id:}") String keyId,
            @Value("${razorpay.key-secret:}") String keySecret) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.messagingTemplate = messagingTemplate;
        this.orderMapper = orderMapper;
        this.emailService = emailService;
        this.keyId = keyId;
        this.keySecret = keySecret;

        RazorpayClient client = null;
        if (keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank()) {
            try {
                client = new RazorpayClient(keyId, keySecret);
                log.info("Razorpay client initialized successfully");
            } catch (RazorpayException e) {
                log.warn("Failed to initialize Razorpay client: {}", e.getMessage());
            }
        } else {
            log.info("Razorpay keys not configured. Running in mock/dev checkout mode.");
        }
        this.razorpayClient = client;
    }

    @Override
    public PaymentResponse createPaymentOrder(String orderId, String customerId, boolean demoMode) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getCustomerId().equalsIgnoreCase(customerId)) {
            throw new InvalidOperationException("You can only pay for your own orders");
        }

        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new InvalidOperationException(
                    "Order is not awaiting payment. Current status: " + order.getStatus());
        }

        // Idempotent: reuse an existing open payment for this order (same mode)
        Optional<Payment> existing = paymentRepository
                .findFirstByOrderIdAndStatusOrderByCreatedAtDesc(orderId, Payment.PaymentStatus.CREATED);
        if (existing.isPresent()) {
            Payment payment = existing.get();
            boolean existingIsMock = payment.getRazorpayOrderId() != null
                    && payment.getRazorpayOrderId().startsWith("order_mock_");
            if (demoMode == existingIsMock) {
                log.info("Reusing existing payment session {} for order {}", payment.getRazorpayOrderId(), orderId);
                return toPaymentResponse(payment, orderId);
            }
            // Mode mismatch — retire the old CREATED session
            payment.setStatus(Payment.PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }

        if (paymentRepository.findFirstByOrderIdAndStatusOrderByCreatedAtDesc(orderId, Payment.PaymentStatus.SUCCESS)
                .isPresent()) {
            throw new InvalidOperationException("This order has already been paid");
        }

        String razorpayOrderId;
        long amountInPaise = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
        boolean useMock = demoMode || razorpayClient == null;

        if (!useMock) {
            try {
                JSONObject orderRequest = new JSONObject();
                orderRequest.put("amount", amountInPaise);
                orderRequest.put("currency", "INR");
                orderRequest.put("receipt", orderId);

                com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
                razorpayOrderId = razorpayOrder.get("id");
            } catch (RazorpayException e) {
                log.error("Razorpay order creation failed: {}", e.getMessage());
                throw new PaymentException("Failed to create payment order: " + e.getMessage());
            }
        } else {
            razorpayOrderId = "order_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
            log.info("Generated mock Razorpay order ID: {} for order: {}", razorpayOrderId, orderId);
        }

        Payment payment = Payment.builder()
                .orderId(orderId)
                .razorpayOrderId(razorpayOrderId)
                .amount(order.getTotalAmount())
                .status(Payment.PaymentStatus.CREATED)
                .build();

        paymentRepository.save(payment);
        log.info("Payment record created for order: {}, Razorpay Order: {}", orderId, razorpayOrderId);

        return toPaymentResponse(payment, orderId);
    }

    @Override
    public void verifyPayment(PaymentVerificationRequest request, String customerId) {
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        Order order = orderRepository.findById(payment.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getCustomerId().equalsIgnoreCase(customerId)) {
            throw new InvalidOperationException("You can only verify payment for your own orders");
        }

        // Idempotent success
        if (payment.getStatus() == Payment.PaymentStatus.SUCCESS
                && order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            log.info("Payment already verified for order {}", order.getId());
            return;
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new InvalidOperationException(
                    "This order was cancelled and can no longer accept payment. Please place a new order.");
        }

        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new InvalidOperationException(
                    "Order is not awaiting payment. Current status: " + order.getStatus());
        }

        if (payment.getStatus() == Payment.PaymentStatus.FAILED) {
            throw new InvalidOperationException("This payment session failed. Please start a new payment.");
        }

        boolean isMockPayment = payment.getRazorpayOrderId() != null
                && payment.getRazorpayOrderId().startsWith("order_mock_");

        if (!isMockPayment) {
            if (keySecret == null || keySecret.isBlank()) {
                throw new PaymentException("Payment gateway is not configured");
            }
            try {
                JSONObject attributes = new JSONObject();
                attributes.put("razorpay_order_id", request.getRazorpayOrderId());
                attributes.put("razorpay_payment_id", request.getRazorpayPaymentId());
                attributes.put("razorpay_signature", request.getRazorpaySignature());

                boolean isValid = Utils.verifyPaymentSignature(attributes, keySecret);
                if (!isValid) {
                    payment.setStatus(Payment.PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                    throw new PaymentException("Invalid payment signature");
                }
            } catch (PaymentException e) {
                throw e;
            } catch (Exception e) {
                payment.setStatus(Payment.PaymentStatus.FAILED);
                paymentRepository.save(payment);
                log.error("Payment verification failed: {}", e.getMessage());
                throw new PaymentException("Payment verification failed: " + e.getMessage());
            }
        } else {
            // Mock payments only accept mock payment IDs issued for this session
            if (request.getRazorpayPaymentId() == null
                    || !request.getRazorpayPaymentId().startsWith("pay_mock_")) {
                throw new PaymentException("Invalid mock payment credentials");
            }
        }

        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(
                request.getRazorpaySignature() != null ? request.getRazorpaySignature() : "sig_mock");
        payment.setStatus(Payment.PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        order.setStatus(OrderStatus.PENDING);
        order.setPaymentId(payment.getId());
        orderRepository.save(order);

        log.info("Payment verified and order #{} updated to PENDING", payment.getOrderId());

        try {
            OrderResponse response = orderMapper.toResponse(order);
            messagingTemplate.convertAndSend("/topic/orders/new", response);
            messagingTemplate.convertAndSend("/topic/orders/status", response);
            messagingTemplate.convertAndSend("/topic/orders/" + order.getId(), response);
            messagingTemplate.convertAndSend("/topic/dashboard", response);
            emailService.sendOrderConfirmation(order.getCustomerId(), response);
        } catch (Exception e) {
            log.warn("Failed to dispatch WebSocket or email for payment verification: {}", e.getMessage());
        }
    }

    private PaymentResponse toPaymentResponse(Payment payment, String orderId) {
        return PaymentResponse.builder()
                .razorpayOrderId(payment.getRazorpayOrderId())
                .amount(payment.getAmount())
                .currency("INR")
                .keyId(keyId != null && !keyId.isBlank() ? keyId : "rzp_test_demo123456789")
                .orderId(orderId)
                .build();
    }
}
