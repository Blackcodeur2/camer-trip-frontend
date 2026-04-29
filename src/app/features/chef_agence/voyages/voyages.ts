import { Component, computed, inject, signal } from '@angular/core';
import { AppButton } from '../../../shared/button/app-button/app-button';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { ChefAgenceService } from '../../../services/chef_agence/chef-agence-service';
import { Bus } from '../../../models/bus';
import { Trajet } from '../../../models/trajet';
import { User } from '../../../models/user';
import { Voyage } from '../../../models/voyage';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-voyages',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, AppButton, PaginationComponent, DatePipe],
  templateUrl: './voyages.html',
  styleUrl: './voyages.css',
})
export class Voyages {
  private fb = inject(FormBuilder);
  private chefService = inject(ChefAgenceService);

  buses = signal<Bus[]>([]);
  routesList = signal<Trajet[]>([]);
  voyages = signal<any[]>([]);
  chauffeurs = signal<User[]>([]);
  showForm = signal(false);
  isLoading = signal(true);
  isSubmitting = signal(false);
  isEditing = signal(false);
  editId = signal<number | null>(null);

  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = signal(10);

  voyageForm = this.fb.group({
    date_depart: ['', Validators.required],
    heure_depart: ['', Validators.required],
    date_arrivee: [{ value: '', disabled: true }],
    duree_heure: [{ value: 0, disabled: true }],
    trajet_id: [null as number | null, Validators.required],
    bus_id: [null as number | null, Validators.required],
    prix: [0, [Validators.required, Validators.min(0)]],
    chauffeur_id: [null as number | null, Validators.required],
    promo: [0],
    statut: ['en attente'],
  });

  statsTotalToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.voyages().filter(v => v.date_depart === today).length;
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
      v.trajet?.depart?.toLowerCase().includes(term) ||
      v.trajet?.arrivee?.toLowerCase().includes(term) ||
      v.chauffeur?.nom?.toLowerCase().includes(term) ||
      v.bus?.immatriculation?.toLowerCase().includes(term)
    );
  });

  paginatedVoyages = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredVoyages().slice(start, end);
  });

  ngOnInit() {
    this.loadAllData();
    this.setupFormListeners();
  }

  loadAllData() {
    this.loadVoyages();
    this.loadBuses();
    this.loadRoutes();
    this.loadChauffeurs();
  }

  setupFormListeners() {
    this.voyageForm.get('trajet_id')?.valueChanges.subscribe(id => {
      if (id) {
        const trajet = this.routesList().find(t => t.id === Number(id));
        if (trajet) {
          this.voyageForm.patchValue({
            prix: trajet.prix,
            duree_heure: trajet.duree_heure
          }, { emitEvent: false });
          this.calculateArrival();
        }
      }
    });

    this.voyageForm.get('date_depart')?.valueChanges.subscribe(() => this.calculateArrival());
    this.voyageForm.get('heure_depart')?.valueChanges.subscribe(() => this.calculateArrival());
  }

  calculateArrival() {
    const date = this.voyageForm.get('date_depart')?.value;
    const time = this.voyageForm.get('heure_depart')?.value;
    const duration = this.voyageForm.get('duree_heure')?.value || 0;

    if (date && time && duration) {
      const departure = new Date(`${date}T${time}`);
      const arrival = new Date(departure.getTime() + (duration * 60 * 60 * 1000));
      
      const year = arrival.getFullYear();
      const month = String(arrival.getMonth() + 1).padStart(2, '0');
      const day = String(arrival.getDate()).padStart(2, '0');
      const hours = String(arrival.getHours()).padStart(2, '0');
      const mins = String(arrival.getMinutes()).padStart(2, '0');
      
      this.voyageForm.patchValue({
        date_arrivee: `${day}/${month}/${year} ${hours}:${mins}`
      }, { emitEvent: false });
    }
  }

  loadBuses() {
    this.chefService.getBusesDispo().subscribe(data => this.buses.set(data));
  }

  loadChauffeurs() {
    this.chefService.getChauffeurs().subscribe(data => this.chauffeurs.set(data));
  }

  loadRoutes() {
    this.chefService.getRoutes().subscribe(data => this.routesList.set(data));
  }

  loadVoyages() {
    this.isLoading.set(true);
    this.chefService.getVoyages().subscribe({
      next: (data) => {
        this.voyages.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  toggleForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.voyageForm.reset({ statut: 'en attente', prix: 0, promo: 0 });
    } else {
      this.loadBuses();
    }
  }

  onSubmit() {
    if (this.voyageForm.invalid) return;

    this.isSubmitting.set(true);
    const formValue = this.voyageForm.getRawValue();

    this.chefService.createVoyage(formValue).subscribe({
      next: () => {
        Swal.fire('Succès', 'Voyage créé avec succès', 'success');
        this.isSubmitting.set(false);
        this.toggleForm();
        this.loadVoyages();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        Swal.fire('Erreur', err.error?.message || 'Erreur lors de la création', 'error');
      }
    });
  }

  markAsTerminated(voyage: any) {
    Swal.fire({
      title: 'Terminer le voyage ?',
      text: "Le bus sera de nouveau disponible.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, terminer'
    }).then((result) => {
      if (result.isConfirmed) {
        this.chefService.updateVoyageStatus(voyage.id, 'termine').subscribe(() => {
          Swal.fire('Terminé', 'Le voyage est fini.', 'success');
          this.loadVoyages();
        });
      }
    });
  }
}
