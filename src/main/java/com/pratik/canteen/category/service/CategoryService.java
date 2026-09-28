package com.pratik.canteen.category.service;

import com.pratik.canteen.category.dto.CategoryRequest;
import com.pratik.canteen.category.dto.CategoryResponse;

import java.util.List;

/**
 * Service interface for category operations.
 */
public interface CategoryService {

    CategoryResponse createCategory(CategoryRequest request);

    List<CategoryResponse> getAllCategories();

    CategoryResponse getCategoryById(String id);

    CategoryResponse updateCategory(String id, CategoryRequest request);

    void deleteCategory(String id);
}
