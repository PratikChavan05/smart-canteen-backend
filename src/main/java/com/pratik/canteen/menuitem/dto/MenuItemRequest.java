package com.pratik.canteen.menuitem.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for creating or updating a menu item.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemRequest {

    @NotBlank(message = "Menu item name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Size(max = 300, message = "Description must not exceed 300 characters")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    private String imageUrl;

    @NotBlank(message = "Category ID is required")
    private String categoryId;
}
