package com.pratik.canteen.auth.controller;

import com.pratik.canteen.auth.dto.AuthResponse;
import com.pratik.canteen.auth.dto.LoginRequest;
import com.pratik.canteen.auth.dto.RegisterRequest;
import com.pratik.canteen.auth.service.AuthService;
import com.pratik.canteen.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static com.pratik.canteen.common.constants.AppConstants.*;

/**
 * REST controller for authentication endpoints.
 * Public endpoints — no authentication required.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register and login endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new customer account")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, USER_REGISTERED));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, LOGIN_SUCCESS));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP code for email confirmation")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody com.pratik.canteen.auth.dto.VerifyOtpRequest request) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response, OTP_VERIFIED));
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend OTP code to user's email")
    public ResponseEntity<ApiResponse<Void>> resendOtp(@Valid @RequestBody com.pratik.canteen.auth.dto.ResendOtpRequest request) {
        authService.resendOtp(request);
        return ResponseEntity.ok(ApiResponse.success(null, OTP_SENT));
    }
}
