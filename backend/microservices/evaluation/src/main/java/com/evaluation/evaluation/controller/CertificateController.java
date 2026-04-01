package com.evaluation.evaluation.controller;

import com.evaluation.evaluation.dto.CertificateEligibilityResponse;
import com.evaluation.evaluation.service.EvaluationAttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/evaluation/certificate")
@RequiredArgsConstructor
public class CertificateController {

    private final EvaluationAttemptService evaluationAttemptService;

    @GetMapping("/eligibility/{userId}")
    public ResponseEntity<CertificateEligibilityResponse> getEligibility(@PathVariable Long userId) {
        return ResponseEntity.ok(evaluationAttemptService.getCertificateEligibility(userId));
    }
}
