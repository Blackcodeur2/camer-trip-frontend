import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Voyage } from '../../../models/voyage';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private authService = inject(AuthService);
  private router = inject(Router);
  today = new Date();
  
  isLoading = signal(true);
  isProcessing = signal(false);
  nextTrip?: Voyage;
  upcomingVoyages: Voyage[] = [];

  ngOnInit() {
    this.loadProgramme();
  }

  loadProgramme() {
    this.isLoading.set(true);
        this.upcomingVoyages = [];
        this.isLoading.set(false);
  }

  demarrerVoyage(id: number) {
            this.isProcessing.set(false);
            Swal.fire('Voyage démarré !', 'Bonne voyage !', 'success');
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
  
  onLogout() {
    Swal.fire({
      title: 'Se déconnecter ?',
      text: 'Êtes-vous sûr de vouloir quitter votre cockpit ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, déconnexion',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#EF4444'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout().subscribe({
          next: () => this.router.navigate(['/auth/login']),
          error: () => this.router.navigate(['/auth/login'])
        });
      }
    });
  }
}
