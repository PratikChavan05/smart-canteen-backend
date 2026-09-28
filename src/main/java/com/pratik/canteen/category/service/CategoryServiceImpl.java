package com.pratik.canteen.category.service;

import com.pratik.canteen.category.dto.CategoryRequest;
import com.pratik.canteen.category.dto.CategoryResponse;
import com.pratik.canteen.category.entity.Category;
import com.pratik.canteen.category.mapper.CategoryMapper;
import com.pratik.canteen.category.repository.CategoryRepository;
import com.pratik.canteen.exception.DuplicateResourceException;
import com.pratik.canteen.exception.InvalidOperationException;
import com.pratik.canteen.exception.ResourceNotFoundException;
import com.pratik.canteen.menuitem.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.pratik.canteen.common.constants.AppConstants.*;

/**
 * Implementation of CategoryService with full CRUD operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final MenuItemRepository menuItemRepository;

    @Override
    public CategoryResponse createCategory(CategoryRequest request) {
        log.info("Creating category: {}", request.getName());

        if (categoryRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException(CATEGORY_NAME_EXISTS);
        }

        Category category = categoryMapper.toEntity(request);
        category = categoryRepository.save(category);
        log.info("Category created with id: {}", category.getId());

        return categoryMapper.toResponse(category);
    }

    @Override
    public List<CategoryResponse> getAllCategories() {
        log.info("Fetching all categories");
        return categoryRepository.findAll()
                .stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    @Override
    public CategoryResponse getCategoryById(String id) {
        log.info("Fetching category with id: {}", id);
        Category category = findCategoryById(id);
        return categoryMapper.toResponse(category);
    }

    @Override
    public CategoryResponse updateCategory(String id, CategoryRequest request) {
        log.info("Updating category with id: {}", id);

        Category category = findCategoryById(id);

        // Check for duplicate name (only if name is being changed)
        if (!category.getName().equalsIgnoreCase(request.getName())
                && categoryRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException(CATEGORY_NAME_EXISTS);
        }

        categoryMapper.updateEntityFromRequest(request, category);
        category = categoryRepository.save(category);
        log.info("Category updated: {}", category.getId());

        return categoryMapper.toResponse(category);
    }

    @Override
    public void deleteCategory(String id) {
        log.info("Deleting category with id: {}", id);
        Category category = findCategoryById(id);
        if (menuItemRepository.countByCategoryId(id) > 0) {
            throw new InvalidOperationException(CATEGORY_HAS_MENU_ITEMS);
        }
        categoryRepository.delete(category);
        log.info("Category deleted: {}", id);
    }

    /**
     * Find category by ID or throw ResourceNotFoundException.
     */
    private Category findCategoryById(String id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(CATEGORY_NOT_FOUND));
    }
}
