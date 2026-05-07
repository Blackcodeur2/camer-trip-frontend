import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChefAgenceService } from '../../../services/chef_agence/chef-agence-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './incidents.html',
  styleUrl: './incidents.css',
})
export class Incidents implements OnInit {
  private chefAgenceService = inject(ChefAgenceService);

  incidents = signal<any[]>([]);
  isLoading = signal(true);

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

  getSeverityClass(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITIQUE': return 'severity-critical';
      case 'MOYEN': return 'severity-medium';
      case 'FAIBLE': return 'severity-low';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'signale': return 'Signalé';
      case 'en cours': return 'En cours';
      case 'resolu': return 'Résolu';
      default: return status;
    }
  }
}
