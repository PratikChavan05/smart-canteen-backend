package com.pratik.canteen.otp.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * MongoDB document for OTP tokens.
 * TTL index auto-deletes expired tokens after 10 minutes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "otp_tokens")
public class OtpToken {

    @Id
    private String id;

    @Indexed
    private String email;

    private String otp;

    private boolean verified;

    private LocalDateTime createdAt;

    @Indexed(expireAfter = "10m")
    private LocalDateTime expiresAt;
}
