package com.pratik.canteen.menuitem.service;

import com.pratik.canteen.menuitem.dto.MenuItemRequest;
import com.pratik.canteen.menuitem.dto.MenuItemResponse;

import java.util.List;

/**
 * Service interface for menu item operations.
 */
public interface MenuItemService {

    // Admin CRUD
    MenuItemResponse createMenuItem(MenuItemRequest request);

    MenuItemResponse getMenuItemById(String id);

    MenuItemResponse updateMenuItem(String id, MenuItemRequest request);

    void deleteMenuItem(String id);

    // Customer browse/search/filter
    List<MenuItemResponse> getAvailableMenuItems();

    /** Staff view: all items including unavailable. */
    List<MenuItemResponse> getAllMenuItems();

    List<MenuItemResponse> searchMenuItemsByName(String name);

    List<MenuItemResponse> getMenuItemsByCategory(String categoryId);

    // Manager availability toggle
    MenuItemResponse toggleAvailability(String id, boolean available);
}
