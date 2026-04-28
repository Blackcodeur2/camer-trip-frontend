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

  // ── Dashboard ──
  getDashboardStats(): Observable<any> {
    return this.http.get<{ statut: boolean; data: any }>(`${this.API}/chauffeur/dashboard`)
      .pipe(map(response => response.data));
  }

  // ── Historique ──
  getHistorique(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/chauffeur/historique`)
      .pipe(map(response => response.data));
  }

  // ── Incidents ──
  reportIncident(payload: any): Observable<any> {
    return this.http.post<any>(`${this.API}/chauffeur/incidents`, payload);
  }

  getIncidents(): Observable<any[]> {
    return this.http.get<{ statut: boolean; data: any[] }>(`${this.API}/chauffeur/incidents`)
      .pipe(map(response => response.data));
  }
}
