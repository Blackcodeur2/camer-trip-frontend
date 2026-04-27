import { Component, computed, inject, signal } from '@angular/core';
import { AppButton } from '../../../shared/button/app-button/app-button';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { Strajets } from '../../proprietaire/strajets/strajets';
import { Trajet } from '../../../models/trajet';
import { Ville } from '../../../models/ville';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-trajets',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, AppButton, PaginationComponent],
  templateUrl: './trajets.html',
  styleUrl: './trajets.css',
})
export class Trajets {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  routesList = signal<Trajet[]>([]);
  villes = signal<Ville[]>([]);
  showForm = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  isExporting = signal(false);
  editId = signal<number | null>(null);

  currentPage = signal(1);
  pageSize = signal(5);

  paginatedRoutes = computed(() => {
    const list = this.routesList();
    if (!Array.isArray(list)) return [];
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return list.slice(start, end);
  });

  totalVIP = computed(() => this.routesList().filter(r => r.type_trajet === 'vip').length);
  totalClassique = computed(() => this.routesList().filter(r => r.type_trajet === 'classique').length);

  routeForm = this.fb.group({
    ville_depart: [null as number | null, Validators.required],
    ville_arrive: [null as number | null, Validators.required],
    distance_km: [0, Validators.required],
    prix: [5000, [Validators.required, Validators.min(100)]],
    type_trajet: ['classique', [Validators.required]],
    gare_id: [null as number | null | undefined, [Validators.required]]
  });


  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.routeForm.patchValue({ gare_id: user.station_id });
    }
    this.loadRoutes();
    this.loadVilles();
  }

  loadVilles() {
        this.villes.set([]);
  }


  loadRoutes() {
        this.routesList.set([]);
  }

  toggleForm() {
    if (this.showForm()) {
      this.isEditing.set(false);
      this.editId.set(null);
      this.routeForm.reset({ gare_id: this.authService.currentUser()?.station_id });
    }
    this.showForm.update(v => !v);
  }

  editRoute(route: Trajet) {
    this.isEditing.set(true);
    this.editId.set(1 || null);
    this.routeForm.patchValue({
      ville_depart: 1,
      ville_arrive: 2,
      prix: 5000,
      distance_km: 23,
      type_trajet: '',
      gare_id: 1
    });
    this.showForm.set(true);
  }


  onSubmit() {

  }

  downloadPdf() {
   
  }
}
