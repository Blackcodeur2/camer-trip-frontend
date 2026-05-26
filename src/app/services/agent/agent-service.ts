import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth-service';
import { Trajet } from '../../models/trajet';
import { Voyage } from '../../models/voyage';
import { Colis } from '../../models/colis';

@Injectable({
  providedIn: 'root',
})
export class AgentService {
    private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API = environment.apiUrl;

  getDashboardStats(): Observable<any> {
    return this.http.get<{ statut: boolean; data: any }>(`${this.API}/${this.getPrefix()}/dashboard`)
      .pipe(map((response: { statut: boolean; data: any }) => response.data));
  }

  getReservations(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/${this.getPrefix()}/reservations`)
      .pipe(map((response: { statut: boolean; data: any[] }) => response.data));
  }

  getRoutes(): Observable<Trajet[]> {
    const role = this.authService.currentUser()?.role_user;
    // Agent uses /routes, Chef d'Agence uses /trajets
    const path = role === 'CHEF_AGENCE' ? 'trajets' : 'routes';
    return this.http.get<{ statut: boolean; data: Trajet[] }>(`${this.API}/${this.getPrefix()}/${path}`)
      .pipe(map((response: { statut: boolean; data: Trajet[] }) => response.data));
  }

  getVoyages(): Observable<Voyage[]> {
    return this.http.get<{ statut: boolean; data: Voyage[] }>(`${this.API}/${this.getPrefix()}/voyages`)
      .pipe(map((response: { statut: boolean; data: Voyage[] }) => response.data));
  }

  createBooking(payload: any): Observable<any> {
    return this.http.post<{ statut: boolean; data: any }>(`${this.API}/${this.getPrefix()}/reservations`, payload)
      .pipe(map((response: { statut: boolean; data: any }) => response.data));
  }

  validateTicket(code: string): Observable<any> {
    return this.http.post<{ statut: boolean; data: any }>(`${this.API}/${this.getPrefix()}/tickets/validate`, { code })
      .pipe(map((response: { statut: boolean; data: any }) => response.data));
  }

  cancelReservation(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API}/${this.getPrefix()}/reservations/${id}`);
  }

  getReservationDetail(id: number): Observable<any> {
    return this.http.get<{ statut: boolean; data: any }>(`${this.API}/${this.getPrefix()}/reservations/${id}`)
      .pipe(map((response: { statut: boolean; data: any }) => response.data));
  }

  // ── Client Management ──
  searchClients(query: string): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/${this.getPrefix()}/clients/search?query=${query}`)
      .pipe(map((response: { statut: boolean; data: any[] }) => response.data));
  }

  createClient(payload: any): Observable<any> {
    return this.http.post<{ statut: boolean; data: any }>(`${this.API}/${this.getPrefix()}/clients`, payload)
      .pipe(map((response: { statut: boolean; data: any }) => response.data));
  }

  // ── Voyage & Seats ──
  getVoyagesByRoute(routeId: number, date: string): Observable<Voyage[]> {
    return this.http.get<{ statut: boolean; data: Voyage[] }>(`${this.API}/${this.getPrefix()}/voyages/search?route_id=${routeId}&date=${date}`)
      .pipe(map((response: { statut: boolean; data: Voyage[] }) => response.data));
  }

  getAvailableSeats(voyageId: number): Observable<string[]> {
    return this.http.get<{ statut: boolean; data: string[] }>(`${this.API}/${this.getPrefix()}/voyages/${voyageId}/available-seats`)
      .pipe(map((response: { statut: boolean; data: string[] }) => response.data));
  }

  getColis(): Observable<Colis[]> {
    return this.http.get<{ statut: boolean; data: Colis[] }>(`${this.API}/${this.getPrefix()}/colis`)
      .pipe(map(response => response.data));
  }

  createColis(payload: Partial<Colis>): Observable<Colis> {
    return this.http.post<{ statut: boolean; data: Colis }>(`${this.API}/${this.getPrefix()}/colis`, payload)
      .pipe(map(response => response.data));
  }

  updateColisStatus(id: number, statut: string, code_retrait?: string): Observable<Colis> {
    return this.http.patch<{ statut: boolean; data: Colis }>(`${this.API}/${this.getPrefix()}/colis/${id}/status`, { statut, code_retrait })
      .pipe(map(response => response.data));
  }

  bulkUpdateColisStatus(ids: number[], statut: string): Observable<any> {
    return this.http.patch<{ statut: boolean; message: string }>(`${this.API}/${this.getPrefix()}/colis/bulk-status`, { ids, statut });
  }

  exportPassagersPdf(voyageId: number): Observable<Blob> {
    return this.http.get(`${this.API}/${this.getPrefix()}/voyages/${voyageId}/export-passagers`, { responseType: 'blob' });
  }

  private getPrefix(): string {
    const user = this.authService.currentUser();
    return user?.role_user === 'AGENT' ? 'agent' : 'chef-agence';
  }
}
