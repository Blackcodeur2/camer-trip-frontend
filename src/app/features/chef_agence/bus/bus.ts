import { Component, computed, inject, signal } from '@angular/core';
import { AppButton } from '../../../shared/button/app-button/app-button';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth/auth-service';
import { Bus } from '../../../models/bus';
import { ChefAgenceService } from '../../../services/chef_agence/chef-agence-service';

@Component({
  selector: 'app-bus',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, AppButton, PaginationComponent],
  templateUrl: './bus.html',
  styleUrl: './bus.css',
})
export class BusPage {
  private chefAgenceService = inject(ChefAgenceService)
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
    station_id: [null as number | null | undefined, [Validators.required]],
    statut: ['disponible', Validators.required]
  });

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.busForm.patchValue({ station_id: user.station_id });
    }
    this.loadBuses();
  }

  loadBuses() {
    this.chefAgenceService.getBuses().subscribe({
      next: (data: Bus[]) => {
        this.buses.set(data || []);
      },
      error: () => this.buses.set([])
    });
  }

  toggleForm() {
    if (this.showForm()) {
      this.isEditing.set(false);
      this.editId.set(null);
      this.busForm.reset({ nb_places: 70, statut: 'disponible', station_id: this.currentUser()?.station_id });
    }
    this.showForm.update(v => !v);
  }

  editBus(bus: Bus) {
    this.isEditing.set(true);
    this.editId.set(bus.id || null);
    this.busForm.patchValue({
      immatriculation: bus.immatriculation,
      code_bus: bus.code_bus,
      type_bus: bus.type_bus || (bus as any).modele,
      classe_bus: bus.classe_bus || (bus as any).type,
      nb_places: bus.nb_places,
      station_id: bus.station_id,
      statut: bus.statut
    });
    this.showForm.set(true);
  }

  onSubmit() {
    if (this.busForm.invalid) return;
    this.isSubmitting.set(true);

    const busData = this.busForm.value as any;
    const request = this.isEditing()
      ? this.chefAgenceService.updateBus({ ...busData, id: this.editId() })
      : this.chefAgenceService.createBus(busData);

    request.subscribe({
      next: (res: any) => {
        if (this.isEditing()) {
          this.buses.update((list: Bus[]) => list.map((b: Bus) => b.id === this.editId() ? res : b));
          Swal.fire({ icon: 'success', title: 'Succès', text: res.message, timer: 2000, showConfirmButton: false });
          this.loadBuses();
        } else {
          this.buses.update((list: Bus[]) => [res, ...list]);
          Swal.fire({ icon: 'success', title: 'Succès', text: res.message, timer: 2000, showConfirmButton: false });
          this.loadBuses();
        }

        this.showForm.set(false);
        this.isSubmitting.set(false);
        this.isEditing.set(false);
        this.editId.set(null);
        this.busForm.reset({ nb_places: 70, statut: 'disponible', station_id: this.currentUser()?.station_id });
      },
      error: (error) => {
        this.isSubmitting.set(false);
        let errorMsg = this.isEditing() ? 'Impossible de modifier le bus' : 'Impossible d\'ajouter le bus';
        if (error.status === 422 && error.error?.errors) {
          errorMsg = Object.entries(error.error.errors)
            .map(([key, value]: [string, any]) => `${key}: ${value.join(', ')}`)
            .join('\n');
        }
        Swal.fire({ icon: 'error', title: 'Erreur', text: errorMsg });
      }
    });
  }

  downloadPdf() {
    if (this.isExporting()) return;
    this.isExporting.set(true);

    this.chefAgenceService.exportBusesPdf().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const now = new Date();
        const dateStr = `${now.getFullYear()}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getDate().toString().padStart(2, '0')}`;
        link.download = `buses_agence_${dateStr}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.isExporting.set(false);
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Téléchargement réussi', timer: 2000, showConfirmButton: false });
      },
      error: (error) => {
        this.isExporting.set(false);
        if (error.status === 200) return;
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de télécharger le document PDF' });
      }
    });
  }
}
