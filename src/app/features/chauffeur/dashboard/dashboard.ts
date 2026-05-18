import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Voyage } from '../../../models/voyage';
import { AuthService } from '../../../services/auth/auth-service';
import { ChauffeurService } from '../../../services/chauffeur/chauffeur-service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private chauffeurService = inject(ChauffeurService);
  private router = inject(Router);
  
  today = new Date();
  isLoading = signal(true);
  isProcessing = signal(false);
  exportingVoyageId = signal<number | null>(null);
  nextTrip = signal<Voyage | null>(null);
  upcomingVoyages = signal<Voyage[]>([]);

  ngOnInit() {
    this.loadProgramme();
  }

  loadProgramme() {
    this.isLoading.set(true);
    this.chauffeurService.getMyVoyages().subscribe({
      next: (voyages) => {
        const sorted = voyages.sort((a, b) => new Date(a.date_depart).getTime() - new Date(b.date_depart).getTime());
        
        // Le prochain voyage est le premier "en attente" ou "en cours"
        const next = sorted.find(v => v.statut === 'en attente' || v.statut === 'en cours');
        this.nextTrip.set(next || null);
        
        // Les autres voyages à venir
        this.upcomingVoyages.set(sorted.filter(v => v.id !== next?.id && v.statut === 'en attente'));
        
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  demarrerVoyage(id: number) {
    this.isProcessing.set(true);
    this.chauffeurService.updateVoyageStatus(id, 'en cours').subscribe({
      next: () => {
        this.isProcessing.set(false);
        Swal.fire('Voyage démarré !', 'Bonne route ! Restez prudent.', 'success');
        this.loadProgramme();
      },
      error: () => {
        this.isProcessing.set(false);
        Swal.fire('Erreur', 'Impossible de démarrer le voyage.', 'error');
      }
    });
  }

  terminerVoyage(id: number) {
    Swal.fire({
      title: 'Terminer le voyage ?',
      text: 'Confirmez-vous que vous êtes bien arrivé à destination ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, arrivé',
      confirmButtonColor: '#10b981'
    }).then(result => {
      if (result.isConfirmed) {
        this.isProcessing.set(true);
        this.chauffeurService.updateVoyageStatus(id, 'termine').subscribe({
          next: () => {
            this.isProcessing.set(false);
            Swal.fire('Félicitations', 'Voyage terminé avec succès.', 'success');
            this.loadProgramme();
          },
          error: () => {
            this.isProcessing.set(false);
            Swal.fire('Erreur', 'Impossible de terminer le voyage.', 'error');
          }
        });
      }
    });
  }

  contactAgency() {
    Swal.fire({
      title: 'Contacter l\'agence',
      text: 'Voulez-vous appeler le support de l\'agence ?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Appeler',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = 'tel:658135105'; 
      }
    });
  }

  exportManifeste(voyage: Voyage) {
    this.exportingVoyageId.set(voyage.id ?? null);
    this.chauffeurService.exportPassagersPdf(voyage.id!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Libérer la mémoire après un court délai
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        this.exportingVoyageId.set(null);
      },
      error: () => {
        this.exportingVoyageId.set(null);
        Swal.fire('Erreur', 'Impossible de générer le manifeste', 'error');
      }
    });
  }
}
