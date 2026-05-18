import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth-service';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API = environment.apiUrl;

  downloadTicket(reservationId: number): void {
    const role = this.authService.currentUser()?.role_user;
    const r = role === 'CHEF_AGENCE' ? 'chef-agence' : 'agent';
    const url = `${this.API}/${r}/reservations/${reservationId}/ticket`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `ticket-reservation-${reservationId}.pdf`;
        link.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: (err: any) => {
        console.error('Erreur lors du téléchargement du ticket:', err);
      }
    });
  }

  openTicket(reservationId: number): void {
    const role = this.authService.currentUser()?.role_user;
    const r = role === 'CHEF_AGENCE' ? 'chef-agence' : 'agent';
    const url = `${this.API}/${r}/reservations/${reservationId}/ticket`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank');
      },
      error: (err: any) => {
        console.error('Erreur lors de l\'ouverture du ticket:', err);
      }
    });
  }
}
