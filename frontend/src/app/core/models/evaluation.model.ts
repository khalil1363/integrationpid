export interface Evaluation {
  id?: number;
  title: string;
  imageUrl?: string;
  dateStart: string;
  dateEnd: string;
  durationMinutes: number;
  numberOfAttempts: number;
  totalScore: number;
  /** When true, this evaluation counts as one of the 5 required for the certificate. */
  certificateEvaluation?: boolean;
  questions?: Question[];
  attempts?: EvaluationAttempt[];
}

export interface Question {
  id?: number;
  questionText: string;
  points: number;
  questionType: 'MCQ' | 'MSQ' | 'FILL_BLANK' | 'READING' | 'WRITING';
  questionOrder: number;
  evaluationId?: number;
  options?: Option[];
  blanks?: Blank[];
  paragraphText?: string;
  instructions?: string;
  pdfUrl?: string;
  subject?: string;
  maxWords?: number;
}

export interface Option {
  id?: number;
  optionText: string;
  isCorrect: boolean;
}

export interface Blank {
  id?: number;
  correctWord: string;
  positionIndex: number;
}

export interface EvaluationAttempt {
  id: number;
  userId: number;
  startTime: string;
  endTime?: string;
  score?: number;
  /** Max possible score (e.g. 100) so results show "score / maxScore". */
  maxScore?: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  attemptNumber: number;
  studentAnswers?: StudentAnswer[];
  evaluation?: Evaluation;
}

export interface StudentAnswer {
  id?: number;
  textAnswer?: string;
  scoreAwarded?: number;
  question?: Question;
  selectedOptions?: Option[];
}

export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
}
