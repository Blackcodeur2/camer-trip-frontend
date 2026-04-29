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

  getVoyageDetails(id: number): Observable<any> {
    return this.http.get<{ status: boolean; data: any }>(`${this.API}/chauffeur/voyages/${id}`)
      .pipe(map(response => response.data));
  }

  updateVoyageStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.API}/chef-agence/voyages/${id}`, { statut: status });
  }

  // ── Historique ──
  // On peut réutiliser getMyVoyages et filtrer par statut 'termine' côté frontend ou backend
}
