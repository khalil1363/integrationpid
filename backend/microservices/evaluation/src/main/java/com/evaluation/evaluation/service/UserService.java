package com.evaluation.evaluation.service;

import com.evaluation.evaluation.enums.Role;
import com.evaluation.evaluation.model.User;

import java.util.List;

public interface UserService {
    User createUser(User user);
    List<User> getAllUsers();
    List<User> getUsersByRole(Role role);
    User getUserById(Long id);
    User updateUser(Long id, User user);
    void deleteUser(Long id);
}
