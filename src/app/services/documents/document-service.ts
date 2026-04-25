import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentKYC } from '../../models/document-kyc';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  getPendingKyc(): Observable<DocumentKYC[]> {
    return this.http.get<DocumentKYC[]>(`${this.API}/admin/documents`);
  }

  approveKyc(doc_id: number): Observable<any> {
    return this.http.put(`${this.API}/admin/kyc/${doc_id}/approve`, {});
  }

  rejectKyc(doc_id: number, reason: string): Observable<any> {
    return this.http.post(`${this.API}/admin/kyc/${doc_id}/reject`, { reason });
  }
}
