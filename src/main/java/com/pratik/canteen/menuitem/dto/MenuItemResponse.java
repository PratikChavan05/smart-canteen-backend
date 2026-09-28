package com.pratik.canteen.menuitem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for menu item data.
 * Includes resolved category name for convenience.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemResponse {

    private String id;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private String categoryId;
    private String categoryName;
    private boolean available;
}
