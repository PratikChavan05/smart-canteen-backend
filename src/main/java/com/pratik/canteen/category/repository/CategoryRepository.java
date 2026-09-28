package com.pratik.canteen.category.repository;

import com.pratik.canteen.category.entity.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * MongoDB repository for Category documents.
 */
@Repository
public interface CategoryRepository extends MongoRepository<Category, String> {

    boolean existsByNameIgnoreCase(String name);

    Optional<Category> findByNameIgnoreCase(String name);
}
