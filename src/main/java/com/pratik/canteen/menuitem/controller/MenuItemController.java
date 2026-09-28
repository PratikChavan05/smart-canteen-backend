package com.pratik.canteen.menuitem.controller;

import com.pratik.canteen.common.response.ApiResponse;
import com.pratik.canteen.menuitem.dto.MenuItemRequest;
import com.pratik.canteen.menuitem.dto.MenuItemResponse;
import com.pratik.canteen.menuitem.service.MenuItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.pratik.canteen.common.constants.AppConstants.*;

/**
 * REST controller for menu item management.
 * Admin: full CRUD. Manager: availability toggle. Public: browse/search/filter.
 */
@RestController
@RequestMapping("/api/menu-items")
@RequiredArgsConstructor
@Tag(name = "Menu Items", description = "Menu item management and browsing endpoints")
public class MenuItemController {

    private final MenuItemService menuItemService;

    // ==================== Admin CRUD ====================

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Create a new menu item (Admin/Manager)")
    public ResponseEntity<ApiResponse<MenuItemResponse>> createMenuItem(
            @Valid @RequestBody MenuItemRequest request) {
        MenuItemResponse response = menuItemService.createMenuItem(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, MENU_ITEM_CREATED));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Update a menu item (Admin/Manager)")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateMenuItem(
            @PathVariable String id,
            @Valid @RequestBody MenuItemRequest request) {
        MenuItemResponse response = menuItemService.updateMenuItem(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, MENU_ITEM_UPDATED));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Delete a menu item (Admin/Manager)")
    public ResponseEntity<ApiResponse<Void>> deleteMenuItem(@PathVariable String id) {
        menuItemService.deleteMenuItem(id);
        return ResponseEntity.ok(ApiResponse.success(null, MENU_ITEM_DELETED));
    }

    // ==================== Public Browse/Search/Filter ====================

    @GetMapping("/manage")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Get all menu items including unavailable (Admin/Manager)")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getAllMenuItemsForStaff() {
        List<MenuItemResponse> items = menuItemService.getAllMenuItems();
        return ResponseEntity.ok(ApiResponse.success(items, MENU_ITEMS_FETCHED));
    }

    @GetMapping
    @Operation(summary = "Get all available menu items (Public)")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getAvailableMenuItems() {
        List<MenuItemResponse> items = menuItemService.getAvailableMenuItems();
        return ResponseEntity.ok(ApiResponse.success(items, MENU_ITEMS_FETCHED));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a menu item by ID (Public)")
    public ResponseEntity<ApiResponse<MenuItemResponse>> getMenuItemById(@PathVariable String id) {
        MenuItemResponse response = menuItemService.getMenuItemById(id);
        return ResponseEntity.ok(ApiResponse.success(response, MENU_ITEM_FETCHED));
    }

    @GetMapping("/search")
    @Operation(summary = "Search menu items by name (Public, case-insensitive partial match)")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> searchMenuItems(
            @RequestParam String name) {
        List<MenuItemResponse> items = menuItemService.searchMenuItemsByName(name);
        return ResponseEntity.ok(ApiResponse.success(items, MENU_ITEMS_FETCHED));
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get available menu items by category (Public)")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getMenuItemsByCategory(
            @PathVariable String categoryId) {
        List<MenuItemResponse> items = menuItemService.getMenuItemsByCategory(categoryId);
        return ResponseEntity.ok(ApiResponse.success(items, MENU_ITEMS_FETCHED));
    }

    // ==================== Manager/Admin Availability Toggle ====================

    @PatchMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Toggle menu item availability (Admin/Manager)")
    public ResponseEntity<ApiResponse<MenuItemResponse>> toggleAvailability(
            @PathVariable String id,
            @RequestParam boolean available) {
        MenuItemResponse response = menuItemService.toggleAvailability(id, available);
        return ResponseEntity.ok(ApiResponse.success(response, AVAILABILITY_UPDATED));
    }
}
