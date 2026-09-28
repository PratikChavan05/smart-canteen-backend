package com.pratik.canteen.user.service;

import com.pratik.canteen.exception.DuplicateResourceException;
import com.pratik.canteen.user.dto.CreateManagerRequest;
import com.pratik.canteen.user.dto.UserResponse;
import com.pratik.canteen.user.entity.Role;
import com.pratik.canteen.user.entity.User;
import com.pratik.canteen.user.mapper.UserMapper;
import com.pratik.canteen.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.pratik.canteen.common.constants.AppConstants.*;

/**
 * Implementation of UserService for admin user management operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse createManager(CreateManagerRequest request) {
        log.info("Admin creating manager account for email: {}", request.getEmail());

        String email = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException(EMAIL_ALREADY_EXISTS);
        }

        User manager = User.builder()
                .fullName(request.getFullName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.MANAGER)
                .emailVerified(true)
                .build();

        manager = userRepository.save(manager);
        log.info("Manager account created: {}", manager.getEmail());

        return userMapper.toResponse(manager);
    }

    @Override
    public List<UserResponse> getAllManagers() {
        log.info("Fetching all manager accounts");
        List<User> managers = userRepository.findByRole(Role.MANAGER);
        return userMapper.toResponseList(managers);
    }
}
