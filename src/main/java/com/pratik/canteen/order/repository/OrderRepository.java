package com.pratik.canteen.order.repository;

import com.pratik.canteen.order.entity.Order;
import com.pratik.canteen.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MongoDB repository for Order documents.
 */
@Repository
public interface OrderRepository extends MongoRepository<Order, String> {

    List<Order> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    List<Order> findByStatusIn(List<OrderStatus> statuses);

    List<Order> findByStatus(OrderStatus status);

    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByStatus(OrderStatus status);
}
