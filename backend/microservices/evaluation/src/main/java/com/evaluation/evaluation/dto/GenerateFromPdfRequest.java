package com.evaluation.evaluation.dto;

import lombok.Data;

@Data
public class GenerateFromPdfRequest {
    private Long evaluationId;
    private String pdfUrl;
    private String instructions;
    private Double pointsPerQuestion;
}
