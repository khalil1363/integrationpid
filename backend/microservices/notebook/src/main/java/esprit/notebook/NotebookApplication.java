package esprit.notebook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class NotebookApplication {
    public static void main(String[] args) {
        SpringApplication.run(NotebookApplication.class, args);
    }
}
