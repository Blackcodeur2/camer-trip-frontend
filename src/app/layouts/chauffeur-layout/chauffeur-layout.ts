import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NotificationMenuComponent } from '../../features/shared/notification-menu/notification-menu';

@Component({
  selector: 'app-chauffeur-layout',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, RouterLink, NotificationMenuComponent],
  templateUrl: './chauffeur-layout.html',
  styleUrl: './chauffeur-layout.css',
})
export class ChauffeurLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;

  menuItems = [
    { label: 'Mes Voyages', route: '/chauffeur/voyages', icon: 'explore' },
    { label: 'Incidents', route: '/chauffeur/incidents', icon: 'report_problem' },
    { label: 'Mon Profil', route: '/chauffeur/profile', icon: 'person' },
  ];

  protected readonly userInitials = computed(() => {
    const u = this.currentUser();
    if (!u) return '?';
    return `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase();
  });

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
