package com.pratik.canteen.common.constants;

import java.util.List;
import java.util.Map;

/**
 * Application-wide constants for roles, order status transitions, and messages.
 * Centralizes magic strings to ensure consistency and easy maintenance.
 */
public final class AppConstants {

    private AppConstants() {
        // Prevent instantiation
    }

    // ==================== Role Names ====================
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_MANAGER = "MANAGER";
    public static final String ROLE_CUSTOMER = "CUSTOMER";

    // ==================== Order Status Transitions ====================
    // Defines valid next statuses for each current status
    // PENDING_PAYMENT → PENDING is payment-verify only (not via status API)
    public static final Map<String, List<String>> VALID_STATUS_TRANSITIONS = Map.of(
            "PENDING_PAYMENT", List.of("CANCELLED"),
            "PENDING", List.of("PREPARING", "CANCELLED"),
            "PREPARING", List.of("READY"),
            "READY", List.of("DELIVERED"),
            "DELIVERED", List.of(),
            "CANCELLED", List.of()
    );

    // ==================== Response Messages ====================
    public static final String USER_REGISTERED = "User registered successfully";
    public static final String LOGIN_SUCCESS = "Login successful";
    public static final String OTP_SENT = "OTP sent to your email address";
    public static final String OTP_VERIFIED = "Email verified successfully";
    public static final String PAYMENT_ORDER_CREATED = "Payment order created successfully";
    public static final String PAYMENT_VERIFIED = "Payment verified successfully";
    public static final String FILE_UPLOADED = "File uploaded successfully";
    public static final String FILE_DELETED = "File deleted successfully";
    public static final String CATEGORY_CREATED = "Category created successfully";
    public static final String CATEGORY_UPDATED = "Category updated successfully";
    public static final String CATEGORY_DELETED = "Category deleted successfully";
    public static final String CATEGORY_FETCHED = "Category retrieved successfully";
    public static final String CATEGORIES_FETCHED = "Categories retrieved successfully";
    public static final String MENU_ITEM_CREATED = "Menu item created successfully";
    public static final String MENU_ITEM_UPDATED = "Menu item updated successfully";
    public static final String MENU_ITEM_DELETED = "Menu item deleted successfully";
    public static final String MENU_ITEM_FETCHED = "Menu item retrieved successfully";
    public static final String MENU_ITEMS_FETCHED = "Menu items retrieved successfully";
    public static final String AVAILABILITY_UPDATED = "Menu item availability updated successfully";
    public static final String ORDER_PLACED = "Order placed successfully";
    public static final String ORDER_CANCELLED = "Order cancelled successfully";
    public static final String ORDER_STATUS_UPDATED = "Order status updated successfully";
    public static final String ORDER_FETCHED = "Order retrieved successfully";
    public static final String ORDERS_FETCHED = "Orders retrieved successfully";
    public static final String MANAGER_CREATED = "Manager account created successfully";
    public static final String MANAGERS_FETCHED = "Managers retrieved successfully";
    public static final String DASHBOARD_FETCHED = "Dashboard stats retrieved successfully";
    public static final String DAILY_SUMMARY_FETCHED = "Daily sales summary retrieved successfully";

    // ==================== Error Messages ====================
    public static final String USER_NOT_FOUND = "User not found";
    public static final String EMAIL_ALREADY_EXISTS = "Email already exists";
    public static final String INVALID_CREDENTIALS = "Invalid email or password";
    public static final String EMAIL_NOT_VERIFIED = "Email is not verified. Please verify your email via OTP.";
    public static final String CATEGORY_NOT_FOUND = "Category not found";
    public static final String CATEGORY_NAME_EXISTS = "Category with this name already exists";
    public static final String MENU_ITEM_NOT_FOUND = "Menu item not found";
    public static final String ORDER_NOT_FOUND = "Order not found";
    public static final String INVALID_STATUS_TRANSITION = "Invalid order status transition";
    public static final String CANCEL_ONLY_PENDING = "Only unpaid or pending orders can be cancelled";
    public static final String NOT_YOUR_ORDER = "You can only access your own orders";
    public static final String MENU_ITEM_UNAVAILABLE = "Menu item is currently unavailable: ";
    public static final String EMPTY_ORDER = "Order must contain at least one item";
    public static final String CATEGORY_HAS_MENU_ITEMS =
            "Cannot delete category that still has menu items. Move or delete those items first.";
}
