package esprit.users.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;

/**
 * Envoie l'email de réinitialisation (expéditeur SlangEnglish, code sans URL).
 */
@Service
@Slf4j
public class PasswordResetEmailServiceImpl implements PasswordResetEmailService {

    private static final String SENDER_NAME = "SlangEnglish";

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@example.com}")
    private String fromEmail;

    public PasswordResetEmailServiceImpl(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        if (mailSender != null) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
                helper.setFrom(fromEmail, SENDER_NAME);
                helper.setTo(toEmail);
                helper.setSubject("Réinitialisation de votre mot de passe - SlangEnglish");
                helper.setText(
                    "Bonjour,\n\n"
                    + "Vous avez demandé la réinitialisation de votre mot de passe.\n\n"
                    + "Votre code de réinitialisation à 6 chiffres (valide 1 heure) :\n\n"
                    + "  " + resetToken + "\n\n"
                    + "Ouvrez l'application SlangEnglish, allez sur « Réinitialiser le mot de passe », saisissez ce code ainsi que votre nouveau mot de passe et sa confirmation.\n\n"
                    + "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\n"
                    + "Cordialement,\nSlangEnglish"
                );
                mailSender.send(message);
                log.info("Email de réinitialisation envoyé à {} (SlangEnglish)", toEmail);
            } catch (MessagingException e) {
                log.error("Erreur envoi email à {}: {}", toEmail, e.getMessage());
                throw new RuntimeException("Impossible d'envoyer l'email de réinitialisation. Réessayez plus tard.");
            } catch (Exception e) {
                log.error("Erreur envoi email à {}: {}", toEmail, e.getMessage());
                throw new RuntimeException("Impossible d'envoyer l'email de réinitialisation. Réessayez plus tard.");
            }
        } else {
            // SMTP non configuré : on log juste un warning, mais on ne bloque pas la requête.
            log.warn("SMTP non configuré : aucun email de réinitialisation envoyé (spring.mail.* manquant).");
        }
    }
}
