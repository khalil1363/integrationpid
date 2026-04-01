package esprit.users.controller;

import esprit.users.dto.*;
import esprit.users.entity.User;
import esprit.users.service.RecaptchaVerificationService;
import esprit.users.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/user/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final UserService userService;
    private final RecaptchaVerificationService recaptchaVerificationService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest request) {
        if (!recaptchaVerificationService.verify(request.getRecaptchaToken())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Vérification « I'm not a robot » échouée. Cochez la case et réessayez."));
        }
        User created = userService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.fromEntity(created));
    }

    @PostMapping("/signin")
    public ResponseEntity<UserResponse> signin(@Valid @RequestBody SigninRequest request) {
        User user = userService.signin(request);
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        userService.requestPasswordReset(request.getEmail(), request.getPhone(), request.getResolvedChannel());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/google-signin")
    public ResponseEntity<UserResponse> googleSignin(@Valid @RequestBody GoogleSigninRequest request) {
        User user = userService.googleSignin(request.getIdToken());
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    @PostMapping("/facebook-signin")
    public ResponseEntity<UserResponse> facebookSignin(@Valid @RequestBody FacebookSigninRequest request) {
        User user = userService.facebookSignin(request.getAccessToken());
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }
}

