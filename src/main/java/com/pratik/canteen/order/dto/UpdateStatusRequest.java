package com.pratik.canteen.order.dto;

import jakarta.validation.constraints.NotNull;
import com.pratik.canteen.order.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating order status.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStatusRequest {

    @NotNull(message = "Status is required")
    private OrderStatus status;
}
