package com.pratik.canteen.user.mapper;

import com.pratik.canteen.user.dto.UserResponse;
import com.pratik.canteen.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MapStruct mapper for User entity → UserResponse DTO conversions.
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "role", expression = "java(user.getRole().name())")
    UserResponse toResponse(User user);

    List<UserResponse> toResponseList(List<User> users);
}
