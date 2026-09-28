package com.pratik.canteen.menuitem.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;

/**
 * MongoDB document representing a menu item in the canteen.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "menu_items")
public class MenuItem {

    @Id
    private String id;

    private String name;

    private String description;

    private BigDecimal price;

    private String imageUrl;

    private String categoryId;

    @Builder.Default
    private boolean available = true;
}
