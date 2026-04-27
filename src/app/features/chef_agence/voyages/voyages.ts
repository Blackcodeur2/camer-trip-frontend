import { Component, computed, inject, signal } from '@angular/core';
import { AppButton } from '../../../shared/button/app-button/app-button';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { Trajets } from '../trajets/trajets';
import { Bus } from '../../../models/bus';
import { Trajet } from '../../../models/trajet';
import { User } from '../../../models/user';
import { Voyage } from '../../../models/voyage';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-voyages',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, AppButton, PaginationComponent, DatePipe],
  templateUrl: './voyages.html',
  styleUrl: './voyages.css',
})
export class Voyages {
  downloadPdf() {
    throw new Error('Method not implemented.');
  }
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  buses = signal<Bus[]>([]);
  routesList = signal<Trajet[]>([]);
  voyages = signal<Voyage[]>([]);
  chauffeurs = signal<User[]>([]);
  showForm = signal(false);
  isLoading = signal(true);
  isSubmitting = signal(false);
  isEditing = signal(false);
  isExporting = signal(false);
  editId = signal<number | null>(null);

  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = signal(5);

  statsTotalToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.voyages().filter(v => v.date_depart?.startsWith(today)).length;
  });

  statsEnCours = computed(() => {
    return this.voyages().filter(v => v.statut === 'en cours' || v.statut === 'en voyage').length;
  });

  statsAttente = computed(() => {
    return this.voyages().filter(v => v.statut === 'en attente').length;
  });

  filteredVoyages = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.voyages();

    return this.voyages().filter(v =>
      v.num_voyage?.toLowerCase().includes(term) ||
      v.ville_depart?.nom?.toLowerCase().includes(term) ||
      v.ville_arrivee?.nom?.toLowerCase().includes(term) ||
      v.chauffeur?.nom?.toLowerCase().includes(term) ||
      v.chauffeur?.prenom?.toLowerCase().includes(term) ||
      v.vehicule_immatriculation?.toLowerCase().includes(term)
    );
  });

  paginatedVoyages = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredVoyages().slice(start, end);
  });

  voyageForm = this.fb.group({
    date_depart: ['', Validators.required],
    date_arrivee: [''],
    duree_heure: [null as number | null],
    trajet_id: [null as number | null, Validators.required],
    bus_id: [null as number | null, Validators.required],
    prix: [0, Validators.required],
    chauffeur_id: [null as number | null, Validators.required],
    statut: ['en attente'],
    gare_id: [null as number | null],
  });


  ngOnInit() {
    this.loadVoyages();
    this.loadBuses();
    this.loadRoutes();
    this.loadChauffeurs();

    this.voyageForm.get('trajet_id')?.valueChanges.subscribe((value: string | number | null) => {
      if (value === null || value === '') {
        return;
      }
      const route = this.routesList().find(r => r.id === Number(value));
      if (route) {
        this.voyageForm.patchValue({ prix: route.prix ?? 0 });
      }
    });
  }

  loadBuses() {
    this.buses.set([]);
  }

  loadChauffeurs() {
    this.chauffeurs.set([]);
  }

  loadRoutes() {
    this.routesList.set([]);
  }

  loadVoyages() {
    this.isLoading.set(true);
    this.voyages.set([]);
    this.isLoading.set(false);
  }

  toggleForm() {
    if (this.showForm()) {
      this.isEditing.set(false);
      this.editId.set(null);
      this.voyageForm.reset({ statut: 'en attente', prix: 0 });
      this.loadBuses(); // Reset to dispo buses
    }
    this.showForm.update(v => !v);
  }

  editVoyage(voyage: Voyage) {
    this.isEditing.set(true);
  }

  onSubmit() {

  }

  markAsTerminated(voyage: Voyage) {

  }
}
