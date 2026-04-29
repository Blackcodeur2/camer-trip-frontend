import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth/auth-service';
import { ChefAgenceService } from '../../../services/chef_agence/chef-agence-service';
import { AgentService } from '../../../services/agent/agent-service';

@Component({
  selector: 'app-reservations',
  imports: [CommonModule, MatIconModule, PaginationComponent],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
})
export class Reservations {
  private agentService = inject(AgentService);
  private chefAgenceService = inject(ChefAgenceService);
  private authService = inject(AuthService);
  //private ticketService = inject(TicketService);

  reservations = signal<any[]>([]);
  isLoading = signal(true);
  isExporting = signal(false);
  currentPage = signal(1);
  pageSize = signal(6);

  isChefAgence = computed(() => this.authService.currentUser()?.role_user === 'CHEF_AGENCE');

  paginatedReservations = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.reservations().slice(start, end);
  });

  ngOnInit() {
    this.loadReservations();
  }

  private loadReservations() {
    const role = this.authService.currentUser()?.role_user;
    const request = role === 'CHEF_AGENCE' 
      ? this.chefAgenceService.getReservations() 
      : this.agentService.getReservations();

    request.pipe(catchError((err: any) => {
        console.error('Error loading reservations:', err);
        return of([]);
      }))
      .subscribe((data: any[]) => {
        this.reservations.set(data);
        this.isLoading.set(false);
      });
  }

  cancelReservation(id: number) {
    Swal.fire({
      title: 'Annuler la réservation ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Fermer'
    }).then((result: any) => {
      if (result.isConfirmed) {
        const role = this.authService.currentUser()?.role_user;
        const request = role === 'CHEF_AGENCE'
          ? this.agentService.cancelReservation(id)
          : this.agentService.cancelReservation(id);

        request.subscribe({
          next: () => {
            this.reservations.update((list: any[]) => list.filter((r: any) => r.id !== id));
            Swal.fire('Annulée !', 'La réservation a été annulée.', 'success');
          },
          error: (err: any) => {
            Swal.fire('Erreur', err.error?.message || 'Impossible d\'annuler la réservation.', 'error');
          }
        });
      }
    });
  }

  printReservation(id: number) {
    //this.ticketService.openTicket(id);
  }

  downloadPdf() {

  }
}
