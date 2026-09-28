package com.pratik.canteen.menuitem.repository;

import com.pratik.canteen.menuitem.entity.MenuItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * MongoDB repository for MenuItem documents.
 */
@Repository
public interface MenuItemRepository extends MongoRepository<MenuItem, String> {

    List<MenuItem> findByAvailableTrue();

    List<MenuItem> findByNameContainingIgnoreCaseAndAvailableTrue(String name);

    List<MenuItem> findByCategoryIdAndAvailableTrue(String categoryId);

    long countByCategoryId(String categoryId);

    List<MenuItem> findByCategoryId(String categoryId);
}
