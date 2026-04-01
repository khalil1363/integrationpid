package com.evaluation.evaluation.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "writing_questions")
public class WritingQuestion extends Question {

    private String subject;

    private Integer maxWords;
}
