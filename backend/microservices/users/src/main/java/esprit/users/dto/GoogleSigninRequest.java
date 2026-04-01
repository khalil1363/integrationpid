package esprit.users.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class GoogleSigninRequest {

    @NotBlank
    private String idToken;
}

