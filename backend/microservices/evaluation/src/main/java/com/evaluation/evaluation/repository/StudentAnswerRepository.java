package com.evaluation.evaluation.repository;

import com.evaluation.evaluation.model.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, Long> {
    List<StudentAnswer> findByEvaluationAttemptId(Long attemptId);
}
