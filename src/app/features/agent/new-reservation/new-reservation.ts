import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged, tap, switchMap, of, catchError, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { Trajet } from '../../../models/trajet';
import { Voyage } from '../../../models/voyage';
import { AuthService } from '../../../services/auth/auth-service';
import { AgentService } from '../../../services/agent/agent-service';

@Component({
  selector: 'app-new-reservation',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './new-reservation.html',
  styleUrl: './new-reservation.css',
})
export class NewReservation {
  private agentService = inject(AgentService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  //private ticketService = inject(TicketService);
  today = new Date().toISOString().split('T')[0];

  // -- State --
  currentStep = signal(1); // 1: Trip, 2: Voyage, 3: Client, 4: Seat, 5: Review
  routes = signal<Trajet[]>([]);
  voyages = signal<Voyage[]>([]);
  clientsSearch = signal<any[]>([]);
  availableSeats = signal<string[]>([]);
  
  submitting = signal(false);
  loadingVoyages = signal(false);
  searchingClients = signal(false);
  loadingSeats = signal(false);

  // -- Selections --
  selectedRoute = signal<Trajet | null>(null);
  selectedVoyage = signal<Voyage | null>(null);
  selectedClient = signal<any | null>(null);
  selectedSeat = signal<string | null>(null);

  // -- Forms --
  tripForm = this.fb.group({
    route_id: ['', Validators.required],
    date: [new Date().toISOString().slice(0, 10), Validators.required]
  });

  clientSearchControl = new FormControl('');
  
  clientForm = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    telephone: ['', [Validators.required, Validators.pattern('^6[0-9]{8}$')]],
    email: ['', [Validators.email]],
    num_cni: ['', Validators.required],
    sexe: ['M', Validators.required],
    date_naissance: ['', Validators.required]
  });

  isNewClient = signal(false);
  isGuestClient = signal(false);

  guestForm = this.fb.group({
    nom_complet: ['', Validators.required],
    telephone: ['', [Validators.pattern('^6[0-9]{8}$')]]
  });

  constructor() {
    // Setup search debounce
    this.clientSearchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => this.searchingClients.set(true)),
      switchMap(query => {
        if (!query || query.length < 2) return of([]);
        return this.agentService.searchClients(query).pipe(
          catchError(() => of([]))
        );
      }),
      tap(() => this.searchingClients.set(false))
    ).subscribe((results: any[]) => this.clientsSearch.set(results));
  }

  ngOnInit() {
    this.loadRoutes();
  }

  loadRoutes() {
    this.agentService.getRoutes().pipe(
      catchError(() => of([] as Trajet[]))
    ).subscribe((routes: Trajet[]) => this.routes.set(routes));
  }

  // -- Step Navigation --
  nextStep() {
    if (this.currentStep() === 1) {
      this.searchVoyages();
    } else if (this.currentStep() === 3) {
      if (!this.selectedClient() && !this.isNewClient() && !this.isGuestClient()) {
        Swal.fire('Attention', 'Veuillez sélectionner ou créer un client', 'warning');
        return;
      }
      if (this.isNewClient()) {
        this.submitNewClient();
        return;
      }
      if (this.isGuestClient()) {
        if (this.guestForm.invalid) {
          this.guestForm.markAllAsTouched();
          return;
        }
        this.loadSeats();
        return;
      }
      this.loadSeats();
    } else {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep() {
    this.currentStep.update(s => s - 1);
  }

  // -- Functional Logic --
  searchVoyages() {
    if (this.tripForm.invalid) return;
    
    this.loadingVoyages.set(true);
    const { route_id, date } = this.tripForm.value;
    
    this.agentService.getVoyagesByRoute(Number(route_id), date!).pipe(
      finalize(() => this.loadingVoyages.set(false))
    ).subscribe((res: Voyage[]) => {
      this.voyages.set(res);
      this.loadingVoyages.set(false);
      this.currentStep.set(2);
      this.selectedRoute.set(this.routes().find(r => r.id === Number(route_id)) || null);
    });
  }

  isVoyageDisabled(voyage: Voyage): boolean {
    const disabledStatuses = ['en cours', 'termine', 'terminé', 'en voyage', 'annule', 'annulé'];
    return disabledStatuses.includes(voyage.statut?.toLowerCase());
  }

  selectVoyage(voyage: Voyage) {
    if (this.isVoyageDisabled(voyage)) return;
    this.selectedVoyage.set(voyage);
    this.currentStep.set(3);
  }

  selectClient(client: any) {
    this.selectedClient.set(client);
    this.isNewClient.set(false);
    this.nextStep();
  }

  toggleNewClient() {
    this.isNewClient.update(v => !v);
    this.isGuestClient.set(false);
    this.selectedClient.set(null);
  }

  toggleGuestClient() {
    this.isGuestClient.update(v => !v);
    this.isNewClient.set(false);
    this.selectedClient.set(null);
  }

  submitNewClient() {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.agentService.createClient(this.clientForm.value).subscribe({
      next: (client: any) => {
        this.selectedClient.set(client);
        this.isNewClient.set(false);
        this.submitting.set(false);
        this.loadSeats();
      },
      error: (err) => {
        this.submitting.set(false);
        Swal.fire('Erreur', err.error?.message || 'Impossible de créer le client', 'error');
      }
    });
  }

  loadSeats() {
    if (!this.selectedVoyage()) return;
    this.loadingSeats.set(true);
    this.agentService.getAvailableSeats(this.selectedVoyage()!.id).subscribe({
      next: (seats: string[]) => {
        this.availableSeats.set(seats);
        this.loadingSeats.set(false);
        this.currentStep.set(4);
      },
      error: () => this.loadingSeats.set(false)
    });
  }

  selectSeat(seat: string) {
    this.selectedSeat.set(seat);
  }

  confirmSeat() {
    if (!this.selectedSeat()) return;
    this.currentStep.set(5);
  }

  submitBooking() {
    this.submitting.set(true);
    const payload: any = {
      voyage_id: this.selectedVoyage()?.id,
      station_id: this.authService.currentUser()?.station_id,
      place: Number(this.selectedSeat()),
      payment_method: 'especes'
    };

    if (this.isGuestClient()) {
      payload.nom_client = this.guestForm.value.nom_complet;
      payload.telephone_client = this.guestForm.value.telephone;
    } else {
      payload.user_id = this.selectedClient()?.id;
      payload.client_name = `${this.selectedClient()?.prenom} ${this.selectedClient()?.nom}`;
      payload.telephone = this.selectedClient()?.telephone;
    }

    this.agentService.createBooking(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        Swal.fire('Succès', 'Réservation enregistrée avec succès !', 'success').then(() => {
          this.resetBooking();
        });
      },
      error: (err) => {
        this.submitting.set(false);
        Swal.fire('Erreur', err.error?.message || 'Erreur lors de la réservation', 'error');
      }
    });
  }

  resetBooking() {
    this.currentStep.set(1);
    this.selectedRoute.set(null);
    this.selectedVoyage.set(null);
    this.selectedClient.set(null);
    this.selectedSeat.set(null);
    this.tripForm.reset({ date: new Date().toISOString().slice(0, 10) });
    this.clientForm.reset({ sexe: 'M' });
    this.guestForm.reset();
    this.isNewClient.set(false);
    this.isGuestClient.set(false);
  }

  // -- UI Helpers --
  getTotalSeatsArray(): number[] {
    const nbPlaces = this.selectedVoyage()?.bus?.nb_places || 70;
    return Array.from({ length: nbPlaces }, (_, i) => i + 1);
  }

  getBusLayoutCells(): any[] {
    const nbPlaces = this.selectedVoyage()?.bus?.nb_places || 70;
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

  isSeatAvailable(seat: number): boolean {
    return seat !== 1 && seat !== 2 && this.availableSeats().includes(seat.toString());
  }
}
