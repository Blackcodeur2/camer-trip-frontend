import { Component, computed, inject, signal } from '@angular/core';
import { AppButton } from '../../../shared/button/app-button/app-button';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth/auth-service';
import { Bus } from '../../../models/bus';

@Component({
  selector: 'app-bus',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, AppButton, PaginationComponent],
  templateUrl: './bus.html',
  styleUrl: './bus.css',
})
export class BusPage {
  //private agencyService = inject(AgencyOpsService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  buses = signal<Bus[]>([]);
  showForm = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  isExporting = signal(false);
  editId = signal<number | null>(null);

  currentPage = signal(1);
  pageSize = signal(5);
  searchQuery = signal('');

  filteredBuses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const list = this.buses();
    if (!Array.isArray(list)) return [];
    if (!query) return list;
    return list.filter(bus => 
      bus.immatriculation?.toLowerCase().includes(query) || 
      bus.code_bus?.toLowerCase().includes(query)
    );
  });

  paginatedBuses = computed(() => {
    const list = this.filteredBuses();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return list.slice(start, end);
  });

  busForm = this.fb.group({
    immatriculation: ['OU 954 CM', Validators.required],
    code_bus: ['bus_001', [Validators.required]],
    type_bus: ['gros porteur', Validators.required],
    classe_bus: ['classique', Validators.required],
    nb_places: [70, [Validators.required]],
    gare_id: [null as number | null | undefined, [Validators.required]],
    statut: ['disponible', Validators.required]
  });

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.busForm.patchValue({ gare_id: user.station_id });
    }
    this.loadBuses();
  }

  loadBuses() {
        this.buses.set([]);
  }

  toggleForm() {
    if (this.showForm()) {
      this.isEditing.set(false);
      this.editId.set(null);
      this.busForm.reset({ nb_places: 70, statut: 'disponible', gare_id: this.currentUser()?.station_id });
    }
    this.showForm.update(v => !v);
  }

  editBus(bus: Bus) {
    this.isEditing.set(true);
    this.editId.set(1 || null);
    this.busForm.patchValue({
      immatriculation: '',
      code_bus: '',
      type_bus: '',
      classe_bus: '',
      nb_places: 80,
      gare_id: 1,
      statut: ''
    });
    this.showForm.set(true);
  }

  onSubmit() {
    
  }

  downloadPdf() {

  }
}
