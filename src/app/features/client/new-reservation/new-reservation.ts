import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { Voyage } from '../../../models/voyage';

@Component({
  selector: 'app-new-reservation',
  imports: [CommonModule, MatIconModule],
  templateUrl: './new-reservation.html',
  styleUrl: './new-reservation.css',
})
export class NewReservation {
   private route = inject(ActivatedRoute);
  private router = inject(Router);

  // States
  voyageId = signal<number | null>(null);
  voyage = signal<Voyage | null>(null);
  occupiedSeats = signal<string[]>([]);
  selectedSeat = signal<number | null>(null);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);

  // Computed
  isSmallBus = computed(() => {
    const places = this.voyage()?.bus?.nb_places || 0;
    return places <= 35; // Coaster style
  });

  busColumns = computed(() => {
    return this.isSmallBus() ? 3 : 4; // 2+1 or 2+2
  });

  seatsArray = computed(() => {
    const count = this.voyage()?.bus?.nb_places || 0;
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('voyageId');
    if (id) {
      this.voyageId.set(+id);
      this.loadData();
    } else {
      this.router.navigate(['/client/voyages']);
    }
  }

  loadData(): void {
    if (!this.voyageId()) return;
    this.isLoading.set(true);
        this.voyage.set(null);
        this.loadOccupations();
  }

  loadOccupations(): void {
    this.occupiedSeats.set([]);
  }

  isOccupied(seat: number): boolean {
    return this.occupiedSeats().includes(seat.toString());
  }

  selectSeat(seat: number): void {
    if (this.isOccupied(seat)) return;
    this.selectedSeat.set(seat === this.selectedSeat() ? null : seat);
  }

  confirmBooking(): void {
    if (!this.selectedSeat()) return;

    Swal.fire({
      title: 'Confirmer la réservation',
      text: `Voulez-vous réserver la place N°${this.selectedSeat()} pour ce voyage ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, réserver',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#2563eb'
    }).then((result) => {
      if (result.isConfirmed) {
        this.submitReservation();
      }
    });
  }

  submitReservation(): void {
    this.isSubmitting.set(true);
    const payload = {
      voyage_id: this.voyageId()!,
      place: this.selectedSeat()!,
      gare_id: this.voyage()?.station_id
    };
  }

  processPayment(reservationId: number): void {
    Swal.fire({
      title: 'Paiement Mobile Money',
      text: 'Entrez votre numéro de téléphone (Orange ou MTN)',
      input: 'tel',
      inputPlaceholder: '6xxxxxxxx',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Lancer le paiement',
      showLoaderOnConfirm: true,
      preConfirm: (phone) => {
        if (!phone || phone.length < 9) {
          Swal.showValidationMessage('Veuillez entrer un numéro valide');
          return false;
        }
        // Normalize phone (ensure 237 prefix if missing)
        const fullPhone = phone.startsWith('237') ? phone : `237${phone}`;
        
        return new Promise((resolve) => {
    
        });
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.startPaymentPolling(result.value.reference);
      }
    });
  }

  startPaymentPolling(reference: string): void {
    Swal.fire({
      title: 'Attente de confirmation',
      text: 'Veuillez valider l\'opération sur votre téléphone en saisissant votre code secret.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    const pollInterval = setInterval(() => {

    }, 5000);

    // Timeout polling after 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (Swal.isVisible() && Swal.isLoading()) {
        Swal.fire('Délai dépassé', 'Nous n\'avons pas reçu de confirmation. Vous pourrez vérifier le statut plus tard dans vos réservations.', 'info').then(() => {
          this.router.navigate(['/client/mes-reservations']);
        });
      }
    }, 120000);
  }

  goBack(): void {
    this.router.navigate(['/client/voyages']);
  }
}
