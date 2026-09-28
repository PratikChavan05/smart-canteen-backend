package com.pratik.canteen.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/**
 * MongoDB configuration.
 * Enables auditing for automatic population of @CreatedDate fields.
 */
@Configuration
@EnableMongoAuditing
public class MongoConfig {
    // Spring Boot auto-configures MongoDB connection from application.yml
    // This class enables auditing support for @CreatedDate annotations
}
