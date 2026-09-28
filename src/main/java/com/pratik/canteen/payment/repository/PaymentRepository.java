package com.pratik.canteen.payment.repository;

import com.pratik.canteen.payment.entity.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * MongoDB repository for Payment documents.
 */
@Repository
public interface PaymentRepository extends MongoRepository<Payment, String> {

    Optional<Payment> findByOrderId(String orderId);

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    Optional<Payment> findFirstByOrderIdAndStatusOrderByCreatedAtDesc(
            String orderId, Payment.PaymentStatus status);
}
