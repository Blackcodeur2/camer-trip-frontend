import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Agence } from '../../models/agence';

interface AgenceResponse {
  success: boolean;
  data: Agence[];
}

@Injectable({
  providedIn: 'root',
})
export class AgenceService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAgences(search?: string): Observable<Agence[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<AgenceResponse>(`${this.API}/agences`, { params }).pipe(
      map((response) => response.data)
    );
  }
}
