package com.pratik.canteen.otp.repository;

import com.pratik.canteen.otp.entity.OtpToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * MongoDB repository for OTP tokens.
 */
@Repository
public interface OtpRepository extends MongoRepository<OtpToken, String> {

    Optional<OtpToken> findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(String email);

    void deleteByEmail(String email);
}
