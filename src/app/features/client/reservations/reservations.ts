import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Reservation } from '../../../models/reservation';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reservations',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
})
export class Reservations {
  private router = inject(Router);

  // Source of truth
  reservations = signal<Reservation[]>([]);

  // Search & Filters
  searchTerm = signal<string>('');
  activeFilter = signal<'all' | 'validee' | 'en_attente' | 'annule'>('all');
  isLoading = signal<boolean>(false);

  // Statistics
  stats = computed(() => {
    const all = this.reservations();
    const validated = all.filter(r => r.statut === 'validee');
    const totalSpent = validated.reduce((sum, r) => sum + Number(r.prix), 0);

    // Check for upcoming trips (departure date >= today)
    const today = new Date().toISOString().split('T')[0];
    const upcoming = validated.filter(r => r.voyage.date_depart.split('T')[0] >= today).length;

    return {
      total: all.length,
      upcoming,
      spent: totalSpent,
      validated: validated.length,
      pending: all.filter(r => r.statut === 'en attente' || r.statut === 'en_attente').length
    };
  });

  // Derived list
  filteredReservations = computed(() => {
    let list = this.reservations();
    const filter = this.activeFilter();
    const search = this.searchTerm().toLowerCase();

    if (filter !== 'all') {
      list = list.filter(r => r.statut === filter);
    }

    if (search) {
      list = list.filter(r =>
        r.num_reservation.toLowerCase().includes(search) ||
        (r.voyage?.trajet?.depart?.ville || '').toLowerCase().includes(search) ||
        (r.voyage?.trajet?.arrivee?.ville || '').toLowerCase().includes(search)
      );
    }

    return list;
  });


  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
        this.reservations.set([]);
  }

  setFilter(filter: 'all' | 'validee' | 'en_attente' | 'annule'): void {
    this.activeFilter.set(filter);
  }

  getCountByStatus(status: string): number {
    return this.reservations().filter(res => res.statut === status).length;
  }

  onViewDetails(reservationId: number): void {
    this.router.navigate(['/client/reservation-details', reservationId]);
  }

  onCancelReservation(reservationId: number): void {
    
  }

  // Helper for CSS classes
  getStatusClass(status: string): string {
    return status ? status.replace(' ', '_') : '';
  }

  onPayReservation(reservation: Reservation): void {

  }

  startPaymentPolling(reference: string): void {

  }

  onDownloadTicket(reservation: Reservation): void {
   
  }

  goToVoyages(): void {
    this.router.navigate(['/client/voyages']);
  }
}
