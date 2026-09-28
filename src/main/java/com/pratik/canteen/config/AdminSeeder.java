package com.pratik.canteen.config;

import com.pratik.canteen.user.entity.Role;
import com.pratik.canteen.user.entity.User;
import com.pratik.canteen.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds a default admin account on application startup if no admin exists.
 * Default credentials: admin@canteen.com / admin123
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.existsByRole(Role.ADMIN)) {
            User admin = User.builder()
                    .fullName("System Admin")
                    .email("admin@canteen.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .emailVerified(true)
                    .build();

            userRepository.save(admin);
            log.info("Default admin account created (admin@canteen.com). Change the default password after first login.");
        } else {
            log.info("Admin account already exists, skipping seed");
        }

        // Ensure staff accounts can log in (legacy rows may have emailVerified=false)
        List<User> staff = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN || u.getRole() == Role.MANAGER)
                .filter(u -> !u.isEmailVerified())
                .toList();
        for (User user : staff) {
            user.setEmailVerified(true);
            userRepository.save(user);
            log.info("Marked {} account as email-verified: {}", user.getRole(), user.getEmail());
        }
    }
}
