package com.evaluation.evaluation.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final UploadPathConfig uploadPathConfig;

    public WebMvcConfig(UploadPathConfig uploadPathConfig) {
        this.uploadPathConfig = uploadPathConfig;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve from same directory as upload controller so saved files are reachable
        String uploadsPath = uploadPathConfig.getUploadDir().toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadsPath + "/");
    }
}
