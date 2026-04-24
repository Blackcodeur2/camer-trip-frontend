import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';

export interface DocumentKYC {
  id: number;
  user_id: number;
  type: string;
  chemin_fichier: string;
  statut: string;
  commentaire?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: User;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAgences(): Observable<any[]> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.API}/admin/agences`).pipe(
      map(response => response.data)
    );
  }

  getUsers(): Observable<User[]> {
    return this.http.get<{ success: boolean; data: User[] }>(`${this.API}/admin/users`).pipe(
      map(response => response.data)
    );
  }

  getDocuments(): Observable<DocumentKYC[]> {
    return this.http.get<{ success: boolean; data: DocumentKYC[] }>(`${this.API}/admin/documents`).pipe(
      map(response => response.data)
    );
  }

  updateDocumentStatus(id: number, statut: string, commentaire?: string): Observable<DocumentKYC> {
    return this.http.patch<{ success: boolean; data: DocumentKYC }>(`${this.API}/admin/documents/${id}`, {
      statut,
      commentaire,
    }).pipe(map(response => response.data));
  }

  getProfile(): Observable<User> {
    return this.http.get<{ success: boolean; data: User }>(`${this.API}/admin/profile`).pipe(
      map(response => response.data)
    );
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<{ success: boolean; data: User }>(`${this.API}/admin/profile`, data).pipe(
      map(response => response.data)
    );
  }
}
