import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  // ── Dashboard ──
  getDashboardStats(): Observable<any> {
    return this.http.get<{ statut: boolean; data: any }>(`${this.API}/agent/dashboard`)
      .pipe(map(response => response.data));
  }

  // ── Reservations & Bookings ──
  getReservations(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/agent/reservations`)
      .pipe(map(response => response.data));
  }

  createBooking(payload: any): Observable<any> {
    return this.http.post<any>(`${this.API}/agent/bookings`, payload);
  }

  // ── Validation ──
  validateTicket(ticketId: string): Observable<any> {
    return this.http.post<any>(`${this.API}/agent/validate-ticket`, { ticket_id: ticketId });
  }

  // ── Colis ──
  getColis(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/agent/colis`)
      .pipe(map(response => response.data));
  }
}
