import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chauffeur-layout',
  imports: [MatIconModule, RouterModule],
  templateUrl: './chauffeur-layout.html',
  styleUrl: './chauffeur-layout.css',
})
export class ChauffeurLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser();
  
  get initials(): string {
    if (!this.user) return '?';
    return `${this.user.prenom?.[0] || ''}${this.user.nom?.[0] || ''}`.toUpperCase();
  }

  logout() {
    Swal.fire({
      title: 'Déconnexion',
      text: 'Voulez-vous vraiment vous déconnecter ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, quitter',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#EF4444'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout().subscribe({
          next: () => this.router.navigate(['/login']),
          error: () => this.router.navigate(['/login'])
        });
      }
    });
  }
}
