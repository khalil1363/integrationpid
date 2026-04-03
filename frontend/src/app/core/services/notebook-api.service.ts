import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NOTEBOOK_API_URL } from '../../api.config';

export interface NotebookNote {
  id?: number;
  userId: number;
  title: string;
  content: string;
  shareScore?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GrammarResult {
  correctedText: string;
  issuesFixed: number;
  /** 'ollama' | 'languagetool' */
  source?: string | null;
}

export interface DictionaryResult {
  word: string;
  meanings: string[];
  phonetic?: string | null;
  aiExplanation?: string | null;
}

export interface SummaryResult {
  summary: string;
  originalWordCount: number;
  summaryWordCount: number;
  /** 'ollama' | 'extractive' */
  source?: string | null;
}

export interface WordCountRow {
  word: string;
  count: number;
}

export interface NotebookDashboard {
  bestNoteToShare: NotebookNote | null;
  mostUsedWords: WordCountRow[];
}

@Injectable({ providedIn: 'root' })
export class NotebookApiService {
  private readonly base = NOTEBOOK_API_URL;

  constructor(private http: HttpClient) {}

  listNotes(userId: number): Observable<NotebookNote[]> {
    return this.http.get<NotebookNote[]>(`${this.base}/notes`, { params: { userId: String(userId) } });
  }

  createNote(userId: number, title: string, content: string): Observable<NotebookNote> {
    return this.http.post<NotebookNote>(`${this.base}/notes`, { userId, title, content });
  }

  updateNote(userId: number, id: number, title: string, content: string): Observable<NotebookNote> {
    return this.http.put<NotebookNote>(`${this.base}/notes/${id}`, { userId, title, content });
  }

  deleteNote(userId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/notes/${id}`, { params: { userId: String(userId) } });
  }

  dashboard(userId: number): Observable<NotebookDashboard> {
    return this.http.get<NotebookDashboard>(`${this.base}/dashboard`, { params: { userId: String(userId) } });
  }

  grammar(text: string): Observable<GrammarResult> {
    return this.http.post<GrammarResult>(`${this.base}/ai/grammar`, { text });
  }

  dictionary(word: string, context?: string): Observable<DictionaryResult> {
    return this.http.post<DictionaryResult>(`${this.base}/ai/dictionary`, { word, context });
  }

  summarize(text: string): Observable<SummaryResult> {
    return this.http.post<SummaryResult>(`${this.base}/ai/summarize`, { text });
  }
}
