import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth/auth-service';
import { ChefAgenceService } from '../../../services/chef_agence/chef-agence-service';
import { AgentService } from '../../../services/agent/agent-service';
import { TicketService } from '../../../services/ticket/ticket-service';

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
  private ticketService = inject(TicketService);
  private router = inject(Router);

  reservations = signal<any[]>([]);
  isLoading = signal(true);
  isExporting = signal(false);
  searchQuery = signal('');
  selectedStatut = signal('');
  currentPage = signal(1);
  pageSize = signal(4);

  isChefAgence = computed(() => this.authService.currentUser()?.role_user === 'CHEF_AGENCE');

  filteredReservations = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const status = this.selectedStatut();
    let list = this.reservations();

    if (query) {
      list = list.filter(r => 
        (r.num_reservation?.toLowerCase().includes(query)) ||
        (r.user?.prenom?.toLowerCase().includes(query)) ||
        (r.user?.nom?.toLowerCase().includes(query)) ||
        (r.nom_client?.toLowerCase().includes(query)) ||
        (r.telephone_client?.toLowerCase().includes(query)) ||
        (r.user?.telephone?.toLowerCase().includes(query))
      );
    }

    if (status) {
      list = list.filter(r => r.statut === status);
    }

    return list;
  });

  paginatedReservations = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredReservations().slice(start, end);
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

  newReservation() {
    const role = this.authService.currentUser()?.role_user;
    if (role === 'CHEF_AGENCE') {
      this.router.navigate(['/chef_agence/reservations/new']);
    } else {
      this.router.navigate(['/agent/booking/new']);
    }
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
            this.loadReservations();
          },
          error: (err: any) => {
            Swal.fire('Erreur', err.error?.message || 'Impossible d\'annuler la réservation.', 'error');
          }
        });
      }
    });
  }

   printReservation(id: number) {
    this.ticketService.downloadTicket(id);
  }

  openTicket(id: number)
  {
    this.ticketService.openTicket(id);
  }

  downloadPdf() {
    if (this.isExporting() || !this.isChefAgence()) return;
    this.isExporting.set(true);

    this.chefAgenceService.exportReservationsPdf().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const now = new Date();
        const dateStr = `${now.getFullYear()}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getDate().toString().padStart(2, '0')}`;
        link.download = `reservations_agence_${dateStr}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.isExporting.set(false);
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Téléchargement réussi', timer: 2000, showConfirmButton: false });
      },
      error: () => {
        this.isExporting.set(false);
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de télécharger le document PDF' });
      }
    });
  }
}
