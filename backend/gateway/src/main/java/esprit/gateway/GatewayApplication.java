package esprit.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableDiscoveryClient
public class GatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
    @Bean
    public RouteLocator gatewayRoutes(
            RouteLocatorBuilder builder,
            @Value("${notebook.gateway.uri:http://localhost:8030}") String notebookGatewayUri) {
        return builder.routes()
                .route("user", r -> r.path("/user/**")
                        .uri("lb://user"))
                .route("evaluation", r -> r.path("/evaluation/**")
                        .uri("lb://evaluation"))
                // Serve uploaded files (photo, PDF) so frontend can display them
                .route("evaluation-uploads", r -> r.path("/uploads/**")
                        .uri("lb://evaluation"))
                // Notebook: default direct URL so it works even if Eureka has no "notebook" instance yet.
                .route("notebook", r -> r.path("/notebook/**")
                        .uri(notebookGatewayUri))
                .build();
    }
}
