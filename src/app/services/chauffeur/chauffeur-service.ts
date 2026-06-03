import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth-service';

@Injectable({
  providedIn: 'root',
})
export class ChauffeurService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API = environment.apiUrl;

  private getRolePrefix(): string {
    const role = this.authService.currentUser()?.role_user;
    if (role === 'PROPRIETAIRE') return 'proprietaire';
    if (role === 'CHEF_AGENCE') return 'chef-agence';
    if (role?.startsWith('AGENT_')) return 'agent';
    return 'chauffeur';
  }

  // ── Voyages ──
  getMyVoyages(): Observable<any[]> {
    const prefix = this.getRolePrefix();
    return this.http.get<{ status: boolean; data: any[] }>(`${this.API}/${prefix}/voyages`)
      .pipe(map(response => response.data));
  }

  searchVoyages(payload: any): Observable<any[]> {
    const prefix = this.getRolePrefix();
    return this.http.post<{ status: boolean; data: any[] }>(`${this.API}/${prefix}/search-trips`, payload)
      .pipe(map(response => response.data));
  }

  getVoyageDetails(id: number): Observable<any> {
    const prefix = this.getRolePrefix();
    return this.http.get<{ status: boolean; data: any }>(`${this.API}/${prefix}/voyages/${id}`)
      .pipe(map(response => response.data));
  }

  updateVoyageStatus(id: number, status: string): Observable<any> {
    const prefix = this.getRolePrefix();
    return this.http.put<any>(`${this.API}/${prefix}/voyages/${id}/statut`, { statut: status });
  }

  // ── Historique & Réservations ──
  getMyReservations(): Observable<any[]> {
    const prefix = this.getRolePrefix();
    const endpoint = prefix === 'chauffeur' ? 'reservations' : 'reservations/self';
    return this.http.get<{ status: boolean; data: any[] }>(`${this.API}/${prefix}/${endpoint}`)
      .pipe(map(response => response.data));
  }

  createReservation(payload: any): Observable<any> {
    const prefix = this.getRolePrefix();
    const endpoint = prefix === 'chauffeur' ? 'reservations' : 'reservations/self';
    return this.http.post<any>(`${this.API}/${prefix}/${endpoint}`, payload);
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
