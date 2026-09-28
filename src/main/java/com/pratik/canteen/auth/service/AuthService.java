package com.pratik.canteen.auth.service;

import com.pratik.canteen.auth.dto.AuthResponse;
import com.pratik.canteen.auth.dto.LoginRequest;
import com.pratik.canteen.auth.dto.RegisterRequest;

/**
 * Service interface for authentication operations.
 */
public interface AuthService {

    /**
     * Register a new customer account.
     */
    AuthResponse register(RegisterRequest request);

    /**
     * Authenticate a user and return a JWT token.
     */
    AuthResponse login(LoginRequest request);

    /**
     * Verify OTP and activate user account.
     */
    AuthResponse verifyOtp(com.pratik.canteen.auth.dto.VerifyOtpRequest request);

    /**
     * Resend verification OTP.
     */
    void resendOtp(com.pratik.canteen.auth.dto.ResendOtpRequest request);
}
