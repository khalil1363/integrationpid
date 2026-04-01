package esprit.users.service;

/**
 * Envoi de l'email de confirmation pour réinitialisation du mot de passe.
 * Le lien dans l'email permet à l'utilisateur de confirmer et de saisir son nouveau mot de passe.
 */
public interface PasswordResetEmailService {

    /**
     * Envoie un email contenant le lien de réinitialisation du mot de passe.
     *
     * @param toEmail destinataire (email de l'utilisateur)
     * @param resetToken token à inclure dans l'URL du lien (valide 1h)
     */
    void sendPasswordResetEmail(String toEmail, String resetToken);
}
