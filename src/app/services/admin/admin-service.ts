import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';
import { Agence } from '../../models/agence';
import { Station } from '../../models/station';
import { DocumentKYC } from '../../models/document-kyc';


export interface PaginatedUsers {
  current_page: number;
  data: User[];
  total: number;
  per_page: number;
  last_page: number;
  from: number;
  to: number;
}

export interface UsersApiResponse {
  success?: boolean;
  statut?: boolean;
  data: PaginatedUsers | User[];
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Profil ──
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

  // ── Utilisateurs ──
  getUsers(page: number = 1): Observable<UsersApiResponse> {
    return this.http.get<UsersApiResponse>(`${this.API}/admin/users?page=${page}`);
  }

  // ── Agences ──
  getAgences(): Observable<Agence[]> {
    return this.http.get<{ success: boolean; data: Agence[] }>(`${this.API}/admin/agences`).pipe(
      map(response => response.data)
    );
  }

  createAgence(agence: Partial<Agence>): Observable<Agence> {
    return this.http.post<Agence>(`${this.API}/admin/agences`, agence);
  }

  // ── Stations ──
  createStation(station: Partial<Station>): Observable<Station> {
    return this.http.post<Station>(`${this.API}/admin/station`, station);
  }

  // ── KYC & Documents ──
  getPendingKyc(): Observable<DocumentKYC[]> {
    return this.http.get<DocumentKYC[]>(`${this.API}/admin/documents`);
  }

  processKyc(userId: number, documents: any[]): Observable<any> {
    return this.http.post(`${this.API}/admin/documents/${userId}/process`, { documents });
  }

  // ── Abonnements ──
  getAbonnements(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/admin/abonnements`).pipe(
      map(response => response.data)
    );
  }
}


