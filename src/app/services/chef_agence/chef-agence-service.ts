import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bus } from '../../models/bus';
import { Trajet } from '../../models/trajet';
import { User } from '../../models/user';

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

  // Buses
  getBuses(): Observable<Bus[]> {
    return this.http.get<{ statut: boolean; data: Bus[] }>(`${this.API}/chef-agence/buses`)
      .pipe(map((response: { statut: boolean; data: Bus[] }) => response.data));
  }

  getBusesDispo(): Observable<Bus[]> {
    return this.http.get<{ statut: boolean; data: Bus[] }>(`${this.API}/chef-agence/buses/dispo`)
      .pipe(map((response: { statut: boolean; data: Bus[] }) => response.data));
  }

  createBus(bus: Partial<Bus>): Observable<Bus> {
    return this.http.post<Bus>(`${this.API}/chef-agence/buses`, bus);
  }

  updateBus(bus: Partial<Bus>): Observable<Bus> {
    return this.http.put<Bus>(`${this.API}/chef-agence/buses/${bus.id}`, bus);
  }

  // Routes
  getRoutes(): Observable<Trajet[]> {
    return this.http.get<{ statut: boolean; data: Trajet[] }>(`${this.API}/chef-agence/trajets`)
      .pipe(map((response: { statut: boolean; data: Trajet[] }) => response.data));
  }

  createRoute(route: Partial<Trajet>): Observable<Trajet> {
    return this.http.post<Trajet>(`${this.API}/chef-agence/trajets`, route);
  }

  updateRoute(route: Partial<Trajet>): Observable<Trajet> {
    return this.http.put<Trajet>(`${this.API}/chef-agence/trajets/${route.id}`, route);
  }

  // Staff
  getStaff(): Observable<User[]> {
    return this.http.get<{ statut: boolean; data: User[] }>(`${this.API}/chef-agence/utilisateurs`)
      .pipe(map((response: { statut: boolean; data: User[] }) => response.data));
  }

  getChauffeurs(): Observable<User[]> {
    return this.http.get<{ statut: boolean; data: User[] }>(`${this.API}/chef-agence/utilisateurs`)
      .pipe(map((response: { statut: boolean; data: User[] }) => response.data.filter((user: User) => user.role_user === 'CHAUFFEUR' && user.statut === 'actif')));
  }

  addStaff(staff: any): Observable<User> {
    return this.http.post<User>(`${this.API}/chef-agence/staff`, staff);
  }

  updateStaff(staffId: number, staff: any): Observable<any> {
    return this.http.put<any>(`${this.API}/chef-agence/staff/${staffId}`, staff);
  }

  // ── Voyages ──
  getVoyages(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/chef-agence/voyages`)
      .pipe(map(response => response.data));
  }

  createVoyage(voyage: any): Observable<any> {
    return this.http.post<any>(`${this.API}/chef-agence/voyages`, voyage);
  }

  updateVoyageStatus(id: number, statut: string, motif_annulation?: string): Observable<any> {
    return this.http.put<any>(`${this.API}/chef-agence/voyages/${id}`, { statut, motif_annulation });
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

  // ── Incidents ──
  getIncidents(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/chef-agence/incidents`)
      .pipe(map(response => response.data));
  }

  updateIncidentStatus(id: number, statut: string): Observable<any> {
    return this.http.patch<any>(`${this.API}/chef-agence/incidents/${id}/status`, { statut });
  }

  exportIncidentsPdf(): Observable<Blob> {
    return this.http.get(`${this.API}/chef-agence/export-incidents`, { responseType: 'blob' });
  }

  // ── Personnels ──
  getPersonnels(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/chef-agence/personnels`)
      .pipe(map(response => response.data));
  }

  exportPersonnelPdf(): Observable<Blob> {
    return this.http.get(`${this.API}/chef-agence/export-personnel`, { responseType: 'blob' });
  }

  exportBusesPdf(): Observable<Blob> {
    return this.http.get(`${this.API}/chef-agence/export-buses`, { responseType: 'blob' });
  }

  exportRoutesPdf(): Observable<Blob> {
    return this.http.get(`${this.API}/chef-agence/export-trajets`, { responseType: 'blob' });
  }

  exportVoyagesPdf(): Observable<Blob> {
    return this.http.get(`${this.API}/chef-agence/export-voyages`, { responseType: 'blob' });
  }

  exportReservationsPdf(): Observable<Blob> {
    return this.http.get(`${this.API}/chef-agence/export-reservations`, { responseType: 'blob' });
  }

  exportPassagersPdf(voyageId: number): Observable<Blob> {
    return this.http.get(`${this.API}/chef-agence/voyages/${voyageId}/export-passagers`, { responseType: 'blob' });
  }

  // ── Annonces ──
  getAnnonces(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/chef-agence/annonces`)
      .pipe(map(response => response.data));
  }

  createAnnonce(formData: FormData): Observable<any> {
    return this.http.post<{ statut: boolean; data: any; message: string }>(`${this.API}/chef-agence/annonces`, formData)
      .pipe(map(response => response.data));
  }

  deleteAnnonce(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API}/chef-agence/annonces/${id}`);
  }
}
