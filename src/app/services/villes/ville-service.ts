import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from '../auth/auth-service';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { Ville } from '../../models/ville';

@Injectable({
  providedIn: 'root',
})
export class VilleService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API = environment.apiUrl;

  getVilles(): Observable<Ville[]>{
    return this.http.get<{ status: boolean; data: Ville[] }>(`${this.API}/villes`).pipe(map(response => response.data));
  }

  createVille(ville: Partial<Ville>): Observable<Ville> {
    return this.http.post<{ status: boolean; data: Ville }>(`${this.API}/admin/villes`, ville).pipe(map(response => response.data));
  }

  updateVille(ville: Partial<Ville>): Observable<Ville> {
    return this.http.put<{ status: boolean; data: Ville }>(`${this.API}/admin/villes/${ville.id}`, ville).pipe(map(response => response.data));
  }

  deleteVille(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/admin/villes/${id}`);
  }
}
