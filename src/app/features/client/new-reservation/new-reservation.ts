import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../../services/client/client-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-reservation',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './new-reservation.html',
  styleUrl: './new-reservation.css',
})
export class NewReservation implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clientService = inject(ClientService);

  // States
  voyageId = signal<number | null>(null);
  voyage = signal<any | null>(null);
  occupiedSeats = signal<number[]>([]);
  selectedSeat = signal<number | null>(null);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  
  private refreshInterval: any;

  // Computed
  isSmallBus = computed(() => {
    const places = this.voyage()?.bus?.nb_places || 0;
    return places <= 35;
  });

  busColumns = computed(() => {
    return this.isSmallBus() ? 3 : 4;
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
      this.startRealtimeUpdates();
    } else {
      this.router.navigate(['/client/home']);
    }
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  startRealtimeUpdates(): void {
    this.refreshInterval = setInterval(() => {
      this.refreshOccupations();
    }, 5000); // Rafraîchissement toutes les 5 secondes
  }

  loadData(): void {
    if (!this.voyageId()) return;
    this.isLoading.set(true);
    
    this.clientService.getVoyageDetails(this.voyageId()!).subscribe({
      next: (v) => {
        this.voyage.set(v);
        this.loadOccupations();
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Erreur', 'Impossible de charger les détails du voyage.', 'error');
      }
    });
  }

  refreshOccupations(): void {
    if (!this.voyageId() || this.isSubmitting()) return;
    
    this.clientService.getVoyageDetails(this.voyageId()!).subscribe({
      next: (v) => {
        this.voyage.set(v);
        this.loadOccupations();
      }
    });
  }

  loadOccupations(): void {
    if (!this.voyageId()) return;
    const occupied = this.voyage()?.reservations
      ?.filter((r: any) => r.statut === 'validee')
      ?.map((r: any) => r.place) || [];
    
    this.occupiedSeats.set(occupied);
    this.isLoading.set(false);
  }

  isOccupied(seat: number): boolean {
    return this.occupiedSeats().includes(seat);
  }

  selectSeat(seat: number): void {
    if (this.isOccupied(seat)) return;
    this.selectedSeat.set(seat === this.selectedSeat() ? null : seat);
  }

  confirmBooking(): void {
    if (!this.selectedSeat()) return;

    Swal.fire({
      title: 'Confirmer la réservation',
      text: `Voulez-vous réserver la place N°${this.selectedSeat()} ?`,
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
      station_id: this.voyage()?.station_id
    };

    this.clientService.createReservation(payload).subscribe({
      next: (res) => {
        this.processPayment(res.data.id);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        Swal.fire('Erreur', err.error?.message || 'Impossible de réserver ce siège.', 'error');
      }
    });
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
          this.isSubmitting.set(false);
          Swal.fire('Erreur', err.error?.message || 'Échec de l\'initialisation du paiement.', 'error');
        }
      });
    } else {
      this.isSubmitting.set(false);
    }
  }

  pollPaymentStatus(reference: string) {
    const interval = setInterval(() => {
      this.clientService.checkPaymentStatus(reference).subscribe({
        next: (res) => {
          if (res.statut === 'SUCCESSFUL') {
            clearInterval(interval);
            this.isSubmitting.set(false);
            Swal.fire('Succès', 'Paiement réussi ! Bon voyage.', 'success').then(() => {
              this.router.navigate(['/client/reservations']);
            });
          } else if (res.statut === 'FAILED' || res.statut === 'echoue') {
            clearInterval(interval);
            this.isSubmitting.set(false);
            Swal.fire('Échec', 'Le paiement a échoué ou a été annulé.', 'error');
          }
        },
        error: () => {}
      });
    }, 3000);

    setTimeout(() => {
      clearInterval(interval);
      if (this.isSubmitting()) {
        this.isSubmitting.set(false);
        Swal.fire('Délai dépassé', 'Nous n\'avons pas reçu la confirmation. Vérifiez votre historique plus tard.', 'warning');
      }
    }, 120000);
  }

  goBack(): void {
    this.router.navigate(['/client/home']);
  }
}
