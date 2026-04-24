import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-client-layout',
  imports: [MatIconModule, RouterModule],
  templateUrl: './client-layout.html',
  styleUrl: './client-layout.css',
})
export class ClientLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;

  get initials(): string {
    const u = this.currentUser();
    return u ? `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase() : '?';
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour,';
    if (hour < 18) return 'Bon après-midi,';
    return 'Bonsoir,';
  }

  onLogout(): void {
    Swal.fire({
      title: 'Déconnexion',
      text: 'Voulez-vous vraiment vous déconnecter ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, déconnecter',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#2563EB'
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
