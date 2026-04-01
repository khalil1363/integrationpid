package esprit.users.service;

/**
 * Envoi d'un email d'information lorsque le statut du compte change
 * (par exemple quand un compte étudiant est bloqué par un admin / tuteur).
 */
public interface AccountStatusEmailService {

    /**
     * Notifie l'utilisateur que son compte a été bloqué.
     *
     * @param toEmail email du compte bloqué
     * @param fullName nom complet de l'utilisateur
     * @param actorRole rôle de la personne qui a bloqué (ADMIN ou TUTOR)
     */
    void sendAccountBlockedEmail(String toEmail, String fullName, String actorRole);
}

