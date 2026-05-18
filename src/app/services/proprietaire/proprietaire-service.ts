import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Agence } from '../../models/agence';
import { User } from '../../models/user';
import { AuthService } from '../auth/auth-service';
import { Station } from '../../models/station';
import { Ville } from '../../models/ville';


export interface CreateAgencePayload {
  nom: string; // Correspond au backend
  email: string; // Correspond au backend
  telephone: string;
  //logo?: File; 
  adresse?: string; // Correspond au backend
}

export interface CreateGerantPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  num_cni: string;
  date_naissance: string;
  station_id: number | null| undefined;
  password?: string;
  password_confirmation?: string;
}

export interface CreateStationPayload {
  agence_id: number;
  ville: string;
  quartier: string;
  telephone: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProprietaireService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API = environment.apiUrl;

  // ── Profil & Gérants ──
  updateGerant(id: number, payload: Partial<CreateGerantPayload>): Observable<User> {
    return this.http.put<User>(`${this.API}/proprietaire/gerants/${id}`, payload);
  }

  // ── Agences ──
  getMyAgences(): Observable<Agence[]> {
    const user = this.authService.currentUser();
    return this.http.get<any>(`${this.API}/proprietaire/mes-agences/${user?.id}`)
      .pipe(map(res => Array.isArray(res.data) ? res.data : Object.values(res.data || {})));
  }

  createAgence(payload: FormData | CreateAgencePayload): Observable<Agence> {
    return this.http.post<Agence>(`${this.API}/proprietaire/agences`, payload);
  }

  updateAgence(id: number, payload: FormData | Partial<CreateAgencePayload>): Observable<Agence> {
    return this.http.post<Agence>(`${this.API}/proprietaire/agences/${id}`, payload);
  }

  deleteAgence(id: number): Observable<any> {
    return this.http.delete(`${this.API}/proprietaire/agences/${id}`);
  }

  // ── Stations ──
  getMyStations(): Observable<Station[]> {
    return this.http.get<any>(`${this.API}/proprietaire/stations`)
      .pipe(map(res => Array.isArray(res.data) ? res.data : Object.values(res.data || {})));
  }

  createStation(payload: CreateStationPayload): Observable<Station> {
    return this.http.post<Station>(`${this.API}/proprietaire/stations`, payload);
  }

  updateStation(id: number, payload: Partial<CreateStationPayload>): Observable<Station> {
    return this.http.put<Station>(`${this.API}/proprietaire/stations/${id}`, payload);
  }

  deleteStation(id: number): Observable<any> {
    return this.http.delete(`${this.API}/proprietaire/stations/${id}`);
  }

  // ── Buses ──
  getMyBuses(): Observable<any[]> {
    return this.http.get<any>(`${this.API}/proprietaire/buses`)
      .pipe(map(res => Array.isArray(res.data) ? res.data : Object.values(res.data || {})));
  }

  // ── Routes/Trajets ──
  getMyTrajets(): Observable<any[]> {
    return this.http.get<any>(`${this.API}/proprietaire/trajets`)
      .pipe(map(res => Array.isArray(res.data) ? res.data : Object.values(res.data || {})));
  }

  // ── Voyages ──
  getMyVoyages(): Observable<any[]> {
    return this.http.get<any>(`${this.API}/proprietaire/voyages`)
      .pipe(map(res => Array.isArray(res.data) ? res.data : Object.values(res.data || {})));
  }

  // ── Utilisateurs ──
  getMyUtilisateurs(): Observable<User[]> {
    return this.http.get<any>(`${this.API}/proprietaire/utilisateurs`)
      .pipe(map(res => Array.isArray(res.data) ? res.data : Object.values(res.data || {})));
  }

  // ── Statistiques ──
  getMyStatistics(stationId?: number): Observable<any> {
    let url = `${this.API}/proprietaire/statistiques`;
    if (stationId) {
      url += `?station_id=${stationId}`;
    }
    return this.http.get<{ statut: boolean; data: any }>(url)
      .pipe(map(response => response.data));
  }

  // ── Gérants (CHEF_AGENCE) ──
  getMyGerants(): Observable<User[]> {
    return this.http.get<any>(`${this.API}/proprietaire/gerants`)
      .pipe(map(res => Array.isArray(res.data) ? res.data : Object.values(res.data || {})));
  }

  createGerant(payload: CreateGerantPayload): Observable<User> {
    return this.http.post<User>(`${this.API}/proprietaire/gerants`, payload);
  }

  assignGerant(userId: number, agenceId: number): Observable<any> {
    return this.http.post(`${this.API}/proprietaire/gerants/assign`, {
      user_id: userId,
      agence_id: agenceId,
    });
  }

  removeGerant(userId: number): Observable<any> {
    return this.http.delete(`${this.API}/proprietaire/gerants/${userId}`);
  }

  getMyPersonnels(): Observable<User[]> {
    return this.http.get<any>(`${this.API}/proprietaire/personnels`)
      .pipe(map(res => Array.isArray(res.data) ? res.data : Object.values(res.data || {})));
  }

  // ── KYC ──
  getKycStatus(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/proprietaire/kyc/status`);
  }

  submitKyc(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.API}/proprietaire/kyc/submit`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  submitEntrepriseKyc(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.API}/proprietaire/kyc/entreprise/submit`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  getMySubscription(): Observable<any> {
    return this.http.get<any>(`${this.API}/proprietaire/my-subscription`)
      .pipe(map(res => res.data));
  }

  getSubscriptionPlan(): Observable<any> {
    return this.http.get<{ statut: boolean; data: any }>(`${this.API}/proprietaire/subscription-plan`)
      .pipe(map(res => res.data));
  }

  getKYCDocuments(): Observable<any> {
    return this.http.get<any>(`${this.API}/proprietaire/documents`);
  }

  resubmitKYCDocument(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('fichier', file);
    return this.http.post<any>(`${this.API}/proprietaire/documents/${id}`, formData);
  }

  initiateSubscriptionPayment(phone: string): Observable<any> {
    return this.http.post<any>(`${this.API}/payments/subscription`, { phone });
  }

  exportPersonnelPdf(): Observable<Blob> {
    return this.http.get(`${this.API}/proprietaire/export-personnel`, { responseType: 'blob' });
  }

  exportPassagersPdf(voyageId: number): Observable<Blob> {
    return this.http.get(`${this.API}/proprietaire/voyages/${voyageId}/export-passagers`, { responseType: 'blob' });
  }
}
