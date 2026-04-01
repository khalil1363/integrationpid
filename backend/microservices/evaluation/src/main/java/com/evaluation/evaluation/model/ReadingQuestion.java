package com.evaluation.evaluation.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "reading_questions")
public class ReadingQuestion extends Question {

    private String pdfUrl;

    @Column(columnDefinition = "TEXT")
    private String instructions;
}
