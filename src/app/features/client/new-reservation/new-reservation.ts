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
  occupancyCount = signal<number>(0);
  selectedSeat = signal<number | null>(null);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  
  private refreshInterval: any;

  // Computed
  isSmallBus = computed(() => {
    const places = this.voyage()?.bus?.nb_places || 0;
    return places <= 35;
  });



  freeSeats = computed(() => {
    const total = this.voyage()?.bus?.nb_places || 2;
    return (total - 2) - this.occupancyCount();
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
    
    // On considère occupé tout ce qui n'est pas annulé
    const activeReservations = this.voyage()?.reservations
      ?.filter((r: any) => r.statut !== 'annule') || [];
      
    const occupied = activeReservations.map((r: any) => r.place);
    
    this.occupiedSeats.set(occupied);
    this.occupancyCount.set(activeReservations.length);
    this.isLoading.set(false);
  }

  isOccupied(seat: number): boolean {
    return !this.isSeatAvailable(seat);
  }

  isSeatAvailable(seat: number): boolean {
    return seat !== 1 && seat !== 2 && !this.occupiedSeats().includes(seat);
  }

  selectSeat(seat: number): void {
    if (!this.isSeatAvailable(seat)) return;
    this.selectedSeat.set(seat === this.selectedSeat() ? null : seat);
  }

  getBusLayoutCells(): any[] {
    const nbPlaces = this.voyage()?.bus?.nb_places || 70;
    const isGrosPorteur = nbPlaces > 35;
    const cells: any[] = [];

    // Rangée 1 (Cockpit / Avant)
    cells.push({ type: 'driver', seatNumber: 1 });
    cells.push({ type: 'motorboy', seatNumber: 2 });
    
    // Sièges passagers de la rangée 1 (colonnes 3, 4 et 5)
    if (nbPlaces >= 3) cells.push({ type: 'seat', seatNumber: 3 });
    else cells.push({ type: 'empty' });

    if (nbPlaces >= 4) cells.push({ type: 'seat', seatNumber: 4 });
    else cells.push({ type: 'empty' });

    if (nbPlaces >= 5) cells.push({ type: 'seat', seatNumber: 5 });
    else cells.push({ type: 'empty' });

    // Rangée 2 (Entrée avant)
    if (nbPlaces >= 6) cells.push({ type: 'seat', seatNumber: 6 });
    else cells.push({ type: 'empty' });

    if (nbPlaces >= 7) cells.push({ type: 'seat', seatNumber: 7 });
    else cells.push({ type: 'empty' });

    if (nbPlaces >= 8) cells.push({ type: 'seat', seatNumber: 8 });
    else cells.push({ type: 'empty' });

    // Porte d'entrée avant sur les colonnes 4 et 5 (2ème rangée)
    cells.push({ type: 'door', label: 'Front' });
    cells.push({ type: 'door', label: 'Front' });

    // Reste des sièges passagers (à partir de 9)
    const startPassengerSeat = 9;
    const totalRemainingPassengerSeats = nbPlaces >= 9 ? nbPlaces - 8 : 0;
    
    if (totalRemainingPassengerSeats > 0) {
      const totalCellsNeeded = totalRemainingPassengerSeats + (isGrosPorteur ? 2 : 0);
      const totalRows = Math.ceil(totalCellsNeeded / 5);
      const backDoorRowIdx = isGrosPorteur && totalRows >= 4 ? totalRows - 3 : -1;

      let seatPointer = startPassengerSeat;
      for (let r = 0; r < totalRows; r++) {
        const isBackDoorRow = r === backDoorRowIdx;
        for (let c = 0; c < 5; c++) {
          if (isBackDoorRow && (c === 3 || c === 4)) {
            cells.push({ type: 'door', label: 'Back' });
          } else {
            if (seatPointer <= nbPlaces) {
              cells.push({ type: 'seat', seatNumber: seatPointer });
              seatPointer++;
            } else {
              cells.push({ type: 'empty' });
            }
          }
        }
      }
    }

    return cells;
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
