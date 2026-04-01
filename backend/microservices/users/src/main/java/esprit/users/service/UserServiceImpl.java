package esprit.users.service;

import esprit.users.dto.SigninRequest;
import esprit.users.dto.SignupRequest;
import esprit.users.dto.UserProfileUpdateRequest;
import esprit.users.entity.Role;
import esprit.users.entity.Status;
import esprit.users.entity.User;
import esprit.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import javax.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final PasswordResetEmailService passwordResetEmailService;
    private final PasswordResetWhatsAppService passwordResetWhatsAppService;
    private final AccountStatusEmailService accountStatusEmailService;

    /** Bloque certains domaines d'email considérés comme non réels / de test. */
    private boolean isBlockedEmailDomain(String email) {
        if (email == null) {
            return true;
        }
        String[] parts = email.split("@");
        if (parts.length != 2) {
            return true;
        }
        String domain = parts[1].toLowerCase();
        return domain.equals("example.com")
                || domain.equals("exemple.com")
                || domain.equals("test.com")
                || domain.equals("test.fr")
                || domain.equals("mailinator.com")
                || domain.equals("tempmail.com")
                || domain.equals("yopmail.com");
    }

    @Override
    public User createUser(User user) {
        if (isBlockedEmailDomain(user.getEmail())) {
            throw new IllegalArgumentException("Le domaine de l'email n'est pas autorisé. Utilisez une adresse email réelle.");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email is already in use");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    /** Au moins 8 caractères, au moins une lettre et un chiffre. */
    private boolean isValidPasswordFormat(String password) {
        if (password == null || password.length() < 8) return false;
        return password.matches(".*[a-zA-Z].*") && password.matches(".*\\d.*");
    }

    @Override
    public User signup(SignupRequest request) {
        if (isBlockedEmailDomain(request.getEmail())) {
            throw new IllegalArgumentException("Le domaine de l'email n'est pas autorisé. Utilisez une adresse email réelle.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use");
        }
        if (!isValidPasswordFormat(request.getPassword())) {
            throw new IllegalArgumentException("Le mot de passe doit contenir au moins 8 caractères, des lettres et des chiffres.");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.toRoleEnum())
                .status(Status.ACTIVE)
                .phone(request.getPhone())
                .address(request.getAddress())
                .photoBase64(request.getPhotoBase64())
                .build();

        return userRepository.save(user);
    }

    @Override
    public User signin(SigninRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new EntityNotFoundException("Invalid email or password");
        }

        if (user.getStatus() == Status.INACTIVE) {
            throw new IllegalStateException("Compte bloqué. Contactez l'administrateur.");
        }

        return user;
    }

    @Override
    public User googleSignin(String idToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = UriComponentsBuilder
                    .fromHttpUrl("https://oauth2.googleapis.com/tokeninfo")
                    .queryParam("id_token", idToken)
                    .toUriString();

            String json = restTemplate.getForObject(url, String.class);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(json);

            String email = node.path("email").asText(null);
            String emailVerified = node.path("email_verified").asText("false");

            if (email == null || !"true".equalsIgnoreCase(emailVerified)) {
                throw new IllegalArgumentException("Google token invalide ou email non vérifié.");
            }

            String picture = node.path("picture").asText(null);

            return userRepository.findByEmail(email)
                    .map(existing -> {
                        if (existing.getStatus() == Status.INACTIVE) {
                            throw new IllegalStateException("Compte bloqué. Contactez l'administrateur.");
                        }
                        existing.setPhotoBase64(picture);
                        return userRepository.save(existing);
                    })
                    .orElseGet(() -> {
                        String givenName = node.path("given_name").asText("Google");
                        String familyName = node.path("family_name").asText("User");

                        User user = User.builder()
                                .firstName(givenName)
                                .lastName(familyName)
                                .email(email)
                                .password(passwordEncoder.encode("google-auth-" + email))
                                .role(Role.STUDENT)
                                .status(Status.ACTIVE)
                                .photoBase64(picture)
                                .build();
                        return userRepository.save(user);
                    });
        } catch (Exception e) {
            throw new IllegalArgumentException("Échec de la vérification Google : " + e.getMessage(), e);
        }
    }

    @Override
    public User facebookSignin(String accessToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = UriComponentsBuilder
                    .fromHttpUrl("https://graph.facebook.com/me")
                    .queryParam("fields", "id,first_name,last_name,email,picture.type(large)")
                    .queryParam("access_token", accessToken)
                    .toUriString();

            String json = restTemplate.getForObject(url, String.class);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(json);

            String email = node.path("email").asText(null);
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Impossible de récupérer l'email Facebook.");
            }

            return userRepository.findByEmail(email)
                    .map(existing -> {
                        if (existing.getStatus() == Status.INACTIVE) {
                            throw new IllegalStateException("Compte bloqué. Contactez l'administrateur.");
                        }
                        if (existing.getPhotoBase64() == null || existing.getPhotoBase64().isBlank()) {
                            JsonNode pictureNode = node.path("picture").path("data").path("url");
                            String pictureUrl = pictureNode.asText(null);
                            existing.setPhotoBase64(pictureUrl);
                            return userRepository.save(existing);
                        }
                        return existing;
                    })
                    .orElseGet(() -> {
                        String firstName = node.path("first_name").asText("Facebook");
                        String lastName = node.path("last_name").asText("User");
                        JsonNode pictureNode = node.path("picture").path("data").path("url");
                        String pictureUrl = pictureNode.asText(null);

                        User user = User.builder()
                                .firstName(firstName)
                                .lastName(lastName)
                                .email(email)
                                .password(passwordEncoder.encode("facebook-auth-" + email))
                                .role(Role.STUDENT)
                                .status(Status.ACTIVE)
                                .photoBase64(pictureUrl)
                                .build();
                        return userRepository.save(user);
                    });
        } catch (Exception e) {
            throw new IllegalArgumentException("Échec de la vérification Facebook : " + e.getMessage(), e);
        }
    }

    @Override
    public void requestPasswordReset(String email, String phone, String channel) {
        final String ch;
        if (channel == null || channel.isBlank()) {
            ch = "EMAIL";
        } else {
            ch = channel.trim().toUpperCase();
        }

        // Sélection de l'utilisateur en fonction du canal
        java.util.Optional<User> optionalUser;
        if ("WHATSAPP".equals(ch)) {
            if (phone == null || phone.isBlank()) {
                throw new IllegalArgumentException("Le numéro de téléphone est requis pour l'envoi par WhatsApp.");
            }
            optionalUser = userRepository.findByPhone(phone.trim());
        } else {
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("L'email est requis pour l'envoi par email.");
            }
            optionalUser = userRepository.findByEmail(email.trim());
        }

        optionalUser.ifPresent(user -> {
            String code = String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
            user.setResetToken(code);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            boolean sendEmail = "EMAIL".equals(ch) || "BOTH".equals(ch);
            boolean sendWhatsApp = "WHATSAPP".equals(ch) || "BOTH".equals(ch);

            if (sendEmail) {
                passwordResetEmailService.sendPasswordResetEmail(user.getEmail(), user.getResetToken());
            }

            if (sendWhatsApp && user.getPhone() != null && !user.getPhone().isBlank()) {
                passwordResetWhatsAppService.sendPasswordResetCode(user.getPhone(), user.getResetToken());
            }

            // Si canal WhatsApp : envoi aussi par email en secours (au cas où le message WhatsApp n'arrive pas)
            if (sendWhatsApp && user.getEmail() != null && !user.getEmail().isBlank()) {
                passwordResetEmailService.sendPasswordResetEmail(user.getEmail(), user.getResetToken());
            }
        });
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new EntityNotFoundException("Invalid password reset token"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Password reset token has expired");
        }
        if (!isValidPasswordFormat(newPassword)) {
            throw new IllegalArgumentException("Le mot de passe doit contenir au moins 8 caractères, des lettres et des chiffres.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    @Override
    public User updateUser(Long id, User user) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        existing.setFirstName(user.getFirstName());
        existing.setLastName(user.getLastName());
        existing.setRole(user.getRole());

        if (!existing.getEmail().equals(user.getEmail())) {
            if (isBlockedEmailDomain(user.getEmail())) {
                throw new IllegalArgumentException("Le domaine de l'email n'est pas autorisé. Utilisez une adresse email réelle.");
            }
            if (userRepository.existsByEmail(user.getEmail())) {
                throw new IllegalArgumentException("Email is already in use");
            }
            existing.setEmail(user.getEmail());
        }

        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            existing.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        return userRepository.save(existing);
    }

    @Override
    public User updateUserProfile(Long id, UserProfileUpdateRequest request) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        existing.setFirstName(request.getFirstName());
        existing.setLastName(request.getLastName());
        existing.setPhone(request.getPhone());
        existing.setAddress(request.getAddress());

        if (!existing.getEmail().equals(request.getEmail())) {
            if (isBlockedEmailDomain(request.getEmail())) {
                throw new IllegalArgumentException("Le domaine de l'email n'est pas autorisé. Utilisez une adresse email réelle.");
            }
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email is already in use");
            }
            existing.setEmail(request.getEmail());
        }

        // On ne modifie ni le rôle ni le mot de passe ici
        return userRepository.save(existing);
    }

    @Override
    public void deleteUser(Long id, Long adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Admin not found"));
        if (admin.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Seul un administrateur peut supprimer un utilisateur.");
        }

        User target = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (target.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Impossible de supprimer un administrateur.");
        }

        userRepository.delete(target);
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public List<User> searchUsers(String search, String role, String status) {
        Role r = (role == null || role.isBlank() || "all".equalsIgnoreCase(role)) ? null : Role.valueOf(role.trim().toUpperCase());
        Status s = (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) ? null : Status.valueOf(status.trim().toUpperCase());
        return userRepository.searchUsers(search == null ? "" : search.trim(), r, s);
    }

    @Override
    public User setUserStatus(Long userId, Long adminId, Status status) {
        User actor = userRepository.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Admin not found"));

        // ADMIN peut bloquer/débloquer tous les utilisateurs sauf les autres ADMIN.
        // TUTOR (prof) peut activer/désactiver uniquement les comptes STUDENT.
        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.TUTOR) {
            throw new IllegalArgumentException("Seul un administrateur ou un professeur peut modifier le statut d'un utilisateur.");
        }

        User target = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (target.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Impossible de bloquer un administrateur.");
        }

        if (actor.getRole() == Role.TUTOR && target.getRole() != Role.STUDENT) {
            throw new IllegalArgumentException("Un professeur ne peut activer/désactiver que les comptes des étudiants.");
        }

        target.setStatus(status);
        User saved = userRepository.save(target);

        // Si le compte vient d'être bloqué, envoyer un email d'information à l'utilisateur.
        if (status == Status.INACTIVE && saved.getEmail() != null && !saved.getEmail().isBlank()) {
            String fullName = (saved.getFirstName() == null ? "" : saved.getFirstName()) +
                    " " +
                    (saved.getLastName() == null ? "" : saved.getLastName());
            accountStatusEmailService.sendAccountBlockedEmail(
                    saved.getEmail(),
                    fullName.trim(),
                    actor.getRole().name()
            );
        }

        return saved;
    }
}

