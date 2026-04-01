package com.evaluation.evaluation.client;

import com.evaluation.evaluation.dto.UserMicroDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "user")
public interface UserClient {

    @GetMapping("/user/users")
    List<UserMicroDto> getAllUsers(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "status", required = false) String status
    );

    @GetMapping("/user/users/{id}")
    UserMicroDto getUserById(@PathVariable("id") Long id);
}

