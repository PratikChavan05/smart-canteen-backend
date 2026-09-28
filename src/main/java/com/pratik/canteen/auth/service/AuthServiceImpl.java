package com.pratik.canteen.auth.service;

import com.pratik.canteen.auth.dto.AuthResponse;
import com.pratik.canteen.auth.dto.LoginRequest;
import com.pratik.canteen.auth.dto.RegisterRequest;
import com.pratik.canteen.auth.dto.ResendOtpRequest;
import com.pratik.canteen.auth.dto.VerifyOtpRequest;
import com.pratik.canteen.exception.DuplicateResourceException;
import com.pratik.canteen.exception.InvalidOperationException;
import com.pratik.canteen.exception.ResourceNotFoundException;
import com.pratik.canteen.notification.service.EmailService;
import com.pratik.canteen.otp.service.OtpService;
import com.pratik.canteen.security.JwtProvider;
import com.pratik.canteen.user.entity.Role;
import com.pratik.canteen.user.entity.User;
import com.pratik.canteen.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import static com.pratik.canteen.common.constants.AppConstants.*;

/**
 * Implementation of AuthService for customer registration, login, and OTP verification.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpService;
    private final EmailService emailService;

    @Override
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new customer with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new DuplicateResourceException(EMAIL_ALREADY_EXISTS);
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .emailVerified(false)
                .build();

        userRepository.save(user);
        log.info("Customer registered successfully: {}", user.getEmail());

        try {
            otpService.generateAndSendOtp(user.getEmail(), user.getFullName());
        } catch (Exception e) {
            log.warn("Could not dispatch OTP email immediately: {}", e.getMessage());
        }

        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
        } catch (Exception e) {
            log.warn("Could not dispatch welcome email: {}", e.getMessage());
        }

        // No JWT until email is verified — frontend must complete OTP step
        return AuthResponse.builder()
                .token(null)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .emailVerified(false)
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().toLowerCase(),
                            request.getPassword()
                    )
            );

            User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                    .orElseThrow(() -> new BadCredentialsException(INVALID_CREDENTIALS));

            // Customers must verify email before receiving a session token
            if (user.getRole() == Role.CUSTOMER && !user.isEmailVerified()) {
                try {
                    otpService.generateAndSendOtp(user.getEmail(), user.getFullName());
                } catch (Exception e) {
                    log.warn("Could not resend OTP on unverified login: {}", e.getMessage());
                }
                throw new InvalidOperationException(EMAIL_NOT_VERIFIED);
            }

            String token = jwtProvider.generateToken(user.getEmail(), user.getRole().name());
            log.info("User logged in successfully: {}", user.getEmail());

            return buildAuthResponse(user, token);
        } catch (InvalidOperationException e) {
            throw e;
        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for email: {}", request.getEmail());
            throw new BadCredentialsException(INVALID_CREDENTIALS);
        }
    }

    @Override
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        log.info("Verifying OTP for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND));

        otpService.verifyOtp(user.getEmail(), request.getOtp());

        user.setEmailVerified(true);
        userRepository.save(user);
        log.info("Email successfully verified for user: {}", user.getEmail());

        String token = jwtProvider.generateToken(user.getEmail(), user.getRole().name());
        return buildAuthResponse(user, token);
    }

    @Override
    public void resendOtp(ResendOtpRequest request) {
        log.info("Resending OTP for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND));

        if (user.isEmailVerified()) {
            throw new InvalidOperationException("Email is already verified. Please sign in.");
        }

        otpService.generateAndSendOtp(user.getEmail(), user.getFullName());
        log.info("OTP resent to email: {}", user.getEmail());
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .emailVerified(user.isEmailVerified())
                .build();
    }
}
