package com.pratik.canteen.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for user data (used in manager listing, etc.).
 * Never exposes the password field.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;
    private String fullName;
    private String email;
    private String role;
    private LocalDateTime createdAt;
}
