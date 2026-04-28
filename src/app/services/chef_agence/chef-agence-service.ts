import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChefAgenceService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  // ── Dashboard ──
  getDashboardStats(): Observable<any> {
    return this.http.get<{ statut: boolean; data: any }>(`${this.API}/chef-agence/dashboard`)
      .pipe(map(response => response.data));
  }

  // ── Trajets ──
  getTrajets(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/chef-agence/trajets`)
      .pipe(map(response => response.data));
  }

  // ── Bus ──
  getBuses(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/chef-agence/buses`)
      .pipe(map(response => response.data));
  }

  // ── Voyages ──
  getVoyages(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/chef-agence/voyages`)
      .pipe(map(response => response.data));
  }

  // ── Reservations ──
  getReservations(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/chef-agence/reservations`)
      .pipe(map(response => response.data));
  }

  createReservation(payload: any): Observable<any> {
    return this.http.post<any>(`${this.API}/chef-agence/reservations`, payload);
  }

  // ── Colis ──
  getColis(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/chef-agence/colis`)
      .pipe(map(response => response.data));
  }

  // ── Personnels ──
  getPersonnels(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/chef-agence/personnels`)
      .pipe(map(response => response.data));
  }
}
