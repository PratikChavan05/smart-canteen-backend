package com.pratik.canteen.order.mapper;

import com.pratik.canteen.order.dto.OrderItemResponse;
import com.pratik.canteen.order.dto.OrderResponse;
import com.pratik.canteen.order.entity.Order;
import com.pratik.canteen.order.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
import java.util.List;

/**
 * MapStruct mapper for Order entity ↔ DTO conversions.
 */
@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(target = "status", expression = "java(order.getStatus().name())")
    @Mapping(target = "items", source = "items")
    OrderResponse toResponse(Order order);

    List<OrderResponse> toResponseList(List<Order> orders);

    /**
     * Map OrderItem to OrderItemResponse, computing subtotal.
     */
    default OrderItemResponse toOrderItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .menuItemId(item.getMenuItemId())
                .name(item.getName())
                .price(item.getPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .build();
    }
}
