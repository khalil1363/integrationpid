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
 * Implémentation simple qui envoie un email texte lorsque le compte est bloqué.
 */
@Service
@Slf4j
public class AccountStatusEmailServiceImpl implements AccountStatusEmailService {

    private static final String SENDER_NAME = "SlangEnglish";

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@example.com}")
    private String fromEmail;

    public AccountStatusEmailServiceImpl(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendAccountBlockedEmail(String toEmail, String fullName, String actorRole) {
        if (mailSender == null) {
            log.warn("SMTP non configuré : aucun email de blocage de compte envoyé (spring.mail.* manquant).");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail, SENDER_NAME);
            helper.setTo(toEmail);
            helper.setSubject("Votre compte SlangEnglish a été bloqué");

            String actor = actorRole != null ? actorRole.toLowerCase() : "administrateur";
            String body =
                    "Bonjour " + fullName + ",\n\n" +
                    "Votre compte sur la plateforme SlangEnglish a été bloqué par un " + actor + ".\n\n" +
                    "Vous ne pourrez plus vous connecter tant que votre compte reste bloqué.\n" +
                    "Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administration ou votre professeur.\n\n" +
                    "Cordialement,\n" +
                    "L'équipe SlangEnglish";

            helper.setText(body);
            mailSender.send(message);
            log.info("Email de blocage de compte envoyé à {} (SlangEnglish)", toEmail);
        } catch (MessagingException e) {
            log.error("Erreur envoi email de blocage de compte à {}: {}", toEmail, e.getMessage());
        } catch (Exception e) {
            log.error("Erreur envoi email de blocage de compte à {}: {}", toEmail, e.getMessage());
        }
    }
}

