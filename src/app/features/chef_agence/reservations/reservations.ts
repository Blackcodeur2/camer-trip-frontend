import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-reservations',
  imports: [CommonModule, MatIconModule, PaginationComponent],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
})
export class Reservations {
  private authService = inject(AuthService);

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
    
        this.reservations.set([]);
        this.isLoading.set(false);
  }

  cancelReservation(id: number) {
    
  }

  printReservation(id: number) {
   
  }

  downloadPdf() {
  
  }
}
