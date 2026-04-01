import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';

export type Role = 'ADMIN' | 'TUTOR' | 'STUDENT' | 'CLUB_MANAGER' | 'EMPLOYEE';

export type Status = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: Role;
  status?: Status;
  photoBase64?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  joinDate?: string;
  lastActive?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly apiUrl = `${API_URL}/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  /** Recherche dynamique : search (nom, prénom, email), role, status (null/'all' = tous). */
  search(params: { search?: string; role?: string; status?: string }): Observable<User[]> {
    const q = new URLSearchParams();
    if (params.search != null && params.search.trim() !== '') q.set('search', params.search.trim());
    if (params.role != null && params.role !== 'all') q.set('role', params.role);
    if (params.status != null && params.status !== 'all') q.set('status', params.status);
    const query = q.toString();
    const url = query ? `${this.apiUrl}?${query}` : this.apiUrl;
    return this.http.get<User[]>(url);
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  create(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  update(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  updateProfile(id: number, data: Pick<User, 'firstName' | 'lastName' | 'email' | 'phone' | 'address'>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/profile`, data);
  }

  delete(id: number, adminId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      params: { adminId: adminId.toString() }
    });
  }

  /** Bloque ou débloque un utilisateur (réservé à l'admin). */
  setStatus(userId: number, adminId: number, status: Status): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}/status`, { adminId, status });
  }
}

