package com.evaluation.evaluation.repository;

import com.evaluation.evaluation.model.ReadingQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadingQuestionRepository extends JpaRepository<ReadingQuestion, Long> {
    /** Use evaluation.id (evaluationId is @Transient on Question). */
    List<ReadingQuestion> findByEvaluation_Id(Long evaluationId);
}
