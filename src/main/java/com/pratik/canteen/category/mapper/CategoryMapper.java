package com.pratik.canteen.category.mapper;

import com.pratik.canteen.category.dto.CategoryRequest;
import com.pratik.canteen.category.dto.CategoryResponse;
import com.pratik.canteen.category.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for Category entity ↔ DTO conversions.
 */
@Mapper(componentModel = "spring")
public interface CategoryMapper {

    CategoryResponse toResponse(Category category);

    @Mapping(target = "id", ignore = true)
    Category toEntity(CategoryRequest request);

    /**
     * Update existing entity fields from request DTO (for PUT operations).
     */
    @Mapping(target = "id", ignore = true)
    void updateEntityFromRequest(CategoryRequest request, @MappingTarget Category category);
}
