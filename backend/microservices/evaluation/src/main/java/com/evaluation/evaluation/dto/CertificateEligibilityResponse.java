package com.evaluation.evaluation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificateEligibilityResponse {
    private boolean eligible;
    private int passedCount;
    /** Titles of the evaluations the user passed (≥50%); used on the certificate. */
    private List<String> passedEvaluationTitles;
    /** Average score (0–100) across best attempt per passed evaluation; used for level. */
    private Double certificateScore;
    /** Level A1–C2 based on certificateScore: 0–39 A1, 40–54 A2, 55–69 B1, 70–83 B2, 84–91 C1, 92–100 C2. */
    private String level;
}
