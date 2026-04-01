package com.evaluation.evaluation.repository;

import com.evaluation.evaluation.model.EvaluationAttempt;
import com.evaluation.evaluation.enums.AttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationAttemptRepository extends JpaRepository<EvaluationAttempt, Long> {
    List<EvaluationAttempt> findByUserIdAndEvaluationId(Long userId, Long evaluationId);
    List<EvaluationAttempt> findByEvaluationId(Long evaluationId);

    @Query("SELECT a FROM EvaluationAttempt a JOIN FETCH a.evaluation WHERE a.userId = :userId AND a.status = :status")
    List<EvaluationAttempt> findByUserIdAndStatusWithEvaluation(@Param("userId") Long userId, @Param("status") AttemptStatus status);
}
