package esprit.notebook.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class AppConfig {

    @Bean
    @Primary
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(30))
                .build();
    }

    /** Longer timeouts for local Ollama (same API shape as evaluation service). */
    @Bean
    @Qualifier("ollamaRestTemplate")
    public RestTemplate ollamaRestTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(15))
                .setReadTimeout(Duration.ofSeconds(120))
                .build();
    }
}
