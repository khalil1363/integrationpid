package com.evaluation.evaluation.controller;

import com.evaluation.evaluation.client.UserClient;
import com.evaluation.evaluation.dto.UserMicroDto;
import com.evaluation.evaluation.dto.UserSummaryDto;
import com.evaluation.evaluation.model.User;
import com.evaluation.evaluation.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/evaluation/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserClient userClient;

    private static UserSummaryDto toSummary(UserMicroDto u) {
        if (u == null) return null;
        return new UserSummaryDto(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(), u.getRole());
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User created = userService.createUser(user);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<UserSummaryDto>> getAllUsers(
            @RequestParam(required = false) com.evaluation.evaluation.enums.Role role) {
        // Prefer the real User microservice via Eureka/OpenFeign
        String roleParam = role != null ? role.name() : null;
        List<UserMicroDto> remote = userClient.getAllUsers(null, roleParam, null);
        List<UserSummaryDto> list = remote.stream().map(UserController::toSummary).toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserSummaryDto> getUserById(@PathVariable Long id) {
        UserMicroDto remote = userClient.getUserById(id);
        return ResponseEntity.ok(toSummary(remote));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
