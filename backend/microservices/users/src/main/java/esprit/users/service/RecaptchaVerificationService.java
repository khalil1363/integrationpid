package esprit.users.service;

/**
 * Vérification du token reCAPTCHA côté serveur (preuve que l'utilisateur est humain).
 */
public interface RecaptchaVerificationService {

    /**
     * Vérifie le token reCAPTCHA auprès de Google.
     *
     * @param token token renvoyé par le widget reCAPTCHA côté client
     * @return true si la vérification réussit (utilisateur humain)
     */
    boolean verify(String token);
}
