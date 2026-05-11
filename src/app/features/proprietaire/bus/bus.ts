import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { ProprietaireService } from '../../../services/proprietaire/proprietaire-service';

@Component({
  selector: 'app-bus',
  imports: [CommonModule, MatIconModule],
  templateUrl: './bus.html',
  styleUrl: './bus.css',
})
export class Bus {
  private proprietaireService = inject(ProprietaireService);

  buses = signal<any[]>([]);
  stations = signal<any[]>([]);
  selectedStationId = signal<number | null>(null);
  selectedType = signal('');
  selectedCapacity = signal<number | null>(null);
  isLoading = signal(true);

  filteredBuses = computed(() => {
    let list = this.buses();
    const stationId = this.selectedStationId();
    const typeFilter = this.selectedType();
    const capFilter = this.selectedCapacity();

    if (stationId) {
      list = list.filter(b => b.station_id == stationId);
    }
    
    if (typeFilter) {
      list = list.filter(b => b.type_bus === typeFilter);
    }

    if (capFilter) {
      list = list.filter(b => b.nb_places === capFilter);
    }

    return list;
  });

  ngOnInit() {
    this.loadBuses();
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

  loadBuses() {
    this.isLoading.set(true);
    this.proprietaireService.getMyBuses().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : (data as any).data ?? [];
        this.buses.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Erreur', 'Impossible de charger les bus.', 'error');
      }
    });
  }
}
