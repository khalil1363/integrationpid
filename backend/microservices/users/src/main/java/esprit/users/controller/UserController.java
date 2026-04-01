package esprit.users.controller;

import esprit.users.entity.User;
import esprit.users.entity.Status;
import esprit.users.service.UserService;
import esprit.users.dto.UserProfileUpdateRequest;
import esprit.users.dto.UpdateStatusRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/user/users")
@RequiredArgsConstructor
@Validated
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
        User created = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody User user) {
        User updated = userService.updateUser(id, user);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/profile")
    public ResponseEntity<User> updateProfile(@PathVariable Long id,
                                              @Valid @RequestBody UserProfileUpdateRequest request) {
        User updated = userService.updateUserProfile(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id,
                                           @RequestParam Long adminId) {
        userService.deleteUser(id, adminId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        if ((search != null && !search.isBlank()) || (role != null && !role.isBlank() && !"all".equalsIgnoreCase(role))
                || (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status))) {
            List<User> users = userService.searchUsers(search, role, status);
            return ResponseEntity.ok(users);
        }
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    /** Seul un ADMIN peut appeler cet endpoint (vérifié via adminId dans le body). */
    @PatchMapping("/{id}/status")
    public ResponseEntity<User> setUserStatus(@PathVariable Long id,
                                              @Valid @RequestBody UpdateStatusRequest request) {
        Status status = Status.valueOf(request.getStatus().toUpperCase());
        User updated = userService.setUserStatus(id, request.getAdminId(), status);
        return ResponseEntity.ok(updated);
    }
}

