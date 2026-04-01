package com.evaluation.evaluation.repository;

import com.evaluation.evaluation.model.FillBlankQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FillBlankQuestionRepository extends JpaRepository<FillBlankQuestion, Long> {
    List<FillBlankQuestion> findByEvaluationId(Long evaluationId);
}
