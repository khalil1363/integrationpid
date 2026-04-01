package com.evaluation.evaluation.repository;

import com.evaluation.evaluation.model.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {

    /** Load evaluation with all questions (e.g. all 10 Reading questions) for take-evaluation / frontoffice. */
    @Query("SELECT DISTINCT e FROM Evaluation e LEFT JOIN FETCH e.questions q WHERE e.id = :id")
    Optional<Evaluation> findByIdWithQuestions(@Param("id") Long id);
}
