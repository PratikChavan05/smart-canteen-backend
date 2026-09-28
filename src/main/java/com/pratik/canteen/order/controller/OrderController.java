package com.pratik.canteen.order.controller;

import com.pratik.canteen.common.response.ApiResponse;
import com.pratik.canteen.order.dto.*;
import com.pratik.canteen.order.entity.OrderStatus;
import com.pratik.canteen.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import static com.pratik.canteen.common.constants.AppConstants.*;

/**
 * REST controller for order management.
 * Customer: place/cancel/view orders. Manager: status updates/daily summary. Admin: view all/dashboard.
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order management endpoints")
public class OrderController {

    private final OrderService orderService;

    // ==================== Customer Endpoints ====================

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Place a new order (Customer only)")
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            @Valid @RequestBody PlaceOrderRequest request,
            Authentication authentication) {
        String customerId = authentication.getName();
        OrderResponse response = orderService.placeOrder(request, customerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, ORDER_PLACED));
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "View own order history (Customer only)")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(Authentication authentication) {
        String customerId = authentication.getName();
        List<OrderResponse> orders = orderService.getCustomerOrders(customerId);
        return ResponseEntity.ok(ApiResponse.success(orders, ORDERS_FETCHED));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Cancel an order (Customer only, PENDING status only)")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable String id,
            Authentication authentication) {
        String customerId = authentication.getName();
        OrderResponse response = orderService.cancelOrder(id, customerId);
        return ResponseEntity.ok(ApiResponse.success(response, ORDER_CANCELLED));
    }

    // ==================== Manager/Admin Endpoints ====================

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Get orders by status (Manager/Admin)")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersByStatus(
            @RequestParam(required = false) OrderStatus status) {
        List<OrderResponse> orders = orderService.getOrdersByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(orders, ORDERS_FETCHED));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Update order status (Manager/Admin, validates transitions)")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateStatusRequest request) {
        OrderResponse response = orderService.updateOrderStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, ORDER_STATUS_UPDATED));
    }

    @GetMapping("/daily-summary")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Get daily sales summary (Manager/Admin)")
    public ResponseEntity<ApiResponse<DailySalesSummary>> getDailySalesSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        DailySalesSummary summary = orderService.getDailySalesSummary(date);
        return ResponseEntity.ok(ApiResponse.success(summary, DAILY_SUMMARY_FETCHED));
    }

    // ==================== Admin-Only Endpoints ====================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all orders with pagination (Admin only)")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> orders = orderService.getAllOrders(pageable);
        return ResponseEntity.ok(ApiResponse.success(orders, ORDERS_FETCHED));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get dashboard stats (Admin only)")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboardStats() {
        DashboardStats stats = orderService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats, DASHBOARD_FETCHED));
    }
}
