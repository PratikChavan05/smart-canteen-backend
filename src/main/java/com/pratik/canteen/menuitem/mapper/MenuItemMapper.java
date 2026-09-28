package com.pratik.canteen.menuitem.mapper;

import com.pratik.canteen.menuitem.dto.MenuItemRequest;
import com.pratik.canteen.menuitem.dto.MenuItemResponse;
import com.pratik.canteen.menuitem.entity.MenuItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for MenuItem entity ↔ DTO conversions.
 * categoryName is set manually in the service layer since it requires a repository lookup.
 */
@Mapper(componentModel = "spring")
public interface MenuItemMapper {

    @Mapping(target = "categoryName", ignore = true)
    MenuItemResponse toResponse(MenuItem menuItem);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "available", ignore = true)
    MenuItem toEntity(MenuItemRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "available", ignore = true)
    void updateEntityFromRequest(MenuItemRequest request, @MappingTarget MenuItem menuItem);
}
