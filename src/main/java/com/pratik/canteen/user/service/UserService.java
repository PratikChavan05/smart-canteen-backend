package com.pratik.canteen.user.service;

import com.pratik.canteen.user.dto.CreateManagerRequest;
import com.pratik.canteen.user.dto.UserResponse;

import java.util.List;

/**
 * Service interface for user management (admin operations).
 */
public interface UserService {

    /**
     * Create a new manager account (Admin only).
     */
    UserResponse createManager(CreateManagerRequest request);

    /**
     * Get all managers.
     */
    List<UserResponse> getAllManagers();
}
