package esprit.users.service;

/**
 * Envoi du code de réinitialisation de mot de passe par WhatsApp.
 */
public interface PasswordResetWhatsAppService {

    /**
     * Envoie un message WhatsApp contenant le code de réinitialisation.
     *
     * @param phoneNumber numéro de téléphone au format international (ex: 216XXXXXXXX)
     * @param resetToken  code à 6 chiffres (valide 1h)
     */
    void sendPasswordResetCode(String phoneNumber, String resetToken);
}

