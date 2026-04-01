package com.evaluation.evaluation.dto;

import lombok.Data;

/**
 * Subset of the User microservice response (esprit.users.entity.User).
 * We keep it minimal to avoid coupling to the full user model.
 */
@Data
public class UserMicroDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
}

