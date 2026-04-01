package com.evaluation.evaluation.repository;

import com.evaluation.evaluation.model.WritingQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WritingQuestionRepository extends JpaRepository<WritingQuestion, Long> {
    List<WritingQuestion> findByEvaluationId(Long evaluationId);
}
