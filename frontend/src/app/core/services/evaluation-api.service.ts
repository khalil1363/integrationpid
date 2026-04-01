import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Evaluation, Question, Option, Blank, EvaluationAttempt, StudentAnswer, User } from '../models';
import { EVALUATION_API_URL } from '../../api.config';

export interface CertificateEligibilityResponse {
  eligible: boolean;
  passedCount: number;
  passedEvaluationTitles?: string[];
  certificateScore?: number;
  level?: string;
}

@Injectable({ providedIn: 'root' })
export class EvaluationApiService {

  constructor(private http: HttpClient) {}

  getEvaluations(): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(`${EVALUATION_API_URL}/evaluations`);
  }

  getEvaluation(id: number): Observable<Evaluation> {
    return this.http.get<Evaluation>(`${EVALUATION_API_URL}/evaluations/${id}`);
  }

  /** Upload evaluation image; file is saved in backend uploads folder, returns URL for database. */
  uploadEvaluationImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<{ url: string }>(`${EVALUATION_API_URL}/evaluations/upload-image`, formData);
  }

  /** Upload PDF for Reading question; file is saved in backend uploads folder, returns URL for database. */
  uploadReadingPdf(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<{ url: string }>(`${EVALUATION_API_URL}/evaluations/upload-pdf`, formData);
  }

  createEvaluation(e: Partial<Evaluation>): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${EVALUATION_API_URL}/evaluations`, e);
  }

  updateEvaluation(id: number, e: Partial<Evaluation>): Observable<Evaluation> {
    return this.http.put<Evaluation>(`${EVALUATION_API_URL}/evaluations/${id}`, e);
  }

  deleteEvaluation(id: number): Observable<void> {
    return this.http.delete<void>(`${EVALUATION_API_URL}/evaluations/${id}`);
  }

  getAvailableForUser(userId: number): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(`${EVALUATION_API_URL}/evaluations/available/user/${userId}`);
  }

  startAttempt(evaluationId: number, userId: number): Observable<EvaluationAttempt> {
    return this.http.post<EvaluationAttempt>(`${EVALUATION_API_URL}/attempts/start/${evaluationId}?userId=${userId}`, {});
  }

  submitAnswer(attemptId: number, questionId: number, body: { textAnswer?: string; selectedOptions?: { id: number }[] }): Observable<EvaluationAttempt> {
    return this.http.post<EvaluationAttempt>(`${EVALUATION_API_URL}/attempts/${attemptId}/submit-answer/${questionId}`, body);
  }

  finishAttempt(attemptId: number): Observable<EvaluationAttempt> {
    return this.http.post<EvaluationAttempt>(`${EVALUATION_API_URL}/attempts/${attemptId}/finish`, {});
  }

  /** Finish attempt with 0 score when student leaves tab/browser (anti-cheating). */
  finishAttemptWithZero(attemptId: number): Observable<EvaluationAttempt> {
    return this.http.post<EvaluationAttempt>(`${EVALUATION_API_URL}/attempts/${attemptId}/finish-with-zero`, {});
  }

  getAttempt(attemptId: number): Observable<EvaluationAttempt> {
    return this.http.get<EvaluationAttempt>(`${EVALUATION_API_URL}/attempts/${attemptId}`);
  }

  getAttemptsByUserAndEvaluation(userId: number, evaluationId: number): Observable<EvaluationAttempt[]> {
    return this.http.get<EvaluationAttempt[]>(`${EVALUATION_API_URL}/attempts/user/${userId}/evaluation/${evaluationId}`);
  }

  getAttemptsByEvaluation(evaluationId: number): Observable<EvaluationAttempt[]> {
    return this.http.get<EvaluationAttempt[]>(`${EVALUATION_API_URL}/attempts/evaluation/${evaluationId}`);
  }

  updateAnswerScore(answerId: number, score: number): Observable<StudentAnswer> {
    return this.http.put<StudentAnswer>(`${EVALUATION_API_URL}/attempts/answer/${answerId}/score`, { score });
  }

  addMCQQuestion(question: Partial<Question> & { evaluationId: number; options: Option[] }): Observable<Question> {
    return this.http.post<Question>(`${EVALUATION_API_URL}/mcq-questions`, { ...question, questionType: 'MCQ' });
  }

  addMSQQuestion(question: Partial<Question> & { evaluationId: number; options: Option[] }): Observable<Question> {
    return this.http.post<Question>(`${EVALUATION_API_URL}/msq-questions`, { ...question, questionType: 'MSQ' });
  }

  addFillBlankQuestion(question: Partial<Question> & { evaluationId: number; paragraphText: string; blanks: Blank[] }): Observable<Question> {
    return this.http.post<Question>(`${EVALUATION_API_URL}/fillblank-questions`, { ...question, questionType: 'FILL_BLANK' });
  }

  addReadingQuestion(question: Partial<Question> & { evaluationId: number; instructions?: string; pdfUrl?: string }): Observable<Question> {
    return this.http.post<Question>(`${EVALUATION_API_URL}/reading-questions`, { ...question, questionType: 'READING' });
  }

  /** Generate 10 Reading questions from PDF using AI (Ollama, free). Requires PDF uploaded and Ollama running locally. */
  generateReadingQuestionsFromPdf(params: { evaluationId: number; pdfUrl: string; instructions?: string; pointsPerQuestion?: number }): Observable<Question[]> {
    return this.http.post<Question[]>(`${EVALUATION_API_URL}/reading-questions/generate-from-pdf`, {
      evaluationId: params.evaluationId,
      pdfUrl: params.pdfUrl,
      instructions: params.instructions ?? '',
      pointsPerQuestion: params.pointsPerQuestion ?? 2
    });
  }

  addWritingQuestion(question: Partial<Question> & { evaluationId: number; subject?: string; maxWords?: number }): Observable<Question> {
    return this.http.post<Question>(`${EVALUATION_API_URL}/writing-questions`, { ...question, questionType: 'WRITING' });
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${EVALUATION_API_URL}/users`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${EVALUATION_API_URL}/users/${id}`);
  }

  getCertificateEligibility(userId: number): Observable<CertificateEligibilityResponse> {
    return this.http.get<CertificateEligibilityResponse>(`${EVALUATION_API_URL}/certificate/eligibility/${userId}`);
  }
}
