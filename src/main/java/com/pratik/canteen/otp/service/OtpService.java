package com.pratik.canteen.otp.service;

import com.pratik.canteen.exception.InvalidOperationException;
import com.pratik.canteen.notification.service.EmailService;
import com.pratik.canteen.otp.entity.OtpToken;
import com.pratik.canteen.otp.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Service for OTP generation, sending, and verification.
 * OTP is a 6-digit numeric code valid for 5 minutes.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final EmailService emailService;

    private static final int OTP_LENGTH = 6;
    private static final int OTP_VALIDITY_MINUTES = 5;
    private static final SecureRandom random = new SecureRandom();

    /**
     * Generate a 6-digit OTP, save to DB, and send via email.
     */
    public void generateAndSendOtp(String email, String fullName) {
        // Delete any existing OTPs for this email
        otpRepository.deleteByEmail(email);

        String otp = generateOtp();

        OtpToken token = OtpToken.builder()
                .email(email)
                .otp(otp)
                .verified(false)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES))
                .build();

        otpRepository.save(token);
        log.info("OTP generated for {} (valid {} minutes)", email, OTP_VALIDITY_MINUTES);

        emailService.sendOtp(email, otp, fullName);
    }

    /**
     * Verify an OTP for the given email.
     *
     * @return true if OTP is valid and not expired
     */
    public boolean verifyOtp(String email, String otp) {
        OtpToken token = otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new InvalidOperationException("No OTP found. Please request a new one."));

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidOperationException("OTP has expired. Please request a new one.");
        }

        if (!token.getOtp().equals(otp)) {
            throw new InvalidOperationException("Invalid OTP. Please try again.");
        }

        // Mark as verified
        token.setVerified(true);
        otpRepository.save(token);
        log.info("OTP verified for email: {}", email);

        return true;
    }

    private String generateOtp() {
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }
}
