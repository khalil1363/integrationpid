package esprit.users.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {



    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    @Column(nullable = false, length = 50)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    @Column(nullable = false, length = 50)
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Size(max = 20, message = "Phone number must be at most 20 characters")
    @Column(name = "phone", length = 20)
    private String phone;

    @Size(max = 255, message = "Address must be at most 255 characters")
    @Column(name = "address", length = 255)
    private String address;

    // Password is required on create, but optional on update.
    // Validation for non-empty on create est gérée côté front.
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Column(nullable = false)
    private String password;

    @NotNull(message = "Role is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role; // ADMIN, TUTOR, STUDENT, CLUB_MANAGER, EMPLOYEE

    @Convert(converter = StatusConverter.class)
    @Column(name = "status", length = 20)
    private Status status = Status.ACTIVE; // ACTIVE, INACTIVE, PENDING

    @Column(name = "reset_token", length = 100)
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    /** Photo de profil (base64, optionnel). */
    @Lob
    @Column(name = "photo_base64", columnDefinition = "LONGTEXT")
    private String photoBase64;
}

