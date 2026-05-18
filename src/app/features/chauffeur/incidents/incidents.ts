import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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

  private cdr = inject(ChangeDetectorRef);

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  selectedType: string = '';
  isSubmitting = false;

  incidentTypes = [
    { id: 'panne', label: 'Panne', icon: 'build' },
    { id: 'accident', label: 'Accident', icon: 'minor_crash' },
    { id: 'meteo', label: 'Météo', icon: 'cloudy_filled' }
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
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Limite PHP par défaut (2 Mo) pour éviter les erreurs CORS 413 ou 500
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire('Fichier trop lourd', 'La taille maximale de la photo est de 2 Mo. Veuillez en choisir une plus petite.', 'warning');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.previewUrl = null;
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

    if (!this.selectedFile) {
      Swal.fire('Photo requise', 'Veuillez ajouter une photo pour décrire l\'incident.', 'warning');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('voyage_id', String(this.incidentData.voyage_id));
    formData.append('type', this.selectedType);
    formData.append('description', this.incidentData.description);
    formData.append('niveau_gravite', this.incidentData.niveau_gravite);
    formData.append('photo', this.selectedFile);

    this.chauffeurService.reportIncident(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
        Swal.fire('Signalé !', 'L\'incident a été transmis à l\'agence.', 'success');
        this.resetForm();
      },
      error: () => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
        Swal.fire('Erreur', 'Impossible d\'envoyer le signalement.', 'error');
      }
    });
  }

  resetForm() {
    this.selectedType = '';
    this.incidentData.description = '';
    this.incidentData.niveau_gravite = 'MOYEN';
    this.selectedFile = null;
    this.previewUrl = null;
    this.cdr.detectChanges();
  }
}
