package com.evaluation.evaluation.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Resolves the upload directory so both upload and generate-from-pdf use the same path
 * (avoids 500 when run from different working directories, e.g. project root vs module).
 */
@Component
public class UploadPathConfig {

    @Value("${app.upload.dir:uploads}")
    private String uploadDirConfig;

    private Path resolvedUploadDir;

    @PostConstruct
    public void init() {
        Path cwd = Paths.get(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        Path configured = Paths.get(uploadDirConfig);
        Path configuredAbs = configured.isAbsolute() ? configured.normalize() : cwd.resolve(configured).normalize();

        // If an absolute path is configured, always prefer it (deterministic across machines/run dirs).
        if (configured.isAbsolute() && (Files.exists(configuredAbs) || (configuredAbs.getParent() != null && Files.exists(configuredAbs.getParent())))) {
            resolvedUploadDir = configuredAbs;
            return;
        }

        // Prefer a real "<repo>/frontend/uploads" if it exists anywhere above the current working dir.
        // This keeps uploads in the Angular project's uploads folder even when the microservice is run
        // from ".../backend/microservices/evaluation".
        Path repoFrontendUploads = findRepoFrontendUploads(cwd);
        if (repoFrontendUploads != null) {
            resolvedUploadDir = repoFrontendUploads;
            return;
        }

        // Otherwise, use the configured path if it is plausible (existing directory OR parent exists so it can be created).
        if (Files.exists(configuredAbs) || (configuredAbs.getParent() != null && Files.exists(configuredAbs.getParent()))) {
            resolvedUploadDir = configuredAbs;
            return;
        }

        // Last resort: "<cwd>/uploads"
        resolvedUploadDir = cwd.resolve("uploads").normalize();
    }

    public Path getUploadDir() {
        return resolvedUploadDir;
    }

    public Path resolve(String filename) {
        return resolvedUploadDir.resolve(filename);
    }

    private static Path findRepoFrontendUploads(Path start) {
        Path current = start;
        // prevent infinite loop; repo isn't expected to be deeper than this
        for (int i = 0; i < 20 && current != null; i++) {
            // Only accept a repo root that looks like this project:
            //   <root>/backend
            //   <root>/frontend/src
            // This avoids accidentally picking "<some parent>/frontend/uploads" from a different workspace.
            Path backendDir = current.resolve("backend");
            Path frontendSrcDir = current.resolve("frontend").resolve("src");
            if (Files.isDirectory(backendDir) && Files.isDirectory(frontendSrcDir)) {
                return current.resolve("frontend").resolve("uploads").toAbsolutePath().normalize();
            }
            current = current.getParent();
        }
        return null;
    }
}
