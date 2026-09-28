package com.pratik.canteen.order.service;

import com.pratik.canteen.order.dto.*;
import com.pratik.canteen.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

/**
 * Service interface for order operations.
 */
public interface OrderService {

    // Customer operations
    OrderResponse placeOrder(PlaceOrderRequest request, String customerId);

    OrderResponse cancelOrder(String orderId, String customerId);

    List<OrderResponse> getCustomerOrders(String customerId);

    // Manager operations
    List<OrderResponse> getOrdersByStatus(OrderStatus status);

    OrderResponse updateOrderStatus(String orderId, UpdateStatusRequest request);

    DailySalesSummary getDailySalesSummary(LocalDate date);

    // Admin operations
    Page<OrderResponse> getAllOrders(Pageable pageable);

    DashboardStats getDashboardStats();
}
