import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { ProprietaireService } from '../../../services/proprietaire/proprietaire-service';

@Component({
  selector: 'app-strajets',
  imports: [CommonModule, MatIconModule],
  templateUrl: './strajets.html',
  styleUrl: './strajets.css',
})
export class Strajets {
  private proprietaireService = inject(ProprietaireService);

  routes = signal<any[]>([]);
  stations = signal<any[]>([]);
  selectedStationId = signal<number | null>(null);
  isLoading = signal(true);

  filteredRoutes = computed(() => {
    const stationId = this.selectedStationId();
    if (!stationId) return this.routes();
    return this.routes().filter(r => r.station_id == stationId);
  });

  ngOnInit() {
    this.loadRoutes();
    this.loadStations();
  }

  loadStations() {
    this.proprietaireService.getMyStations().subscribe({
      next: (data) => this.stations.set(data),
      error: () => console.error('Error loading stations')
    });
  }

  onStationChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedStationId.set(value ? parseInt(value, 10) : null);
  }

  loadRoutes() {
    this.isLoading.set(true);
    this.proprietaireService.getMyTrajets().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : (data as any).data ?? [];
        this.routes.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Erreur', 'Impossible de charger les trajets.', 'error');
      }
    });
  }
}
