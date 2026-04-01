package esprit.users.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecaptchaVerificationServiceImpl implements RecaptchaVerificationService {

    private static final String VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.recaptcha.secret-key:}")
    private String secretKey;

    @Override
    public boolean verify(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        if (secretKey == null || secretKey.isBlank()) {
            log.warn("reCAPTCHA secret key not configured; skipping verification");
            return true;
        }
        try {
            org.springframework.util.LinkedMultiValueMap<String, String> params = new org.springframework.util.LinkedMultiValueMap<>();
            params.add("secret", secretKey);
            params.add("response", token);
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);
            org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, String>> request = new org.springframework.http.HttpEntity<>(params, headers);
            ResponseEntity<RecaptchaResponse> response = restTemplate.postForEntity(VERIFY_URL, request, RecaptchaResponse.class);
            if (response.getBody() != null && Boolean.TRUE.equals(response.getBody().getSuccess())) {
                return true;
            }
            log.debug("reCAPTCHA verification failed: {}", response.getBody());
            return false;
        } catch (Exception e) {
            log.error("reCAPTCHA verification error: {}", e.getMessage());
            return false;
        }
    }

    @Data
    private static class RecaptchaResponse {
        private Boolean success;
        @JsonProperty("challenge_ts")
        private String challengeTs;
        private String hostname;
        @JsonProperty("error-codes")
        private String[] errorCodes;
    }
}
