package com.pratik.canteen.order.service;

import com.pratik.canteen.common.utils.DateUtils;
import com.pratik.canteen.exception.InvalidOperationException;
import com.pratik.canteen.exception.ResourceNotFoundException;
import com.pratik.canteen.menuitem.entity.MenuItem;
import com.pratik.canteen.menuitem.repository.MenuItemRepository;
import com.pratik.canteen.notification.service.EmailService;
import com.pratik.canteen.order.dto.*;
import com.pratik.canteen.order.entity.Order;
import com.pratik.canteen.order.entity.OrderItem;
import com.pratik.canteen.order.entity.OrderStatus;
import com.pratik.canteen.order.mapper.OrderMapper;
import com.pratik.canteen.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.pratik.canteen.common.constants.AppConstants.*;

/**
 * Implementation of OrderService with full order lifecycle management,
 * real-time WebSocket notifications, and asynchronous email updates.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderMapper orderMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;

    // ==================== Customer Operations ====================

    @Override
    public OrderResponse placeOrder(PlaceOrderRequest request, String customerId) {
        log.info("Placing order for customer: {}", customerId);

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new InvalidOperationException(EMPTY_ORDER);
        }

        // Build order items by snapshotting current menu item data
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException(MENU_ITEM_NOT_FOUND));

            if (!menuItem.isAvailable()) {
                throw new InvalidOperationException(MENU_ITEM_UNAVAILABLE + menuItem.getName());
            }

            // Snapshot item details at order time
            OrderItem orderItem = OrderItem.builder()
                    .menuItemId(menuItem.getId())
                    .name(menuItem.getName())
                    .price(menuItem.getPrice())
                    .quantity(itemRequest.getQuantity())
                    .build();

            orderItems.add(orderItem);
            totalAmount = totalAmount.add(
                    menuItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
        }

        Order order = Order.builder()
                .customerId(customerId)
                .items(orderItems)
                .totalAmount(totalAmount)
                .status(OrderStatus.PENDING_PAYMENT)
                .build();

        order = orderRepository.save(order);
        log.info("Order placed successfully with id: {}", order.getId());

        // Do not notify kitchen until payment is verified (PENDING_PAYMENT → PENDING)
        return orderMapper.toResponse(order);
    }

    @Override
    public OrderResponse cancelOrder(String orderId, String customerId) {
        log.info("Customer {} attempting to cancel order: {}", customerId, orderId);

        Order order = findOrderById(orderId);

        // Ensure the customer owns this order
        if (!order.getCustomerId().equalsIgnoreCase(customerId)) {
            throw new InvalidOperationException(NOT_YOUR_ORDER);
        }

        // Only PENDING or PENDING_PAYMENT orders can be cancelled by customers
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new InvalidOperationException(CANCEL_ONLY_PENDING);
        }

        order.setStatus(OrderStatus.CANCELLED);
        order = orderRepository.save(order);
        log.info("Order {} cancelled by customer {}", orderId, customerId);

        OrderResponse response = orderMapper.toResponse(order);

        // Notify WebSockets
        try {
            messagingTemplate.convertAndSend("/topic/orders/status", response);
            messagingTemplate.convertAndSend("/topic/orders/" + order.getId(), response);
            messagingTemplate.convertAndSend("/topic/dashboard", response);
            emailService.sendOrderStatusUpdate(order.getCustomerId(), order.getId(), OrderStatus.CANCELLED);
        } catch (Exception e) {
            log.warn("Failed to broadcast cancellation: {}", e.getMessage());
        }

        return response;
    }

    @Override
    public List<OrderResponse> getCustomerOrders(String customerId) {
        log.info("Fetching order history for customer: {}", customerId);
        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        return orderMapper.toResponseList(orders);
    }

    // ==================== Manager Operations ====================

    @Override
    public List<OrderResponse> getOrdersByStatus(OrderStatus status) {
        log.info("Fetching orders with status: {}", status);
        List<Order> orders;
        if (status != null) {
            orders = orderRepository.findByStatus(status);
        } else {
            orders = orderRepository.findAll();
        }
        return orderMapper.toResponseList(orders);
    }

    @Override
    public OrderResponse updateOrderStatus(String orderId, UpdateStatusRequest request) {
        log.info("Updating order {} status to: {}", orderId, request.getStatus());

        Order order = findOrderById(orderId);
        OrderStatus currentStatus = order.getStatus();
        OrderStatus newStatus = request.getStatus();

        // Validate status transition
        if (!currentStatus.canTransitionTo(newStatus)) {
            throw new InvalidOperationException(
                    String.format("%s: %s → %s", INVALID_STATUS_TRANSITION,
                            currentStatus.name(), newStatus.name()));
        }

        order.setStatus(newStatus);
        order = orderRepository.save(order);
        log.info("Order {} status updated: {} → {}", orderId, currentStatus, newStatus);

        OrderResponse response = orderMapper.toResponse(order);

        // Real-time WebSocket broadcasting to manager, customer, and admin channels
        try {
            messagingTemplate.convertAndSend("/topic/orders/status", response);
            messagingTemplate.convertAndSend("/topic/orders/" + order.getId(), response);
            messagingTemplate.convertAndSend("/topic/dashboard", response);
        } catch (Exception e) {
            log.warn("Failed to broadcast order status update over WebSocket: {}", e.getMessage());
        }

        // Send email update to customer asynchronously
        try {
            emailService.sendOrderStatusUpdate(order.getCustomerId(), order.getId(), newStatus);
        } catch (Exception e) {
            log.warn("Failed to send order status update email: {}", e.getMessage());
        }

        return response;
    }

    @Override
    public DailySalesSummary getDailySalesSummary(LocalDate date) {
        log.info("Fetching daily sales summary for date: {}", date);

        LocalDateTime startOfDay = DateUtils.startOfDay(date);
        LocalDateTime endOfDay = DateUtils.endOfDay(date);

        List<Order> orders = orderRepository.findByCreatedAtBetween(startOfDay, endOfDay);

        // Only count DELIVERED orders for revenue
        long totalOrders = orders.size();
        BigDecimal totalRevenue = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return DailySalesSummary.builder()
                .date(DateUtils.formatDate(date))
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .build();
    }

    // ==================== Admin Operations ====================

    @Override
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        log.info("Fetching all orders (page: {}, size: {})", pageable.getPageNumber(), pageable.getPageSize());
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(orderMapper::toResponse);
    }

    @Override
    public DashboardStats getDashboardStats() {
        log.info("Fetching dashboard statistics");

        List<Order> allOrders = orderRepository.findAll();

        long totalOrders = allOrders.size();

        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> orderCountByStatus = Arrays.stream(OrderStatus.values())
                .collect(Collectors.toMap(
                        OrderStatus::name,
                        status -> allOrders.stream()
                                .filter(o -> o.getStatus() == status)
                                .count()
                ));

        return DashboardStats.builder()
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .orderCountByStatus(orderCountByStatus)
                .build();
    }

    // ==================== Helper Methods ====================

    /**
     * Find order by ID or throw ResourceNotFoundException.
     */
    private Order findOrderById(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(ORDER_NOT_FOUND));
    }
}
