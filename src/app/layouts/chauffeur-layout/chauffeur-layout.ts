import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chauffeur-layout',
  imports: [MatIconModule, RouterModule, RouterLink],
  templateUrl: './chauffeur-layout.html',
  styleUrl: './chauffeur-layout.css',
})
export class ChauffeurLayout {
  public authService = inject(AuthService);
  private router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;

  protected readonly initials = computed(() => {
    const u = this.currentUser();
    if (!u) return '?';
    return `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase();
  });

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour,';
    if (hour < 18) return 'Bon après-midi,';
    return 'Bonsoir,';
  }

  logout() {
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({
        title: 'Déconnexion ?',
        text: 'Êtes-vous sûr de vouloir vous déconnecter ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#006644',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, me déconnecter',
        cancelButtonText: 'Annuler',
        background: '#ffffff',
      }).then((result) => {
        if (result.isConfirmed) {
          this.authService.logout().subscribe({
            next: () => this.router.navigate(['/login']),
            error: () => this.router.navigate(['/login'])
          });
        }
      });
    });
  }
}
