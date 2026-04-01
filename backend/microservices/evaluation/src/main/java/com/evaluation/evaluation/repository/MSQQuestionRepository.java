package com.evaluation.evaluation.repository;

import com.evaluation.evaluation.model.MSQQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MSQQuestionRepository extends JpaRepository<MSQQuestion, Long> {
    List<MSQQuestion> findByEvaluationId(Long evaluationId);
}
