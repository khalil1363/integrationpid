package esprit.users.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Implémentation basée sur l'API Cloud WhatsApp (Meta).
 *
 * Configuration dans application.properties :
 * - slang.whatsapp.enabled=true
 * - slang.whatsapp.token=EA...
 * - slang.whatsapp.phone-number-id=1234567890
 * - slang.whatsapp.default-country-code=216 (optionnel, pour numéros commençant par 0)
 *
 * Important : avec l'API Cloud, un message texte libre n'est possible que si l'utilisateur
 * vous a envoyé un message dans les 24 dernières heures. Sinon, il faut utiliser un
 * template approuvé par Meta (voir doc WhatsApp Business).
 */
@Service
@Slf4j
public class PasswordResetWhatsAppServiceImpl implements PasswordResetWhatsAppService {

    @Value("${slang.whatsapp.enabled:false}")
    private boolean enabled;

    @Value("${slang.whatsapp.token:}")
    private String accessToken;

    @Value("${slang.whatsapp.phone-number-id:}")
    private String phoneNumberId;

    /** Code pays par défaut si le numéro commence par 0 (ex: 216 pour Tunisie). */
    @Value("${slang.whatsapp.default-country-code:216}")
    private String defaultCountryCode;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Normalise le numéro pour l'API WhatsApp : chiffres uniquement, format international.
     * Ex: 0612345678 -> 216612345678 ; 94689514 -> 21694689514 (8 chiffres = Tunisie)
     */
    private String normalizePhoneForWhatsApp(String phone) {
        if (phone == null || phone.isBlank()) return phone;
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) return phone;
        if (defaultCountryCode == null || defaultCountryCode.isEmpty()) return digits;
        // Numéro local commençant par 0 : 0612345678 -> 216612345678
        if (digits.startsWith("0")) {
            digits = defaultCountryCode + digits.substring(1);
        } else if (!digits.startsWith(defaultCountryCode)) {
            // 8 chiffres sans indicatif (ex: 94689514) = format local Tunisie -> 21694689514
            int len = digits.length();
            if (len == 8 || (len == 9 && digits.startsWith("9"))) {
                digits = defaultCountryCode + digits;
            }
        }
        return digits;
    }

    @Override
    public void sendPasswordResetCode(String phoneNumber, String resetToken) {
        if (!enabled) {
            log.info("WhatsApp reset disabled (slang.whatsapp.enabled=false). Aucun message envoyé.");
            return;
        }

        if (phoneNumber == null || phoneNumber.isBlank()) {
            log.warn("Impossible d'envoyer le code WhatsApp : numéro de téléphone manquant.");
            return;
        }

        if (accessToken == null || accessToken.isBlank() || phoneNumberId == null || phoneNumberId.isBlank()) {
            log.error("Configuration WhatsApp manquante (token ou phone-number-id). Aucun message envoyé.");
            return;
        }

        String toNumber = normalizePhoneForWhatsApp(phoneNumber);
        log.info("Envoi WhatsApp vers numéro normalisé: {} (original: {})", toNumber, phoneNumber);

        try {
            String url = "https://graph.facebook.com/v19.0/" + phoneNumberId + "/messages";

            Map<String, Object> text = new HashMap<>();
            text.put("preview_url", false);
            text.put("body",
                    "SlangEnglish - Réinitialisation de mot de passe\n\n" +
                    "Votre code à 6 chiffres (valide 1 heure) : " + resetToken + "\n\n" +
                    "Saisissez ce code dans l'écran \"Mot de passe oublié\" pour choisir un nouveau mot de passe.");

            Map<String, Object> body = new HashMap<>();
            body.put("messaging_product", "whatsapp");
            body.put("recipient_type", "individual");
            body.put("to", toNumber);
            body.put("type", "text");
            body.put("text", text);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Code de réinitialisation envoyé par WhatsApp à {} (réponse: {})", toNumber, response.getBody());
            } else {
                log.error("Échec envoi WhatsApp vers {} : status={} body={}", toNumber,
                        response.getStatusCode(), response.getBody());
            }
        } catch (HttpClientErrorException e) {
            // 400 "Recipient not in allowed list" = en mode dev, ajouter le numéro dans Meta Developer Console
            log.error("WhatsApp API erreur vers {} : {} - {}", toNumber, e.getStatusCode(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du code par WhatsApp à {} : {}", toNumber, e.getMessage(), e);
        }
    }
}

