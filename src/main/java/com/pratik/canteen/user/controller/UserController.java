package com.pratik.canteen.user.controller;

import com.pratik.canteen.common.response.ApiResponse;
import com.pratik.canteen.user.dto.CreateManagerRequest;
import com.pratik.canteen.user.dto.UserResponse;
import com.pratik.canteen.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.pratik.canteen.common.constants.AppConstants.*;

/**
 * REST controller for user management (Admin only).
 * Handles manager account creation and listing.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Admin endpoints for managing user accounts")
public class UserController {

    private final UserService userService;

    @PostMapping("/managers")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new manager account (Admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> createManager(
            @Valid @RequestBody CreateManagerRequest request) {
        UserResponse response = userService.createManager(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, MANAGER_CREATED));
    }

    @GetMapping("/managers")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all manager accounts (Admin only)")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllManagers() {
        List<UserResponse> managers = userService.getAllManagers();
        return ResponseEntity.ok(ApiResponse.success(managers, MANAGERS_FETCHED));
    }
}
