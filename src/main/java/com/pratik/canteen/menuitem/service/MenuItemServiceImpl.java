package com.pratik.canteen.menuitem.service;

import com.pratik.canteen.category.repository.CategoryRepository;
import com.pratik.canteen.exception.ResourceNotFoundException;
import com.pratik.canteen.menuitem.dto.MenuItemRequest;
import com.pratik.canteen.menuitem.dto.MenuItemResponse;
import com.pratik.canteen.menuitem.entity.MenuItem;
import com.pratik.canteen.menuitem.mapper.MenuItemMapper;
import com.pratik.canteen.menuitem.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.pratik.canteen.common.constants.AppConstants.*;

/**
 * Implementation of MenuItemService with full CRUD, search, and availability toggle.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MenuItemServiceImpl implements MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;
    private final MenuItemMapper menuItemMapper;
    private final com.pratik.canteen.storage.service.StorageService storageService;

    @Override
    public MenuItemResponse createMenuItem(MenuItemRequest request) {
        log.info("Creating menu item: {}", request.getName());
        validateCategoryExists(request.getCategoryId());

        MenuItem menuItem = menuItemMapper.toEntity(request);
        menuItem.setAvailable(true);
        menuItem = menuItemRepository.save(menuItem);
        log.info("Menu item created with id: {}", menuItem.getId());

        return enrichWithCategoryName(menuItem);
    }

    @Override
    public MenuItemResponse getMenuItemById(String id) {
        log.info("Fetching menu item with id: {}", id);
        MenuItem menuItem = findMenuItemById(id);
        return enrichWithCategoryName(menuItem);
    }

    @Override
    public MenuItemResponse updateMenuItem(String id, MenuItemRequest request) {
        log.info("Updating menu item with id: {}", id);
        validateCategoryExists(request.getCategoryId());

        MenuItem menuItem = findMenuItemById(id);
        menuItemMapper.updateEntityFromRequest(request, menuItem);
        menuItem = menuItemRepository.save(menuItem);
        log.info("Menu item updated: {}", menuItem.getId());

        return enrichWithCategoryName(menuItem);
    }

    @Override
    public void deleteMenuItem(String id) {
        log.info("Deleting menu item with id: {}", id);
        MenuItem menuItem = findMenuItemById(id);
        if (menuItem.getImageUrl() != null && !menuItem.getImageUrl().isBlank()) {
            try {
                storageService.deleteFile(menuItem.getImageUrl());
            } catch (Exception e) {
                log.warn("Failed to delete image from storage: {}", e.getMessage());
            }
        }
        menuItemRepository.delete(menuItem);
        log.info("Menu item deleted: {}", id);
    }

    @Override
    public List<MenuItemResponse> getAvailableMenuItems() {
        log.info("Fetching all available menu items");
        return menuItemRepository.findByAvailableTrue()
                .stream()
                .map(this::enrichWithCategoryName)
                .toList();
    }

    @Override
    public List<MenuItemResponse> getAllMenuItems() {
        log.info("Fetching all menu items (including unavailable)");
        return menuItemRepository.findAll()
                .stream()
                .map(this::enrichWithCategoryName)
                .toList();
    }

    @Override
    public List<MenuItemResponse> searchMenuItemsByName(String name) {
        log.info("Searching menu items by name: {}", name);
        return menuItemRepository.findByNameContainingIgnoreCaseAndAvailableTrue(name)
                .stream()
                .map(this::enrichWithCategoryName)
                .toList();
    }

    @Override
    public List<MenuItemResponse> getMenuItemsByCategory(String categoryId) {
        log.info("Fetching menu items for category: {}", categoryId);
        validateCategoryExists(categoryId);
        return menuItemRepository.findByCategoryIdAndAvailableTrue(categoryId)
                .stream()
                .map(this::enrichWithCategoryName)
                .toList();
    }

    @Override
    public MenuItemResponse toggleAvailability(String id, boolean available) {
        log.info("Toggling availability for menu item {}: {}", id, available);
        MenuItem menuItem = findMenuItemById(id);
        menuItem.setAvailable(available);
        menuItem = menuItemRepository.save(menuItem);
        log.info("Menu item {} availability set to: {}", id, available);

        return enrichWithCategoryName(menuItem);
    }

    // ==================== Helper Methods ====================

    /**
     * Find menu item by ID or throw ResourceNotFoundException.
     */
    private MenuItem findMenuItemById(String id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(MENU_ITEM_NOT_FOUND));
    }

    /**
     * Validate that the referenced category exists.
     */
    private void validateCategoryExists(String categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException(CATEGORY_NOT_FOUND);
        }
    }

    /**
     * Enrich a MenuItemResponse with the category name.
     */
    private MenuItemResponse enrichWithCategoryName(MenuItem menuItem) {
        MenuItemResponse response = menuItemMapper.toResponse(menuItem);
        categoryRepository.findById(menuItem.getCategoryId())
                .ifPresent(category -> response.setCategoryName(category.getName()));
        return response;
    }
}
