import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Agence } from '../../models/agence';
import { Ville } from '../../models/ville';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  // ── Recherche & Exploration ──
  getAgences(search?: string): Observable<Agence[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<{ success: boolean; data: Agence[] }>(`${this.API}/agences`, { params })
      .pipe(map(response => response.data));
  }

  searchTrips(payload: any): Observable<any[]> {
    return this.http.post<{ statut: boolean; data: any[] }>(`${this.API}/client/search-trips`, payload)
      .pipe(map(response => response.data));
  }

  // ── Réservations ──
  getMyReservations(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/client/reservations`)
      .pipe(map(response => response.data));
  }

  createReservation(payload: any): Observable<any> {
    return this.http.post<any>(`${this.API}/client/reservations`, payload);
  }

  getReservationDetails(id: number): Observable<any> {
    return this.http.get<{ statut: boolean; data: any }>(`${this.API}/client/reservations/${id}`)
      .pipe(map(response => response.data));
  }
}
