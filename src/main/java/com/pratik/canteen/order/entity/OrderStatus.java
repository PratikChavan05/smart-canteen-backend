package com.pratik.canteen.order.entity;

import com.pratik.canteen.common.constants.AppConstants;

import java.util.List;

/**
 * Enum representing the lifecycle status of an order.
 * Valid transitions:
 *   PENDING_PAYMENT → CANCELLED (PENDING only via successful payment verify)
 *   PENDING → PREPARING, CANCELLED
 *   PREPARING → READY
 *   READY → DELIVERED
 *   DELIVERED / CANCELLED → (terminal)
 */
public enum OrderStatus {
    PENDING_PAYMENT,
    PENDING,
    PREPARING,
    READY,
    DELIVERED,
    CANCELLED;

    /**
     * Check if transitioning from the current status to the target status is valid.
     */
    public boolean canTransitionTo(OrderStatus target) {
        List<String> validTargets = AppConstants.VALID_STATUS_TRANSITIONS.get(this.name());
        return validTargets != null && validTargets.contains(target.name());
    }
}
