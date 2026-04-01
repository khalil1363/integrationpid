package com.evaluation.evaluation.repository;

import com.evaluation.evaluation.model.MCQQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MCQQuestionRepository extends JpaRepository<MCQQuestion, Long> {
    List<MCQQuestion> findByEvaluationId(Long evaluationId);
}
