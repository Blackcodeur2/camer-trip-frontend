import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Reservation } from '../../../models/reservation';
import { Router } from '@angular/router';
import { ClientService } from '../../../services/client/client-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
})
export class Reservations implements OnInit {
  private clientService = inject(ClientService);
  private router = inject(Router);

  reservations = signal<Reservation[]>([]);
  searchTerm = signal<string>('');
  activeFilter = signal<'all' | 'validee' | 'en attente' | 'annule'>('all');
  isLoading = signal<boolean>(false);
  isPaying = signal<boolean>(false);

  stats = computed(() => {
    const all = this.reservations();
    const validated = all.filter(r => r.statut === 'validee');
    const totalSpent = validated.reduce((sum, r) => sum + Number(r.prix), 0);
    return {
      total: all.length,
      spent: totalSpent,
      validated: validated.length,
      pending: all.filter(r => r.statut === 'en attente').length
    };
  });

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
        (r.voyage?.trajet?.depart || '').toLowerCase().includes(search) ||
        (r.voyage?.trajet?.arrivee || '').toLowerCase().includes(search)
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading.set(true);
    this.clientService.getMyReservations().subscribe({
      next: (data) => {
        this.reservations.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  setFilter(filter: 'all' | 'validee' | 'en attente' | 'annule'): void {
    this.activeFilter.set(filter);
  }

  onPayReservation(reservation: Reservation): void {
    this.processPayment(reservation.id);
  }

  async processPayment(reservationId: number) {
    const { value: phone } = await Swal.fire({
      title: 'Paiement Mobile',
      text: 'Entrez votre numéro de téléphone de paiement',
      input: 'text',
      inputPlaceholder: '6XXXXXXXX',
      showCancelButton: true,
      confirmButtonText: 'Payer maintenant',
      confirmButtonColor: '#2563eb',
      inputValidator: (value) => {
        if (!value) return 'Le numéro est requis';
        return null;
      }
    });

    if (phone) {
      let formattedPhone = phone.trim();
      if (/^6\d{8}$/.test(formattedPhone)) {
        formattedPhone = '237' + formattedPhone;
      }

      Swal.fire({
        title: 'Initialisation...',
        text: 'Veuillez confirmer le paiement sur votre téléphone',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.clientService.initiatePayment(reservationId, formattedPhone).subscribe({
        next: (res) => {
          this.pollPaymentStatus(res.reference);
        },
        error: (err) => {
          Swal.fire('Erreur', err.error?.message || 'Échec de l\'initialisation du paiement.', 'error');
        }
      });
    }
  }

  pollPaymentStatus(reference: string) {
    const interval = setInterval(() => {
      this.clientService.checkPaymentStatus(reference).subscribe({
        next: (res) => {
          if (res.statut === 'SUCCESSFUL') {
            clearInterval(interval);
            Swal.fire('Succès', 'Paiement réussi ! Votre billet est prêt.', 'success').then(() => {
              this.loadReservations();
            });
          } else if (res.statut === 'FAILED' || res.statut === 'echoue') {
            clearInterval(interval);
            Swal.fire('Échec', 'Le paiement a échoué.', 'error');
          }
        },
        error: () => {}
      });
    }, 3000);

    setTimeout(() => clearInterval(interval), 120000);
  }

  goToVoyages(): void {
    this.router.navigate(['/client/agences']);
  }
}
