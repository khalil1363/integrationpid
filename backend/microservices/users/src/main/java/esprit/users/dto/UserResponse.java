package esprit.users.dto;

import esprit.users.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String status;
    private String photoBase64;
    private String phone;
    private String address;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(user.getStatus() != null ? user.getStatus().name() : "ACTIVE")
                .photoBase64(user.getPhotoBase64())
                .phone(user.getPhone())
                .address(user.getAddress())
                .build();
    }
}

