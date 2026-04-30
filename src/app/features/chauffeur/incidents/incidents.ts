import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChauffeurService } from '../../../services/chauffeur/chauffeur-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './incidents.html',
  styleUrl: './incidents.css',
})
export class Incidents {
  private chauffeurService = inject(ChauffeurService);

  selectedType: string = '';
  isSubmitting = false;

  incidentTypes = [
    { id: 'panne', label: 'Panne', icon: 'build' },
    { id: 'accident', label: 'Accident', icon: 'minor_crash' },
    { id: 'bouchon', label: 'Embouteillage', icon: 'traffic' },
    { id: 'meteo', label: 'Météo', icon: 'cloudy_filled' },
    { id: 'autre', label: 'Autre', icon: 'more_horiz' }
  ];

  incidentData = {
    voyage_id: null as number | null,
    description: '',
    niveau_gravite: 'MOYEN',
    type: ''
  };

  ngOnInit() {
    this.loadCurrentVoyage();
  }

  loadCurrentVoyage() {
    this.chauffeurService.getMyVoyages().subscribe(voyages => {
      const current = voyages.find(v => v.statut === 'en cours');
      if (current) {
        this.incidentData.voyage_id = current.id;
      }
    });
  }

  onSubmit() {
    if (!this.incidentData.voyage_id) {
      Swal.fire('Erreur', 'Aucun voyage en cours détecté.', 'error');
      return;
    }

    if (!this.selectedType || !this.incidentData.description) {
      Swal.fire('Attention', 'Veuillez remplir tous les champs.', 'warning');
      return;
    }

    this.incidentData.type = this.selectedType;
    this.isSubmitting = true;

    this.chauffeurService.reportIncident(this.incidentData).subscribe({
      next: () => {
        this.isSubmitting = false;
        Swal.fire('Signalé !', 'L\'incident a été transmis à l\'agence.', 'success');
        this.resetForm();
      },
      error: () => {
        this.isSubmitting = false;
        Swal.fire('Erreur', 'Impossible d\'envoyer le signalement.', 'error');
      }
    });
  }

  resetForm() {
    this.selectedType = '';
    this.incidentData.description = '';
    this.incidentData.niveau_gravite = 'MOYEN';
  }
}
