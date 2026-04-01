import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { API_URL } from '../api.config';
import type { Role } from './user.service';

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  photoBase64?: string;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  address?: string;
  photoBase64?: string;
  recaptchaToken: string;
}

export interface SigninPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email?: string;
  phone?: string;
  /** Canal : 'EMAIL' ou 'WHATSAPP' (optionnel, défaut EMAIL) */
  channel?: 'EMAIL' | 'WHATSAPP';
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface GoogleSigninPayload {
  idToken: string;
}

export interface FacebookSigninPayload {
  accessToken: string;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = `${API_URL}/auth`;

  // Simple in-memory current user (pas de localStorage pour éviter les erreurs SSR)
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private setCurrentUser(user: AuthUser | null): void {
    this.currentUserSubject.next(user);
  }

  signup(payload: SignupPayload): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.apiUrl}/signup`, payload).pipe(
      tap(user => this.setCurrentUser(user))
    );
  }

  signin(payload: SigninPayload): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.apiUrl}/signin`, payload).pipe(
      tap(user => this.setCurrentUser(user))
    );
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, payload);
  }

  googleSignin(idToken: string): Observable<AuthUser> {
    const body: GoogleSigninPayload = { idToken };
    return this.http.post<AuthUser>(`${this.apiUrl}/google-signin`, body).pipe(
      tap(user => this.setCurrentUser(user))
    );
  }

  facebookSignin(accessToken: string): Observable<AuthUser> {
    const body: FacebookSigninPayload = { accessToken };
    return this.http.post<AuthUser>(`${this.apiUrl}/facebook-signin`, body).pipe(
      tap(user => this.setCurrentUser(user))
    );
  }

  signout(): void {
    this.setCurrentUser(null);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  getLoginTime(): string | null {
    return null;
  }
}

