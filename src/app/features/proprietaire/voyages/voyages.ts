import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { ProprietaireService } from '../../../services/proprietaire/proprietaire-service';

@Component({
  selector: 'app-voyages',
  imports: [CommonModule, MatIconModule],
  templateUrl: './voyages.html',
  styleUrl: './voyages.css',
})
export class Voyages {
  private proprietaireService = inject(ProprietaireService);

  voyages = signal<any[]>([]);
  stations = signal<any[]>([]);
  selectedStationId = signal<number | null>(null);
  isLoading = signal(true);
  exportingVoyageId = signal<number | null>(null);

  filteredVoyages = computed(() => {
    const stationId = this.selectedStationId();
    if (!stationId) return this.voyages();
    return this.voyages().filter(v => v.station_id == stationId);
  });

  ngOnInit() {
    this.loadVoyages();
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

  loadVoyages() {
    this.isLoading.set(true);
    this.proprietaireService.getMyVoyages().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : (data as any).data ?? [];
        this.voyages.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Erreur', 'Impossible de charger les voyages.', 'error');
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PLANIFIE':
        return 'status-planned';
      case 'EN_COURS':
        return 'status-ongoing';
      case 'TERMINE':
        return 'status-completed';
      case 'ANNULE':
        return 'status-cancelled';
      default:
        return 'status-unknown';
    }
  }

  exportManifeste(voyage: any) {
    this.exportingVoyageId.set(voyage.id);
    this.proprietaireService.exportPassagersPdf(voyage.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manifeste_voyage_${voyage.num_voyage}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.exportingVoyageId.set(null);
      },
      error: () => {
        this.exportingVoyageId.set(null);
        Swal.fire('Erreur', 'Impossible de générer le manifeste', 'error');
      }
    });
  }
}
