package com.pratik.canteen.order.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for a single item in an order.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequest {

    @NotBlank(message = "Menu item ID is required")
    private String menuItemId;

    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 50, message = "Quantity cannot exceed 50 per item")
    private int quantity;
}
