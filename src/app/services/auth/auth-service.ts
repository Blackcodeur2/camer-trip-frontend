import { Injectable, signal } from '@angular/core';
import { User } from '../../models/user';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

export interface AuthResponse {
  data: {
    user: User;
    token?: string;
    access_token?: string;
  };

}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API = environment.apiUrl;

  public readonly currentUser = signal<User | null>(this.getUserFromStorage());

  constructor(private http: HttpClient) { }

  login(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, data).pipe(
      tap(response => {
        const token = response.data.token || response.data.access_token;
        if (token && response.data.user) {
          this.saveSession(response.data.user, token);
        }
      })
    );
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register`, data).pipe(
      tap(response => {
        const token = response.data.token || response.data.access_token;
        if (token && response.data.user) {
          this.saveSession(response.data.user, token);
        }
      })
    );
  }

  saveSession(user: User, token: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', user.role_user);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  forgotPassword(data: { email: string }): Observable<any> {
    return this.http.post(`${this.API}/forgot-password`, data);
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.API}/reset-password`, data);
  }

  changePassword(data: any): Observable<any> {
    return this.http.post(`${this.API}/change-password`, data);
  }

  updateProfile(data: FormData): Observable<any> {
    return this.http.post<any>(`${this.API}/user/update-profile`, data).pipe(
      tap(response => {
        if (response && response.data) {
          const user = response.data;
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUser.set(user);
        }
      })
    );
  }


  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }


  fetchUser(): Observable<User> {
    return this.http.get<any>(`${this.API}/user`).pipe(
      map(response => {
        // L'API peut retourner soit User directement, soit { data: User } ou { data: User[] }
        let user: User;
        if (response && response.data) {
          // Réponse enveloppée : { data: User } ou { data: User[] }
          user = Array.isArray(response.data) ? response.data[0] : response.data;
        } else {
          // Réponse directe : User
          user = response;
        }
        return user;
      }),
      tap(user => {
        if (user && user.id) {
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUser.set(user);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.API}/logout`, {}).pipe(
      tap({
        next: () => this.clearSession(),
        error: () => this.clearSession()
      })
    );
  }

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): string | null {
    const user = this.currentUser();
    return user ? user.role_user : localStorage.getItem('role');
  }
}
