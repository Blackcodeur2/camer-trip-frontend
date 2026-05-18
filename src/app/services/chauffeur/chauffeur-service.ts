import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChauffeurService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  // ── Voyages ──
  getMyVoyages(): Observable<any[]> {
    return this.http.get<{ status: boolean; data: any[] }>(`${this.API}/chauffeur/voyages`)
      .pipe(map(response => response.data));
  }

  searchVoyages(payload: any): Observable<any[]> {
    return this.http.post<{ status: boolean; data: any[] }>(`${this.API}/chauffeur/search-trips`, payload)
      .pipe(map(response => response.data));
  }

  getVoyageDetails(id: number): Observable<any> {
    return this.http.get<{ status: boolean; data: any }>(`${this.API}/chauffeur/voyages/${id}`)
      .pipe(map(response => response.data));
  }

  updateVoyageStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.API}/chauffeur/voyages/${id}/statut`, { statut: status });
  }

  // ── Historique & Réservations ──
  getMyReservations(): Observable<any[]> {
    return this.http.get<{ status: boolean; data: any[] }>(`${this.API}/chauffeur/reservations`)
      .pipe(map(response => response.data));
  }

  createReservation(payload: any): Observable<any> {
    return this.http.post<any>(`${this.API}/chauffeur/reservations`, payload);
  }

  // ── Paiement ──
  initiatePayment(reservationId: number, phone: string): Observable<any> {
    return this.http.post<any>(`${this.API}/payments/initiate`, {
      reservation_id: reservationId,
      phone: phone
    });
  }

  checkPaymentStatus(reference: string): Observable<any> {
    return this.http.get<any>(`${this.API}/payments/status/${reference}`);
  }

  // On peut réutiliser getMyVoyages et filtrer par statut 'termine' côté frontend ou backend

  // ── Incidents ──
  reportIncident(incident: any): Observable<any> {
    return this.http.post<any>(`${this.API}/chauffeur/incidents`, incident);
  }

  getMyIncidents(): Observable<any[]> {
    return this.http.get<{ status: boolean; data: any[] }>(`${this.API}/chauffeur/incidents`)
      .pipe(map(response => response.data));
  }

  exportPassagersPdf(voyageId: number): Observable<Blob> {
    return this.http.get(`${this.API}/chauffeur/voyages/${voyageId}/export-passagers`, { responseType: 'blob' });
  }
}
