package esprit.users.dto;

import esprit.users.entity.Role;
import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class SignupRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50)
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @Size(max = 20)
    private String phone;

    @Size(max = 255)
    private String address;

    @NotBlank(message = "Role is required")
    private String role; // ADMIN, TUTOR, STUDENT, CLUB_MANAGER, EMPLOYEE

    /** Photo de profil en base64 (optionnel). */
    private String photoBase64;

    /** Token reCAPTCHA (« I'm not a robot »). */
    @NotBlank(message = "Veuillez confirmer que vous n'êtes pas un robot.")
    private String recaptchaToken;

    public Role toRoleEnum() {
        return Role.valueOf(role.toUpperCase());
    }
}

