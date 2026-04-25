import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Agence } from '../../models/agence';
import { Station } from '../../models/station';
import { Ville } from '../../models/ville';
import { CreateAgencePayload, CreateStationPayload } from '../proprietaire/proprietaire-service';

interface AgenceResponse {
  success: boolean;
  data: Agence[];
}

@Injectable({
  providedIn: 'root',
})
export class AgenceService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAgences(search?: string): Observable<Agence[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<AgenceResponse>(`${this.API}/agences`, { params }).pipe(
      map((response) => response.data)
    );
  }

  getAllAgences(): Observable<Agence[]> {
    return this.http.get<Agence[]>(`${this.API}/admin/agences`);
  }

  createStation(station: Partial<Station>): Observable<Station> {
    return this.http.post<Station>(`${this.API}/admin/station`, station);
  }

  createAgence(agence: Partial<Agence>): Observable<Agence> {
    return this.http.post<Agence>(`${this.API}/admin/agences`, agence);
  }

  getVilles(): Observable<Ville[]> {
    return this.http.get<Ville[]>(`${this.API}/villes`);
  }

  updateAgence(id: number, payload: Partial<CreateAgencePayload>): Observable<Agence> {
    return this.http.put<Agence>(`${this.API}/proprietaire/agences/${id}`, payload);
  }

  deleteAgence(id: number): Observable<any> {
    return this.http.delete(`${this.API}/proprietaire/agences/${id}`);
  }

  // ── Gares ──
  getMyGares(): Observable<Station[]> {
    return this.http.get<{ statut: boolean; data: Station[] }>(`${this.API}/proprietaire/stations`)
      .pipe(map(response => response.data));
  }

  createGare(station: CreateStationPayload): Observable<Station> {
    return this.http.post<Station>(`${this.API}/proprietaire/stations`, station);
  }

  updateGare(id: number, payload: Partial<CreateStationPayload>): Observable<Station> {
    return this.http.put<Station>(`${this.API}/proprietaire/stations/${id}`, payload);
  }

  deleteGare(id: number): Observable<any> {
    return this.http.delete(`${this.API}/proprietaire/stations/${id}`);
  }
}
