import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChefAgenceService } from '../../../services/chef_agence/chef-agence-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './incidents.html',
  styleUrl: './incidents.css',
})
export class Incidents implements OnInit {
  private chefAgenceService = inject(ChefAgenceService);

  incidents = signal<any[]>([]);
  isLoading = signal(true);
  isExporting = signal(false);

  // Filters
  filterSeverity = signal<string>('');
  filterStatus = signal<string>('');
  searchQuery = signal<string>('');

  filteredIncidents = computed(() => {
    return this.incidents().filter(incident => {
      const matchSeverity = !this.filterSeverity() || incident.niveau_gravite === this.filterSeverity();
      const matchStatus   = !this.filterStatus()   || incident.statut === this.filterStatus();
      const q = this.searchQuery().toLowerCase();
      const matchSearch   = !q ||
        (incident.type ?? '').toLowerCase().includes(q) ||
        (incident.description ?? '').toLowerCase().includes(q) ||
        (incident.lieu ?? '').toLowerCase().includes(q) ||
        (incident.user?.nom ?? '').toLowerCase().includes(q) ||
        (incident.user?.prenom ?? '').toLowerCase().includes(q);
      return matchSeverity && matchStatus && matchSearch;
    });
  });

  ngOnInit() {
    this.loadIncidents();
  }

  loadIncidents() {
    this.isLoading.set(true);
    this.chefAgenceService.getIncidents().subscribe({
      next: (data) => {
        this.incidents.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Erreur', 'Impossible de charger les incidents.', 'error');
      }
    });
  }

  async changeStatus(incident: any) {
    const { value: newStatut } = await Swal.fire({
      title: 'Modifier le statut',
      input: 'select',
      inputOptions: {
        'signale'  : 'Signalé',
        'en cours' : 'En cours',
        'resolu'   : 'Résolu',
      },
      inputValue: incident.statut,
      showCancelButton: true,
      confirmButtonText: 'Mettre à jour',
      cancelButtonText: 'Annuler',
    });

    if (!newStatut || newStatut === incident.statut) return;

    this.chefAgenceService.updateIncidentStatus(incident.id, newStatut).subscribe({
      next: () => {
        this.incidents.update(list =>
          list.map(i => i.id === incident.id ? { ...i, statut: newStatut } : i)
        );
        Swal.fire({ icon: 'success', title: 'Statut mis à jour', timer: 1500, showConfirmButton: false });
      },
      error: () => Swal.fire('Erreur', 'La mise à jour a échoué.', 'error'),
    });
  }

  exportPdf() {
    this.isExporting.set(true);
    this.chefAgenceService.exportIncidentsPdf().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'incidents.pdf';
        a.click();
        URL.revokeObjectURL(url);
        this.isExporting.set(false);
      },
      error: () => {
        this.isExporting.set(false);
        Swal.fire('Erreur', "L'export PDF a échoué.", 'error');
      },
    });
  }

  getSeverityClass(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITIQUE': return 'severity-critical';
      case 'MOYEN':    return 'severity-medium';
      case 'FAIBLE':   return 'severity-low';
      default:         return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'signale':  return 'Signalé';
      case 'en cours': return 'En cours';
      case 'resolu':   return 'Résolu';
      default:         return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'signale':  return 'status-signale';
      case 'en cours': return 'status-en-cours';
      case 'resolu':   return 'status-resolu';
      default:         return '';
    }
  }

  viewFullPhoto(photoUrl: string) {
    Swal.fire({
      imageUrl: photoUrl,
      imageAlt: "Photo de l'incident",
      showConfirmButton: false,
      showCloseButton: true,
      background: '#fff',
      width: '600px',
    });
  }

  // Counts for summary cards
  get criticalCount() { return this.incidents().filter(i => i.niveau_gravite === 'CRITIQUE').length; }
  get pendingCount()  { return this.incidents().filter(i => i.statut !== 'resolu').length; }
  get resolvedCount() { return this.incidents().filter(i => i.statut === 'resolu').length; }
}
