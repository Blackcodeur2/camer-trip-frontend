import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Route } from '@angular/router';
import { debounceTime, distinctUntilChanged, tap, switchMap, of, catchError, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { Trajet } from '../../../models/trajet';
import { Voyage } from '../../../models/voyage';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-new-reservation',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './new-reservation.html',
  styleUrl: './new-reservation.css',
})
export class NewReservation {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

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

  constructor() {
    // Setup search debounce
    this.clientSearchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => this.searchingClients.set(true)),
      switchMap(query => {
        if (!query || query.length < 2) return of([]);
        return [];
      }),
      tap(() => this.searchingClients.set(false))
    ).subscribe((results: any[]) => this.clientsSearch.set(results));
  }

  ngOnInit() {
    this.loadRoutes();
  }

  loadRoutes() {
    this.routes.set([]);
  }

  // -- Step Navigation --
  nextStep() {
    if (this.currentStep() === 1) {
      this.searchVoyages();
    } else if (this.currentStep() === 3) {
      if (!this.selectedClient() && !this.isNewClient()) {
        Swal.fire('Attention', 'Veuillez sélectionner ou créer un client', 'warning');
        return;
      }
      if (this.isNewClient()) {
        this.submitNewClient();
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
    
  }

  isVoyageDisabled(voyage: Voyage): boolean {
    const disabledStatuses = ['en cours', 'termine', 'terminé', 'en voyage', 'annule', 'annulé'];
    return false;
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
    this.selectedClient.set(null);
  }

  submitNewClient() {
    
  }

  loadSeats() {
        this.availableSeats.set([]);
        this.loadingSeats.set(false);
        this.currentStep.set(4);
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
    const payload = {
      voyage_id: this.selectedVoyage()?.id,
      user_id: this.selectedClient()?.id,
      gare_id: this.authService.currentUser()?.station_id,
      place: Number(this.selectedSeat()),
      // Client info for display if needed
      client_name: `${this.selectedClient()?.prenom} ${this.selectedClient()?.nom}`,
      telephone: this.selectedClient()?.telephone
    };
  }

  resetBooking() {
    this.currentStep.set(1);
    this.selectedRoute.set(null);
    this.selectedVoyage.set(null);
    this.selectedClient.set(null);
    this.selectedSeat.set(null);
    this.tripForm.reset({ date: new Date().toISOString().slice(0, 10) });
    this.clientForm.reset({ sexe: 'M' });
    this.isNewClient.set(false);
  }

  // -- UI Helpers --
  getTotalSeatsArray(): number[] {
    // Assuming standard coaster if not provided, but ideally voyages should have bus info
    // For now let's generate 70 seats if we don't know
    return Array.from({ length: 70 }, (_, i) => i + 1);
  }

  isSeatAvailable(seat: number): boolean {
    return this.availableSeats().includes(seat.toString());
  }
}
